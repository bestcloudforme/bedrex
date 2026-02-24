import { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeTypes } from './nodes';
import { FloatingEdge } from './FloatingEdge';
import { NODE_COLORS } from '@bedrex/shared';

const edgeTypes = { floating: FloatingEdge };

interface GraphCanvasProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  onNodeClick?: (node: Node) => void;
  fitViewTrigger?: number;
}

const FIT_VIEW_OPTIONS = { padding: 0.15, duration: 300 };

function GraphCanvasInner({ initialNodes, initialEdges, onNodeClick, fitViewTrigger }: GraphCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { fitView } = useReactFlow();

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    // Re-fit the view after nodes update (e.g. direction toggle)
    requestAnimationFrame(() => {
      fitView(FIT_VIEW_OPTIONS);
    });
  }, [initialNodes, initialEdges, setNodes, setEdges, fitView]);

  // Re-fit when fitViewTrigger changes
  useEffect(() => {
    if (fitViewTrigger !== undefined && fitViewTrigger > 0) {
      requestAnimationFrame(() => {
        fitView(FIT_VIEW_OPTIONS);
      });
    }
  }, [fitViewTrigger, fitView]);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onNodeClick?.(node);
    },
    [onNodeClick],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      fitViewOptions={FIT_VIEW_OPTIONS}
      minZoom={0.3}
      maxZoom={2}
      defaultEdgeOptions={{
        type: 'floating',
      }}
      proOptions={{ hideAttribution: true }}
    >
      <Controls className="!bg-[rgba(255,255,255,0.04)] !backdrop-blur-md !border !border-white/[0.08] !rounded-xl !shadow-lg [&>button]:!bg-transparent [&>button]:!border-white/[0.08] [&>button]:!text-text-muted [&>button:hover]:!bg-white/10" />
      <MiniMap
        className="!bg-[#0a0d16]/80 !border-white/[0.08] !rounded-xl"
        nodeColor={(node) => NODE_COLORS[node.type || ''] || '#6b7280'}
        maskColor="rgba(15, 23, 42, 0.7)"
      />
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#ffffff08" />
    </ReactFlow>
  );
}

export function GraphCanvas(props: GraphCanvasProps) {
  return (
    <div className="h-full w-full rounded-xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm">
      <ReactFlowProvider>
        <GraphCanvasInner {...props} />
      </ReactFlowProvider>
    </div>
  );
}
