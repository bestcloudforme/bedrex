import { AgentDiscoveryService } from './agent-discovery.js';
import { AccountManagerService } from './account-manager.js';
import { cacheManager } from './cache-manager.js';
import { config } from '../config/index.js';
import type { AgentInventoryItem } from '@bedrex/shared';

const agentService = new AgentDiscoveryService(cacheManager);
const accountService = new AccountManagerService();

/** Discover agents across all configured regions for active accounts */
export async function discoverAllAgents(): Promise<AgentInventoryItem[]> {
  const accounts = await accountService.getAccounts();
  const active = accounts.filter((a) => a.isActive);

  if (active.length === 0) {
    if (!config.AWS_ACCOUNT_ID) {
      throw new Error('AWS_ACCOUNT_ID environment variable is required when no accounts are configured');
    }
    return agentService.discoverAgents(config.AWS_REGION, config.AWS_ACCOUNT_ID);
  }

  const promises = active.flatMap((account) =>
    account.regions.map((region) => agentService.discoverAgents(region, account.accountId)),
  );

  const results = await Promise.allSettled(promises);
  const agents: AgentInventoryItem[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') agents.push(...r.value);
  }
  return agents;
}

/** Refresh (invalidate cache + re-discover) agents across all configured regions */
export async function refreshAllAgents(): Promise<AgentInventoryItem[]> {
  const accounts = await accountService.getAccounts();
  const active = accounts.filter((a) => a.isActive);

  if (active.length === 0) {
    if (!config.AWS_ACCOUNT_ID) {
      throw new Error('AWS_ACCOUNT_ID environment variable is required when no accounts are configured');
    }
    return agentService.refreshAgents(config.AWS_REGION, config.AWS_ACCOUNT_ID);
  }

  const promises = active.flatMap((account) =>
    account.regions.map((region) => agentService.refreshAgents(region, account.accountId)),
  );

  const results = await Promise.allSettled(promises);
  const agents: AgentInventoryItem[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') agents.push(...r.value);
  }
  return agents;
}
