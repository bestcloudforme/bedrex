import ELK from 'elkjs/lib/elk.bundled.js';
import type { Node, Edge } from '@xyflow/react';

const elk = new ELK();

const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;

export async function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'TB',
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  if (nodes.length === 0) return { nodes: [], edges: [] };

  const elkDirection = direction === 'LR' ? 'RIGHT' : 'DOWN';

  const elkGraph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': elkDirection,
      // Node spacing within a layer
      'elk.spacing.nodeNode': '40',
      // Spacing between layers (ranks)
      'elk.layered.spacing.nodeNodeBetweenLayers': '100',
      // Edge routing: SPLINES for smooth curves, POLYLINE for straight segments
      'elk.edgeRouting': 'POLYLINE',
      // Crossing minimization
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      // Node placement strategy - BRANDES_KOEPF produces compact, balanced layouts
      'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
      // Edge-node spacing (prevents edges from hugging nodes)
      'elk.spacing.edgeNode': '25',
      // Edge-edge spacing (prevents parallel edges from overlapping)
      'elk.spacing.edgeEdge': '15',
      // Edge spacing between layers
      'elk.layered.spacing.edgeNodeBetweenLayers': '25',
      // Port constraints: let ELK decide optimal port positions
      'elk.portConstraints': 'UNDEFINED',
      // Merge edges going to the same target where possible
      'elk.layered.mergeEdges': 'true',
      // Consider model order for stable layouts
      'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
    },
    children: nodes.map((n) => ({
      id: n.id,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      // Define ports on all 4 sides for flexible edge routing
      ports: [
        { id: `${n.id}__top`, properties: { 'port.side': 'NORTH', 'port.index': '0' } },
        { id: `${n.id}__right`, properties: { 'port.side': 'EAST', 'port.index': '0' } },
        { id: `${n.id}__bottom`, properties: { 'port.side': 'SOUTH', 'port.index': '0' } },
        { id: `${n.id}__left`, properties: { 'port.side': 'WEST', 'port.index': '0' } },
      ],
      properties: {
        'portConstraints': 'FREE',
      },
    })),
    edges: edges.map((e) => ({
      id: e.id,
      sources: [e.source],
      targets: [e.target],
    })),
  };

  const layout = await elk.layout(elkGraph);

  const nodePositionMap = new Map<string, { x: number; y: number }>();
  for (const child of layout.children ?? []) {
    nodePositionMap.set(child.id, { x: child.x ?? 0, y: child.y ?? 0 });
  }

  const layoutedNodes = nodes.map((node) => {
    const pos = nodePositionMap.get(node.id) ?? { x: 0, y: 0 };
    return {
      ...node,
      data: { ...node.data, direction },
      position: pos,
    };
  });

  // FloatingEdge computes dynamic connection points at render time,
  // so we don't need sourceHandle/targetHandle here
  return { nodes: layoutedNodes, edges };
}
