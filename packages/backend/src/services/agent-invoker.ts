import { InvokeAgentCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { getBedrockAgentRuntimeClient } from '../utils/aws-client-factory.js';
import { logger } from '../utils/logger.js';
import type { AgentInventoryItem } from '@bedrex/shared';

// Default test alias that every Bedrock agent has
const TEST_ALIAS_ID = 'TSTALIASID';

// Simple test prompts per agent name pattern
const TEST_PROMPTS: Record<string, string> = {
  playlist: 'Create a playlist with 3 songs in the pop genre with a happy theme',
  blog: 'Write a short paragraph about cloud computing trends',
  code: 'Review this function: function add(a, b) { return a + b; }',
  customer: 'Hello, I need help with my account',
  support: 'Hello, I need help with my account',
  data: 'Analyze the trend of increasing cloud adoption',
  email: 'Summarize this email: Meeting scheduled for Monday at 10am to discuss Q1 results.',
  hr: 'What is the company vacation policy?',
  meeting: 'Schedule a meeting for tomorrow at 2pm',
  travel: 'Plan a 3-day trip to Istanbul',
};

function getTestPrompt(agentName: string): string {
  const lower = agentName.toLowerCase();
  for (const [key, prompt] of Object.entries(TEST_PROMPTS)) {
    if (lower.includes(key)) return prompt;
  }
  return 'Hello, can you help me with a quick test?';
}

export interface InvokeResult {
  agentId: string;
  agentName: string;
  success: boolean;
  responseText?: string;
  latencyMs: number;
  error?: string;
}

export async function invokeAgent(
  agent: AgentInventoryItem,
  prompt?: string,
): Promise<InvokeResult> {
  const client = getBedrockAgentRuntimeClient(agent.region);
  const inputText = prompt || getTestPrompt(agent.name);
  const sessionId = `test-${agent.id}-${Date.now()}`;
  const start = Date.now();

  try {
    const response = await client.send(
      new InvokeAgentCommand({
        agentId: agent.id,
        agentAliasId: TEST_ALIAS_ID,
        sessionId,
        inputText,
      }),
    );

    // Collect streamed response chunks
    let responseText = '';
    if (response.completion) {
      for await (const event of response.completion) {
        if (event.chunk?.bytes) {
          responseText += new TextDecoder().decode(event.chunk.bytes);
        }
      }
    }

    const latencyMs = Date.now() - start;
    logger.info({ agentId: agent.id, agentName: agent.name, latencyMs }, 'Agent invoked successfully');

    return {
      agentId: agent.id,
      agentName: agent.name,
      success: true,
      responseText: responseText.slice(0, 500), // truncate for response
      latencyMs,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    const errorMessage = err.message || String(err);
    logger.warn({ agentId: agent.id, agentName: agent.name, error: errorMessage }, 'Agent invocation failed');

    return {
      agentId: agent.id,
      agentName: agent.name,
      success: false,
      latencyMs,
      error: errorMessage,
    };
  }
}

export async function invokeAllAgents(
  agents: AgentInventoryItem[],
): Promise<{ results: InvokeResult[]; summary: { total: number; success: number; failed: number; avgLatencyMs: number } }> {
  const prepared = agents.filter((a) => a.status === 'PREPARED');

  logger.info({ total: agents.length, prepared: prepared.length }, 'Starting batch agent invocation');

  // Invoke agents sequentially to avoid throttling
  const results: InvokeResult[] = [];
  for (const agent of prepared) {
    const result = await invokeAgent(agent);
    results.push(result);
  }

  const successful = results.filter((r) => r.success);
  const avgLatency = successful.length > 0
    ? Math.round(successful.reduce((sum, r) => sum + r.latencyMs, 0) / successful.length)
    : 0;

  const summary = {
    total: prepared.length,
    success: successful.length,
    failed: results.filter((r) => !r.success).length,
    avgLatencyMs: avgLatency,
  };

  logger.info(summary, 'Batch agent invocation complete');

  return { results, summary };
}
