import { describe, it, expect } from 'vitest';
import { buildTopology } from '../../src/services/topology-builder.js';
import type { AgentInventoryItem } from '@bedrex/shared';

function makeAgent(overrides: Partial<AgentInventoryItem> = {}): AgentInventoryItem {
  return {
    id: 'agent-1',
    name: 'TestAgent',
    type: 'bedrock-agent',
    status: 'PREPARED',
    region: 'us-east-1',
    accountId: '000000000000',
    foundationModel: 'anthropic.claude-3-sonnet-20240229-v1:0',
    agentVersion: '1',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    actionGroups: [],
    knowledgeBases: [],
    ...overrides,
  };
}

describe('buildTopology', () => {
  it('returns empty nodes and edges for empty input', () => {
    const result = buildTopology([]);
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
  });

  it('creates an agent node for a single agent', () => {
    const agent = makeAgent();
    const result = buildTopology([agent]);

    const agentNode = result.nodes.find((n) => n.id === 'agent-agent-1');
    expect(agentNode).toBeDefined();
    expect(agentNode!.type).toBe('bedrock-agent');
    expect(agentNode!.label).toBe('TestAgent');
    expect(agentNode!.region).toBe('us-east-1');
    expect(agentNode!.accountId).toBe('000000000000');
  });

  it('does not create separate foundation model nodes (model shown inside agent node)', () => {
    const agent = makeAgent();
    const result = buildTopology([agent]);

    const modelNodes = result.nodes.filter((n) => n.type === 'foundation-model');
    expect(modelNodes).toHaveLength(0);

    const poweredByEdges = result.edges.filter((e) => e.type === 'powered-by');
    expect(poweredByEdges).toHaveLength(0);
  });

  it('includes agent data with foundationModel for frontend badge display', () => {
    const agent = makeAgent();
    const result = buildTopology([agent]);

    const agentNode = result.nodes.find((n) => n.id === 'agent-agent-1');
    expect(agentNode).toBeDefined();
    expect((agentNode!.data as any).agent.foundationModel).toBe('anthropic.claude-3-sonnet-20240229-v1:0');
  });

  it('sorts agents by model so dagre groups them together', () => {
    const agent1 = makeAgent({ id: 'a1', name: 'Agent1', foundationModel: 'z-model' });
    const agent2 = makeAgent({ id: 'a2', name: 'Agent2', foundationModel: 'a-model' });
    const result = buildTopology([agent1, agent2]);

    // Agent with 'a-model' should come first due to sorting
    const agentNodes = result.nodes.filter((n) => n.type === 'bedrock-agent');
    expect(agentNodes[0].label).toBe('Agent2');
    expect(agentNodes[1].label).toBe('Agent1');
  });

  it('creates action group nodes and invokes-action edges', () => {
    const agent = makeAgent({
      actionGroups: [
        {
          id: 'ag-1',
          name: 'MyAction',
          description: 'Desc',
          executionType: 'LAMBDA',
          state: 'ENABLED',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
        {
          id: 'ag-2',
          name: 'MyAction2',
          description: 'Desc2',
          executionType: 'LAMBDA',
          state: 'ENABLED',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ],
    });
    const result = buildTopology([agent]);

    const agNodes = result.nodes.filter((n) => n.type === 'action-group');
    expect(agNodes).toHaveLength(2);
    expect(agNodes[0].id).toBe('ag-agent-1-ag-1');
    expect(agNodes[0].label).toBe('MyAction');
    expect(agNodes[1].id).toBe('ag-agent-1-ag-2');

    const agEdges = result.edges.filter((e) => e.type === 'invokes-action');
    expect(agEdges).toHaveLength(2);
    expect(agEdges[0].source).toBe('agent-agent-1');
    expect(agEdges[0].target).toBe('ag-agent-1-ag-1');
  });

  it('creates knowledge base nodes and uses-kb edges (deduplicated)', () => {
    const kb = {
      knowledgeBaseId: 'kb-shared',
      name: 'SharedKB',
      description: 'Shared',
      dataSourceType: 'S3' as const,
      embeddingModel: 'amazon.titan-embed-text-v2:0',
      status: 'ACTIVE' as const,
      updatedAt: '2025-01-01T00:00:00.000Z',
    };
    const agent1 = makeAgent({ id: 'a1', knowledgeBases: [kb] });
    const agent2 = makeAgent({ id: 'a2', knowledgeBases: [kb] });
    const result = buildTopology([agent1, agent2]);

    // KB node should be deduplicated
    const kbNodes = result.nodes.filter((n) => n.type === 'knowledge-base');
    expect(kbNodes).toHaveLength(1);
    expect(kbNodes[0].id).toBe('kb-kb-shared');
    expect(kbNodes[0].label).toBe('SharedKB');

    // But both agents should have edges to it
    const kbEdges = result.edges.filter((e) => e.type === 'uses-kb');
    expect(kbEdges).toHaveLength(2);
  });

  it('uses knowledgeBaseId as label when name is missing', () => {
    const agent = makeAgent({
      knowledgeBases: [
        {
          knowledgeBaseId: 'kb-no-name',
          description: 'No name',
          dataSourceType: 'S3',
          embeddingModel: 'amazon.titan-embed-text-v2:0',
          status: 'ACTIVE',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ],
    });
    const result = buildTopology([agent]);

    const kbNode = result.nodes.find((n) => n.type === 'knowledge-base');
    expect(kbNode!.label).toBe('kb-no-name');
  });

  it('creates guardrail nodes and protected-by edges (deduplicated)', () => {
    const guardrail = {
      guardrailId: 'gr-shared',
      guardrailVersion: '1',
      name: 'SharedGuard',
    };
    const agent1 = makeAgent({ id: 'a1', guardrail });
    const agent2 = makeAgent({ id: 'a2', guardrail });
    const result = buildTopology([agent1, agent2]);

    const grNodes = result.nodes.filter((n) => n.type === 'guardrail');
    expect(grNodes).toHaveLength(1);
    expect(grNodes[0].id).toBe('gr-gr-shared');
    expect(grNodes[0].label).toBe('SharedGuard');

    const grEdges = result.edges.filter((e) => e.type === 'protected-by');
    expect(grEdges).toHaveLength(2);
  });

  it('uses fallback label for guardrail without name', () => {
    const agent = makeAgent({
      guardrail: {
        guardrailId: 'gr-noname',
        guardrailVersion: '1',
      },
    });
    const result = buildTopology([agent]);

    const grNode = result.nodes.find((n) => n.type === 'guardrail');
    expect(grNode!.label).toBe('Guardrail gr-noname');
  });

  it('sets type to agentcore-runtime for agentcore-runtime agents', () => {
    const agent = makeAgent({ type: 'agentcore-runtime' });
    const result = buildTopology([agent]);

    const agentNode = result.nodes.find((n) => n.id === 'agent-agent-1');
    expect(agentNode!.type).toBe('agentcore-runtime');
  });

  it('handles a complex agent with all components', () => {
    const agent = makeAgent({
      actionGroups: [
        { id: 'ag-1', name: 'Action1', description: 'D', executionType: 'LAMBDA', state: 'ENABLED', updatedAt: '' },
      ],
      knowledgeBases: [
        { knowledgeBaseId: 'kb-1', name: 'KB1', description: 'D', dataSourceType: 'S3', embeddingModel: 'e', status: 'ACTIVE', updatedAt: '' },
      ],
      guardrail: { guardrailId: 'gr-1', guardrailVersion: '1', name: 'Guard1' },
    });
    const result = buildTopology([agent]);

    // 1 agent + 1 action group + 1 KB + 1 guardrail = 4 nodes (no separate model node)
    expect(result.nodes).toHaveLength(4);
    // 1 invokes-action + 1 uses-kb + 1 protected-by = 3 edges (no powered-by edge)
    expect(result.edges).toHaveLength(3);
  });
});
