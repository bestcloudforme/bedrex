import { AgentNode } from './AgentNode';
import { RuntimeNode } from './RuntimeNode';
import { KnowledgeBaseNode } from './KnowledgeBaseNode';
import { ActionGroupNode } from './ActionGroupNode';
import { GuardrailNode } from './GuardrailNode';
import { ModelNode } from './ModelNode';
import { MemoryNode } from './MemoryNode';
import { GatewayNode } from './GatewayNode';

export const nodeTypes = {
  'bedrock-agent': AgentNode,
  'agentcore-runtime': RuntimeNode,
  'knowledge-base': KnowledgeBaseNode,
  'action-group': ActionGroupNode,
  'guardrail': GuardrailNode,
  'foundation-model': ModelNode,
  'memory': MemoryNode,
  'gateway': GatewayNode,
};
