import { useState, useEffect, useRef, useMemo } from 'react';
import type { Node } from '@xyflow/react';
import { useTopology } from '../hooks/useTopology';
import { GraphCanvas } from '../components/topology/GraphCanvas';
import { DetailPanel } from '../components/topology/DetailPanel';
import { SkeletonTopology } from '../components/common/Skeleton';
import { NODE_COLORS } from '@bedrex/shared';

const legendItems = [
  { label: 'Agent', type: 'bedrock-agent' },
  { label: 'Model', type: 'foundation-model' },
  { label: 'Action', type: 'action-group' },
  { label: 'KB', type: 'knowledge-base' },
  { label: 'Guardrail', type: 'guardrail' },
  { label: 'Runtime', type: 'agentcore-runtime' },
  { label: 'Memory', type: 'memory' },
  { label: 'Gateway', type: 'gateway' },
];

export function TopologyPage() {
  const [direction, setDirection] = useState<'TB' | 'LR'>('LR');
  const { nodes, edges, isLoading, isError, error, refetch } = useTopology(direction);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRelayouting, setIsRelayouting] = useState(false);
  const relayoutTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(new Set());
  const [selectedAgentIds, setSelectedAgentIds] = useState<Set<string>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [fitViewTrigger, setFitViewTrigger] = useState(0);

  // Close filter dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as HTMLElement)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Trigger fit view when agent filter changes
  useEffect(() => {
    setFitViewTrigger(prev => prev + 1);
  }, [selectedAgentIds]);

  useEffect(() => {
    setIsRelayouting(true);
    relayoutTimerRef.current = setTimeout(() => setIsRelayouting(false), 300);
    return () => clearTimeout(relayoutTimerRef.current);
  }, [direction]);

  const usedTypes = new Set(nodes.map(n => n.type));
  const activeLegend = legendItems.filter(item => usedTypes.has(item.type));

  const toggleType = (type: string) => {
    setHiddenTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const agentNodes = nodes.filter(n => n.type === 'bedrock-agent' || n.type === 'agentcore-runtime');

  const toggleAgent = (agentId: string) => {
    setSelectedAgentIds(prev => {
      const next = new Set(prev);
      if (next.has(agentId)) next.delete(agentId);
      else next.add(agentId);
      return next;
    });
  };

  // Determine which nodes are visible based on agent filter
  const visibleNodeIds = useMemo(() => {
    if (selectedAgentIds.size === 0) return null; // null = show all
    const ids = new Set<string>();
    selectedAgentIds.forEach(id => ids.add(id));
    // Add connected nodes via edges
    edges.forEach(e => {
      if (ids.has(e.source)) ids.add(e.target);
      if (ids.has(e.target)) ids.add(e.source);
    });
    return ids;
  }, [selectedAgentIds, edges]);

  // Modify nodes based on search, hidden types, and agent filter
  const displayNodes = useMemo(() => nodes.map(n => {
    const isHidden = hiddenTypes.has(n.type ?? '');
    const isFilteredOut = visibleNodeIds !== null && !visibleNodeIds.has(n.id);
    const matchesSearch = searchQuery
      ? (n.data?.label as string || '').toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    return {
      ...n,
      style: {
        ...n.style,
        opacity: isHidden || isFilteredOut ? 0 : (searchQuery && !matchesSearch ? 0.15 : 1),
        pointerEvents: (isHidden || isFilteredOut) ? ('none' as const) : undefined,
      },
    };
  }), [nodes, hiddenTypes, visibleNodeIds, searchQuery]);

  // Build a node type lookup for edge filtering
  const nodeTypeMap = useMemo(() => {
    const map = new Map<string, string>();
    nodes.forEach(n => map.set(n.id, n.type ?? ''));
    return map;
  }, [nodes]);

  const displayEdges = useMemo(() => edges.map(e => {
    const sourceType = nodeTypeMap.get(e.source) ?? '';
    const targetType = nodeTypeMap.get(e.target) ?? '';
    const sourceHiddenByType = hiddenTypes.has(sourceType);
    const targetHiddenByType = hiddenTypes.has(targetType);
    const sourceHiddenByFilter = visibleNodeIds !== null && !visibleNodeIds.has(e.source);
    const targetHiddenByFilter = visibleNodeIds !== null && !visibleNodeIds.has(e.target);

    return {
      ...e,
      hidden: sourceHiddenByType || targetHiddenByType || sourceHiddenByFilter || targetHiddenByFilter,
    };
  }), [edges, nodeTypeMap, hiddenTypes, visibleNodeIds]);

  if (isLoading) {
    return <SkeletonTopology />;
  }

  if (isError) {
    return (
      <div className="flex h-[calc(100vh-2rem)] items-center justify-center">
        <div className="rounded-lg border border-error/30 bg-error/10 p-6 text-center">
          <p className="text-error">Failed to load topology</p>
          <p className="mt-1 text-xs text-text-faint">{error?.message}</p>
          <button onClick={() => refetch()} className="mt-3 rounded-xl bg-primary px-4 py-1.5 text-xs text-white hover:bg-primary/80">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="flex h-[calc(100vh-2rem)] items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-text-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
          <p className="mt-3 text-text-muted">No topology data</p>
          <p className="mt-1 text-xs text-text-faint">Add agents to see their relationships</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-2rem)] gap-4">
      <div className="flex-1 min-w-0">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-xs text-text-faint">
              {nodes.length} nodes, {edges.length} edges
            </div>
            <div ref={filterRef} className="relative">
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] hover:bg-white/[0.07] hover:border-white/[0.14] transition-all text-text-muted hover:text-white"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                </svg>
                {selectedAgentIds.size > 0 ? `${selectedAgentIds.size} agent${selectedAgentIds.size > 1 ? 's' : ''}` : 'All agents'}
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {filterOpen && (
                <div className="absolute left-0 top-full mt-1 z-50 w-64 max-h-64 overflow-y-auto rounded-xl border border-white/[0.08] bg-[#0e1120]/95 backdrop-blur-xl shadow-lg p-1.5">
                  {selectedAgentIds.size > 0 && (
                    <button
                      onClick={() => setSelectedAgentIds(new Set())}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-primary hover:bg-white/[0.06] rounded-lg mb-1"
                    >
                      Clear filter
                    </button>
                  )}
                  {agentNodes.map(n => (
                    <button
                      key={n.id}
                      onClick={() => toggleAgent(n.id)}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs hover:bg-white/[0.06] rounded-lg transition-colors"
                    >
                      <div className={`h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0 ${
                        selectedAgentIds.has(n.id)
                          ? 'bg-primary border-primary'
                          : 'border-white/[0.2] bg-transparent'
                      }`}>
                        {selectedAgentIds.has(n.id) && (
                          <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </div>
                      <span className="text-text-primary truncate">{n.data?.label as string}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search nodes..."
                className="w-40 rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm py-1 pl-7 pr-2 text-xs text-white placeholder-text-faint focus:border-primary focus:outline-none"
              />
              <svg className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-text-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-faint hover:text-white">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-wrap gap-2 text-xs">
              {activeLegend.map((item) => {
                const isHidden = hiddenTypes.has(item.type);
                return (
                  <button
                    key={item.label}
                    onClick={() => toggleType(item.type)}
                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 cursor-pointer transition-all hover:bg-white/10 ${
                      isHidden ? 'opacity-50 line-through' : ''
                    }`}
                    style={{
                      border: `1px solid ${isHidden ? 'rgba(255,255,255,0.05)' : (NODE_COLORS[item.type] || '#6b7280') + '40'}`,
                      backgroundColor: isHidden ? 'transparent' : (NODE_COLORS[item.type] || '#6b7280') + '15',
                    }}
                    title={isHidden ? `Show ${item.label} nodes` : `Hide ${item.label} nodes`}
                  >
                    <div
                      className="h-2.5 w-2.5 rounded-full transition-all"
                      style={{
                        backgroundColor: NODE_COLORS[item.type] || '#6b7280',
                        filter: isHidden ? 'grayscale(100%)' : undefined,
                      }}
                    />
                    <span className={`text-text-muted ${isHidden ? 'text-text-faint' : ''}`}>{item.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDirection(d => d === 'TB' ? 'LR' : 'TB')}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] hover:bg-white/[0.07] hover:border-white/[0.14] transition-all active:scale-[0.97] text-text-muted hover:text-white"
              >
                {direction === 'TB' ? (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m0 0l-4-4m4 4l4-4" />
                  </svg>
                ) : (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16m0 0l-4-4m4 4l-4 4" />
                  </svg>
                )}
                {direction === 'TB' ? 'Top \u2192 Bottom' : 'Left \u2192 Right'}
              </button>
            </div>
          </div>
        </div>
        <div className="h-[calc(100%-2rem)]" style={{ opacity: isRelayouting ? 0.5 : 1, transition: 'opacity 300ms ease' }}>
          <GraphCanvas
            initialNodes={displayNodes}
            initialEdges={displayEdges}
            onNodeClick={(node) => setSelectedNode(node)}
            fitViewTrigger={fitViewTrigger}
          />
        </div>
      </div>
      {selectedNode && <DetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />}
    </div>
  );
}
