import { clsx } from 'clsx';
import type { AgentStatus } from '@bedrex/shared';

const statusConfig: Record<AgentStatus, { color: string; label: string; dotColor: string }> = {
  ACTIVE: { color: 'bg-success/20 text-success border border-success/30', label: 'Active', dotColor: 'bg-success' },
  PREPARED: { color: 'bg-success/20 text-success border border-success/30', label: 'Prepared', dotColor: 'bg-success' },
  INACTIVE: { color: 'bg-white/10 text-text-muted border border-white/10', label: 'Inactive', dotColor: 'bg-text-muted' },
  PREPARING: { color: 'bg-warning/20 text-warning border border-warning/30', label: 'Preparing', dotColor: 'bg-warning animate-pulse' },
  FAILED: { color: 'bg-error/20 text-error border border-error/30', label: 'Failed', dotColor: 'bg-error' },
  NOT_PREPARED: { color: 'bg-warning/10 text-warning border border-warning/20', label: 'Not Prepared', dotColor: 'bg-warning' },
  DELETING: { color: 'bg-error/20 text-error border border-error/30', label: 'Deleting', dotColor: 'bg-error animate-pulse' },
};

export function StatusBadge({ status }: { status: AgentStatus }) {
  const config = statusConfig[status] || statusConfig.INACTIVE;
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', config.color)}>
      <span className={clsx('mr-1.5 h-1.5 w-1.5 rounded-full', config.dotColor)} />
      {config.label}
    </span>
  );
}
