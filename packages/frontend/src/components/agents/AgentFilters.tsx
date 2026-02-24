import { useMemo, useState } from 'react';
import type { AgentStatus, AgentType, AgentInventoryItem } from '@bedrex/shared';
import { getModelDisplayName } from '@bedrex/shared';
import { useAgentStore } from '../../stores/agent-store';
import { Checkbox } from '../common/Checkbox';
import { clsx } from 'clsx';

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

function FilterSection({ title, children, defaultExpanded = true }: FilterSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="mb-2 flex w-full items-center justify-between text-xs font-medium uppercase tracking-wider text-text-muted hover:text-text-secondary transition-colors"
      >
        <span>{title}</span>
        <svg
          className={clsx('h-3 w-3 transition-transform duration-200', expanded && 'rotate-180')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {expanded && (
        <div className="animate-slide-down">
          {children}
        </div>
      )}
    </div>
  );
}

function CheckboxGroup<T extends string>({
  options,
  selected,
  onChange,
}: {
  options: { value: T; label: string; count: number }[];
  selected: T[];
  onChange: (values: T[]) => void;
}) {
  const toggle = (value: T) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    );
  };

  // Only show options that have at least 1 agent
  const visibleOptions = options.filter((opt) => opt.count > 0);

  return (
    <div className="space-y-1">
      {visibleOptions.map((opt) => (
        <div key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm text-text-secondary hover:text-white">
          <Checkbox
            checked={selected.includes(opt.value)}
            onChange={() => toggle(opt.value)}
          />
          <span className="flex-1">{opt.label}</span>
          <span className="text-[10px] text-text-faint">{opt.count}</span>
        </div>
      ))}
    </div>
  );
}

interface AgentFiltersProps {
  regions: string[];
  allAgents: AgentInventoryItem[];
}

export function AgentFilters({ regions, allAgents }: AgentFiltersProps) {
  const { filters, setFilters, clearFilters } = useAgentStore();

  const hasFilters = Object.values(filters).some((v) => v && (Array.isArray(v) ? v.length > 0 : v));

  const statusOptions = useMemo(() => {
    const counts = new Map<AgentStatus, number>();
    for (const a of allAgents) {
      counts.set(a.status, (counts.get(a.status) || 0) + 1);
    }
    const allStatuses: { value: AgentStatus; label: string }[] = [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'PREPARED', label: 'Prepared' },
      { value: 'PREPARING', label: 'Preparing' },
      { value: 'FAILED', label: 'Failed' },
      { value: 'NOT_PREPARED', label: 'Not Prepared' },
      { value: 'INACTIVE', label: 'Inactive' },
    ];
    return allStatuses.map((s) => ({ ...s, count: counts.get(s.value) || 0 }));
  }, [allAgents]);

  const typeOptions = useMemo(() => {
    const counts = new Map<AgentType, number>();
    for (const a of allAgents) {
      counts.set(a.type, (counts.get(a.type) || 0) + 1);
    }
    const allTypes: { value: AgentType; label: string }[] = [
      { value: 'bedrock-agent', label: 'Bedrock Agent' },
      { value: 'agentcore-runtime', label: 'AgentCore Runtime' },
    ];
    return allTypes.map((t) => ({ ...t, count: counts.get(t.value) || 0 }));
  }, [allAgents]);

  const regionOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of allAgents) {
      counts.set(a.region, (counts.get(a.region) || 0) + 1);
    }
    return regions.map((r) => ({ value: r, label: r, count: counts.get(r) || 0 }));
  }, [allAgents, regions]);

  const modelOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of allAgents) {
      const name = getModelDisplayName(a.foundationModel);
      counts.set(name, (counts.get(name) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([name, count]) => ({ value: name, label: name, count }));
  }, [allAgents]);

  return (
    <div className="w-56 shrink-0 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">Filters</h3>
        {hasFilters && (
          <button onClick={clearFilters} className="text-xs text-primary hover:text-primary/80">Clear all</button>
        )}
      </div>

      <FilterSection title="Status">
        <CheckboxGroup
          options={statusOptions}
          selected={filters.status || []}
          onChange={(status) => setFilters({ status })}
        />
      </FilterSection>

      <FilterSection title="Type">
        <CheckboxGroup
          options={typeOptions}
          selected={filters.type || []}
          onChange={(type) => setFilters({ type })}
        />
      </FilterSection>

      <FilterSection title="Region">
        <CheckboxGroup
          options={regionOptions}
          selected={filters.region || []}
          onChange={(region) => setFilters({ region })}
        />
      </FilterSection>

      {modelOptions.length > 1 && (
        <FilterSection title="Model">
          <CheckboxGroup
            options={modelOptions}
            selected={filters.model || []}
            onChange={(model) => setFilters({ model })}
          />
        </FilterSection>
      )}
    </div>
  );
}
