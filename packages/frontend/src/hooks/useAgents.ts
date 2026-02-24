import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import Fuse from 'fuse.js';
import { fetchAgents, refreshAgents } from '../services/api';
import { useAgentStore } from '../stores/agent-store';
import type { AgentInventoryItem } from '@bedrex/shared';
import { getModelDisplayName } from '@bedrex/shared';

export function useAgents() {
  const queryClient = useQueryClient();
  const { filters, sort } = useAgentStore();

  const query = useQuery({
    queryKey: ['agents'],
    queryFn: () => fetchAgents(),
    staleTime: 60_000,
  });

  const refreshMutation = useMutation({
    mutationFn: () => refreshAgents(),
    onSuccess: (data) => {
      queryClient.setQueryData(['agents'], data);
    },
  });

  const agents = query.data?.data ?? [];

  const fuseIndex = useMemo(
    () => new Fuse(agents, { keys: ['name', 'description', 'foundationModel'], threshold: 0.4 }),
    [agents]
  );

  const filteredAndSorted = useMemo(() => {
    let result: AgentInventoryItem[] = [...agents];

    // Fuzzy search
    if (filters.search) {
      result = fuseIndex.search(filters.search).map((r) => r.item);
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      result = result.filter((a) => filters.status!.includes(a.status));
    }

    // Type filter
    if (filters.type && filters.type.length > 0) {
      result = result.filter((a) => filters.type!.includes(a.type));
    }

    // Region filter
    if (filters.region && filters.region.length > 0) {
      result = result.filter((a) => filters.region!.includes(a.region));
    }

    // Framework filter
    if (filters.framework && filters.framework.length > 0) {
      result = result.filter((a) => a.framework && filters.framework!.includes(a.framework));
    }

    // Model filter
    if (filters.model?.length) {
      result = result.filter((a) =>
        filters.model!.includes(getModelDisplayName(a.foundationModel))
      );
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sort.field) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'updatedAt':
          cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'invocationCount':
          cmp = (a.metrics?.invocationCount24h ?? 0) - (b.metrics?.invocationCount24h ?? 0);
          break;
        case 'estimatedCost':
          cmp = (a.metrics?.estimatedCost24h ?? 0) - (b.metrics?.estimatedCost24h ?? 0);
          break;
        case 'model':
          cmp = getModelDisplayName(a.foundationModel).localeCompare(getModelDisplayName(b.foundationModel));
          break;
        case 'region':
          cmp = a.region.localeCompare(b.region);
          break;
        case 'actionGroups':
          cmp = a.actionGroups.length - b.actionGroups.length;
          break;
        case 'knowledgeBases':
          cmp = a.knowledgeBases.length - b.knowledgeBases.length;
          break;
      }
      return sort.direction === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [agents, filters, sort, fuseIndex]);

  const regions = useMemo(() => [...new Set(agents.map((a) => a.region))].sort(), [agents]);

  return {
    agents: filteredAndSorted,
    allAgents: agents,
    regions,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refresh: refreshMutation.mutate,
    isRefreshing: refreshMutation.isPending,
  };
}
