import type { AgentInventoryItem, AgentMetrics, MetricDataPoint, TimeRange } from '@bedrex/shared';
import { MODEL_PRICING } from '@bedrex/shared';
import { logger } from '../utils/logger.js';

interface SimulatedAgentMetrics {
  invocationCount24h: number;
  avgLatencyMs: number;
  errorRate: number;
  totalTokensUsed24h: number;
  estimatedCost24h: number;
}

const TIME_RANGE_HOURS: Record<TimeRange, number> = {
  '1h': 1, '6h': 6, '24h': 24, '7d': 168, '30d': 720,
};

class MetricsSimulator {
  private simulated = new Map<string, SimulatedAgentMetrics>();
  private _active = false;

  get active() { return this._active; }

  activate(agents: AgentInventoryItem[]) {
    this.simulated.clear();
    for (const agent of agents) {
      this.simulated.set(agent.id, this.generateMetrics(agent));
    }
    this._active = true;
    logger.info({ agentCount: agents.length }, 'Metrics simulation activated');
  }

  deactivate() {
    this.simulated.clear();
    this._active = false;
    logger.info('Metrics simulation deactivated');
  }

  getAgentSummaryMetrics(agentId: string): SimulatedAgentMetrics | undefined {
    return this.simulated.get(agentId);
  }

  enrichAgent(agent: AgentInventoryItem): AgentInventoryItem {
    const metrics = this.simulated.get(agent.id);
    if (!metrics) return agent;
    return { ...agent, metrics };
  }

  getTimeSeries(agentId: string, timeRange: TimeRange): AgentMetrics | null {
    const summary = this.simulated.get(agentId);
    if (!summary) return null;

    const hours = TIME_RANGE_HOURS[timeRange];
    const points = Math.min(hours * 4, 100);
    const now = Date.now();
    const interval = (hours * 3600 * 1000) / points;

    // Base values scaled from 24h summary
    const invPerPoint = summary.invocationCount24h / (24 * 4);
    const tokensPerPoint = summary.totalTokensUsed24h / (24 * 4);

    const gen = (base: number, variance: number): MetricDataPoint[] =>
      Array.from({ length: points }, (_, i) => {
        // Add a daily pattern: busier during "work hours"
        const hourOfDay = new Date(now - (points - i) * interval).getHours();
        const activityFactor = (hourOfDay >= 8 && hourOfDay <= 18) ? 1.4 : 0.6;
        return {
          timestamp: new Date(now - (points - i) * interval).toISOString(),
          value: Math.max(0, Math.round((base * activityFactor + (Math.random() - 0.5) * variance * 2) * 100) / 100),
        };
      });

    return {
      agentId,
      timeRange,
      invocationCount: gen(invPerPoint, invPerPoint * 0.5),
      latency: gen(summary.avgLatencyMs, summary.avgLatencyMs * 0.3),
      errorCount: gen(invPerPoint * summary.errorRate, invPerPoint * 0.05),
      throttleCount: gen(invPerPoint * 0.02, invPerPoint * 0.01),
      inputTokens: gen(tokensPerPoint * 0.6, tokensPerPoint * 0.2),
      outputTokens: gen(tokensPerPoint * 0.4, tokensPerPoint * 0.15),
    };
  }

  private generateMetrics(agent: AgentInventoryItem): SimulatedAgentMetrics {
    const pricing = MODEL_PRICING[agent.foundationModel];
    const isPrepared = agent.status === 'PREPARED';

    // Different agents get different usage levels
    const baseInvocations = isPrepared
      ? 200 + Math.floor(Math.random() * 800)    // 200-1000 invocations/day
      : 5 + Math.floor(Math.random() * 20);       // 5-25 for non-prepared

    const avgTokensPerInvocation = 800 + Math.floor(Math.random() * 1200); // 800-2000 tokens
    const totalTokens = baseInvocations * avgTokensPerInvocation;

    const avgLatency = 800 + Math.floor(Math.random() * 1500); // 800-2300ms
    const errorRate = isPrepared
      ? Math.round(Math.random() * 0.05 * 100) / 100   // 0-5%
      : Math.round(Math.random() * 0.2 * 100) / 100;    // 0-20%

    let cost = 0;
    if (pricing) {
      const inputTokens = totalTokens * 0.6;
      const outputTokens = totalTokens * 0.4;
      cost = (inputTokens / 1000) * pricing.inputPer1k + (outputTokens / 1000) * pricing.outputPer1k;
    }

    return {
      invocationCount24h: baseInvocations,
      avgLatencyMs: avgLatency,
      errorRate,
      totalTokensUsed24h: totalTokens,
      estimatedCost24h: Math.round(cost * 100) / 100,
    };
  }
}

export const metricsSimulator = new MetricsSimulator();
