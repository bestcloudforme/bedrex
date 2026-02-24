import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/services/agent-discovery.js', () => {
  return {
    AgentDiscoveryService: vi.fn().mockImplementation(() => ({
      discoverAgents: vi.fn().mockResolvedValue([
        {
          id: 'test-agent-1',
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
        },
      ]),
    })),
  };
});

// Mock the snapshot store to avoid file system access — all data must be inline (vi.mock is hoisted)
vi.mock('../../src/services/snapshot-store.js', () => {
  const snapshots = [
    {
      id: 'snap-1',
      agentId: 'test-agent-1',
      timestamp: '2025-06-01T10:00:00.000Z',
      config: {
        id: 'test-agent-1',
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
      },
      changeType: 'INITIAL',
    },
  ];

  return {
    snapshotStore: {
      getRecentChanges: vi.fn().mockResolvedValue(snapshots),
      captureAll: vi.fn().mockResolvedValue(snapshots),
      getSnapshotsForAgent: vi.fn().mockResolvedValue(snapshots),
      getSnapshotsInRange: vi.fn().mockResolvedValue(snapshots),
    },
  };
});

import { createApp } from '../../src/app.js';

describe('Snapshot Routes', () => {
  const app = createApp();

  describe('GET /api/snapshots/recent', () => {
    it('returns 200 with recent snapshots', async () => {
      const res = await request(app).get('/api/snapshots/recent');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('includes meta with total count', async () => {
      const res = await request(app).get('/api/snapshots/recent');
      expect(res.body).toHaveProperty('meta');
      expect(res.body.meta).toHaveProperty('total');
      expect(typeof res.body.meta.total).toBe('number');
    });

    it('returns snapshot objects with expected fields', async () => {
      const res = await request(app).get('/api/snapshots/recent');
      const snap = res.body.data[0];
      expect(snap).toHaveProperty('id');
      expect(snap).toHaveProperty('agentId');
      expect(snap).toHaveProperty('timestamp');
      expect(snap).toHaveProperty('config');
      expect(snap).toHaveProperty('changeType');
    });
  });

  describe('POST /api/snapshots/capture', () => {
    it('returns 200 and triggers a capture', async () => {
      const res = await request(app).post('/api/snapshots/capture');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('includes meta with totalAgentsScanned and snapshotsCreated', async () => {
      const res = await request(app).post('/api/snapshots/capture');
      expect(res.body.meta).toHaveProperty('totalAgentsScanned');
      expect(res.body.meta).toHaveProperty('snapshotsCreated');
      expect(typeof res.body.meta.totalAgentsScanned).toBe('number');
    });
  });

  describe('GET /api/snapshots/:agentId', () => {
    it('returns 200 with snapshots for a specific agent', async () => {
      const res = await request(app).get('/api/snapshots/test-agent-1');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/snapshots/range', () => {
    it('returns 400 when startTime or endTime is missing', async () => {
      const res = await request(app).get('/api/snapshots/range');
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('returns 200 with snapshots when both time params are provided', async () => {
      const res = await request(app).get('/api/snapshots/range?startTime=2025-01-01T00:00:00Z&endTime=2025-12-31T00:00:00Z');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.meta).toHaveProperty('startTime');
      expect(res.body.meta).toHaveProperty('endTime');
    });
  });
});
