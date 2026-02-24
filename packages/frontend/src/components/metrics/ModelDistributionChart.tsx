import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getModelDisplayName } from '@bedrex/shared';
import { CHART_TOOLTIP_STYLE, CHART_TOOLTIP_ITEM_STYLE, CHART_TOOLTIP_LABEL_STYLE, CHART_COLORS } from '../../utils/chart-styles';
import type { AgentInventoryItem } from '@bedrex/shared';

export function ModelDistributionChart({ agents }: { agents: AgentInventoryItem[] }) {
  const modelCounts = new Map<string, number>();
  for (const a of agents) {
    const name = getModelDisplayName(a.foundationModel);
    modelCounts.set(name, (modelCounts.get(name) || 0) + 1);
  }
  const data = Array.from(modelCounts.entries())
    .map(([name, count]) => ({ name, value: count }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md p-4 transition-all hover:bg-white/[0.07] hover:border-white/[0.14] hover:shadow-[0_0_24px_rgba(79,143,255,0.06)]">
      <h3 className="mb-3 text-sm font-semibold text-text-primary flex items-center gap-2">
        <span className="h-5 w-0.5 rounded-full bg-primary" />
        Model Distribution
      </h3>
      <div className="relative">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={3}
              strokeWidth={0}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              itemStyle={CHART_TOOLTIP_ITEM_STYLE}
              labelStyle={CHART_TOOLTIP_LABEL_STYLE}
              formatter={(value: number, name: string) => [`${value} agent${value !== 1 ? 's' : ''}`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{agents.length}</p>
            <p className="text-[10px] text-text-faint">agents</p>
          </div>
        </div>
      </div>
      {/* Legend */}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 justify-center">
        {data.map((item, i) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="text-[11px] text-text-muted">{item.name}</span>
            <span className="text-[11px] font-medium text-text-secondary">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
