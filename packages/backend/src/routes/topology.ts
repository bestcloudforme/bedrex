import { Router } from 'express';
import { buildTopology } from '../services/topology-builder.js';
import { discoverAllAgents } from '../services/multi-region-discovery.js';

export const topologyRoutes = Router();

topologyRoutes.get('/', async (_req, res, next) => {
  try {
    const agents = await discoverAllAgents();
    const topology = buildTopology(agents);
    res.json({
      data: topology,
      meta: {
        timestamp: new Date().toISOString(),
        cached: false,
        nodeCount: topology.nodes.length,
        edgeCount: topology.edges.length,
      },
    });
  } catch (err) {
    next(err);
  }
});
