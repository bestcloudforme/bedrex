import { Router } from 'express';
import { z } from 'zod';
import { discoverAllAgents, refreshAllAgents } from '../services/multi-region-discovery.js';
import { snapshotStore } from '../services/snapshot-store.js';
import { metricsSimulator } from '../services/metrics-simulator.js';
import { MetricsCollectorService } from '../services/metrics-collector.js';
import { cacheManager } from '../services/cache-manager.js';
import { config } from '../config/index.js';
import { invokeAgent, invokeAllAgents } from '../services/agent-invoker.js';

const metricsService = new MetricsCollectorService(cacheManager);

export const agentRoutes = Router();

agentRoutes.get('/', async (_req, res, next) => {
  try {
    let agents = await discoverAllAgents();

    // Fire-and-forget snapshot capture on each discovery run
    snapshotStore.captureAll(agents).catch(() => {});

    // Enrich with simulated metrics if active, otherwise use real CloudWatch
    if (metricsSimulator.active) {
      agents = agents.map((a) => metricsSimulator.enrichAgent(a));
    } else {
      agents = await metricsService.enrichAgentsWithRealMetrics(agents, config.AWS_REGION);
    }

    res.json({
      data: agents,
      meta: { timestamp: new Date().toISOString(), cached: false, total: agents.length },
    });
  } catch (err) {
    next(err);
  }
});

agentRoutes.post('/refresh', async (_req, res, next) => {
  try {
    let agents = await refreshAllAgents();

    // Fire-and-forget snapshot capture on each refresh run
    snapshotStore.captureAll(agents).catch(() => {});

    // Enrich with simulated metrics if active, otherwise use real CloudWatch
    if (metricsSimulator.active) {
      agents = agents.map((a) => metricsSimulator.enrichAgent(a));
    } else {
      agents = await metricsService.enrichAgentsWithRealMetrics(agents, config.AWS_REGION);
    }

    res.json({
      data: agents,
      meta: { timestamp: new Date().toISOString(), cached: false, total: agents.length },
    });
  } catch (err) {
    next(err);
  }
});

// Invoke a single agent with a test prompt
const invokeSchema = z.object({ prompt: z.string().max(10000).optional() });

agentRoutes.post('/:agentId/invoke', async (req, res, next) => {
  try {
    const { agentId } = req.params;
    const { prompt } = invokeSchema.parse(req.body || {});
    const agents = await discoverAllAgents();
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: `Agent ${agentId} not found` } });
    }
    if (agent.status !== 'PREPARED') {
      return res.status(400).json({ error: { code: 'NOT_PREPARED', message: `Agent ${agent.name} is ${agent.status}, must be PREPARED to invoke` } });
    }
    const result = await invokeAgent(agent, prompt);
    res.json({ data: result, meta: { timestamp: new Date().toISOString() } });
  } catch (err) {
    next(err);
  }
});

// Invoke all PREPARED agents to generate real CloudWatch metrics
agentRoutes.post('/invoke-all', async (_req, res, next) => {
  try {
    const agents = await discoverAllAgents();
    const { results, summary } = await invokeAllAgents(agents);
    res.json({ data: { results, summary }, meta: { timestamp: new Date().toISOString() } });
  } catch (err) {
    next(err);
  }
});
