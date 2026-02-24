import { useCallback } from 'react';
import {
  useStore,
  getBezierPath,
  BaseEdge,
  type EdgeProps,
  Position,
  type InternalNode,
} from '@xyflow/react';

// Calculate where a line from node center to a target point intersects the node border
function getNodeIntersection(node: InternalNode, targetPoint: { x: number; y: number }) {
  const w = node.measured?.width ?? 200;
  const h = node.measured?.height ?? 80;
  const x = node.internals?.positionAbsolute?.x ?? node.position.x;
  const y = node.internals?.positionAbsolute?.y ?? node.position.y;

  const cx = x + w / 2;
  const cy = y + h / 2;

  const dx = targetPoint.x - cx;
  const dy = targetPoint.y - cy;

  if (dx === 0 && dy === 0) return { x: cx, y: cy };

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  // Check if intersection is on left/right side or top/bottom
  // by comparing aspect ratios
  if (absDx / w > absDy / h) {
    // Intersects left or right
    const signX = dx > 0 ? 1 : -1;
    return {
      x: cx + signX * (w / 2),
      y: cy + (dy * (w / 2)) / absDx,
    };
  } else {
    // Intersects top or bottom
    const signY = dy > 0 ? 1 : -1;
    return {
      x: cx + (dx * (h / 2)) / absDy,
      y: cy + signY * (h / 2),
    };
  }
}

// Determine which Position (Top/Right/Bottom/Left) the intersection is on
function getEdgePosition(node: InternalNode, intersection: { x: number; y: number }): Position {
  const w = node.measured?.width ?? 200;
  const h = node.measured?.height ?? 80;
  const x = node.internals?.positionAbsolute?.x ?? node.position.x;
  const y = node.internals?.positionAbsolute?.y ?? node.position.y;

  const cx = x + w / 2;
  const cy = y + h / 2;

  const dx = intersection.x - cx;
  const dy = intersection.y - cy;

  if (Math.abs(dx / w) > Math.abs(dy / h)) {
    return dx > 0 ? Position.Right : Position.Left;
  }
  return dy > 0 ? Position.Bottom : Position.Top;
}

export function FloatingEdge({ id, source, target, style, markerEnd }: EdgeProps) {
  const sourceNode = useStore(
    useCallback((s) => s.nodeLookup.get(source), [source]),
  );
  const targetNode = useStore(
    useCallback((s) => s.nodeLookup.get(target), [target]),
  );

  if (!sourceNode || !targetNode) return null;

  const sw = sourceNode.measured?.width ?? 200;
  const sh = sourceNode.measured?.height ?? 80;
  const sx = sourceNode.internals?.positionAbsolute?.x ?? sourceNode.position.x;
  const sy = sourceNode.internals?.positionAbsolute?.y ?? sourceNode.position.y;

  const tw = targetNode.measured?.width ?? 200;
  const th = targetNode.measured?.height ?? 80;
  const tx = targetNode.internals?.positionAbsolute?.x ?? targetNode.position.x;
  const ty = targetNode.internals?.positionAbsolute?.y ?? targetNode.position.y;

  const sourceCenter = { x: sx + sw / 2, y: sy + sh / 2 };
  const targetCenter = { x: tx + tw / 2, y: ty + th / 2 };

  const sourceIntersection = getNodeIntersection(sourceNode, targetCenter);
  const targetIntersection = getNodeIntersection(targetNode, sourceCenter);

  const sourcePos = getEdgePosition(sourceNode, sourceIntersection);
  const targetPos = getEdgePosition(targetNode, targetIntersection);

  const [edgePath] = getBezierPath({
    sourceX: sourceIntersection.x,
    sourceY: sourceIntersection.y,
    sourcePosition: sourcePos,
    targetX: targetIntersection.x,
    targetY: targetIntersection.y,
    targetPosition: targetPos,
  });

  return <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />;
}
