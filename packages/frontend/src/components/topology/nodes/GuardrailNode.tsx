import { type NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { IconGuardrail } from '../../common/Icons';

export function GuardrailNode({ data, selected }: NodeProps) {
  return (
    <BaseNode
      label={data.label as string}
      icon={<IconGuardrail className="h-4 w-4" />}
      color="#ef4444"
      borderColor="#ef4444"
      selected={selected}
      subtitle={data.subtitle as string}
      direction={data.direction as 'TB' | 'LR'}
    />
  );
}
