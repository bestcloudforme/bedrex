import { Router } from 'express';
import { snapshotStore } from '../services/snapshot-store.js';
import { AgentDiscoveryService } from '../services/agent-discovery.js';
import { cacheManager } from '../services/cache-manager.js';
import { config } from '../config/index.js';

export const snapshotRoutes = Router();
const agentService = new AgentDiscoveryService(cacheManager);

// GET /api/snapshots/recent — recent changes across all agents (last 50)
// NOTE: This route must be registered BEFORE /:agentId to avoid "recent" being treated as an agentId
snapshotRoutes.get('/recent', async (_req, res, next) => {
  try {
    const snapshots = await snapshotStore.getRecentChanges(50);
    res.json({
      data: snapshots,
      meta: { timestamp: new Date().toISOString(), total: snapshots.length },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/snapshots/capture — manually trigger a snapshot capture for all agents
snapshotRoutes.post('/capture', async (req, res, next) => {
  try {
    const region = (req.query.region as string) || config.AWS_REGION;
    const accountId = (req.query.accountId as string) || (config.AWS_ACCOUNT_ID ?? '');
    const agents = await agentService.discoverAgents(region, accountId);
    const captured = await snapshotStore.captureAll(agents);
    res.json({
      data: captured,
      meta: {
        timestamp: new Date().toISOString(),
        totalAgentsScanned: agents.length,
        snapshotsCreated: captured.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/snapshots/range?startTime=ISO&endTime=ISO — get snapshots within a time range
snapshotRoutes.get('/range', async (req, res, next) => {
  try {
    const startTime = req.query.startTime as string;
    const endTime = req.query.endTime as string;

    if (!startTime || !endTime) {
      res.status(400).json({
        error: { message: 'Both startTime and endTime query parameters are required (ISO 8601 format)' },
      });
      return;
    }

    const snapshots = await snapshotStore.getSnapshotsInRange(startTime, endTime);
    res.json({
      data: snapshots,
      meta: { timestamp: new Date().toISOString(), total: snapshots.length, startTime, endTime },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/snapshots/:agentId — get all snapshots for a specific agent
snapshotRoutes.get('/:agentId', async (req, res, next) => {
  try {
    const { agentId } = req.params;
    const snapshots = await snapshotStore.getSnapshotsForAgent(agentId);
    res.json({
      data: snapshots,
      meta: { timestamp: new Date().toISOString(), total: snapshots.length },
    });
  } catch (err) {
    next(err);
  }
});
