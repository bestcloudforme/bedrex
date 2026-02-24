import { useState, useMemo } from 'react';
import { getModelDisplayName } from '@bedrex/shared';
import { useAgentMetrics } from '../../hooks/useMetrics';
import { SparklineChart } from './SparklineChart';
import { clsx } from 'clsx';
import type { AgentInventoryItem, TimeRange } from '@bedrex/shared';

type SortField = 'name' | 'model' | 'status' | 'invocations' | 'latency' | 'errorRate' | 'cost';
type SortDir = 'asc' | 'desc';

const columns: { key: SortField; label: string; align?: 'right' | 'center' }[] = [
  { key: 'name', label: 'Agent' },
  { key: 'model', label: 'Model' },
  { key: 'status', label: 'Status', align: 'center' },
  { key: 'invocations', label: 'Invocations (24h)', align: 'right' },
  { key: 'latency', label: 'Avg Latency', align: 'right' },
  { key: 'errorRate', label: 'Error Rate', align: 'right' },
  { key: 'cost', label: 'Est. Cost (24h)', align: 'right' },
];

function sortAgents(agents: AgentInventoryItem[], field: SortField, dir: SortDir): AgentInventoryItem[] {
  const sorted = [...agents].sort((a, b) => {
    let cmp = 0;
    switch (field) {
      case 'name':
        cmp = a.name.localeCompare(b.name);
        break;
      case 'model':
        cmp = getModelDisplayName(a.foundationModel).localeCompare(getModelDisplayName(b.foundationModel));
        break;
      case 'status':
        cmp = a.status.localeCompare(b.status);
        break;
      case 'invocations':
        cmp = (a.metrics?.invocationCount24h ?? 0) - (b.metrics?.invocationCount24h ?? 0);
        break;
      case 'latency':
        cmp = (a.metrics?.avgLatencyMs ?? 0) - (b.metrics?.avgLatencyMs ?? 0);
        break;
      case 'errorRate':
        cmp = (a.metrics?.errorRate ?? 0) - (b.metrics?.errorRate ?? 0);
        break;
      case 'cost':
        cmp = (a.metrics?.estimatedCost24h ?? 0) - (b.metrics?.estimatedCost24h ?? 0);
        break;
    }
    return cmp;
  });
  return dir === 'desc' ? sorted.reverse() : sorted;
}

