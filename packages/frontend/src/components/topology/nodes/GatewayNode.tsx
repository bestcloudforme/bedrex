import { type NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { IconGateway } from '../../common/Icons';

export function GatewayNode({ data, selected }: NodeProps) {
  return (
    <BaseNode
      label={data.label as string}
      icon={<IconGateway className="h-4 w-4" />}
      color="#eab308"
      borderColor="#eab308"
      selected={selected}
      subtitle={data.subtitle as string}
      direction={data.direction as 'TB' | 'LR'}
    />
  );
}
