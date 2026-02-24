import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { fetchAgents, invokeAllAgents } from '../services/api';
import { useMetricsSummary } from '../hooks/useMetrics';
import { useToastStore } from '../stores/toast-store';
import { SummaryBar } from '../components/metrics/SummaryBar';
import { TimeRangeSelector } from '../components/metrics/TimeRangeSelector';
import { ModelDistributionChart } from '../components/metrics/ModelDistributionChart';
import { StatusDistribution } from '../components/metrics/StatusDistribution';
import { PricingComparison } from '../components/metrics/PricingComparison';
import { AgentOverviewTable } from '../components/metrics/AgentOverviewTable';
import { CostBreakdown, CostEstimation } from '../components/metrics/CostBreakdown';
import { Button } from '../components/common/Button';
import { IconRefresh } from '../components/common/Icons';
import { SkeletonMetrics } from '../components/common/Skeleton';
import { getModelDisplayName } from '@bedrex/shared';
import type { TimeRange, AgentInventoryItem } from '@bedrex/shared';

const VALID_TIME_RANGES: TimeRange[] = ['1h', '6h', '24h', '7d', '30d'];

function isValidTimeRange(v: string | null): v is TimeRange {
  return v !== null && VALID_TIME_RANGES.includes(v as TimeRange);
}

