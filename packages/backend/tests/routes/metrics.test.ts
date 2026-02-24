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
          actionGroups: [],
          knowledgeBases: [],
          metrics: {
            invocationCount24h: 100,
            avgLatencyMs: 500,
            errorRate: 0.02,
            totalTokensUsed24h: 50000,
            estimatedCost24h: 0.25,
          },
        },
      ]),
    })),
  };
});

// Mock config to use mock data for metrics
vi.mock('../../src/config/index.js', () => ({
  config: {
    USE_MOCK_DATA: true,
    AWS_REGION: 'us-east-1',
    PORT: 3001,
    NODE_ENV: 'test',
    CORS_ORIGIN: 'http://localhost:5173',
    LOG_LEVEL: 'info',
    CACHE_ENABLED: true,
  },
}));

import { createApp } from '../../src/app.js';

describe('Metrics Routes', () => {
  const app = createApp();

  describe('GET /api/metrics/summary', () => {
    it('returns 200 with summary data', async () => {
      const res = await request(app).get('/api/metrics/summary');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
    });

    it('includes dashboard summary fields', async () => {
      const res = await request(app).get('/api/metrics/summary');
      const { data } = res.body;

      expect(data).toHaveProperty('totalAgents');
      expect(data).toHaveProperty('activeAgents');
      expect(data).toHaveProperty('totalInvocationsToday');
      expect(data).toHaveProperty('totalErrorsToday');
      expect(data).toHaveProperty('estimatedDailyCost');
    });

    it('includes cost breakdown', async () => {
      const res = await request(app).get('/api/metrics/summary');
      const { data } = res.body;

      expect(data).toHaveProperty('costs');
      expect(data.costs).toHaveProperty('dailyTotal');
      expect(data.costs).toHaveProperty('monthlyTotal');
      expect(data.costs).toHaveProperty('byModel');
    });

    it('returns correct agent count', async () => {
      const res = await request(app).get('/api/metrics/summary');
      expect(res.body.data.totalAgents).toBe(1);
      expect(res.body.data.activeAgents).toBe(1);
    });
  });

  describe('GET /api/metrics/agents/:agentId', () => {
    it('returns 200 with agent metrics', async () => {
      const res = await request(app).get('/api/metrics/agents/test-agent-1');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
    });

    it('returns metrics with expected time series fields', async () => {
      const res = await request(app).get('/api/metrics/agents/test-agent-1');
      const { data } = res.body;

      expect(data).toHaveProperty('agentId', 'test-agent-1');
      expect(data).toHaveProperty('timeRange', '24h');
      expect(data).toHaveProperty('invocationCount');
      expect(data).toHaveProperty('latency');
      expect(data).toHaveProperty('errorCount');
      expect(data).toHaveProperty('throttleCount');
      expect(Array.isArray(data.invocationCount)).toBe(true);
    });

    it('accepts timeRange query parameter', async () => {
      const res = await request(app).get('/api/metrics/agents/test-agent-1?timeRange=1h');
      expect(res.status).toBe(200);
      expect(res.body.data.timeRange).toBe('1h');
    });
  });
});
