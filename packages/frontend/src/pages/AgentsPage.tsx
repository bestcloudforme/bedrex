import { useState, useEffect } from 'react';
import { useAgents } from '../hooks/useAgents';
import { useAgentStore } from '../stores/agent-store';
import { useUIStore } from '../stores/ui-store';
import { useToastStore } from '../stores/toast-store';
import { useSearchParamsState } from '../hooks/useSearchParamsState';
import { AgentCard } from '../components/agents/AgentCard';
import { AgentTable } from '../components/agents/AgentTable';
import { AgentFilters } from '../components/agents/AgentFilters';
import { ChangeTimeline } from '../components/agents/ChangeTimeline';
import { AgentDetailDrawer } from '../components/agents/AgentDetailDrawer';
import { SearchBar } from '../components/common/SearchBar';
import { Select } from '../components/common/Select';
import { Button } from '../components/common/Button';
import { IconRefresh } from '../components/common/Icons';
import { SkeletonAgentGrid } from '../components/common/Skeleton';
import { clsx } from 'clsx';
import type { AgentInventoryItem } from '@bedrex/shared';

export function AgentsPage() {
  const { agents, allAgents, regions, isLoading, isError, error, refresh, isRefreshing } = useAgents();
  const { viewMode, setViewMode, filters, setFilters, selectedAgentIds, sort } = useAgentStore();
  const { filterSidebarOpen, setFilterSidebarOpen } = useUIStore();
  const addToast = useToastStore((s) => s.addToast);
  const { agentParam, setAgentParam } = useSearchParamsState();
  const [historyAgent, setHistoryAgent] = useState<AgentInventoryItem | null>(null);
  const [detailAgent, setDetailAgent] = useState<AgentInventoryItem | null>(null);

  // Sync detail drawer with URL agent param
  useEffect(() => {
    if (agentParam && !detailAgent && allAgents.length > 0) {
      const found = allAgents.find((a) => a.id === agentParam);
      if (found) setDetailAgent(found);
    }
  }, [agentParam, allAgents, detailAgent]);

  const openDetail = (agent: AgentInventoryItem) => {
    setDetailAgent(agent);
    setAgentParam(agent.id);
  };

  const closeDetail = () => {
    setDetailAgent(null);
    setAgentParam(null);
  };

  const handleExportSelected = () => {
    const selected = allAgents.filter((a) => selectedAgentIds.includes(a.id));
    const blob = new Blob([JSON.stringify(selected, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agents-export.json';
    a.click();
    URL.revokeObjectURL(url);
    addToast({ type: 'success', message: `Exported ${selected.length} agents` });
  };

  return (
    <div className="flex gap-6">
      {/* Collapsible Filter Sidebar */}
      <div className={clsx('shrink-0 transition-all duration-200 overflow-hidden', filterSidebarOpen ? 'hidden md:block md:w-56' : 'w-0')}>
        {filterSidebarOpen && <AgentFilters regions={regions} allAgents={allAgents} />}
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Page Heading */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white">Agents</h2>
          <p className="text-sm text-text-muted mt-1">Monitor and manage your Bedrock agent fleet</p>
        </div>

        {/* Top Bar */}
        <div className="mb-4 flex items-center gap-4">
          <div className="flex-1">
            <SearchBar
              value={filters.search || ''}
              onChange={(search) => setFilters({ search })}
              placeholder="Search agents by name, description, or model..."
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Filter sidebar toggle */}
            <button
              onClick={() => setFilterSidebarOpen(!filterSidebarOpen)}
              className="rounded-xl border border-white/[0.08] p-2 text-text-faint hover:text-white hover:border-white/[0.14] transition-colors backdrop-blur-sm"
              title={filterSidebarOpen ? 'Hide filters' : 'Show filters'}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
            </button>

            {/* View mode toggle */}
            <div className="flex rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={clsx('px-3 py-1.5 text-xs font-medium rounded-l-xl', viewMode === 'grid' ? 'bg-primary text-white' : 'text-text-muted hover:text-white')}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={clsx('px-3 py-1.5 text-xs font-medium rounded-r-xl', viewMode === 'table' ? 'bg-primary text-white' : 'text-text-muted hover:text-white')}
              >
                Table
              </button>
            </div>

            {/* Grid sort dropdown */}
            {viewMode === 'grid' && (
              <Select
                value={sort.field}
                onChange={(field) => useAgentStore.getState().setSort(field as any)}
                options={[
                  { value: 'name', label: 'Sort: Name' },
                  { value: 'status', label: 'Sort: Status' },
                  { value: 'model', label: 'Sort: Model' },
                  { value: 'region', label: 'Sort: Region' },
                  { value: 'actionGroups', label: 'Sort: Actions' },
                  { value: 'knowledgeBases', label: 'Sort: KBs' },
                ]}
              />
            )}

            {/* Refresh button */}
            <Button
              variant="secondary"
              onClick={() => refresh(undefined, { onSuccess: () => addToast({ type: 'success', message: 'Agents refreshed successfully' }) })}
              disabled={isRefreshing}
              loading={isRefreshing}
              icon={!isRefreshing ? <IconRefresh className="h-3.5 w-3.5" /> : undefined}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Count */}
        <div className="mb-3 text-xs text-text-faint">
          <span>{agents.length === allAgents.length
            ? `${agents.length} agents`
            : `${agents.length} of ${allAgents.length} agents`}</span>
        </div>

        {/* Batch Actions Bar */}
        {selectedAgentIds.length > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 backdrop-blur-sm px-4 py-2 mb-4">
            <span className="text-sm text-text-secondary">
              {selectedAgentIds.length} agent{selectedAgentIds.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportSelected}
                className="rounded-xl border border-white/[0.08] px-3 py-1 text-xs text-text-muted hover:text-white hover:border-white/[0.14] transition-colors"
              >
                Export JSON
              </button>
              <button
                onClick={() => useAgentStore.getState().clearSelection()}
                className="text-xs text-text-faint hover:text-text-muted"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Loading / Error / Content */}
        {isLoading ? (
          <SkeletonAgentGrid />
        ) : isError ? (
          <div className="rounded-xl border border-error/30 bg-error/10 backdrop-blur-sm p-6 text-center">
            <p className="text-error">Failed to load agents</p>
            <p className="mt-1 text-xs text-text-faint">{error?.message}</p>
            <button onClick={() => refresh(undefined, { onSuccess: () => addToast({ type: 'success', message: 'Agents refreshed successfully' }) })} className="mt-3 rounded-xl bg-primary px-4 py-1.5 text-xs text-white hover:bg-primary/80">
              Retry
            </button>
          </div>
        ) : agents.length === 0 ? (
          <div className="py-20 text-center text-text-faint">
            <p>No agents found</p>
            <p className="text-xs mt-1">Try adjusting your filters or search query</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                selected={selectedAgentIds.includes(agent.id)}
                onSelect={() => useAgentStore.getState().toggleAgentSelection(agent.id)}
                onClick={() => openDetail(agent)}
                onHistory={() => setHistoryAgent(agent)}
              />
            ))}
          </div>
        ) : (
          <AgentTable agents={agents} onAgentClick={(agent) => openDetail(agent)} onHistory={(agent) => setHistoryAgent(agent)} />
        )}
      </div>

      {historyAgent && (
        <ChangeTimeline
          agentId={historyAgent.id}
          agentName={historyAgent.name}
          onClose={() => setHistoryAgent(null)}
        />
      )}

      {detailAgent && (
        <AgentDetailDrawer
          agent={detailAgent}
          onClose={closeDetail}
        />
      )}
    </div>
  );
}
