import { BedrockAgentClient } from '@aws-sdk/client-bedrock-agent';
import { BedrockAgentRuntimeClient } from '@aws-sdk/client-bedrock-agent-runtime';
import { BedrockClient } from '@aws-sdk/client-bedrock';
import { CloudWatchClient } from '@aws-sdk/client-cloudwatch';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import type { AccountConfig } from '@bedrex/shared';

const clientCache = new Map<string, unknown>();

function getCachedClient<T>(key: string, factory: () => T): T {
  if (!clientCache.has(key)) {
    clientCache.set(key, factory());
  }
  return clientCache.get(key) as T;
}

export function getBedrockAgentClient(region: string): BedrockAgentClient {
  return getCachedClient(`bedrock-agent:${region}`, () => new BedrockAgentClient({ region }));
}

export function getBedrockAgentRuntimeClient(region: string): BedrockAgentRuntimeClient {
  return getCachedClient(`bedrock-agent-runtime:${region}`, () => new BedrockAgentRuntimeClient({ region }));
}

export function getBedrockClient(region: string): BedrockClient {
  return getCachedClient(`bedrock:${region}`, () => new BedrockClient({ region }));
}

export function getCloudWatchClient(region: string): CloudWatchClient {
  return getCachedClient(`cloudwatch:${region}`, () => new CloudWatchClient({ region }));
}

export async function getClientForAccount(
  accountConfig: AccountConfig,
  region: string,
): Promise<BedrockAgentClient> {
  if (!accountConfig.roleArn) {
    return getBedrockAgentClient(region);
  }
  const stsClient = new STSClient({ region });
  const { Credentials } = await stsClient.send(
    new AssumeRoleCommand({
      RoleArn: accountConfig.roleArn,
      RoleSessionName: `bedrex-${Date.now()}`,
      ExternalId: accountConfig.externalId,
    }),
  );
  if (!Credentials?.AccessKeyId || !Credentials.SecretAccessKey) {
    throw new Error(`Failed to assume role ${accountConfig.roleArn}`);
  }
  return new BedrockAgentClient({
    region,
    credentials: {
      accessKeyId: Credentials.AccessKeyId,
      secretAccessKey: Credentials.SecretAccessKey,
      sessionToken: Credentials.SessionToken,
    },
  });
}

export function clearClientCache(): void {
  clientCache.clear();
}
