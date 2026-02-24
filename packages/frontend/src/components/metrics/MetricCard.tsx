import type { AgentInventoryItem, AgentMetrics, TimeRange } from '@bedrex/shared';
import { getModelDisplayName } from '@bedrex/shared';
import { SparklineChart } from './SparklineChart';
import { StatusBadge } from '../common/StatusBadge';
import { useAgentMetrics } from '../../hooks/useMetrics';
import { getModelColorClass } from '../../utils/model-colors';
import { clsx } from 'clsx';

interface MetricCardProps {
  agent: AgentInventoryItem;
  metrics?: AgentMetrics;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export function MetricCard({ agent, metrics, isLoading, isError, onRetry }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md p-4 transition-all hover:bg-white/[0.07] hover:border-white/[0.14] hover:shadow-[0_0_20px_rgba(79,143,255,0.1)]">
      <div className="mb-3 flex items-center justify-between">
        <div className="min-w-0 flex items-center gap-2">
          <span className={clsx('h-2 w-2 rounded-full shrink-0', getModelColorClass(getModelDisplayName(agent.foundationModel)))} />
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-text-primary">{agent.name}</h3>
            <p className="text-xs text-text-faint">{agent.region}</p>
          </div>
        </div>
        <StatusBadge status={agent.status} />
      </div>

      {isError ? (
        <div className="flex flex-col items-center justify-center h-32 gap-2">
          <p className="text-xs text-text-faint">Failed to load metrics</p>
          {onRetry && (
            <button onClick={onRetry} className="text-xs text-primary hover:text-primary/80 transition-colors">
              Retry
            </button>
          )}
        </div>
      ) : isLoading || !metrics ? (
        <div className="space-y-3 animate-pulse">
          <div>
            <div className="h-3 w-16 bg-white/[0.06] rounded mb-1" />
            <div className="h-[60px] bg-white/[0.04] rounded-lg" />
          </div>
          <div>
            <div className="h-3 w-20 bg-white/[0.06] rounded mb-1" />
            <div className="h-[60px] bg-white/[0.04] rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i}>
                <div className="h-3 w-14 bg-white/[0.06] rounded mb-1" />
                <div className="h-4 w-16 bg-white/[0.06] rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <p className="text-xs text-text-faint mb-1">Invocations</p>
            <SparklineChart data={metrics.invocationCount} color="#3b82f6" />
          </div>
          <div>
            <p className="text-xs text-text-faint mb-1">Latency (ms)</p>
            <SparklineChart data={metrics.latency} color="#f59e0b" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-text-faint">Avg Latency</span>
              <p className="font-mono text-text-secondary tabular-nums">{agent.metrics?.avgLatencyMs ?? '-'}ms</p>
            </div>
            <div>
              <span className="text-text-faint">Error Rate</span>
              <p className={clsx('font-mono tabular-nums', agent.metrics && agent.metrics.errorRate > 0.05 ? 'text-error' : 'text-text-secondary')}>
                {agent.metrics ? `${(agent.metrics.errorRate * 100).toFixed(1)}%` : '-'}
              </p>
            </div>
            <div>
              <span className="text-text-faint">Tokens (24h)</span>
              <p className="font-mono text-text-secondary tabular-nums">{agent.metrics?.totalTokensUsed24h?.toLocaleString() ?? '-'}</p>
            </div>
            <div>
              <span className="text-text-faint">Cost (24h)</span>
              <p className="font-mono text-warning tabular-nums">${agent.metrics?.estimatedCost24h?.toFixed(2) ?? '-'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function MetricCardWithData({ agent, timeRange }: { agent: AgentInventoryItem; timeRange: TimeRange }) {
  const { data, isLoading, isError, refetch } = useAgentMetrics(agent.id, timeRange);
  return <MetricCard agent={agent} metrics={data?.data} isLoading={isLoading} isError={isError} onRetry={() => refetch()} />;
}
