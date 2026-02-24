import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/services/agent-discovery.js', () => {
  return {
    AgentDiscoveryService: vi.fn().mockImplementation(() => ({
      discoverAgents: vi.fn().mockResolvedValue([
        {
          id: 'test-agent-1',
          name: 'TestAgent',
          type: 'bedrock-agent',
          status: 'PREPARED',
          region: 'us-east-1',
          accountId: '000000000000',
          foundationModel: 'anthropic.claude-3-sonnet-20240229-v1:0',
          agentVersion: '1',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
          actionGroups: [
            { id: 'ag-1', name: 'Action1', description: 'D', executionType: 'LAMBDA', state: 'ENABLED', updatedAt: '' },
          ],
          knowledgeBases: [
            { knowledgeBaseId: 'kb-1', name: 'KB1', description: 'D', dataSourceType: 'S3', embeddingModel: 'e', status: 'ACTIVE', updatedAt: '' },
          ],
        },
      ]),
    })),
  };
});

import { createApp } from '../../src/app.js';

describe('Topology Routes', () => {
  const app = createApp();

  it('GET /api/topology returns 200 with topology data', async () => {
    const res = await request(app).get('/api/topology');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('nodes');
    expect(res.body.data).toHaveProperty('edges');
    expect(Array.isArray(res.body.data.nodes)).toBe(true);
    expect(Array.isArray(res.body.data.edges)).toBe(true);
  });

  it('GET /api/topology response includes meta with node/edge counts', async () => {
    const res = await request(app).get('/api/topology');
    expect(res.body).toHaveProperty('meta');
    expect(res.body.meta).toHaveProperty('timestamp');
    expect(res.body.meta).toHaveProperty('nodeCount');
    expect(res.body.meta).toHaveProperty('edgeCount');
    expect(typeof res.body.meta.nodeCount).toBe('number');
    expect(typeof res.body.meta.edgeCount).toBe('number');
  });

  it('GET /api/topology includes agent node, model node, action group, and KB', async () => {
    const res = await request(app).get('/api/topology');
    const { nodes, edges } = res.body.data;

    // Should have: 1 agent + 1 action group + 1 KB + 1 model = 4 nodes
    expect(nodes.length).toBeGreaterThanOrEqual(4);

    const agentNode = nodes.find((n: { id: string }) => n.id === 'agent-test-agent-1');
    expect(agentNode).toBeDefined();
    expect(agentNode.label).toBe('TestAgent');

    // At least powered-by, invokes-action, uses-kb edges
    expect(edges.length).toBeGreaterThanOrEqual(3);
  });

  it('GET /api/topology accepts region query parameter', async () => {
    const res = await request(app).get('/api/topology?region=us-west-2');
    expect(res.status).toBe(200);
  });
});
