import { type NodeProps } from '@xyflow/react';
import { getModelDisplayName } from '@bedrex/shared';
import { BaseNode } from './BaseNode';
import { IconAgent } from '../../common/Icons';

export function AgentNode({ data, selected }: NodeProps) {
  const agent = data.agent as any;
  const modelName = agent?.foundationModel ? getModelDisplayName(agent.foundationModel) : undefined;

  return (
    <BaseNode
      label={data.label as string}
      icon={<IconAgent className="h-4 w-4" />}
      color="#3b82f6"
      borderColor="#3b82f6"
      selected={selected}
      subtitle={data.subtitle as string}
      direction={data.direction as 'TB' | 'LR'}
      badge={modelName}
    />
  );
}
