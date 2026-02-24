import { useQuery } from '@tanstack/react-query';
import { fetchMetricsSummary, fetchAgentMetrics } from '../services/api';
import type { TimeRange } from '@bedrex/shared';

export function useMetricsSummary() {
  return useQuery({
    queryKey: ['metrics-summary'],
    queryFn: fetchMetricsSummary,
    staleTime: 15_000,
  });
}

export function useAgentMetrics(agentId: string, timeRange: TimeRange) {
  return useQuery({
    queryKey: ['agent-metrics', agentId, timeRange],
    queryFn: () => fetchAgentMetrics(agentId, timeRange),
    staleTime: 15_000,
    enabled: !!agentId,
  });
}
