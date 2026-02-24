import { useQuery } from '@tanstack/react-query';
import { clsx } from 'clsx';
import type { ConfigSnapshot, ChangeType } from '@bedrex/shared';
import { fetchAgentSnapshots } from '../../services/api';

interface ChangeTimelineProps {
  agentId: string;
  agentName: string;
  onClose: () => void;
}

const changeTypeConfig: Record<ChangeType, { label: string; color: string; icon: string }> = {
  INITIAL: {
    label: 'Initial Capture',
    color: 'text-blue-400 bg-blue-400/20',
    icon: 'M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  MODIFIED: {
    label: 'Modified',
    color: 'text-amber-400 bg-amber-400/20',
    icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  },
  DELETED: {
    label: 'Deleted',
    color: 'text-red-400 bg-red-400/20',
    icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  },
};

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  let relative: string;
  if (diffMins < 1) {
    relative = 'just now';
  } else if (diffMins < 60) {
    relative = `${diffMins}m ago`;
  } else if (diffHours < 24) {
    relative = `${diffHours}h ago`;
  } else if (diffDays < 30) {
    relative = `${diffDays}d ago`;
  } else {
    relative = date.toLocaleDateString();
  }

  return `${date.toLocaleString()} (${relative})`;
}

function ChangeEntry({ snapshot, isLast }: { snapshot: ConfigSnapshot; isLast: boolean }) {
  const config = changeTypeConfig[snapshot.changeType];

  return (
    <div className="relative pl-8 pb-6 last:pb-0">
      {/* Timeline line */}
      {!isLast && <div className="absolute left-3 top-6 bottom-0 w-px bg-white/10" />}

      {/* Timeline dot */}
      <div className={clsx('absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full', config.color)}>
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
        </svg>
      </div>

      {/* Content */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md p-3">
        <div className="flex items-center justify-between mb-1">
          <span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', config.color)}>
            {config.label}
          </span>
          <span className="text-xs text-text-faint">{formatTimestamp(snapshot.timestamp)}</span>
        </div>

        {snapshot.changeType === 'MODIFIED' && snapshot.changedFields && snapshot.changedFields.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-text-muted mb-1.5">Changed fields:</p>
            <div className="flex flex-wrap gap-1.5">
              {snapshot.changedFields.map((field) => (
                <span
                  key={field}
                  className="inline-flex items-center rounded bg-amber-400/10 px-2 py-0.5 text-xs font-mono text-amber-300"
                >
                  {field}
                </span>
              ))}
            </div>
          </div>
        )}

        {snapshot.changeType === 'INITIAL' && (
          <p className="mt-1.5 text-xs text-text-faint">
            First configuration snapshot recorded for this agent.
          </p>
        )}
      </div>
    </div>
  );
}

export function ChangeTimeline({ agentId, agentName, onClose }: ChangeTimelineProps) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['snapshots', agentId],
    queryFn: () => fetchAgentSnapshots(agentId),
    staleTime: 30_000,
  });

  const snapshots = data?.data ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0d16]/95 backdrop-blur-2xl">
      <div className="mx-4 w-full max-w-lg rounded-xl border border-white/[0.08] bg-[#0e1120]/95 backdrop-blur-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Change History</h2>
            <p className="text-xs text-text-faint mt-0.5">{agentName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-faint hover:bg-white/10 hover:text-white transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
          ) : isError ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-center">
              <p className="text-sm text-red-400">Failed to load change history</p>
              <p className="mt-1 text-xs text-text-faint">{error?.message}</p>
            </div>
          ) : snapshots.length === 0 ? (
            <div className="py-12 text-center">
              <svg className="mx-auto h-8 w-8 text-text-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-3 text-sm text-text-faint">No change history yet</p>
              <p className="mt-1 text-xs text-text-faint">
                Trigger a snapshot capture to start tracking changes.
              </p>
            </div>
          ) : snapshots.length === 1 && snapshots[0].changeType === 'INITIAL' ? (
            <div>
              <ChangeEntry snapshot={snapshots[0]} isLast={true} />
              <div className="mt-4 rounded-lg bg-white/5 p-3 text-center">
                <p className="text-xs text-text-faint">No changes detected yet</p>
                <p className="text-xs text-text-faint mt-0.5">This agent was just discovered. Future configuration changes will appear here.</p>
              </div>
            </div>
          ) : (
            <div>
              {snapshots.map((snapshot, i) => (
                <ChangeEntry key={snapshot.id} snapshot={snapshot} isLast={i === snapshots.length - 1} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.08] px-5 py-3 flex items-center justify-between">
          <span className="text-xs text-text-faint">
            {snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={onClose}
            className="rounded-xl bg-white/[0.06] border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-white/[0.1] hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
