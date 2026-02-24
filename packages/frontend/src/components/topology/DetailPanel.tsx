import type { Node } from '@xyflow/react';
import type { AgentInventoryItem, ActionGroup, KnowledgeBaseAssociation, GuardrailConfig } from '@bedrex/shared';
import { getModelDisplayName, MODEL_PRICING } from '@bedrex/shared';
import { StatusBadge } from '../common/StatusBadge';

interface DetailPanelProps {
  node: Node | null;
  onClose: () => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-text-faint text-xs">{label}</span>
      <div className="text-text-secondary text-xs mt-0.5">{children}</div>
    </div>
  );
}

function AgentDetail({ agent }: { agent: AgentInventoryItem }) {
  return (
    <>
      <Field label="Status"><StatusBadge status={agent.status} /></Field>
      <Field label="Model">{getModelDisplayName(agent.foundationModel)}</Field>
      {agent.description && <Field label="Description">{agent.description}</Field>}
      <Field label={`Action Groups (${agent.actionGroups.length})`}>
        {agent.actionGroups.map((ag) => (
          <p key={ag.id}>- {ag.name}</p>
        ))}
        {agent.actionGroups.length === 0 && <p className="text-text-faint">None</p>}
      </Field>
      <Field label={`Knowledge Bases (${agent.knowledgeBases.length})`}>
        {agent.knowledgeBases.map((kb) => (
          <p key={kb.knowledgeBaseId}>- {kb.name || kb.knowledgeBaseId}</p>
        ))}
        {agent.knowledgeBases.length === 0 && <p className="text-text-faint">None</p>}
      </Field>
      {agent.guardrail && (
        <Field label="Guardrail">{agent.guardrail.name || agent.guardrail.guardrailId}</Field>
      )}
      {agent.metrics && (
        <div className="border-t border-white/[0.08] pt-3">
          <span className="text-text-faint text-xs">24h Metrics</span>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <Field label="Invocations">{agent.metrics.invocationCount24h.toLocaleString()}</Field>
            <Field label="Avg Latency">{agent.metrics.avgLatencyMs}ms</Field>
            <Field label="Error Rate">{(agent.metrics.errorRate * 100).toFixed(1)}%</Field>
            <Field label="Cost">${agent.metrics.estimatedCost24h.toFixed(2)}</Field>
          </div>
        </div>
      )}
      <div className="border-t border-white/[0.08] pt-3">
        <Field label="Agent ID"><span className="font-mono text-[10px] break-all">{agent.id}</span></Field>
      </div>
    </>
  );
}

function ModelDetail({ modelId }: { modelId: string }) {
  const pricing = MODEL_PRICING[modelId];
  return (
    <>
      <Field label="Model ID"><span className="font-mono text-[10px] break-all">{modelId}</span></Field>
      <Field label="Display Name">{getModelDisplayName(modelId)}</Field>
      {pricing && (
        <div className="border-t border-white/[0.08] pt-3 space-y-2">
          <span className="text-text-faint text-xs">Pricing (per 1K tokens)</span>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <Field label="Input">${pricing.inputPer1k.toFixed(6)}</Field>
            <Field label="Output">${pricing.outputPer1k.toFixed(6)}</Field>
          </div>
        </div>
      )}
    </>
  );
}

function ActionGroupDetail({ actionGroup, agentId }: { actionGroup: ActionGroup; agentId?: string }) {
  return (
    <>
      {actionGroup.description && <Field label="Description">{actionGroup.description}</Field>}
      <Field label="Execution Type">{actionGroup.executionType}</Field>
      <Field label="State">
        <span className={actionGroup.state === 'ENABLED' ? 'text-success' : 'text-text-faint'}>{actionGroup.state}</span>
      </Field>
      {agentId && <Field label="Parent Agent"><span className="font-mono text-[10px]">{agentId}</span></Field>}
    </>
  );
}

function KBDetail({ kb }: { kb: KnowledgeBaseAssociation }) {
  return (
    <>
      <Field label="KB ID"><span className="font-mono text-[10px]">{kb.knowledgeBaseId}</span></Field>
      {kb.description && <Field label="Description">{kb.description}</Field>}
      <Field label="Status">
        <span className={kb.status === 'ENABLED' ? 'text-success' : 'text-text-faint'}>{kb.status}</span>
      </Field>
    </>
  );
}

function GuardrailDetail({ guardrail }: { guardrail: GuardrailConfig }) {
  return (
    <>
      <Field label="Guardrail ID"><span className="font-mono text-[10px]">{guardrail.guardrailId}</span></Field>
      <Field label="Version">{guardrail.guardrailVersion}</Field>
      {guardrail.name && <Field label="Name">{guardrail.name}</Field>}
    </>
  );
}

export function DetailPanel({ node, onClose }: DetailPanelProps) {
  if (!node) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = node.data as Record<string, any>;
  const label = data?.label as string | undefined;
  const nodeType = node.type || 'unknown';

  return (
    <div className="w-80 shrink-0 overflow-y-auto rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">{label}</h3>
        <button onClick={onClose} className="text-text-faint hover:text-white">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-3 text-xs">
        <Field label="Type"><span className="capitalize">{nodeType.replace(/-/g, ' ')}</span></Field>

        {nodeType === 'bedrock-agent' && data?.agent && (
          <AgentDetail agent={node.data.agent as AgentInventoryItem} />
        )}

        {nodeType === 'foundation-model' && data?.modelId && (
          <ModelDetail modelId={node.data.modelId as string} />
        )}

        {nodeType === 'action-group' && data?.actionGroup && (
          <ActionGroupDetail
            actionGroup={node.data.actionGroup as ActionGroup}
            agentId={node.data.agentId as string | undefined}
          />
        )}

        {nodeType === 'knowledge-base' && data?.knowledgeBase && (
          <KBDetail kb={node.data.knowledgeBase as KnowledgeBaseAssociation} />
        )}

        {nodeType === 'guardrail' && data?.guardrail && (
          <GuardrailDetail guardrail={node.data.guardrail as GuardrailConfig} />
        )}
      </div>
    </div>
  );
}
