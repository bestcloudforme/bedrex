import { type NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { IconActionGroup } from '../../common/Icons';

export function ActionGroupNode({ data, selected }: NodeProps) {
  return (
    <BaseNode
      label={data.label as string}
      icon={<IconActionGroup className="h-4 w-4" />}
      color="#f59e0b"
      borderColor="#f59e0b"
      selected={selected}
      subtitle={data.subtitle as string}
      direction={data.direction as 'TB' | 'LR'}
    />
  );
}
