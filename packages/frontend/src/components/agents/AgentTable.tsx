import type { AgentInventoryItem, AgentSortField } from '@bedrex/shared';
import { getModelDisplayName } from '@bedrex/shared';
import { StatusBadge } from '../common/StatusBadge';
import { useAgentStore } from '../../stores/agent-store';
import { getModelColorClass } from '../../utils/model-colors.js';
import { clsx } from 'clsx';

interface AgentTableProps {
  agents: AgentInventoryItem[];
  onAgentClick?: (agent: AgentInventoryItem) => void;
  onHistory?: (agent: AgentInventoryItem) => void;
}

const columns: { key: string; label: string; sortable: boolean; sortField?: AgentSortField }[] = [
  { key: 'name', label: 'Name', sortable: true, sortField: 'name' },
  { key: 'status', label: 'Status', sortable: true, sortField: 'status' },
  { key: 'model', label: 'Model', sortable: true, sortField: 'model' },
  { key: 'region', label: 'Region', sortable: true, sortField: 'region' },
  { key: 'actions', label: 'Actions', sortable: true, sortField: 'actionGroups' },
  { key: 'kbs', label: 'KBs', sortable: true, sortField: 'knowledgeBases' },
  { key: 'guardrail', label: 'Guardrail', sortable: false },
  { key: 'history', label: '', sortable: false },
];

export function AgentTable({ agents, onAgentClick, onHistory }: AgentTableProps) {
  const { sort, setSort, selectedAgentIds, toggleAgentSelection, clearSelection } = useAgentStore();

  const visibleIds = agents.map((a) => a.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedAgentIds.includes(id));
  const someVisibleSelected = visibleIds.some((id) => selectedAgentIds.includes(id));

  const handleSelectAll = () => {
    if (allVisibleSelected) {
      clearSelection();
    } else {
      visibleIds.forEach((id) => {
        if (!selectedAgentIds.includes(id)) {
          toggleAgentSelection(id);
        }
      });
    }
  };

  return (
    <div className="relative rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md max-h-[calc(100vh-14rem)] overflow-y-auto">
      {/* Scroll container with horizontal scroll indicator shadow */}
      <div className="overflow-x-auto shadow-[inset_-20px_0_20px_-20px_rgba(0,0,0,0.5)]">
      <table className="min-w-[700px] w-full text-left text-sm">
        <thead className="sticky top-0 z-10 border-b-2 border-primary/20 bg-white/[0.04]">
          <tr>
            <th className="p-3 w-10">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                ref={(el) => { if (el) el.indeterminate = someVisibleSelected && !allVisibleSelected; }}
                onChange={handleSelectAll}
                className="h-3.5 w-3.5 rounded border-border-default bg-transparent text-primary focus:ring-primary/50 cursor-pointer"
              />
            </th>
            {columns.map((col) => (
              <th
                key={col.key}
                className={clsx('p-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider', col.sortable && 'cursor-pointer hover:text-text-secondary')}
                onClick={() => col.sortable && col.sortField && setSort(col.sortField)}
              >
                {col.label}
                {col.sortable && col.sortField && sort.field === col.sortField && (
                  <span className="ml-1">{sort.direction === 'asc' ? '\u2191' : '\u2193'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {agents.map((agent) => (
            <tr
              key={agent.id}
              className={clsx('hover:bg-white/[0.05] border-l-2 border-l-transparent hover:border-l-primary/60 cursor-pointer transition-colors', selectedAgentIds.includes(agent.id) && 'bg-primary/5')}
              onClick={() => onAgentClick?.(agent)}
            >
              <td className="p-3 w-10">
                <input
                  type="checkbox"
                  checked={selectedAgentIds.includes(agent.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleAgentSelection(agent.id);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="h-3.5 w-3.5 rounded border-border-default bg-transparent text-primary focus:ring-primary/50 cursor-pointer"
                />
              </td>
              <td className="p-3">
                <div>
                  <p className="font-medium text-text-primary">{agent.name}</p>
                  {agent.description && agent.description !== agent.name
                    ? <p className="text-xs text-text-faint truncate max-w-xs">{agent.description}</p>
                    : <p className="text-xs text-text-faint italic truncate max-w-xs">No description</p>}
                </div>
              </td>
              <td className="p-3"><StatusBadge status={agent.status} /></td>
              <td className="p-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-0.5 text-xs text-text-muted">
                  <span className={clsx('h-1.5 w-1.5 rounded-full', getModelColorClass(getModelDisplayName(agent.foundationModel)))} />
                  {getModelDisplayName(agent.foundationModel)}
                </span>
              </td>
              <td className="p-3 text-text-secondary text-xs">{agent.region}</td>
              <td className="p-3 text-text-secondary">{agent.actionGroups.length}</td>
              <td className="p-3 text-text-secondary">{agent.knowledgeBases.length}</td>
              <td className="p-3 text-center">
                {agent.guardrail ? (
                  <svg className="h-4 w-4 mx-auto text-error/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                ) : (
                  <span className="text-xs text-text-faint">{'\u2014'}</span>
                )}
              </td>
              <td className="p-3">
                {onHistory && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onHistory(agent);
                    }}
                    className="flex items-center gap-1 rounded-md border border-border-default px-2 py-1 text-xs text-text-faint hover:border-border-hover hover:text-text-secondary transition-colors"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    History
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