function exportAgentsCsv(agents: AgentInventoryItem[]) {
  const header = 'Name,Model,Status,Action Groups,Knowledge Bases,Guardrail,Invocations (24h),Avg Latency (ms),Error Rate,Est. Cost (24h),Created';
  const rows = agents.map((a) => {
    const name = a.name.replace(/,/g, ' ');
    const model = getModelDisplayName(a.foundationModel).replace(/,/g, ' ');
    const guardrail = a.guardrail?.name ?? a.guardrail?.guardrailId ?? '';
    const invocations = a.metrics?.invocationCount24h ?? '';
    const latency = a.metrics?.avgLatencyMs ?? '';
    const errorRate = a.metrics?.errorRate != null ? (a.metrics.errorRate * 100).toFixed(1) + '%' : '';
    const cost = a.metrics?.estimatedCost24h != null ? a.metrics.estimatedCost24h.toFixed(2) : '';
    const createdAt = a.createdAt ? new Date(a.createdAt).toISOString() : '';
    return `${name},${model},${a.status},${a.actionGroups.length},${a.knowledgeBases.length},${guardrail},${invocations},${latency},${errorRate},${cost},${createdAt}`;
  });
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `agents-export-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

export function MetricsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTimeRange = isValidTimeRange(searchParams.get('range')) ? searchParams.get('range') as TimeRange : '24h';
  const [timeRange, setTimeRange] = useState<TimeRange>(initialTimeRange);
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInvoking, setIsInvoking] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [lastUpdatedText, setLastUpdatedText] = useState('');

  const summaryQuery = useMetricsSummary();
  const agentsQuery = useQuery({ queryKey: ['agents'], queryFn: () => fetchAgents() });

  const summary = summaryQuery.data?.data;
  const agents = agentsQuery.data?.data ?? [];

  // Track last updated time
  useEffect(() => {
    if (summaryQuery.dataUpdatedAt > 0) {
      setLastUpdated(new Date(summaryQuery.dataUpdatedAt));
    }
  }, [summaryQuery.dataUpdatedAt]);

  // Update relative time display
  useEffect(() => {
    if (!lastUpdated) return;
    const update = () => setLastUpdatedText(formatRelativeTime(lastUpdated));
    update();
    const interval = setInterval(update, 10_000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
    setSearchParams({ range }, { replace: true });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.refetchQueries({ queryKey: ['metrics-summary'] }),
      queryClient.refetchQueries({ queryKey: ['agents'] }),
    ]);
    setIsRefreshing(false);
    addToast({ type: 'success', message: 'Metrics refreshed' });
  };

  const handleExportCsv = () => {
    exportAgentsCsv(agents);
    addToast({ type: 'success', message: `Exported ${agents.length} agents to CSV` });
  };

  const handleInvokeAll = async () => {
    setIsInvoking(true);
    try {
      const result = await invokeAllAgents();
      const { summary: s } = result.data;
      addToast({
        type: s.failed > 0 ? 'error' : 'success',
        message: `Invoked ${s.success}/${s.total} agents (avg ${s.avgLatencyMs}ms). CloudWatch metrics will appear in ~2 min.`,
      });
      // Refresh after a short delay to pick up any immediate CloudWatch data
      setTimeout(async () => {
        await queryClient.invalidateQueries({ queryKey: ['metrics-summary'] });
        await queryClient.invalidateQueries({ queryKey: ['agents'] });
      }, 5000);
    } catch {
      addToast({ type: 'error', message: 'Failed to invoke agents' });
    }
    setIsInvoking(false);
  };

  if (summaryQuery.isLoading || agentsQuery.isLoading) {
    return <SkeletonMetrics />;
  }

  // Error state
  if (summaryQuery.isError || agentsQuery.isError) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="rounded-xl border border-error/30 bg-error/10 p-6 text-center max-w-sm">
          <svg className="mx-auto h-10 w-10 text-error/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="mt-3 text-sm font-medium text-error">Failed to load metrics</p>
          <p className="mt-1 text-xs text-text-faint">
            {summaryQuery.error?.message || agentsQuery.error?.message || 'An unknown error occurred'}
          </p>
          <button
            onClick={() => { summaryQuery.refetch(); agentsQuery.refetch(); }}
            className="mt-4 rounded-xl bg-primary px-4 py-1.5 text-xs text-white hover:bg-primary/80 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Metrics Dashboard</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-text-muted">Overview of your Bedrock agent fleet performance and costs</p>
            {lastUpdatedText && (
              <span className="text-[10px] text-text-faint">
                &middot; Updated {lastUpdatedText}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={handleInvokeAll}
            loading={isInvoking}
            disabled={agents.length === 0}
            icon={!isInvoking ? (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
              </svg>
            ) : undefined}
          >
            {isInvoking ? 'Invoking agents...' : 'Invoke All Agents'}
          </Button>
          <Button variant="secondary" onClick={handleExportCsv} disabled={agents.length === 0} icon={
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          }>
            Export CSV
          </Button>
          <Button variant="secondary" onClick={handleRefresh} loading={isRefreshing} icon={!isRefreshing ? <IconRefresh className="h-3.5 w-3.5" /> : undefined}>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Section 1: KPI Summary */}
      {summary && (
        <SummaryBar
          totalAgents={summary.totalAgents}
          activeAgents={summary.activeAgents}
          totalInvocationsToday={summary.totalInvocationsToday}
          totalErrorsToday={summary.totalErrorsToday}
          estimatedDailyCost={summary.estimatedDailyCost}
        />
      )}

      {/* Section 2: Fleet Overview */}
      {agents.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ModelDistributionChart agents={agents} />
          <StatusDistribution agents={agents} />
          <PricingComparison agents={agents} />
        </div>
      )}

      {/* Section 3: Cost Analysis */}
      {agents.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CostEstimation agents={agents} />
          </div>
          {summary?.costs && (
            <div>
              <CostBreakdown byModel={summary.costs.byModel} />
            </div>
          )}
        </div>
      )}

      {/* Section 4: Agent Metrics — table with expandable sparkline rows */}
      {agents.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <span className="h-5 w-0.5 rounded-full bg-primary" />
              Agent Metrics
            </h2>
            <TimeRangeSelector value={timeRange} onChange={handleTimeRangeChange} />
          </div>
          <p className="text-[10px] text-text-faint mb-2">Click any row to view detailed charts and time-series data</p>
          <AgentOverviewTable agents={agents} timeRange={timeRange} />
        </div>
      )}
    </div>
  );
}
