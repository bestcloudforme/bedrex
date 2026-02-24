import { type NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { IconMemory } from '../../common/Icons';

export function MemoryNode({ data, selected }: NodeProps) {
  return (
    <BaseNode
      label={data.label as string}
      icon={<IconMemory className="h-4 w-4" />}
      color="#14b8a6"
      borderColor="#14b8a6"
      selected={selected}
      subtitle={data.subtitle as string}
      direction={data.direction as 'TB' | 'LR'}
    />
  );
}
