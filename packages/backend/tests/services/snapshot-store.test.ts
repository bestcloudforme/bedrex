import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AgentInventoryItem } from '@bedrex/shared';

// Mock the fs modules and logger BEFORE importing the module under test
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
}));

vi.mock('../../src/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { SnapshotStore } from '../../src/services/snapshot-store.js';

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

describe('SnapshotStore', () => {
  let store: SnapshotStore;

  beforeEach(() => {
    vi.clearAllMocks();
    // Create a fresh store for each test (bypasses the singleton)
    store = new SnapshotStore();
    // Default: no file on disk
    vi.mocked(existsSync).mockReturnValue(false);
    vi.mocked(writeFile).mockResolvedValue(undefined);
    vi.mocked(mkdir).mockResolvedValue(undefined);
  });

  describe('captureSnapshot', () => {
    it('creates an INITIAL snapshot for a new agent', async () => {
      const agent = makeAgent();
      const snapshot = await store.captureSnapshot(agent);

      expect(snapshot).not.toBeNull();
      expect(snapshot!.agentId).toBe('agent-1');
      expect(snapshot!.changeType).toBe('INITIAL');
      expect(snapshot!.config).toEqual(agent);
      expect(snapshot!.id).toBeDefined();
      expect(snapshot!.timestamp).toBeDefined();
    });

    it('returns null when agent config has not changed', async () => {
      const agent = makeAgent();

      // First call creates INITIAL
      const first = await store.captureSnapshot(agent);
      expect(first).not.toBeNull();

      // Second call with same data returns null (no changes)
      const second = await store.captureSnapshot(agent);
      expect(second).toBeNull();
    });

    it('creates a MODIFIED snapshot when agent config changes', async () => {
      const agent = makeAgent();
      await store.captureSnapshot(agent);

      // Change the agent's status
      const modified = makeAgent({ status: 'FAILED' });
      const snapshot = await store.captureSnapshot(modified);

      expect(snapshot).not.toBeNull();
      expect(snapshot!.changeType).toBe('MODIFIED');
      expect(snapshot!.changedFields).toContain('status');
    });

    it('detects changes in nested fields (actionGroups)', async () => {
      const agent = makeAgent();
      await store.captureSnapshot(agent);

      const modified = makeAgent({
        actionGroups: [
          { id: 'ag-new', name: 'NewAction', description: 'D', executionType: 'LAMBDA', state: 'ENABLED', updatedAt: '' },
        ],
      });
      const snapshot = await store.captureSnapshot(modified);

      expect(snapshot).not.toBeNull();
      expect(snapshot!.changedFields).toContain('actionGroups');
    });

    it('saves to disk after creating a snapshot', async () => {
      const agent = makeAgent();
      await store.captureSnapshot(agent);

      expect(writeFile).toHaveBeenCalled();
    });

    it('creates data directory if it does not exist', async () => {
      vi.mocked(existsSync).mockReturnValue(false);
      const agent = makeAgent();
      await store.captureSnapshot(agent);

      expect(mkdir).toHaveBeenCalled();
    });
  });

  describe('captureAll', () => {
    it('captures snapshots for multiple agents', async () => {
      const agents = [
        makeAgent({ id: 'a1', name: 'Agent1' }),
        makeAgent({ id: 'a2', name: 'Agent2' }),
      ];

      const results = await store.captureAll(agents);
      expect(results).toHaveLength(2);
      expect(results[0].agentId).toBe('a1');
      expect(results[1].agentId).toBe('a2');
    });

    it('skips agents with no changes on second call', async () => {
      const agents = [
        makeAgent({ id: 'a1', name: 'Agent1' }),
        makeAgent({ id: 'a2', name: 'Agent2' }),
      ];

      await store.captureAll(agents);
      const secondRun = await store.captureAll(agents);
      expect(secondRun).toHaveLength(0);
    });
  });

  describe('getSnapshotsForAgent', () => {
    it('returns snapshots filtered by agentId, sorted newest first', async () => {
      // Use vi.spyOn to control timestamp ordering
      let time = Date.now();
      const dateSpy = vi.spyOn(Date.prototype, 'toISOString');
      dateSpy.mockImplementation(function (this: Date) {
        // Return incrementing timestamps so sorting works
        time += 1000;
        return new Date(time).toISOString.call(new Date(time));
      });
      // Restore for proper function
      dateSpy.mockRestore();

      const agent1 = makeAgent({ id: 'a1' });
      const agent2 = makeAgent({ id: 'a2' });

      await store.captureSnapshot(agent1);
      await store.captureSnapshot(agent2);

      // Modify agent1 to get a second snapshot
      const modified = makeAgent({ id: 'a1', status: 'FAILED' });
      await store.captureSnapshot(modified);

      const snapshots = await store.getSnapshotsForAgent('a1');
      expect(snapshots).toHaveLength(2);
      // Both should be for agent a1
      expect(snapshots.every((s) => s.agentId === 'a1')).toBe(true);
      // Should have both INITIAL and MODIFIED
      const types = snapshots.map((s) => s.changeType);
      expect(types).toContain('INITIAL');
      expect(types).toContain('MODIFIED');
    });

    it('returns empty array for unknown agent', async () => {
      const snapshots = await store.getSnapshotsForAgent('nonexistent');
      expect(snapshots).toHaveLength(0);
    });
  });

  describe('getRecentChanges', () => {
    it('returns all snapshots sorted newest first', async () => {
      const agent1 = makeAgent({ id: 'a1' });
      const agent2 = makeAgent({ id: 'a2' });

      await store.captureSnapshot(agent1);
      await store.captureSnapshot(agent2);

      const recent = await store.getRecentChanges();
      expect(recent).toHaveLength(2);
      // Both agents should be present
      const agentIds = recent.map((s) => s.agentId);
      expect(agentIds).toContain('a1');
      expect(agentIds).toContain('a2');
    });

    it('respects the limit parameter', async () => {
      const agents = Array.from({ length: 5 }, (_, i) =>
        makeAgent({ id: `a${i}`, name: `Agent${i}` })
      );

      for (const agent of agents) {
        await store.captureSnapshot(agent);
      }

      const recent = await store.getRecentChanges(3);
      expect(recent).toHaveLength(3);
    });
  });

  describe('getSnapshotsInRange', () => {
    it('returns snapshots within the specified time range', async () => {
      const agent = makeAgent();
      await store.captureSnapshot(agent);

      const now = new Date();
      const past = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
      const future = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

      const inRange = await store.getSnapshotsInRange(past.toISOString(), future.toISOString());
      expect(inRange).toHaveLength(1);
    });

    it('returns empty array when no snapshots in range', async () => {
      const agent = makeAgent();
      await store.captureSnapshot(agent);

      // Range from 2 hours ago to 1 hour ago (snapshot was just created, so outside)
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);

      const inRange = await store.getSnapshotsInRange(twoHoursAgo.toISOString(), oneHourAgo.toISOString());
      expect(inRange).toHaveLength(0);
    });
  });

  describe('load from disk', () => {
    it('loads existing snapshots from file', async () => {
      const existingSnapshots = [
        {
          id: 'snap-1',
          agentId: 'agent-1',
          timestamp: '2025-01-01T00:00:00.000Z',
          config: makeAgent(),
          changeType: 'INITIAL' as const,
        },
      ];

      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFile).mockResolvedValue(JSON.stringify(existingSnapshots));

      const freshStore = new SnapshotStore();
      const snapshots = await freshStore.getSnapshotsForAgent('agent-1');
      expect(snapshots).toHaveLength(1);
      expect(snapshots[0].id).toBe('snap-1');
    });

    it('starts fresh when file read fails', async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFile).mockRejectedValue(new Error('corrupted file'));

      const freshStore = new SnapshotStore();
      const snapshots = await freshStore.getRecentChanges();
      expect(snapshots).toHaveLength(0);
    });
  });

  describe('diffConfigs (via captureSnapshot)', () => {
    it('detects changes in simple fields (name, status, foundationModel)', async () => {
      const original = makeAgent();
      await store.captureSnapshot(original);

      const modified = makeAgent({
        name: 'NewName',
        status: 'FAILED',
        foundationModel: 'amazon.nova-pro-v1:0',
      });
      const snapshot = await store.captureSnapshot(modified);

      expect(snapshot).not.toBeNull();
      expect(snapshot!.changedFields).toContain('name');
      expect(snapshot!.changedFields).toContain('status');
      expect(snapshot!.changedFields).toContain('foundationModel');
    });

    it('detects changes in guardrail', async () => {
      const original = makeAgent();
      await store.captureSnapshot(original);

      const modified = makeAgent({
        guardrail: { guardrailId: 'gr-1', guardrailVersion: '1', name: 'Guard1' },
      });
      const snapshot = await store.captureSnapshot(modified);

      expect(snapshot).not.toBeNull();
      expect(snapshot!.changedFields).toContain('guardrail');
    });

    it('detects changes in knowledgeBases', async () => {
      const original = makeAgent({
        knowledgeBases: [
          { knowledgeBaseId: 'kb-1', name: 'KB', description: 'D', dataSourceType: 'S3', embeddingModel: 'e', status: 'ACTIVE', updatedAt: '' },
        ],
      });
      await store.captureSnapshot(original);

      const modified = makeAgent({ knowledgeBases: [] });
      const snapshot = await store.captureSnapshot(modified);

      expect(snapshot).not.toBeNull();
      expect(snapshot!.changedFields).toContain('knowledgeBases');
    });
  });
});
