import type { AgentInventoryItem, TopologyData, TopologyNode, TopologyEdge } from '@bedrex/shared';

export function buildTopology(agents: AgentInventoryItem[]): TopologyData {
  const nodes: TopologyNode[] = [];
  const edges: TopologyEdge[] = [];
  const guardrailNodes = new Map<string, TopologyNode>();

  // Sort agents by model so dagre groups them together
  const sortedAgents = [...agents].sort((a, b) =>
    (a.foundationModel || '').localeCompare(b.foundationModel || '')
  );

  for (const agent of sortedAgents) {
    // Agent node
    nodes.push({
      id: `agent-${agent.id}`,
      type: agent.type === 'agentcore-runtime' ? 'agentcore-runtime' : 'bedrock-agent',
      label: agent.name,
      data: { agent },
      region: agent.region,
      accountId: agent.accountId,
    });

    // Action group nodes
    for (const ag of agent.actionGroups) {
      const agNodeId = `ag-${agent.id}-${ag.id}`;
      nodes.push({
        id: agNodeId,
        type: 'action-group',
        label: ag.name,
        data: { actionGroup: ag, agentId: agent.id },
        region: agent.region,
        accountId: agent.accountId,
      });
      edges.push({
        id: `edge-${agent.id}-ag-${ag.id}`,
        source: `agent-${agent.id}`,
        target: agNodeId,
        type: 'invokes-action',
        label: 'invokes',
      });
    }

    // Knowledge base nodes (deduplicated)
    for (const kb of agent.knowledgeBases) {
      const kbNodeId = `kb-${kb.knowledgeBaseId}`;
      if (!nodes.find((n) => n.id === kbNodeId)) {
        nodes.push({
          id: kbNodeId,
          type: 'knowledge-base',
          label: kb.name || kb.knowledgeBaseId,
          data: { knowledgeBase: kb },
          region: agent.region,
          accountId: agent.accountId,
        });
      }
      edges.push({
        id: `edge-${agent.id}-kb-${kb.knowledgeBaseId}`,
        source: `agent-${agent.id}`,
        target: kbNodeId,
        type: 'uses-kb',
        label: 'uses',
      });
    }

    // Guardrail node (deduplicated)
    if (agent.guardrail) {
      const grId = `gr-${agent.guardrail.guardrailId}`;
      if (!guardrailNodes.has(grId)) {
        guardrailNodes.set(grId, {
          id: grId,
          type: 'guardrail',
          label: agent.guardrail.name || `Guardrail ${agent.guardrail.guardrailId}`,
          data: { guardrail: agent.guardrail },
          region: agent.region,
          accountId: agent.accountId,
        });
      }
      edges.push({
        id: `edge-${agent.id}-gr-${agent.guardrail.guardrailId}`,
        source: `agent-${agent.id}`,
        target: grId,
        type: 'protected-by',
        label: 'protected by',
      });
    }
  }

  // Add deduplicated nodes
  nodes.push(...guardrailNodes.values());

  return { nodes, edges };
}
