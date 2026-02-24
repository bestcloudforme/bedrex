import { GetMetricDataCommand, type MetricDataQuery } from '@aws-sdk/client-cloudwatch';
import type { AgentMetrics, MetricDataPoint, MetricsDashboardSummary, TimeRange, AgentInventoryItem } from '@bedrex/shared';
import { MODEL_PRICING, CACHE_TTL } from '@bedrex/shared';
import { getCloudWatchClient } from '../utils/aws-client-factory.js';
import type { CacheManager } from './cache-manager.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const TIME_RANGE_HOURS: Record<TimeRange, number> = {
  '1h': 1, '6h': 6, '24h': 24, '7d': 168, '30d': 720,
};

const PERIOD_SECONDS: Record<TimeRange, number> = {
  '1h': 60, '6h': 300, '24h': 900, '7d': 3600, '30d': 14400,
};

export class MetricsCollectorService {
  constructor(private cache: CacheManager) {}

  /**
   * Fetch real CloudWatch metrics for a specific model ID.
   * Bedrock publishes metrics under AWS/Bedrock namespace with ModelId dimension.
   */
  async getModelMetrics(modelId: string, agentId: string, region: string, timeRange: TimeRange): Promise<AgentMetrics> {
    if (config.USE_MOCK_DATA) {
      return this.getMockAgentMetrics(agentId, timeRange);
    }

    const cacheKey = `metrics:${modelId}:${timeRange}`;
    const cached = this.cache.get<AgentMetrics>(cacheKey);
    if (cached) return { ...cached, agentId };

    const client = getCloudWatchClient(region);
    const now = new Date();
    const startTime = new Date(now.getTime() - TIME_RANGE_HOURS[timeRange] * 3600 * 1000);
    const period = PERIOD_SECONDS[timeRange];

    const dim = [{ Name: 'ModelId', Value: modelId }];
    const ns = 'AWS/Bedrock';

    const queries: MetricDataQuery[] = [
      { Id: 'invocations', MetricStat: { Metric: { Namespace: ns, MetricName: 'Invocations', Dimensions: dim }, Period: period, Stat: 'Sum' } },
      { Id: 'latency', MetricStat: { Metric: { Namespace: ns, MetricName: 'InvocationLatency', Dimensions: dim }, Period: period, Stat: 'Average' } },
      { Id: 'errors', MetricStat: { Metric: { Namespace: ns, MetricName: 'InvocationClientErrors', Dimensions: dim }, Period: period, Stat: 'Sum' } },
      { Id: 'inputTokens', MetricStat: { Metric: { Namespace: ns, MetricName: 'InputTokenCount', Dimensions: dim }, Period: period, Stat: 'Sum' } },
      { Id: 'outputTokens', MetricStat: { Metric: { Namespace: ns, MetricName: 'OutputTokenCount', Dimensions: dim }, Period: period, Stat: 'Sum' } },
    ];

    try {
      const response = await client.send(new GetMetricDataCommand({
        MetricDataQueries: queries,
        StartTime: startTime,
        EndTime: now,
      }));

      const toDataPoints = (timestamps: Date[] | undefined, values: number[] | undefined): MetricDataPoint[] => {
        if (!timestamps || !values) return [];
        // Sort by timestamp ascending
        const pairs = timestamps.map((ts, i) => ({ timestamp: ts.toISOString(), value: values[i] || 0 }));
        pairs.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
        return pairs;
      };

      const results = response.MetricDataResults || [];
      const metrics: AgentMetrics = {
        agentId,
        timeRange,
        invocationCount: toDataPoints(results.find(r => r.Id === 'invocations')?.Timestamps, results.find(r => r.Id === 'invocations')?.Values),
        latency: toDataPoints(results.find(r => r.Id === 'latency')?.Timestamps, results.find(r => r.Id === 'latency')?.Values),
        errorCount: toDataPoints(results.find(r => r.Id === 'errors')?.Timestamps, results.find(r => r.Id === 'errors')?.Values),
        throttleCount: [],
        inputTokens: toDataPoints(results.find(r => r.Id === 'inputTokens')?.Timestamps, results.find(r => r.Id === 'inputTokens')?.Values),
        outputTokens: toDataPoints(results.find(r => r.Id === 'outputTokens')?.Timestamps, results.find(r => r.Id === 'outputTokens')?.Values),
      };

      this.cache.set(cacheKey, metrics, CACHE_TTL.METRICS);
      logger.debug({ modelId, timeRange, invocationPoints: metrics.invocationCount.length }, 'Fetched CloudWatch metrics');
      return metrics;
    } catch (err) {
      logger.warn({ err, modelId }, 'Failed to fetch CloudWatch metrics');
      return this.getEmptyMetrics(agentId, timeRange);
    }
  }

