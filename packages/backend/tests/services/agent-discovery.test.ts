import { describe, it, expect, beforeEach } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import {
  BedrockAgentClient,
  ListAgentsCommand,
  GetAgentCommand,
  ListAgentActionGroupsCommand,
  ListAgentKnowledgeBasesCommand,
} from '@aws-sdk/client-bedrock-agent';
import { AgentDiscoveryService } from '../../src/services/agent-discovery.js';
import { CacheManager } from '../../src/services/cache-manager.js';

const bedrockMock = mockClient(BedrockAgentClient);

describe('AgentDiscoveryService', () => {
  let service: AgentDiscoveryService;
  let cache: CacheManager;

  beforeEach(() => {
    bedrockMock.reset();
    cache = new CacheManager();
    service = new AgentDiscoveryService(cache);
  });

  it('lists agents from a region', async () => {
    bedrockMock.on(ListAgentsCommand).resolves({
      agentSummaries: [
        {
          agentId: 'agent-1',
          agentName: 'TestAgent',
          agentStatus: 'PREPARED',
          latestAgentVersion: '1',
          updatedAt: new Date('2025-01-01'),
        },
      ],
    });
    bedrockMock.on(GetAgentCommand).resolves({
      agent: {
        agentId: 'agent-1',
        agentName: 'TestAgent',
        agentStatus: 'PREPARED',
        foundationModel: 'anthropic.claude-3-sonnet-20240229-v1:0',
        agentVersion: '1',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      },
    });
    bedrockMock.on(ListAgentActionGroupsCommand).resolves({ actionGroupSummaries: [] });
    bedrockMock.on(ListAgentKnowledgeBasesCommand).resolves({ agentKnowledgeBaseSummaries: [] });

    const agents = await service.discoverAgents('us-east-1', '000000000000');
    expect(agents).toHaveLength(1);
    expect(agents[0].name).toBe('TestAgent');
    expect(agents[0].type).toBe('bedrock-agent');
    expect(agents[0].region).toBe('us-east-1');
    expect(agents[0].foundationModel).toBe('anthropic.claude-3-sonnet-20240229-v1:0');
  });

  it('caches agent list', async () => {
    bedrockMock.on(ListAgentsCommand).resolves({ agentSummaries: [] });

    await service.discoverAgents('us-east-1', '000000000000');
    await service.discoverAgents('us-east-1', '000000000000');

    expect(bedrockMock.commandCalls(ListAgentsCommand)).toHaveLength(1);
  });

  it('handles agent detail fetch failure gracefully', async () => {
    bedrockMock.on(ListAgentsCommand).resolves({
      agentSummaries: [
        { agentId: 'agent-fail', agentName: 'FailAgent', agentStatus: 'PREPARED', latestAgentVersion: '1', updatedAt: new Date() },
      ],
    });
    bedrockMock.on(GetAgentCommand).rejects(new Error('Access denied'));
    bedrockMock.on(ListAgentActionGroupsCommand).resolves({ actionGroupSummaries: [] });
    bedrockMock.on(ListAgentKnowledgeBasesCommand).resolves({ agentKnowledgeBaseSummaries: [] });

    const agents = await service.discoverAgents('us-east-1', '000000000000');
    expect(agents).toHaveLength(0);
  });
});
