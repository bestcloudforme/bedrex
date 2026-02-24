import { describe, it, expect } from 'vitest';
import { calculateAgentCost, calculateTotalCosts } from '../../src/services/cost-calculator.js';
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

describe('calculateAgentCost', () => {
  it('returns zero costs when agent has no metrics', () => {
    const agent = makeAgent();
    const cost = calculateAgentCost(agent);
    expect(cost.daily).toBe(0);
    expect(cost.monthly).toBe(0);
  });

  it('calculates cost using MODEL_PRICING for a known model', () => {
    // claude-3-sonnet: inputPer1k = 0.003, outputPer1k = 0.015
    // 100,000 tokens total, 60% input = 60,000, 40% output = 40,000
    // daily = (60000/1000) * 0.003 + (40000/1000) * 0.015
    //       = 60 * 0.003 + 40 * 0.015
    //       = 0.18 + 0.60 = 0.78
    const agent = makeAgent({
      metrics: {
        invocationCount24h: 100,
        avgLatencyMs: 1000,
        errorRate: 0.01,
        totalTokensUsed24h: 100000,
        estimatedCost24h: 0.5,
      },
    });

    const cost = calculateAgentCost(agent);
    expect(cost.daily).toBe(0.78);
    expect(cost.monthly).toBe(23.4); // 0.78 * 30
  });

  it('falls back to estimatedCost24h for unknown model', () => {
    const agent = makeAgent({
      foundationModel: 'some-unknown-model-v1:0',
      metrics: {
        invocationCount24h: 50,
        avgLatencyMs: 500,
        errorRate: 0,
        totalTokensUsed24h: 10000,
        estimatedCost24h: 1.23,
      },
    });

    const cost = calculateAgentCost(agent);
    expect(cost.daily).toBe(1.23);
    expect(cost.monthly).toBe(1.23 * 30);
  });

  it('rounds costs to 2 decimal places', () => {
    // claude-3-haiku: inputPer1k = 0.00025, outputPer1k = 0.00125
    // 7777 tokens: 4666.2 input, 3110.8 output
    // daily = (4666.2/1000)*0.00025 + (3110.8/1000)*0.00125
    //       = 1.16655*0.00025 + 3.1108*0.00125
    //       = 0.000291... + 0.003888... = 0.004179...
    const agent = makeAgent({
      foundationModel: 'anthropic.claude-3-haiku-20240307-v1:0',
      metrics: {
        invocationCount24h: 10,
        avgLatencyMs: 200,
        errorRate: 0,
        totalTokensUsed24h: 7777,
        estimatedCost24h: 0,
      },
    });

    const cost = calculateAgentCost(agent);
    // haiku: inputPer1k=0.00025, outputPer1k=0.00125
    // 7777 * 0.6 = 4666.2 input, 7777 * 0.4 = 3110.8 output
    // daily = (4666.2/1000)*0.00025 + (3110.8/1000)*0.00125 = 0.0011666 + 0.003889 = ~0.005055
    // Math.round(0.005055 * 100) / 100 = Math.round(0.5055) / 100 = 1/100 = 0.01
    expect(cost.daily).toBe(0.01);
    expect(cost.monthly).toBe(0.15); // 0.005055 * 30 = 0.15165 => rounds to 0.15
  });

  it('calculates cost for a high-volume agent correctly', () => {
    // claude-3-5-sonnet: inputPer1k = 0.003, outputPer1k = 0.015
    // 1,000,000 tokens: 600,000 input, 400,000 output
    // daily = (600000/1000)*0.003 + (400000/1000)*0.015
    //       = 600*0.003 + 400*0.015
    //       = 1.80 + 6.00 = 7.80
    const agent = makeAgent({
      foundationModel: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      metrics: {
        invocationCount24h: 5000,
        avgLatencyMs: 1500,
        errorRate: 0.01,
        totalTokensUsed24h: 1000000,
        estimatedCost24h: 5.0,
      },
    });

    const cost = calculateAgentCost(agent);
    expect(cost.daily).toBe(7.8);
    expect(cost.monthly).toBe(234);
  });
});

describe('calculateTotalCosts', () => {
  it('returns zero totals for empty agent list', () => {
    const result = calculateTotalCosts([]);
    expect(result.dailyTotal).toBe(0);
    expect(result.monthlyTotal).toBe(0);
    expect(result.byModel).toEqual({});
  });

  it('aggregates costs across multiple agents', () => {
    const agent1 = makeAgent({
      id: 'a1',
      foundationModel: 'anthropic.claude-3-sonnet-20240229-v1:0',
      metrics: {
        invocationCount24h: 100,
        avgLatencyMs: 1000,
        errorRate: 0,
        totalTokensUsed24h: 100000,
        estimatedCost24h: 0.5,
      },
    });
    const agent2 = makeAgent({
      id: 'a2',
      foundationModel: 'anthropic.claude-3-sonnet-20240229-v1:0',
      metrics: {
        invocationCount24h: 200,
        avgLatencyMs: 800,
        errorRate: 0.01,
        totalTokensUsed24h: 100000,
        estimatedCost24h: 0.5,
      },
    });

    const result = calculateTotalCosts([agent1, agent2]);
    // Each agent: daily=0.78, monthly=23.4
    expect(result.dailyTotal).toBe(1.56);
    expect(result.monthlyTotal).toBe(46.8);
  });

  it('groups costs by model', () => {
    const sonnetAgent = makeAgent({
      id: 'a1',
      foundationModel: 'anthropic.claude-3-sonnet-20240229-v1:0',
      metrics: {
        invocationCount24h: 100,
        avgLatencyMs: 1000,
        errorRate: 0,
        totalTokensUsed24h: 100000,
        estimatedCost24h: 0.5,
      },
    });
    const haikuAgent = makeAgent({
      id: 'a2',
      foundationModel: 'anthropic.claude-3-haiku-20240307-v1:0',
      metrics: {
        invocationCount24h: 200,
        avgLatencyMs: 300,
        errorRate: 0,
        totalTokensUsed24h: 50000,
        estimatedCost24h: 0.02,
      },
    });

    const result = calculateTotalCosts([sonnetAgent, haikuAgent]);

    expect(result.byModel['anthropic.claude-3-sonnet-20240229-v1:0']).toBeDefined();
    expect(result.byModel['anthropic.claude-3-sonnet-20240229-v1:0'].agentCount).toBe(1);
    expect(result.byModel['anthropic.claude-3-haiku-20240307-v1:0']).toBeDefined();
    expect(result.byModel['anthropic.claude-3-haiku-20240307-v1:0'].agentCount).toBe(1);
  });

  it('handles agents without metrics in the total', () => {
    const agentWithMetrics = makeAgent({
      id: 'a1',
      metrics: {
        invocationCount24h: 100,
        avgLatencyMs: 1000,
        errorRate: 0,
        totalTokensUsed24h: 100000,
        estimatedCost24h: 0.5,
      },
    });
    const agentWithout = makeAgent({ id: 'a2' });

    const result = calculateTotalCosts([agentWithMetrics, agentWithout]);
    expect(result.dailyTotal).toBe(0.78);
    expect(result.byModel['anthropic.claude-3-sonnet-20240229-v1:0'].agentCount).toBe(2);
  });
});
