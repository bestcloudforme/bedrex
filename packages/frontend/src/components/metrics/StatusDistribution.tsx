import type { AgentInventoryItem } from '@bedrex/shared';

const STATUS_COLORS: Record<string, string> = {
  PREPARED: '#00e5a0',
  ACTIVE: '#4f8fff',
  NOT_PREPARED: '#ffb224',
  FAILED: '#ff4d6a',
  INACTIVE: '#6b7280',
  PREPARING: '#a855f7',
};

export function StatusDistribution({ agents }: { agents: AgentInventoryItem[] }) {
  const statusCounts = new Map<string, number>();
  for (const a of agents) {
    statusCounts.set(a.status, (statusCounts.get(a.status) || 0) + 1);
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md p-4 transition-all hover:bg-white/[0.07] hover:border-white/[0.14] hover:shadow-[0_0_24px_rgba(79,143,255,0.06)]">
      <h3 className="mb-4 text-sm font-semibold text-text-primary flex items-center gap-2">
        <span className="h-5 w-0.5 rounded-full bg-primary" />
        Status Distribution
      </h3>
      <div className="space-y-2.5">
        {Array.from(statusCounts.entries())
          .sort(([, a], [, b]) => b - a)
          .map(([status, count]) => (
            <div key={status} className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[status] || '#6b7280' }} />
              <span className="text-xs text-text-muted flex-1">{status}</span>
              <span className="text-xs font-semibold text-text-primary tabular-nums">{count}</span>
              <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${(count / agents.length) * 100}%`, backgroundColor: STATUS_COLORS[status] || '#6b7280' }}
                />
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
