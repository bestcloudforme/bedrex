import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { fetchTopology } from '../services/api';
import { getLayoutedElements } from '../utils/graph-layout';
import type { Node, Edge } from '@xyflow/react';
import type { TopologyNode, TopologyEdge } from '@bedrex/shared';

function toReactFlowNode(node: TopologyNode): Node {
  return {
    id: node.id,
    type: node.type,
    position: { x: 0, y: 0 },
    data: {
      label: node.label,
      ...node.data,
      subtitle: node.region,
    },
  };
}

const EDGE_COLORS: Record<string, string> = {
  'invokes-action': '#f59e0b',
  'uses-kb': '#10b981',
  'protected-by': '#ef4444',
  'a2a-communication': '#8b5cf6',
  'stores-memory': '#14b8a6',
  'routes-through': '#eab308',
};

function toReactFlowEdge(edge: TopologyEdge): Edge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    animated: edge.animated ?? false,
    style: { stroke: EDGE_COLORS[edge.type] || '#6b7280', strokeWidth: 1.5 },
  };
}

export function useTopology(direction: 'TB' | 'LR' = 'TB') {
  const query = useQuery({
    queryKey: ['topology'],
    queryFn: fetchTopology,
    staleTime: 60_000,
  });

  const [layoutResult, setLayoutResult] = useState<{ nodes: Node[]; edges: Edge[] }>({
    nodes: [],
    edges: [],
  });

  useEffect(() => {
    if (!query.data?.data) {
      setLayoutResult({ nodes: [], edges: [] });
      return;
    }

    const rfNodes = query.data.data.nodes.map(toReactFlowNode);
    const rfEdges = query.data.data.edges.map(toReactFlowEdge);

    let cancelled = false;
    getLayoutedElements(rfNodes, rfEdges, direction).then((result) => {
      if (!cancelled) setLayoutResult(result);
    });

    return () => { cancelled = true; };
  }, [query.data, direction]);

  return {
    nodes: layoutResult.nodes,
    edges: layoutResult.edges,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
