import type { AgentInventoryItem } from '@bedrex/shared';
import { getModelDisplayName } from '@bedrex/shared';
import { StatusBadge } from '../common/StatusBadge';
import { getModelColorClass } from '../../utils/model-colors.js';
import { clsx } from 'clsx';

interface AgentCardProps {
  agent: AgentInventoryItem;
  selected?: boolean;
  onSelect?: () => void;
  onClick?: () => void;
  onHistory?: () => void;
}

export function AgentCard({ agent, selected, onSelect, onClick, onHistory }: AgentCardProps) {
  return (
    <div
      className={clsx(
        'group relative rounded-xl border bg-white/[0.04] backdrop-blur-md p-4 transition-all duration-200 ease-out hover:bg-white/[0.07] hover:border-white/[0.14] hover:shadow-[0_0_24px_rgba(79,143,255,0.08)] hover:-translate-y-0.5 cursor-pointer',
        selected ? 'border-primary/50 ring-1 ring-primary/20 shadow-[0_0_16px_rgba(79,143,255,0.12)] bg-white/[0.06]' : 'border-white/[0.08]'
      )}
      onClick={onClick}
    >
      {onSelect && (
        <button
          role="checkbox"
          aria-checked={selected}
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          className={clsx(
            'absolute top-2 right-2 h-4 w-4 rounded border transition-colors',
            selected ? 'border-primary bg-primary' : 'border-border-hover bg-transparent'
          )}
        >
          {selected && (
            <svg className="h-full w-full text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M2.5 6l2.5 2.5 4.5-4.5" />
            </svg>
          )}
        </button>
      )}
      <div className={clsx('mb-3 flex items-start justify-between', onSelect && 'pr-6')}>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-text-primary">{agent.name}</h3>
          <p className={clsx(
            'mt-0.5 text-xs line-clamp-2 min-h-[2rem]',
            !agent.description || agent.description === agent.name
              ? 'text-text-faint italic'
              : 'text-text-muted'
          )}>
            {!agent.description || agent.description === agent.name
              ? 'No description'
              : agent.description}
          </p>
        </div>
        {agent.guardrail && (
          <svg className="ml-2 h-4 w-4 shrink-0 text-error/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-label="Protected by guardrail">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        )}
      </div>

      <div className="mb-3 flex items-center gap-2">
        <StatusBadge status={agent.status} />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-text-muted">
          <span className={clsx('h-2 w-2 rounded-full', getModelColorClass(getModelDisplayName(agent.foundationModel)))} />
          {getModelDisplayName(agent.foundationModel)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-text-muted text-[10px] uppercase tracking-wide">Region</span>
          <p className="text-text-secondary">{agent.region}</p>
        </div>
        <div>
          <span className="text-text-muted text-[10px] uppercase tracking-wide">Actions</span>
          <p className="text-text-secondary">{agent.actionGroups.length}</p>
        </div>
        <div>
          <span className="text-text-muted text-[10px] uppercase tracking-wide">KBs</span>
          <p className="text-text-secondary">{agent.knowledgeBases.length}</p>
        </div>
        <div>
          <span className="text-text-muted text-[10px] uppercase tracking-wide">Version</span>
          <p className="text-text-secondary">{agent.agentVersion}</p>
        </div>
      </div>

      {agent.metrics && (
        <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
          <div className="text-xs">
            <span className="text-text-muted text-[10px] uppercase tracking-wide">24h invocations</span>
            <p className="font-mono text-text-secondary">{agent.metrics.invocationCount24h.toLocaleString()}</p>
          </div>
          {agent.metrics.errorRate > 0.05 && (
            <span className="text-xs text-error">{(agent.metrics.errorRate * 100).toFixed(1)}% errors</span>
          )}
        </div>
      )}

      {onHistory && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onHistory();
          }}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-xs text-text-faint hover:border-border-hover hover:text-text-secondary transition-colors opacity-0 group-hover:opacity-100"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          History
        </button>
      )}
    </div>
  );
}
