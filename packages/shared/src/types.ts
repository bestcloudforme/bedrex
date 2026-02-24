// === Agent Discovery Types ===

export type AgentType = 'bedrock-agent' | 'agentcore-runtime';

export type AgentStatus = 'ACTIVE' | 'INACTIVE' | 'PREPARING' | 'PREPARED' | 'FAILED' | 'NOT_PREPARED' | 'DELETING';

export type AgentCoreFramework = 'strands' | 'langchain' | 'langgraph' | 'crewai' | 'custom';

export type ActionGroupExecutionType = 'LAMBDA' | 'RETURN_CONTROL' | 'CUSTOM';

export interface ActionGroup {
  id: string;
  name: string;
  description?: string;
  executionType: ActionGroupExecutionType;
  lambdaArn?: string;
  apiSchema?: string;
  state: string;
  updatedAt: string;
}

export interface KnowledgeBaseAssociation {
  knowledgeBaseId: string;
  name?: string;
  description?: string;
  dataSourceType?: string;
  embeddingModel?: string;
  status: string;
  updatedAt: string;
}

export interface GuardrailConfig {
  guardrailId: string;
  guardrailVersion: string;
  name?: string;
}

export interface RuntimeConfig {
  runtimeId: string;
  runtimeName: string;
  status: string;
  endpointUrl?: string;
  framework?: AgentCoreFramework;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryConfig {
  memoryId: string;
  memoryName: string;
  status: string;
  createdAt: string;
}

export interface GatewayConfig {
  gatewayId: string;
  gatewayName: string;
  status: string;
  targets: GatewayTarget[];
  createdAt: string;
}

export interface GatewayTarget {
  targetId: string;
  name: string;
  targetType: string;
  status: string;
}

export interface IdentityConfig {
  workloadIdentityId: string;
  name: string;
  status: string;
  allowedClientIds?: string[];
}

export interface AgentMetricsSummary {
  invocationCount24h: number;
  avgLatencyMs: number;
  errorRate: number;
  totalTokensUsed24h: number;
  estimatedCost24h: number;
}

export interface AgentInventoryItem {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  region: string;
  accountId: string;
  foundationModel: string;
  framework?: AgentCoreFramework;
  description?: string;
  instruction?: string;
  agentVersion: string;
  createdAt: string;
  updatedAt: string;
  actionGroups: ActionGroup[];
  knowledgeBases: KnowledgeBaseAssociation[];
  guardrail?: GuardrailConfig;
  agentCoreConfig?: {
    runtime?: RuntimeConfig;
    memory?: MemoryConfig;
    gateway?: GatewayConfig;
    identity?: IdentityConfig;
  };
  metrics?: AgentMetricsSummary;
  estimatedMonthlyCost?: number;
}

// === Topology Types ===

export type TopologyNodeType =
  | 'bedrock-agent'
  | 'agentcore-runtime'
  | 'knowledge-base'
  | 'action-group'
  | 'guardrail'
  | 'foundation-model'
  | 'memory'
  | 'gateway';

export type TopologyEdgeType =
  | 'uses-kb'
  | 'invokes-action'
  | 'protected-by'
  | 'powered-by'
  | 'a2a-communication'
  | 'stores-memory'
  | 'routes-through';

export interface TopologyNode {
  id: string;
  type: TopologyNodeType;
  label: string;
  data: Record<string, unknown>;
  region: string;
  accountId: string;
}

export interface TopologyEdge {
  id: string;
  source: string;
  target: string;
  type: TopologyEdgeType;
  label?: string;
  animated?: boolean;
}

export interface TopologyData {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
}

// === Metrics Types ===

export interface MetricDataPoint {
  timestamp: string;
  value: number;
}

export interface AgentMetrics {
  agentId: string;
  timeRange: TimeRange;
  invocationCount: MetricDataPoint[];
  latency: MetricDataPoint[];
  errorCount: MetricDataPoint[];
  throttleCount: MetricDataPoint[];
  inputTokens: MetricDataPoint[];
  outputTokens: MetricDataPoint[];
}

export type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d';

export interface MetricsDashboardSummary {
  totalAgents: number;
  activeAgents: number;
  totalInvocationsToday: number;
  totalErrorsToday: number;
  estimatedDailyCost: number;
}

// === Cost Types ===

export interface ModelPricing {
  modelId: string;
  inputTokenPricePer1k: number;
  outputTokenPricePer1k: number;
}

// === Account Configuration ===

export interface AccountConfig {
  accountId: string;
  displayName: string;
  roleArn?: string;
  externalId?: string;
  regions: string[];
  isActive: boolean;
}

// === Config Snapshot (Change Tracking) ===

export type ChangeType = 'INITIAL' | 'MODIFIED' | 'DELETED';

export interface ConfigSnapshot {
  id: string;
  agentId: string;
  timestamp: string;
  config: AgentInventoryItem;
  changeType: ChangeType;
  changedFields?: string[];
}

// === API Response Types ===

export interface ApiResponse<T> {
  data: T;
  meta: {
    timestamp: string;
    cached: boolean;
    staleAge?: number;
  };
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    timestamp: string;
    cached: boolean;
  };
}

// === Filter & Sort Types ===

export interface AgentFilters {
  status?: AgentStatus[];
  region?: string[];
  accountId?: string[];
  type?: AgentType[];
  framework?: AgentCoreFramework[];
  model?: string[];
  search?: string;
}

export type AgentSortField = 'name' | 'status' | 'updatedAt' | 'invocationCount' | 'estimatedCost' | 'model' | 'region' | 'actionGroups' | 'knowledgeBases';
export type SortDirection = 'asc' | 'desc';

export interface AgentSort {
  field: AgentSortField;
  direction: SortDirection;
}
