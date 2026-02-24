import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

// Need to mock agent-discovery since it's imported by other routes in app.ts
vi.mock('../../src/services/agent-discovery.js', () => {
  return {
    AgentDiscoveryService: vi.fn().mockImplementation(() => ({
      discoverAgents: vi.fn().mockResolvedValue([]),
    })),
  };
});

import { createApp } from '../../src/app.js';

describe('Health Routes', () => {
  const app = createApp();

  it('GET /api/health returns 200 with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  it('GET /api/health returns a timestamp', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body).toHaveProperty('timestamp');
    // Verify it's a valid ISO timestamp
    const date = new Date(res.body.timestamp);
    expect(date.getTime()).not.toBeNaN();
  });
});
