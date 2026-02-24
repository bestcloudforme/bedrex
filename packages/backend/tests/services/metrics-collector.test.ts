import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MetricsCollectorService } from '../../src/services/metrics-collector.js';
import { CacheManager } from '../../src/services/cache-manager.js';
import type { AgentInventoryItem } from '@bedrex/shared';

// Mock the config to enable mock mode
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

vi.mock('../../src/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

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

describe('MetricsCollectorService', () => {
  let service: MetricsCollectorService;
  let cache: CacheManager;

  beforeEach(() => {
    cache = new CacheManager();
    service = new MetricsCollectorService(cache);
  });

  describe('getAgentMetrics (mock mode)', () => {
    it('returns mock metrics with the correct agentId and timeRange', async () => {
      const metrics = await service.getAgentMetrics('test-agent', 'us-east-1', '24h');

      expect(metrics.agentId).toBe('test-agent');
      expect(metrics.timeRange).toBe('24h');
    });

    it('returns non-empty data point arrays', async () => {
      const metrics = await service.getAgentMetrics('test-agent', 'us-east-1', '24h');

      expect(metrics.invocationCount.length).toBeGreaterThan(0);
      expect(metrics.latency.length).toBeGreaterThan(0);
      expect(metrics.errorCount.length).toBeGreaterThan(0);
      expect(metrics.throttleCount.length).toBeGreaterThan(0);
      expect(metrics.inputTokens.length).toBeGreaterThan(0);
      expect(metrics.outputTokens.length).toBeGreaterThan(0);
    });

    it('each data point has timestamp and value', async () => {
      const metrics = await service.getAgentMetrics('test-agent', 'us-east-1', '1h');

      for (const point of metrics.invocationCount) {
        expect(point.timestamp).toBeTruthy();
        expect(typeof point.value).toBe('number');
        // Values should be non-negative
        expect(point.value).toBeGreaterThanOrEqual(0);
      }
    });

    it('generates different data point counts for different time ranges', async () => {
      const metrics1h = await service.getAgentMetrics('agent', 'us-east-1', '1h');
      const metrics24h = await service.getAgentMetrics('agent', 'us-east-1', '24h');
      const metrics7d = await service.getAgentMetrics('agent', 'us-east-1', '7d');

      // 1h should have fewer points than 24h which should have fewer than 7d (all capped at 100)
      expect(metrics1h.invocationCount.length).toBeLessThan(metrics24h.invocationCount.length);
      expect(metrics24h.invocationCount.length).toBeLessThanOrEqual(metrics7d.invocationCount.length);
    });

    it('timestamps are in chronological order', async () => {
      const metrics = await service.getAgentMetrics('agent', 'us-east-1', '24h');

      for (let i = 1; i < metrics.invocationCount.length; i++) {
        const prev = new Date(metrics.invocationCount[i - 1].timestamp).getTime();
        const curr = new Date(metrics.invocationCount[i].timestamp).getTime();
        expect(curr).toBeGreaterThan(prev);
      }
    });
  });

  describe('getDashboardSummary', () => {
    it('returns correct total agent count', async () => {
      const agents = [makeAgent({ id: 'a1' }), makeAgent({ id: 'a2' }), makeAgent({ id: 'a3' })];
      const summary = await service.getDashboardSummary(agents);
      expect(summary.totalAgents).toBe(3);
    });

    it('counts only PREPARED and ACTIVE agents as active', async () => {
      const agents = [
        makeAgent({ id: 'a1', status: 'PREPARED' }),
        makeAgent({ id: 'a2', status: 'ACTIVE' }),
        makeAgent({ id: 'a3', status: 'FAILED' }),
        makeAgent({ id: 'a4', status: 'NOT_PREPARED' }),
      ];
      const summary = await service.getDashboardSummary(agents);
      expect(summary.activeAgents).toBe(2);
    });

    it('sums invocations from all agents', async () => {
      const agents = [
        makeAgent({
          id: 'a1',
          metrics: { invocationCount24h: 100, avgLatencyMs: 0, errorRate: 0, totalTokensUsed24h: 0, estimatedCost24h: 0 },
        }),
        makeAgent({
          id: 'a2',
          metrics: { invocationCount24h: 200, avgLatencyMs: 0, errorRate: 0, totalTokensUsed24h: 0, estimatedCost24h: 0 },
        }),
      ];
      const summary = await service.getDashboardSummary(agents);
      expect(summary.totalInvocationsToday).toBe(300);
    });

    it('computes error total from invocation count and error rate', async () => {
      const agents = [
        makeAgent({
          id: 'a1',
          metrics: { invocationCount24h: 1000, avgLatencyMs: 0, errorRate: 0.05, totalTokensUsed24h: 0, estimatedCost24h: 0 },
        }),
      ];
      const summary = await service.getDashboardSummary(agents);
      expect(summary.totalErrorsToday).toBe(50);
    });

    it('sums estimated daily cost', async () => {
      const agents = [
        makeAgent({
          id: 'a1',
          metrics: { invocationCount24h: 100, avgLatencyMs: 0, errorRate: 0, totalTokensUsed24h: 0, estimatedCost24h: 1.5 },
        }),
        makeAgent({
          id: 'a2',
          metrics: { invocationCount24h: 200, avgLatencyMs: 0, errorRate: 0, totalTokensUsed24h: 0, estimatedCost24h: 2.5 },
        }),
      ];
      const summary = await service.getDashboardSummary(agents);
      expect(summary.estimatedDailyCost).toBe(4.0);
    });

    it('handles agents without metrics gracefully', async () => {
      const agents = [makeAgent({ id: 'a1' }), makeAgent({ id: 'a2' })];
      const summary = await service.getDashboardSummary(agents);
      expect(summary.totalInvocationsToday).toBe(0);
      expect(summary.totalErrorsToday).toBe(0);
      expect(summary.estimatedDailyCost).toBe(0);
    });

    it('returns zero active agents when all are failed', async () => {
      const agents = [
        makeAgent({ id: 'a1', status: 'FAILED' }),
        makeAgent({ id: 'a2', status: 'FAILED' }),
      ];
      const summary = await service.getDashboardSummary(agents);
      expect(summary.activeAgents).toBe(0);
    });
  });
});
