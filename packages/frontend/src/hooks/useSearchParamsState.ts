import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAgentStore } from '../stores/agent-store';
import type { AgentStatus, AgentType, AgentSortField, SortDirection } from '@bedrex/shared';

export function useSearchParamsState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { filters, setFilters, viewMode, setViewMode, sort, setSort } = useAgentStore();
  const initialized = useRef(false);

  // On mount: read URL params into store
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const status = searchParams.getAll('status') as AgentStatus[];
    const region = searchParams.getAll('region');
    const model = searchParams.getAll('model');
    const type = searchParams.getAll('type') as AgentType[];
    const q = searchParams.get('q') || undefined;
    const view = searchParams.get('view') as 'grid' | 'table' | null;

    const newFilters: Record<string, any> = {};
    if (status.length) newFilters.status = status;
    if (region.length) newFilters.region = region;
    if (model.length) newFilters.model = model;
    if (type.length) newFilters.type = type;
    if (q) newFilters.search = q;

    if (Object.keys(newFilters).length > 0) setFilters(newFilters);
    if (view === 'grid' || view === 'table') setViewMode(view);

    const sortField = searchParams.get('sort') as AgentSortField | null;
    const sortDir = searchParams.get('dir') as SortDirection | null;
    if (sortField) {
      setSort(sortField, sortDir || 'asc');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // On store change: write to URL
  useEffect(() => {
    if (!initialized.current) return;

    const params = new URLSearchParams();
    filters.status?.forEach((s) => params.append('status', s));
    filters.region?.forEach((r) => params.append('region', r));
    filters.model?.forEach((m) => params.append('model', m));
    filters.type?.forEach((t) => params.append('type', t));
    if (filters.search) params.set('q', filters.search);
    if (viewMode !== 'grid') params.set('view', viewMode);
    if (sort.field !== 'name' || sort.direction !== 'asc') {
      params.set('sort', sort.field);
      params.set('dir', sort.direction);
    }

    const currentAgent = searchParams.get('agent');
    if (currentAgent) params.set('agent', currentAgent);

    setSearchParams(params, { replace: true });
  }, [filters, viewMode, sort, setSearchParams]);

  // Return the agent ID from URL for detail drawer
  const agentParam = searchParams.get('agent');

  const setAgentParam = (agentId: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (agentId) {
      params.set('agent', agentId);
    } else {
      params.delete('agent');
    }
    setSearchParams(params, { replace: true });
  };

  return { agentParam, setAgentParam };
}
