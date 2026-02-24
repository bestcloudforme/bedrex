import { useState, useMemo } from 'react';
import { getModelDisplayName, MODEL_PRICING } from '@bedrex/shared';
import type { AgentInventoryItem } from '@bedrex/shared';

export function PricingComparison({ agents }: { agents: AgentInventoryItem[] }) {
  const [showAllModels, setShowAllModels] = useState(false);

  const usedModelIds = useMemo(() => new Set(agents.map((a) => a.foundationModel)), [agents]);

  const allModels = useMemo(
    () =>
      Object.entries(MODEL_PRICING)
        .map(([id, p]) => ({ id, name: getModelDisplayName(id), ...p }))
        .sort((a, b) => a.inputPer1k - b.inputPer1k),
    [],
  );

  const hasUsedModels = usedModelIds.size > 0;
  const models = showAllModels || !hasUsedModels ? allModels : allModels.filter((m) => usedModelIds.has(m.id));

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md p-4 transition-all hover:bg-white/[0.07] hover:border-white/[0.14] hover:shadow-[0_0_24px_rgba(79,143,255,0.06)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <span className="h-5 w-0.5 rounded-full bg-primary" />
          Model Pricing Tiers
        </h3>
        {hasUsedModels && (
          <button
            onClick={() => setShowAllModels((v) => !v)}
            className="text-[10px] text-primary hover:text-primary/80 transition-colors"
          >
            {showAllModels ? 'Show used only' : 'Show all models'}
          </button>
        )}
      </div>
      <div className="space-y-1.5">
        {models.map((m) => (
          <div key={m.id} className="flex items-center gap-3 text-xs">
            <span className="text-text-muted w-36 truncate">{m.name}</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.min((m.inputPer1k / 0.015) * 100, 100)}%` }}
              />
            </div>
            <span className="text-text-faint font-mono w-24 text-right">${m.inputPer1k} / ${m.outputPer1k}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[10px] text-text-faint">Input / Output per 1K tokens</p>
    </div>
  );
}
