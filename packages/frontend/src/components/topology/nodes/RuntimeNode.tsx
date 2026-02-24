import { type NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { IconRuntime } from '../../common/Icons';

export function RuntimeNode({ data, selected }: NodeProps) {
  return (
    <BaseNode
      label={data.label as string}
      icon={<IconRuntime className="h-4 w-4" />}
      color="#8b5cf6"
      borderColor="#8b5cf6"
      selected={selected}
      subtitle={data.subtitle as string}
      direction={data.direction as 'TB' | 'LR'}
    />
  );
}