function ExpandedRow({ agent, timeRange }: { agent: AgentInventoryItem; timeRange: TimeRange }) {
  const { data, isLoading, isError, refetch } = useAgentMetrics(agent.id, timeRange);
  const metrics = data?.data;

  if (isError) {
    return (
      <div className="flex items-center justify-center py-6 gap-2">
        <span className="text-xs text-text-faint">Failed to load metrics</span>
        <button onClick={() => refetch()} className="text-xs text-primary hover:text-primary/80 transition-colors">Retry</button>
      </div>
    );
  }

  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-2 gap-4 p-4 animate-pulse">
        {[1, 2].map((i) => (
          <div key={i}>
            <div className="h-3 w-20 bg-white/[0.06] rounded mb-2" />
            <div className="h-[60px] bg-white/[0.04] rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-2">Invocations</p>
          <SparklineChart data={metrics.invocationCount} color="#4f8fff" height={56} />
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-2">Latency (ms)</p>
          <SparklineChart data={metrics.latency} color="#ffb224" height={56} />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3 mt-3">
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
          <p className="text-[10px] text-text-faint">Avg Latency</p>
          <p className="text-sm font-mono text-text-secondary tabular-nums mt-0.5">
            {agent.metrics?.avgLatencyMs ?? '-'}ms
          </p>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
          <p className="text-[10px] text-text-faint">Error Rate</p>
          <p className={clsx(
            'text-sm font-mono tabular-nums mt-0.5',
            agent.metrics && agent.metrics.errorRate > 0.05 ? 'text-error' :
            agent.metrics && agent.metrics.errorRate > 0.02 ? 'text-warning' : 'text-success'
          )}>
            {agent.metrics ? `${(agent.metrics.errorRate * 100).toFixed(1)}%` : '-'}
          </p>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
          <p className="text-[10px] text-text-faint">Tokens (24h)</p>
          <p className="text-sm font-mono text-text-secondary tabular-nums mt-0.5">
            {agent.metrics?.totalTokensUsed24h?.toLocaleString() ?? '-'}
          </p>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
          <p className="text-[10px] text-text-faint">Est. Cost (24h)</p>
          <p className="text-sm font-mono text-warning tabular-nums mt-0.5">
            ${agent.metrics?.estimatedCost24h?.toFixed(2) ?? '-'}
          </p>
        </div>
      </div>
    </div>
  );
}

interface AgentOverviewTableProps {
  agents: AgentInventoryItem[];
  timeRange: TimeRange;
}

export function AgentOverviewTable({ agents, timeRange }: AgentOverviewTableProps) {
  const [sortField, setSortField] = useState<SortField>('invocations');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'name' || field === 'model' || field === 'status' ? 'asc' : 'desc');
    }
  };

  const filteredAgents = useMemo(() => {
    if (!searchQuery) return agents;
    const q = searchQuery.toLowerCase();
    return agents.filter((a) =>
      a.name.toLowerCase().includes(q) ||
      getModelDisplayName(a.foundationModel).toLowerCase().includes(q) ||
      a.status.toLowerCase().includes(q)
    );
  }, [agents, searchQuery]);

  const sortedAgents = useMemo(() => sortAgents(filteredAgents, sortField, sortDir), [filteredAgents, sortField, sortDir]);

  return (
    <div className="rounded-xl border border-white/[0.08] overflow-hidden">
      {/* Search bar */}
      {agents.length > 5 && (
        <div className="border-b border-white/[0.06] bg-white/[0.02] px-3 py-2">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${agents.length} agents...`}
              className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-faint focus:outline-none focus:border-primary/40 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="max-h-[600px] overflow-y-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/[0.08] bg-white/[0.04] sticky top-0 z-10">
            <tr>
              <th className="w-8 p-3" />
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`p-3 text-xs font-medium text-text-muted uppercase tracking-wider cursor-pointer select-none hover:text-text-secondary transition-colors ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}
                  {sortField === col.key && (
                    <span className="ml-1">{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-white/[0.02]">
            {sortedAgents.map((agent) => {
              const isExpanded = expandedId === agent.id;
              const hasMetrics = !!agent.metrics;
              return (
                <tr key={agent.id} className="group">
                  <td colSpan={8} className="p-0">
                    <div
                      className={clsx(
                        'grid grid-cols-[2rem_1fr_1fr_5rem_minmax(7rem,1fr)_minmax(6rem,1fr)_minmax(5.5rem,1fr)_minmax(7rem,1fr)] items-center cursor-pointer transition-colors',
                        isExpanded ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]',
                      )}
                      onClick={() => {
                        if (hasMetrics) setExpandedId(isExpanded ? null : agent.id);
                      }}
                    >
                      {/* Expand arrow */}
                      <div className="p-3 flex justify-center">
                        {hasMetrics ? (
                          <svg
                            className={clsx(
                              'h-3.5 w-3.5 text-text-faint transition-transform duration-200',
                              isExpanded && 'rotate-90'
                            )}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                          </svg>
                        ) : (
                          <span className="h-3.5 w-3.5" />
                        )}
                      </div>
                      {/* Name */}
                      <div className="p-3">
                        <p className="font-medium text-text-primary text-xs">{agent.name}</p>
                        <p className="text-[10px] text-text-faint">{agent.region}</p>
                      </div>
                      {/* Model */}
                      <div className="p-3">
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-text-muted">
                          {getModelDisplayName(agent.foundationModel)}
                        </span>
                      </div>
                      {/* Status */}
                      <div className="p-3 text-center">
                        <span className={`text-xs font-medium ${agent.status === 'PREPARED' ? 'text-success' : agent.status === 'NOT_PREPARED' ? 'text-warning' : 'text-text-muted'}`}>
                          {agent.status}
                        </span>
                      </div>
                      {/* Invocations */}
                      <div className="p-3 text-right">
                        <span className="text-xs font-mono tabular-nums text-text-secondary">
                          {agent.metrics?.invocationCount24h != null ? agent.metrics.invocationCount24h.toLocaleString() : '--'}
                        </span>
                      </div>
                      {/* Latency */}
                      <div className="p-3 text-right">
                        <span className="text-xs font-mono tabular-nums text-text-secondary">
                          {agent.metrics?.avgLatencyMs != null ? `${agent.metrics.avgLatencyMs}ms` : '--'}
                        </span>
                      </div>
                      {/* Error Rate */}
                      <div className="p-3 text-right">
                        {agent.metrics?.errorRate != null ? (
                          <span className={`text-xs font-mono tabular-nums ${agent.metrics.errorRate > 0.05 ? 'text-error' : agent.metrics.errorRate > 0.02 ? 'text-warning' : 'text-success'}`}>
                            {(agent.metrics.errorRate * 100).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-xs text-text-faint">--</span>
                        )}
                      </div>
                      {/* Cost */}
                      <div className="p-3 text-right">
                        <span className="text-xs font-mono tabular-nums text-warning">
                          {agent.metrics?.estimatedCost24h != null ? `$${agent.metrics.estimatedCost24h.toFixed(2)}` : '--'}
                        </span>
                      </div>
                    </div>
                    {/* Expanded detail row */}
                    {isExpanded && (
                      <div className="border-t border-white/[0.06] bg-white/[0.03]">
                        <ExpandedRow agent={agent} timeRange={timeRange} />
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {sortedAgents.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-xs text-text-faint">
                  {searchQuery ? `No agents matching "${searchQuery}"` : 'No agents found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer with count */}
      {agents.length > 5 && (
        <div className="border-t border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[10px] text-text-faint">
          Showing {sortedAgents.length} of {agents.length} agents
          {expandedId && ' \u00B7 Click a row to expand/collapse metrics'}
        </div>
      )}
    </div>
  );
}
