import { useEffect, useRef, useState } from 'react';
import type { AgentInventoryItem } from '@bedrex/shared';
import { getModelDisplayName } from '@bedrex/shared';
import { StatusBadge } from '../common/StatusBadge';
import { useToastStore } from '../../stores/toast-store';
import { clsx } from 'clsx';

interface AgentDetailDrawerProps {
  agent: AgentInventoryItem;
  onClose: () => void;
}

function CopyableId({ label, value }: { label: string; value: string }) {
  const addToast = useToastStore((s) => s.addToast);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      addToast({ type: 'info', message: `Copied ${label}` });
    } catch {
      addToast({ type: 'error', message: `Failed to copy ${label}` });
    }
  };
  return (
    <div>
      <span className="text-text-faint text-xs">{label}</span>
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className="text-text-secondary text-xs font-mono truncate">{value}</span>
        <button onClick={copy} className="text-text-faint hover:text-text-muted shrink-0" title="Copy">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pt-4">
      <h4 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-3">
        <span className="h-px flex-1 bg-border-default" />
        {title}
        <span className="h-px flex-1 bg-border-default" />
      </h4>
      {children}
    </div>
  );
}

export function AgentDetailDrawer({ agent, onClose }: AgentDetailDrawerProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'actions' | 'knowledge'>('overview');

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-[#0a0d16]/95 backdrop-blur-2xl border-l border-white/[0.08] overflow-y-auto animate-slide-in-right">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0a0d16]/95 backdrop-blur-2xl border-b border-white/[0.08] p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-text-primary truncate">{agent.name}</h2>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <StatusBadge status={agent.status} />
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                  {getModelDisplayName(agent.foundationModel)}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-text-faint hover:text-text-primary hover:bg-white/10 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="border-b border-border-default px-5 flex gap-0">
          {(['overview', 'actions', 'knowledge'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'px-4 py-2.5 text-xs font-medium capitalize transition-colors border-b-2 -mb-px',
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text-secondary'
              )}
            >
              {tab === 'actions' ? `Actions (${agent.actionGroups.length})` : tab === 'knowledge' ? `Knowledge (${agent.knowledgeBases.length})` : 'Overview'}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-5">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <CopyableId label="Agent ID" value={agent.id} />
                <div>
                  <span className="text-text-faint text-xs">Region</span>
                  <p className="text-text-secondary text-xs mt-0.5">{agent.region}</p>
                </div>
                <div>
                  <span className="text-text-faint text-xs">Version</span>
                  <p className="text-text-secondary text-xs mt-0.5">{agent.agentVersion}</p>
                </div>
                <CopyableId label="Foundation Model" value={agent.foundationModel} />
                <div>
                  <span className="text-text-faint text-xs">Created</span>
                  <p className="text-text-secondary text-xs mt-0.5">
                    {agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : '\u2014'}
                  </p>
                </div>
                <div>
                  <span className="text-text-faint text-xs">Updated</span>
                  <p className="text-text-secondary text-xs mt-0.5">
                    {agent.updatedAt ? new Date(agent.updatedAt).toLocaleDateString() : '\u2014'}
                  </p>
                </div>
              </div>

              {/* Description */}
              {agent.description && (
                <Section title="Description">
                  <p className="text-sm text-text-muted leading-relaxed">{agent.description}</p>
                </Section>
              )}

              {/* Instruction */}
              {agent.instruction && (
                <Section title="Instruction">
                  <div className="max-h-48 overflow-y-auto rounded-xl bg-white/[0.04] border border-white/[0.06] p-3">
                    <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{agent.instruction}</p>
                  </div>
                </Section>
              )}

              {/* Guardrail */}
              <Section title="Guardrail">
                {agent.guardrail ? (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-3">
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-error/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                      <span className="text-sm font-medium text-text-secondary">
                        {agent.guardrail.name || `Guardrail ${agent.guardrail.guardrailId}`}
                      </span>
                    </div>
                    <div className="mt-2 flex gap-4 text-xs text-text-faint">
                      <span>ID: {agent.guardrail.guardrailId}</span>
                      <span>Version: {agent.guardrail.guardrailVersion}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-text-faint">No guardrail configured</p>
                )}
              </Section>

              {/* Metrics */}
              <Section title="Metrics">
                {agent.metrics ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3">
                      <span className="text-xs text-text-faint">Invocations (24h)</span>
                      <p className="text-lg font-semibold text-text-primary">{agent.metrics.invocationCount24h.toLocaleString()}</p>
                    </div>
                    <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3">
                      <span className="text-xs text-text-faint">Avg Latency</span>
                      <p className="text-lg font-semibold text-text-primary">{agent.metrics.avgLatencyMs}ms</p>
                    </div>
                    <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3">
                      <span className="text-xs text-text-faint">Error Rate</span>
                      <p className="text-lg font-semibold text-text-primary">{(agent.metrics.errorRate * 100).toFixed(1)}%</p>
                    </div>
                    <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3">
                      <span className="text-xs text-text-faint">Est. Cost (24h)</span>
                      <p className="text-lg font-semibold text-text-primary">${agent.metrics.estimatedCost24h.toFixed(4)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-4 text-center">
                    <p className="text-xs text-text-faint">No invocations yet</p>
                    <p className="text-xs text-text-faint mt-1">Metrics will appear once this agent starts processing requests</p>
                  </div>
                )}
              </Section>
            </>
          )}

          {/* Actions Tab */}
          {activeTab === 'actions' && (
            <>
              {agent.actionGroups.length === 0 ? (
                <p className="text-xs text-text-faint">No action groups configured</p>
              ) : (
                <div className="space-y-2">
                  {agent.actionGroups.map((ag) => (
                    <div key={ag.id} className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-text-secondary">{ag.name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${ag.state === 'ENABLED' ? 'bg-success/20 text-success' : 'bg-white/10 text-text-faint'}`}>
                          {ag.state}
                        </span>
                      </div>
                      {ag.description && (
                        <p className="mt-1 text-xs text-text-faint">{ag.description}</p>
                      )}
                      <div className="mt-2 flex gap-3 text-xs text-text-faint">
                        <span>Type: {ag.executionType}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Knowledge Tab */}
          {activeTab === 'knowledge' && (
            <>
              {agent.knowledgeBases.length === 0 ? (
                <p className="text-xs text-text-faint">No knowledge bases associated</p>
              ) : (
                <div className="space-y-2">
                  {agent.knowledgeBases.map((kb) => (
                    <div key={kb.knowledgeBaseId} className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-text-secondary">{kb.name || kb.knowledgeBaseId}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${kb.status === 'ENABLED' ? 'bg-success/20 text-success' : 'bg-white/10 text-text-faint'}`}>
                          {kb.status}
                        </span>
                      </div>
                      {kb.description && (
                        <p className="mt-1 text-xs text-text-faint">{kb.description}</p>
                      )}
                      <p className="mt-1 text-xs text-text-faint font-mono">{kb.knowledgeBaseId}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
