import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Mock the agent discovery to avoid real AWS calls in route tests
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
          actionGroups: [],
          knowledgeBases: [],
        },
      ]),
      refreshAgents: vi.fn().mockResolvedValue([]),
    })),
  };
});

import { createApp } from '../../src/app.js';

describe('Agent Routes', () => {
  const app = createApp();

  it('GET /api/agents returns 200 with agent list', async () => {
    const res = await request(app).get('/api/agents');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('name', 'TestAgent');
  });

  it('POST /api/agents/refresh returns 200', async () => {
    const res = await request(app).post('/api/agents/refresh');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
  });
});
