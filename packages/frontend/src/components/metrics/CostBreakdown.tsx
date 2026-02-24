import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getModelDisplayName, MODEL_PRICING } from '@bedrex/shared';
import { CHART_TOOLTIP_STYLE, CHART_TOOLTIP_ITEM_STYLE, CHART_TOOLTIP_LABEL_STYLE, CHART_COLORS } from '../../utils/chart-styles';
import type { AgentInventoryItem } from '@bedrex/shared';

interface CostBreakdownProps {
  byModel: Record<string, { daily: number; monthly: number; agentCount: number }>;
}

export function CostBreakdown({ byModel }: CostBreakdownProps) {
  const data = Object.entries(byModel)
    .filter(([_, v]) => v.daily > 0)
    .map(([model, costs]) => ({
      name: getModelDisplayName(model),
      value: costs.daily,
      monthly: costs.monthly,
      agents: costs.agentCount,
    }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md p-4 mb-4">
      <h3 className="mb-4 text-sm font-semibold text-text-primary flex items-center gap-2">
        <span className="h-5 w-0.5 rounded-full bg-primary" />
        Cost by Model (Daily)
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} paddingAngle={2}>
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            itemStyle={CHART_TOOLTIP_ITEM_STYLE}
            labelStyle={CHART_TOOLTIP_LABEL_STYLE}
            formatter={(value: number, name: string, props: any) => [`$${value.toFixed(2)}/day ($${props.payload.monthly.toFixed(2)}/mo)`, name]}
          />
          <Legend
            formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Cost Estimation Table ── */

const USAGE_LEVELS = [
  { label: '1K', tokens: 1_000 },
  { label: '10K', tokens: 10_000 },
  { label: '100K', tokens: 100_000 },
  { label: '1M', tokens: 1_000_000 },
] as const;

function formatCost(amount: number): string {
  if (amount < 0.01) return '<$0.01';
  if (amount < 1) return `$${amount.toFixed(3)}`;
  return `$${amount.toFixed(2)}`;
}

interface CostEstimationProps {
  agents: AgentInventoryItem[];
}

export function CostEstimation({ agents }: CostEstimationProps) {
  const [selectedUsage, setSelectedUsage] = useState(1); // index into USAGE_LEVELS (10K default)

  const modelGroups = useMemo(() => {
    const groups = new Map<string, { modelId: string; name: string; agents: string[]; inputPer1k: number; outputPer1k: number }>();
    for (const agent of agents) {
      const existing = groups.get(agent.foundationModel);
      const pricing = MODEL_PRICING[agent.foundationModel] || { inputPer1k: 0, outputPer1k: 0 };
      if (existing) {
        existing.agents.push(agent.name);
      } else {
        groups.set(agent.foundationModel, {
          modelId: agent.foundationModel,
          name: getModelDisplayName(agent.foundationModel),
          agents: [agent.name],
          ...pricing,
        });
      }
    }
    return Array.from(groups.values()).sort((a, b) => b.agents.length - a.agents.length);
  }, [agents]);

  const usage = USAGE_LEVELS[selectedUsage];

  // Calculate costs: assume 60% input / 40% output ratio
  const calculateDailyCost = (inputPer1k: number, outputPer1k: number, tokens: number, agentCount: number) => {
    const inputTokens = tokens * 0.6;
    const outputTokens = tokens * 0.4;
    const costPerAgent = (inputTokens / 1000) * inputPer1k + (outputTokens / 1000) * outputPer1k;
    return costPerAgent * agentCount;
  };

  const totalDaily = modelGroups.reduce(
    (sum, g) => sum + calculateDailyCost(g.inputPer1k, g.outputPer1k, usage.tokens, g.agents.length),
    0,
  );
  const totalMonthly = totalDaily * 30;

  if (agents.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <span className="h-5 w-0.5 rounded-full bg-primary" />
            Cost Estimation
          </h3>
          <p className="text-[10px] text-text-faint mt-0.5">Projected costs based on model pricing (60/40 input/output ratio)</p>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.04] p-0.5">
          {USAGE_LEVELS.map((level, i) => (
            <button
              key={level.label}
              onClick={() => setSelectedUsage(i)}
              className={`rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors ${
                i === selectedUsage
                  ? 'bg-primary text-white'
                  : 'text-text-faint hover:text-text-muted'
              }`}
            >
              {level.label} tok/day
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.08] overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-white/[0.08] bg-white/[0.04]">
            <tr>
              <th className="p-2.5 text-[10px] font-medium text-text-muted uppercase tracking-wider">Model</th>
              <th className="p-2.5 text-[10px] font-medium text-text-muted uppercase tracking-wider text-center">Agents</th>
              <th className="p-2.5 text-[10px] font-medium text-text-muted uppercase tracking-wider text-right">Input $/1K</th>
              <th className="p-2.5 text-[10px] font-medium text-text-muted uppercase tracking-wider text-right">Output $/1K</th>
              <th className="p-2.5 text-[10px] font-medium text-text-muted uppercase tracking-wider text-right">Est. Daily</th>
              <th className="p-2.5 text-[10px] font-medium text-text-muted uppercase tracking-wider text-right">Est. Monthly</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {modelGroups.map((group) => {
              const daily = calculateDailyCost(group.inputPer1k, group.outputPer1k, usage.tokens, group.agents.length);
              const monthly = daily * 30;
              return (
                <tr key={group.modelId} className="hover:bg-white/5">
                  <td className="p-2.5">
                    <span className="text-text-primary font-medium">{group.name}</span>
                    <p className="text-[10px] text-text-faint mt-0.5 truncate max-w-[200px]">
                      {group.agents.join(', ')}
                    </p>
                  </td>
                  <td className="p-2.5 text-center text-text-muted">{group.agents.length}</td>
                  <td className="p-2.5 text-right font-mono text-text-muted">${group.inputPer1k}</td>
                  <td className="p-2.5 text-right font-mono text-text-muted">${group.outputPer1k}</td>
                  <td className="p-2.5 text-right font-mono text-text-secondary">{formatCost(daily)}</td>
                  <td className="p-2.5 text-right font-mono text-text-secondary">{formatCost(monthly)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t border-white/10 bg-white/5">
            <tr>
              <td className="p-2.5 text-text-primary font-semibold" colSpan={2}>Total ({agents.length} agents)</td>
              <td className="p-2.5" colSpan={2}></td>
              <td className="p-2.5 text-right font-mono text-primary font-semibold">{formatCost(totalDaily)}</td>
              <td className="p-2.5 text-right font-mono text-primary font-semibold">{formatCost(totalMonthly)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
