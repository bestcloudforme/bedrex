import { type NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { IconModel } from '../../common/Icons';

export function ModelNode({ data, selected }: NodeProps) {
  return (
    <BaseNode
      label={data.label as string}
      icon={<IconModel className="h-4 w-4" />}
      color="#6b7280"
      borderColor="#6b7280"
      selected={selected}
      subtitle={data.subtitle as string}
      direction={data.direction as 'TB' | 'LR'}
    />
  );
}
