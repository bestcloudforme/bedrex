import type { AgentInventoryItem, TopologyData, AgentMetrics, MetricsDashboardSummary, TimeRange, AccountConfig, ConfigSnapshot } from '@bedrex/shared';

const BASE_URL = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(error.error?.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchAgents(region?: string, accountId?: string) {
  const params = new URLSearchParams();
  if (region) params.set('region', region);
  if (accountId) params.set('accountId', accountId);
  const query = params.toString() ? `?${params}` : '';
  return fetchJson<{ data: AgentInventoryItem[]; meta: { timestamp: string; total: number } }>(`/agents${query}`);
}

export async function refreshAgents(region?: string, accountId?: string) {
  const params = new URLSearchParams();
  if (region) params.set('region', region);
  if (accountId) params.set('accountId', accountId);
  const query = params.toString() ? `?${params}` : '';
  return fetchJson<{ data: AgentInventoryItem[]; meta: { timestamp: string; total: number } }>(`/agents/refresh${query}`, { method: 'POST' });
}

export async function fetchTopology() {
  return fetchJson<{ data: TopologyData }>('/topology');
}

export async function fetchMetricsSummary() {
  return fetchJson<{ data: MetricsDashboardSummary & { costs: { dailyTotal: number; monthlyTotal: number; byModel: Record<string, { daily: number; monthly: number; agentCount: number }> } } }>('/metrics/summary');
}

export async function fetchAgentMetrics(agentId: string, timeRange: TimeRange) {
  return fetchJson<{ data: AgentMetrics }>(`/metrics/agents/${agentId}?timeRange=${timeRange}`);
}

export async function fetchSettings() {
  return fetchJson<{ data: { accounts: AccountConfig[] } }>('/settings');
}

export async function fetchAgentSnapshots(agentId: string) {
  return fetchJson<{ data: ConfigSnapshot[]; meta: { timestamp: string; total: number } }>(`/snapshots/${agentId}`);
}

export async function fetchRecentChanges() {
  return fetchJson<{ data: ConfigSnapshot[]; meta: { timestamp: string; total: number } }>('/snapshots/recent');
}

export async function fetchSnapshotsInRange(startTime: string, endTime: string) {
  const params = new URLSearchParams({ startTime, endTime });
  return fetchJson<{ data: ConfigSnapshot[]; meta: { timestamp: string; total: number; startTime: string; endTime: string } }>(`/snapshots/range?${params}`);
}

export async function triggerSnapshotCapture() {
  return fetchJson<{ data: ConfigSnapshot[]; meta: { timestamp: string; totalAgentsScanned: number; snapshotsCreated: number } }>('/snapshots/capture', { method: 'POST' });
}

export async function simulateMetrics() {
  return fetchJson<{ data: { active: boolean; agentCount: number } }>('/metrics/simulate', { method: 'POST' });
}

export async function clearSimulatedMetrics() {
  return fetchJson<{ data: { active: boolean } }>('/metrics/simulate/clear', { method: 'POST' });
}

export interface InvokeResult {
  agentId: string;
  agentName: string;
  success: boolean;
  responseText?: string;
  latencyMs: number;
  error?: string;
}

export async function invokeAllAgents() {
  return fetchJson<{ data: { results: InvokeResult[]; summary: { total: number; success: number; failed: number; avgLatencyMs: number } } }>('/agents/invoke-all', { method: 'POST' });
}

export async function invokeAgent(agentId: string, prompt?: string) {
  return fetchJson<{ data: InvokeResult }>(`/agents/${agentId}/invoke`, {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  });
}
