import { Router } from 'express';
import { z } from 'zod';
import { MetricsCollectorService } from '../services/metrics-collector.js';
import { cacheManager } from '../services/cache-manager.js';
import { calculateTotalCosts } from '../services/cost-calculator.js';
import { metricsSimulator } from '../services/metrics-simulator.js';
import { discoverAllAgents } from '../services/multi-region-discovery.js';
import { config } from '../config/index.js';
import type { TimeRange } from '@bedrex/shared';

export const metricsRoutes = Router();
const metricsService = new MetricsCollectorService(cacheManager);

metricsRoutes.get('/summary', async (_req, res, next) => {
  try {
    let agents = await discoverAllAgents();

    // Enrich with simulated metrics if active, otherwise use real CloudWatch
    if (metricsSimulator.active) {
      agents = agents.map((a) => metricsSimulator.enrichAgent(a));
    } else {
      const region = config.AWS_REGION;
      agents = await metricsService.enrichAgentsWithRealMetrics(agents, region);
    }

    const summary = await metricsService.getDashboardSummary(agents);
    const costs = calculateTotalCosts(agents);
    res.json({
      data: { ...summary, costs },
      meta: { timestamp: new Date().toISOString(), cached: false },
    });
  } catch (err) {
    next(err);
  }
});

metricsRoutes.get('/agents/:agentId', async (req, res, next) => {
  try {
    const { agentId } = req.params;
    const timeRangeSchema = z.enum(['1h', '6h', '24h', '7d', '30d']).default('24h');
    const timeRange = timeRangeSchema.parse(req.query.timeRange ?? undefined);
    const region = (req.query.region as string) || config.AWS_REGION;

    // Use simulated time-series if active
    if (metricsSimulator.active) {
      const simulated = metricsSimulator.getTimeSeries(agentId, timeRange);
      if (simulated) {
        return res.json({ data: simulated, meta: { timestamp: new Date().toISOString(), cached: false } });
      }
    }

    // Resolve agent's model ID for CloudWatch query
    const agents = await discoverAllAgents();
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: `Agent ${agentId} not found` } });
    }

    const metrics = await metricsService.getModelMetrics(agent.foundationModel, agentId, region, timeRange);
    res.json({ data: metrics, meta: { timestamp: new Date().toISOString(), cached: false } });
  } catch (err) {
    next(err);
  }
});

// Simulate realistic metrics for all agents
metricsRoutes.post('/simulate', async (_req, res, next) => {
  try {
    const agents = await discoverAllAgents();
    cacheManager.invalidateByPrefix('agents:');
    metricsSimulator.activate(agents);
    res.json({
      data: { active: true, agentCount: agents.length },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
});

metricsRoutes.post('/simulate/clear', async (_req, res) => {
  cacheManager.invalidateByPrefix('agents:');
  metricsSimulator.deactivate();
  res.json({
    data: { active: false },
    meta: { timestamp: new Date().toISOString() },
  });
});
