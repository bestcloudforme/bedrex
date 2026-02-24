interface SummaryBarProps {
  totalAgents: number;
  activeAgents: number;
  totalInvocationsToday: number;
  totalErrorsToday: number;
  estimatedDailyCost: number;
}

function KpiCard({ label, value, subtitle, color, accentColor }: {
  label: string; value: string | number; subtitle?: string; color?: string; accentColor?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md p-4 transition-all hover:bg-white/[0.07] hover:border-white/[0.14] hover:shadow-[0_0_24px_rgba(79,143,255,0.06)]">
      {accentColor && (
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.07]"
          style={{ background: `linear-gradient(135deg, ${accentColor} 0%, transparent 60%)` }}
        />
      )}
      <div className="relative">
        <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted">{label}</p>
        <p className={`mt-1.5 text-2xl font-bold tabular-nums ${color || 'text-white'}`}>
          {value === '--' ? <span className="text-lg text-text-faint">No data</span> : value}
        </p>
        {subtitle && <p className="mt-1 text-[10px] text-text-faint">{subtitle}</p>}
      </div>
    </div>
  );
}

export function SummaryBar({ totalAgents, activeAgents, totalInvocationsToday, totalErrorsToday, estimatedDailyCost }: SummaryBarProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      <KpiCard
        label="Total Agents"
        value={`${activeAgents} / ${totalAgents}`}
        subtitle="active / total"
        accentColor="#4f8fff"
      />
      <KpiCard
        label="Active Agents"
        value={activeAgents}
        color="text-success"
        accentColor="#00e5a0"
      />
      <KpiCard
        label="Invocations Today"
        value={totalInvocationsToday.toLocaleString()}
        color="text-primary"
        accentColor="#4f8fff"
      />
      <KpiCard
        label="Errors Today"
        value={totalErrorsToday.toLocaleString()}
        color={totalErrorsToday > 0 ? 'text-error' : 'text-success'}
        accentColor={totalErrorsToday > 0 ? '#ff4d6a' : '#00e5a0'}
      />
      <KpiCard
        label="Est. Daily Cost"
        value={estimatedDailyCost >= 0.01 ? `$${estimatedDailyCost.toFixed(2)}` : estimatedDailyCost > 0 ? '<$0.01' : '$0.00'}
        color="text-warning"
        accentColor="#ffb224"
      />
    </div>
  );
}
