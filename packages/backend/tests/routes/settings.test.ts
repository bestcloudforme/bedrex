import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

// Mock account-manager to avoid file system operations
vi.mock('../../src/services/account-manager.js', () => {
  const mockAccounts = [
    {
      accountId: '000000000000',
      displayName: 'Primary Account',
      regions: ['us-east-1'],
      isActive: true,
    },
  ];

  return {
    AccountManagerService: vi.fn().mockImplementation(() => ({
      getAccounts: vi.fn().mockResolvedValue([...mockAccounts]),
      addAccount: vi.fn().mockImplementation(async (account: unknown) => {
        return [...mockAccounts, account];
      }),
      updateAccount: vi.fn().mockResolvedValue([...mockAccounts]),
      removeAccount: vi.fn().mockResolvedValue([]),
    })),
  };
});

import { createApp } from '../../src/app.js';

describe('Settings Routes', () => {
  const app = createApp();

  describe('GET /api/settings', () => {
    it('returns 200 with accounts data', async () => {
      const res = await request(app).get('/api/settings');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('accounts');
      expect(Array.isArray(res.body.data.accounts)).toBe(true);
    });

    it('includes meta timestamp', async () => {
      const res = await request(app).get('/api/settings');
      expect(res.body).toHaveProperty('meta');
      expect(res.body.meta).toHaveProperty('timestamp');
    });

    it('returns the expected default account', async () => {
      const res = await request(app).get('/api/settings');
      const accounts = res.body.data.accounts;
      expect(accounts).toHaveLength(1);
      expect(accounts[0].accountId).toBe('000000000000');
      expect(accounts[0].displayName).toBe('Primary Account');
    });
  });

  describe('POST /api/settings/accounts', () => {
    it('returns 201 when creating a valid account', async () => {
      const newAccount = {
        accountId: '123456789012',
        displayName: 'New Account',
        regions: ['us-west-2'],
        isActive: true,
      };
      const res = await request(app).post('/api/settings/accounts').send(newAccount);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('accounts');
    });

    it('rejects invalid account (missing required fields)', async () => {
      const res = await request(app).post('/api/settings/accounts').send({
        accountId: '12345', // too short, needs 12 chars
        displayName: 'Test',
        regions: ['us-east-1'],
        isActive: true,
      });
      // Should fail validation (zod schema: accountId must be length 12)
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('rejects account with empty regions array', async () => {
      const res = await request(app).post('/api/settings/accounts').send({
        accountId: '123456789012',
        displayName: 'Test',
        regions: [],
        isActive: true,
      });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('rejects account with empty displayName', async () => {
      const res = await request(app).post('/api/settings/accounts').send({
        accountId: '123456789012',
        displayName: '',
        regions: ['us-east-1'],
        isActive: true,
      });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });
});
