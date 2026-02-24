import { type NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { IconKnowledgeBase } from '../../common/Icons';

export function KnowledgeBaseNode({ data, selected }: NodeProps) {
  return (
    <BaseNode
      label={data.label as string}
      icon={<IconKnowledgeBase className="h-4 w-4" />}
      color="#10b981"
      borderColor="#10b981"
      selected={selected}
      subtitle={data.subtitle as string}
      direction={data.direction as 'TB' | 'LR'}
    />
  );
}
