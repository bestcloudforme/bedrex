import { randomUUID } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ConfigSnapshot, AgentInventoryItem, ChangeType } from '@bedrex/shared';
import { logger } from '../utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../../data');
const SNAPSHOTS_FILE = resolve(DATA_DIR, 'snapshots.json');

export class SnapshotStore {
  private snapshots: ConfigSnapshot[] = [];
  private loaded = false;

  async load(): Promise<void> {
    if (this.loaded) return;

    try {
      if (existsSync(SNAPSHOTS_FILE)) {
        const raw = await readFile(SNAPSHOTS_FILE, 'utf-8');
        this.snapshots = JSON.parse(raw);
        logger.info({ count: this.snapshots.length }, 'Loaded snapshots from disk');
      } else {
        this.snapshots = [];
        logger.info('No snapshots file found, starting fresh');
      }
    } catch (err) {
      logger.warn({ error: err }, 'Failed to load snapshots, starting fresh');
      this.snapshots = [];
    }

    this.loaded = true;
  }

  private async save(): Promise<void> {
    try {
      if (!existsSync(DATA_DIR)) {
        await mkdir(DATA_DIR, { recursive: true });
      }
      await writeFile(SNAPSHOTS_FILE, JSON.stringify(this.snapshots, null, 2), 'utf-8');
    } catch (err) {
      logger.error({ error: err }, 'Failed to save snapshots to disk');
    }
  }

  /**
   * Capture a snapshot for a single agent. Compares against the most recent
   * snapshot for this agent and only creates a new entry if there are changes
   * (or if this is the first snapshot for the agent).
   */
  async captureSnapshot(agent: AgentInventoryItem): Promise<ConfigSnapshot | null> {
    await this.load();

    const latestSnapshot = this.getLatestForAgent(agent.id);

    if (!latestSnapshot) {
      // First time seeing this agent
      const snapshot = this.createEntry(agent, 'INITIAL');
      this.snapshots.push(snapshot);
      await this.save();
      return snapshot;
    }

    // Compare current config with latest snapshot
    const changedFields = this.diffConfigs(latestSnapshot.config, agent);

    if (changedFields.length === 0) {
      // No changes detected
      return null;
    }

    const snapshot = this.createEntry(agent, 'MODIFIED', changedFields);
    this.snapshots.push(snapshot);
    await this.save();
    return snapshot;
  }

  /**
   * Capture snapshots for all agents in a batch.
   * Performs all in-memory changes first, then writes to disk once.
   */
  async captureAll(agents: AgentInventoryItem[]): Promise<ConfigSnapshot[]> {
    await this.load();

    const results: ConfigSnapshot[] = [];
    for (const agent of agents) {
      const latestSnapshot = this.getLatestForAgent(agent.id);

      if (!latestSnapshot) {
        const snapshot = this.createEntry(agent, 'INITIAL');
        this.snapshots.push(snapshot);
        results.push(snapshot);
        continue;
      }

      const changedFields = this.diffConfigs(latestSnapshot.config, agent);
      if (changedFields.length === 0) continue;

      const snapshot = this.createEntry(agent, 'MODIFIED', changedFields);
      this.snapshots.push(snapshot);
      results.push(snapshot);
    }

    if (results.length > 0) {
      await this.save();
    }

    return results;
  }

  /**
   * Get all snapshots for a specific agent, sorted newest first.
   */
  async getSnapshotsForAgent(agentId: string): Promise<ConfigSnapshot[]> {
    await this.load();
    return this.snapshots
      .filter((s) => s.agentId === agentId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Get snapshots within a time range, sorted newest first.
   */
  async getSnapshotsInRange(startTime: string, endTime: string): Promise<ConfigSnapshot[]> {
    await this.load();
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    return this.snapshots
      .filter((s) => {
        const ts = new Date(s.timestamp).getTime();
        return ts >= start && ts <= end;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Get recent changes across all agents, limited to the most recent N entries.
   */
  async getRecentChanges(limit = 50): Promise<ConfigSnapshot[]> {
    await this.load();
    return [...this.snapshots]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  private getLatestForAgent(agentId: string): ConfigSnapshot | undefined {
    const agentSnapshots = this.snapshots.filter((s) => s.agentId === agentId);
    if (agentSnapshots.length === 0) return undefined;
    return agentSnapshots.reduce((latest, s) =>
      new Date(s.timestamp).getTime() > new Date(latest.timestamp).getTime() ? s : latest,
    );
  }

  private createEntry(
    agent: AgentInventoryItem,
    changeType: ChangeType,
    changedFields?: string[],
  ): ConfigSnapshot {
    return {
      id: randomUUID(),
      agentId: agent.id,
      timestamp: new Date().toISOString(),
      config: structuredClone(agent),
      changeType,
      changedFields,
    };
  }

  /**
   * Shallow diff of two agent configs. Returns list of top-level field names
   * that differ, plus checks nested arrays by length and serialized content.
   */
  private diffConfigs(prev: AgentInventoryItem, curr: AgentInventoryItem): string[] {
    const changed: string[] = [];

    const fieldsToCompare: (keyof AgentInventoryItem)[] = [
      'name',
      'type',
      'status',
      'region',
      'accountId',
      'foundationModel',
      'framework',
      'description',
      'instruction',
      'agentVersion',
      'updatedAt',
      'estimatedMonthlyCost',
    ];

    for (const field of fieldsToCompare) {
      if (prev[field] !== curr[field]) {
        changed.push(field);
      }
    }

    // Compare complex nested fields via serialization
    const complexFields: (keyof AgentInventoryItem)[] = [
      'actionGroups',
      'knowledgeBases',
      'guardrail',
      'agentCoreConfig',
      'metrics',
    ];

    for (const field of complexFields) {
      if (JSON.stringify(prev[field]) !== JSON.stringify(curr[field])) {
        changed.push(field);
      }
    }

    return changed;
  }
}

export const snapshotStore = new SnapshotStore();