  /**
   * Enrich agents with real 24h summary metrics from CloudWatch.
   * Since Bedrock CloudWatch metrics are per-model (not per-agent),
   * we fetch model-level metrics and distribute evenly across agents using that model.
   */
  async enrichAgentsWithRealMetrics(agents: AgentInventoryItem[], region: string): Promise<AgentInventoryItem[]> {
    // Group agents by model
    const modelGroups = new Map<string, AgentInventoryItem[]>();
    for (const agent of agents) {
      if (agent.status !== 'PREPARED') continue;
      const list = modelGroups.get(agent.foundationModel) || [];
      list.push(agent);
      modelGroups.set(agent.foundationModel, list);
    }

    const enriched = [...agents];

    for (const [modelId, modelAgents] of modelGroups) {
      const metrics = await this.getModelMetrics(modelId, '', region, '24h');
      const totalInvocations = metrics.invocationCount.reduce((s, d) => s + d.value, 0);
      const avgLatency = metrics.latency.length > 0
        ? Math.round(metrics.latency.reduce((s, d) => s + d.value, 0) / metrics.latency.length)
        : 0;
      const totalErrors = metrics.errorCount.reduce((s, d) => s + d.value, 0);
      const totalInputTokens = metrics.inputTokens.reduce((s, d) => s + d.value, 0);
      const totalOutputTokens = metrics.outputTokens.reduce((s, d) => s + d.value, 0);

      if (totalInvocations === 0) continue;

      const agentCount = modelAgents.length;
      const pricing = MODEL_PRICING[modelId];

      for (const agent of modelAgents) {
        // Distribute model-level metrics evenly across agents using that model
        const invPerAgent = Math.round(totalInvocations / agentCount);
        const inputPerAgent = Math.round(totalInputTokens / agentCount);
        const outputPerAgent = Math.round(totalOutputTokens / agentCount);
        const errorsPerAgent = totalErrors / agentCount;
        const errorRate = totalInvocations > 0 ? totalErrors / totalInvocations : 0;

        let cost = 0;
        if (pricing) {
          cost = (inputPerAgent / 1000) * pricing.inputPer1k + (outputPerAgent / 1000) * pricing.outputPer1k;
        }

        const idx = enriched.findIndex((a) => a.id === agent.id);
        if (idx >= 0) {
          enriched[idx] = {
            ...enriched[idx],
            metrics: {
              invocationCount24h: invPerAgent,
              avgLatencyMs: avgLatency,
              errorRate: Math.round(errorRate * 100) / 100,
              totalTokensUsed24h: inputPerAgent + outputPerAgent,
              estimatedCost24h: Math.round(cost * 10000) / 10000,
            },
          };
        }
      }
    }

    return enriched;
  }

  async getDashboardSummary(agents: AgentInventoryItem[]): Promise<MetricsDashboardSummary> {
    const activeAgents = agents.filter(a => a.status === 'PREPARED' || a.status === 'ACTIVE');
    const totalInvocations = agents.reduce((sum, a) => sum + (a.metrics?.invocationCount24h ?? 0), 0);
    const totalErrors = agents.reduce((sum, a) => sum + Math.round((a.metrics?.invocationCount24h ?? 0) * (a.metrics?.errorRate ?? 0)), 0);
    const totalCost = agents.reduce((sum, a) => sum + (a.metrics?.estimatedCost24h ?? 0), 0);

    return {
      totalAgents: agents.length,
      activeAgents: activeAgents.length,
      totalInvocationsToday: totalInvocations,
      totalErrorsToday: totalErrors,
      estimatedDailyCost: Math.round(totalCost * 10000) / 10000,
    };
  }

  private getMockAgentMetrics(agentId: string, timeRange: TimeRange): AgentMetrics {
    const hours = TIME_RANGE_HOURS[timeRange];
    const points = Math.min(hours * 4, 100);
    const now = Date.now();
    const interval = (hours * 3600 * 1000) / points;
    const gen = (base: number, variance: number): MetricDataPoint[] =>
      Array.from({ length: points }, (_, i) => ({
        timestamp: new Date(now - (points - i) * interval).toISOString(),
        value: Math.max(0, base + (Math.random() - 0.5) * variance * 2),
      }));
    return { agentId, timeRange, invocationCount: gen(15, 8), latency: gen(1200, 400), errorCount: gen(0.5, 1), throttleCount: gen(0.1, 0.5), inputTokens: gen(5000, 2000), outputTokens: gen(3000, 1500) };
  }

  private getEmptyMetrics(agentId: string, timeRange: TimeRange): AgentMetrics {
    return { agentId, timeRange, invocationCount: [], latency: [], errorCount: [], throttleCount: [], inputTokens: [], outputTokens: [] };
  }
}
