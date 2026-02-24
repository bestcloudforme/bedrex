import { MODEL_PRICING } from '@bedrex/shared';
import type { AgentInventoryItem } from '@bedrex/shared';

export function calculateAgentCost(agent: AgentInventoryItem): { daily: number; monthly: number } {
  if (!agent.metrics) return { daily: 0, monthly: 0 };

  const pricing = MODEL_PRICING[agent.foundationModel];
  if (!pricing) return { daily: agent.metrics.estimatedCost24h, monthly: agent.metrics.estimatedCost24h * 30 };

  // Estimate: assume 60% input, 40% output tokens
  const inputTokens = agent.metrics.totalTokensUsed24h * 0.6;
  const outputTokens = agent.metrics.totalTokensUsed24h * 0.4;

  const daily = (inputTokens / 1000) * pricing.inputPer1k + (outputTokens / 1000) * pricing.outputPer1k;
  const monthly = daily * 30;

  return { daily: Math.round(daily * 100) / 100, monthly: Math.round(monthly * 100) / 100 };
}

export function calculateTotalCosts(agents: AgentInventoryItem[]): {
  dailyTotal: number;
  monthlyTotal: number;
  byModel: Record<string, { daily: number; monthly: number; agentCount: number }>;
} {
  const byModel: Record<string, { daily: number; monthly: number; agentCount: number }> = {};
  let dailyTotal = 0;
  let monthlyTotal = 0;

  for (const agent of agents) {
    const cost = calculateAgentCost(agent);
    dailyTotal += cost.daily;
    monthlyTotal += cost.monthly;

    const model = agent.foundationModel;
    if (!byModel[model]) {
      byModel[model] = { daily: 0, monthly: 0, agentCount: 0 };
    }
    byModel[model].daily += cost.daily;
    byModel[model].monthly += cost.monthly;
    byModel[model].agentCount++;
  }

  return { dailyTotal: Math.round(dailyTotal * 100) / 100, monthlyTotal: Math.round(monthlyTotal * 100) / 100, byModel };
}
