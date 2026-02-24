import {
  ListAgentsCommand,
  GetAgentCommand,
  ListAgentActionGroupsCommand,
  ListAgentKnowledgeBasesCommand,
  GetKnowledgeBaseCommand,
} from '@aws-sdk/client-bedrock-agent';
import { GetGuardrailCommand } from '@aws-sdk/client-bedrock';
import type { BedrockAgentClient } from '@aws-sdk/client-bedrock-agent';
import type { AgentInventoryItem, ActionGroup, KnowledgeBaseAssociation } from '@bedrex/shared';
import { CACHE_TTL } from '@bedrex/shared';
import { getBedrockAgentClient, getBedrockClient } from '../utils/aws-client-factory.js';
import type { CacheManager } from './cache-manager.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';
import { getMockAgents } from './mock-data.js';

export class AgentDiscoveryService {
  constructor(private cache: CacheManager) {}

  async discoverAgents(region: string, accountId: string): Promise<AgentInventoryItem[]> {
    if (config.USE_MOCK_DATA) {
      return getMockAgents(region, accountId);
    }

    const cacheKey = `agents:${accountId}:${region}`;
    const cached = this.cache.get<AgentInventoryItem[]>(cacheKey);
    if (cached) return cached;

    const client = getBedrockAgentClient(region);
    const agents: AgentInventoryItem[] = [];

    let nextToken: string | undefined;
    do {
      const { agentSummaries, nextToken: token } = await client.send(
        new ListAgentsCommand({ maxResults: 100, nextToken }),
      );
      nextToken = token;

      if (!agentSummaries) continue;

      const detailPromises = agentSummaries.map((summary) =>
        this.getAgentDetails(client, summary.agentId!, summary.latestAgentVersion || 'DRAFT', region, accountId),
      );
      const details = await Promise.allSettled(detailPromises);

      for (const result of details) {
        if (result.status === 'fulfilled' && result.value) {
          agents.push(result.value);
        } else if (result.status === 'rejected') {
          logger.warn({ error: result.reason }, 'Failed to get agent details');
        }
      }
    } while (nextToken);

    this.cache.set(cacheKey, agents, CACHE_TTL.AGENT_LIST);
    return agents;
  }

  private async getAgentDetails(
    client: BedrockAgentClient,
    agentId: string,
    agentVersion: string,
    region: string,
    accountId: string,
  ): Promise<AgentInventoryItem> {
    const [agentResp, actionGroupsResp, kbResp] = await Promise.all([
      client.send(new GetAgentCommand({ agentId })),
      client.send(new ListAgentActionGroupsCommand({ agentId, agentVersion })).catch(() => ({ actionGroupSummaries: [] })),
      client.send(new ListAgentKnowledgeBasesCommand({ agentId, agentVersion })).catch(() => ({ agentKnowledgeBaseSummaries: [] })),
    ]);

    const agent = agentResp.agent!;

    const actionGroups: ActionGroup[] = (actionGroupsResp.actionGroupSummaries || []).map((ag: any) => ({
      id: ag.actionGroupId!,
      name: ag.actionGroupName!,
      description: ag.description,
      executionType: 'LAMBDA' as const,
      state: ag.actionGroupState || 'ENABLED',
      updatedAt: ag.updatedAt?.toISOString() || '',
    }));

    // Resolve KB names in parallel
    const kbSummaries = kbResp.agentKnowledgeBaseSummaries || [];
    const kbNamePromises = kbSummaries.map((kb: any) =>
      client.send(new GetKnowledgeBaseCommand({ knowledgeBaseId: kb.knowledgeBaseId! }))
        .then((resp) => resp.knowledgeBase?.name)
        .catch(() => undefined),
    );
    const kbNames = await Promise.all(kbNamePromises);

    const knowledgeBases: KnowledgeBaseAssociation[] = kbSummaries.map((kb: any, i: number) => ({
      knowledgeBaseId: kb.knowledgeBaseId!,
      name: kbNames[i],
      description: kb.description,
      status: kb.knowledgeBaseState || 'ENABLED',
      updatedAt: kb.updatedAt?.toISOString() || '',
    }));

    // Resolve guardrail name
    let guardrail: AgentInventoryItem['guardrail'] = undefined;
    if (agent.guardrailConfiguration?.guardrailIdentifier) {
      const grId = agent.guardrailConfiguration.guardrailIdentifier;
      const grVersion = agent.guardrailConfiguration.guardrailVersion || '';
      let grName: string | undefined;
      try {
        const bedrockClient = getBedrockClient(region);
        const grResp = await bedrockClient.send(
          new GetGuardrailCommand({ guardrailIdentifier: grId }),
        );
        grName = grResp.name;
      } catch {
        logger.debug({ guardrailId: grId }, 'Failed to resolve guardrail name');
      }
      guardrail = { guardrailId: grId, guardrailVersion: grVersion, name: grName };
    }

    return {
      id: agent.agentId!,
      name: agent.agentName!,
      type: 'bedrock-agent',
      status: (agent.agentStatus as AgentInventoryItem['status']) || 'INACTIVE',
      region,
      accountId,
      foundationModel: agent.foundationModel || 'unknown',
      description: agent.description,
      instruction: agent.instruction,
      agentVersion,
      createdAt: agent.createdAt?.toISOString() || '',
      updatedAt: agent.updatedAt?.toISOString() || '',
      actionGroups,
      knowledgeBases,
      guardrail,
    };
  }

  async refreshAgents(region: string, accountId: string): Promise<AgentInventoryItem[]> {
    this.cache.invalidateByPrefix(`agents:${accountId}:${region}`);
    return this.discoverAgents(region, accountId);
  }
}
