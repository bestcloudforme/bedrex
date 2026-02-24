import { describe, it, expect } from 'vitest';
import { getMockAgents } from '../../src/services/mock-data.js';

describe('getMockAgents', () => {
  it('returns all mock agents when no filters are provided', () => {
    const agents = getMockAgents();
    expect(agents.length).toBeGreaterThan(0);
    // The mock data has agents across multiple regions and statuses
    expect(agents.length).toBeGreaterThanOrEqual(20);
  });

  it('every agent has required fields', () => {
    const agents = getMockAgents();
    for (const agent of agents) {
      expect(agent.id).toBeTruthy();
      expect(agent.name).toBeTruthy();
      expect(agent.type).toBe('bedrock-agent');
      expect(agent.status).toBeTruthy();
      expect(agent.region).toBeTruthy();
      expect(agent.accountId).toBeTruthy();
      expect(agent.foundationModel).toBeTruthy();
      expect(Array.isArray(agent.actionGroups)).toBe(true);
      expect(Array.isArray(agent.knowledgeBases)).toBe(true);
    }
  });

  it('filters by region', () => {
    const usEast1 = getMockAgents('us-east-1');
    expect(usEast1.length).toBeGreaterThan(0);
    expect(usEast1.every((a) => a.region === 'us-east-1')).toBe(true);

    const usWest2 = getMockAgents('us-west-2');
    expect(usWest2.length).toBeGreaterThan(0);
    expect(usWest2.every((a) => a.region === 'us-west-2')).toBe(true);

    // us-east-1 and us-west-2 together should be less than all
    expect(usEast1.length + usWest2.length).toBeLessThanOrEqual(getMockAgents().length);
  });

  it('returns empty array for a region with no agents', () => {
    const agents = getMockAgents('af-south-1');
    expect(agents).toEqual([]);
  });

  it('filters by accountId', () => {
    const agents = getMockAgents(undefined, '000000000000');
    expect(agents.length).toBeGreaterThan(0);
    expect(agents.every((a) => a.accountId === '000000000000')).toBe(true);
  });

  it('returns empty array for an unknown accountId', () => {
    const agents = getMockAgents(undefined, '999999999999');
    expect(agents).toEqual([]);
  });

  it('applies both region and accountId filters together', () => {
    const agents = getMockAgents('us-east-1', '000000000000');
    expect(agents.length).toBeGreaterThan(0);
    expect(agents.every((a) => a.region === 'us-east-1' && a.accountId === '000000000000')).toBe(true);
  });

  it('includes agents with various statuses (PREPARED, FAILED, NOT_PREPARED)', () => {
    const agents = getMockAgents();
    const statuses = new Set(agents.map((a) => a.status));
    expect(statuses.has('PREPARED')).toBe(true);
    expect(statuses.has('FAILED')).toBe(true);
    expect(statuses.has('NOT_PREPARED')).toBe(true);
  });

  it('includes agents with different foundation models', () => {
    const agents = getMockAgents();
    const models = new Set(agents.map((a) => a.foundationModel));
    // Should have multiple model families
    expect(models.size).toBeGreaterThan(5);
  });

  it('some agents have guardrails', () => {
    const agents = getMockAgents();
    const withGuardrails = agents.filter((a) => a.guardrail);
    expect(withGuardrails.length).toBeGreaterThan(0);
  });

  it('some agents have metrics', () => {
    const agents = getMockAgents();
    const withMetrics = agents.filter((a) => a.metrics);
    expect(withMetrics.length).toBeGreaterThan(0);
  });

  it('agents across different regions exist (eu-west-1, ap-northeast-1, etc.)', () => {
    const agents = getMockAgents();
    const regions = new Set(agents.map((a) => a.region));
    expect(regions.has('eu-west-1')).toBe(true);
    expect(regions.has('ap-northeast-1')).toBe(true);
  });
});
