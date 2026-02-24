import { describe, it, expect, beforeEach } from 'vitest';
import { getBedrockAgentClient, getCloudWatchClient, clearClientCache } from '../../src/utils/aws-client-factory.js';

describe('AWS Client Factory', () => {
  beforeEach(() => {
    clearClientCache();
  });

  it('creates BedrockAgentClient for a region', async () => {
    const client = getBedrockAgentClient('us-east-1');
    expect(client).toBeDefined();
    const region = await client.config.region();
    expect(region).toBe('us-east-1');
  });

  it('creates CloudWatchClient for a region', async () => {
    const client = getCloudWatchClient('us-west-2');
    expect(client).toBeDefined();
    const region = await client.config.region();
    expect(region).toBe('us-west-2');
  });

  it('caches clients for same region', () => {
    const client1 = getBedrockAgentClient('us-east-1');
    const client2 = getBedrockAgentClient('us-east-1');
    expect(client1).toBe(client2);
  });

  it('creates different clients for different regions', () => {
    const client1 = getBedrockAgentClient('us-east-1');
    const client2 = getBedrockAgentClient('us-west-2');
    expect(client1).not.toBe(client2);
  });
});
