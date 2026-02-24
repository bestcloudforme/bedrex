export const BEDROCK_REGIONS = [
  'us-east-1',
  'us-west-2',
  'eu-west-1',
  'eu-west-2',
  'eu-central-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ca-central-1',
] as const;

export const NODE_COLORS: Record<string, string> = {
  'bedrock-agent': '#3b82f6',
  'agentcore-runtime': '#8b5cf6',
  'knowledge-base': '#10b981',
  'action-group': '#f59e0b',
  'guardrail': '#ef4444',
  'foundation-model': '#6b7280',
  'memory': '#14b8a6',
  'gateway': '#eab308',
};

export const CACHE_TTL = {
  AGENT_LIST: 2 * 60,
  AGENT_CONFIG: 5 * 60,
  METRICS: 30,
  KNOWLEDGE_BASE: 10 * 60,
} as const;

export const RATE_LIMIT = {
  REQUESTS_PER_SECOND: 10,
  MAX_CONCURRENT_REGIONS: 5,
} as const;

export const MODEL_DISPLAY_NAMES: Record<string, string> = {
  'anthropic.claude-3-5-sonnet-20241022-v2:0': 'Claude 3.5 Sonnet v2',
  'anthropic.claude-3-5-haiku-20241022-v1:0': 'Claude 3.5 Haiku',
  'anthropic.claude-3-opus-20240229-v1:0': 'Claude 3 Opus',
  'anthropic.claude-3-sonnet-20240229-v1:0': 'Claude 3 Sonnet',
  'anthropic.claude-3-haiku-20240307-v1:0': 'Claude 3 Haiku',
  'amazon.titan-text-express-v1': 'Titan Text Express',
  'amazon.titan-text-lite-v1': 'Titan Text Lite',
  'amazon.nova-pro-v1:0': 'Nova Pro',
  'amazon.nova-lite-v1:0': 'Nova Lite',
  'amazon.nova-micro-v1:0': 'Nova Micro',
  'meta.llama3-70b-instruct-v1:0': 'Llama 3 70B',
  'meta.llama3-8b-instruct-v1:0': 'Llama 3 8B',
};

export function getModelDisplayName(modelId: string): string {
  if (MODEL_DISPLAY_NAMES[modelId]) return MODEL_DISPLAY_NAMES[modelId];
  // Fallback: parse the model ID into something readable
  const afterDot = modelId.split('.').pop() || modelId;
  return afterDot.replace(/-v\d.*$/, '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export const MODEL_PRICING: Record<string, { inputPer1k: number; outputPer1k: number }> = {
  'anthropic.claude-3-5-sonnet-20241022-v2:0': { inputPer1k: 0.003, outputPer1k: 0.015 },
  'anthropic.claude-3-5-haiku-20241022-v1:0': { inputPer1k: 0.0008, outputPer1k: 0.004 },
  'anthropic.claude-3-opus-20240229-v1:0': { inputPer1k: 0.015, outputPer1k: 0.075 },
  'anthropic.claude-3-sonnet-20240229-v1:0': { inputPer1k: 0.003, outputPer1k: 0.015 },
  'anthropic.claude-3-haiku-20240307-v1:0': { inputPer1k: 0.00025, outputPer1k: 0.00125 },
  'amazon.titan-text-express-v1': { inputPer1k: 0.0002, outputPer1k: 0.0006 },
  'amazon.titan-text-lite-v1': { inputPer1k: 0.00015, outputPer1k: 0.0002 },
  'amazon.nova-pro-v1:0': { inputPer1k: 0.0008, outputPer1k: 0.0032 },
  'amazon.nova-lite-v1:0': { inputPer1k: 0.00006, outputPer1k: 0.00024 },
  'amazon.nova-micro-v1:0': { inputPer1k: 0.000035, outputPer1k: 0.00014 },
  'meta.llama3-70b-instruct-v1:0': { inputPer1k: 0.00265, outputPer1k: 0.0035 },
  'meta.llama3-8b-instruct-v1:0': { inputPer1k: 0.0003, outputPer1k: 0.0006 },
};
