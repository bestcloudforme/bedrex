import { Router } from 'express';
import { AccountManagerService } from '../services/account-manager.js';
import { z } from 'zod';

export const settingsRoutes = Router();
const accountService = new AccountManagerService();

const accountSchema = z.object({
  accountId: z.string().length(12),
  displayName: z.string().min(1).max(100),
  roleArn: z.string().optional(),
  externalId: z.string().optional(),
  regions: z.array(z.string()).min(1),
  isActive: z.boolean(),
});

settingsRoutes.get('/', async (_req, res, next) => {
  try {
    const accounts = await accountService.getAccounts();
    res.json({ data: { accounts }, meta: { timestamp: new Date().toISOString() } });
  } catch (err) {
    next(err);
  }
});

settingsRoutes.post('/accounts', async (req, res, next) => {
  try {
    const account = accountSchema.parse(req.body);
    const accounts = await accountService.addAccount(account);
    res.status(201).json({ data: { accounts }, meta: { timestamp: new Date().toISOString() } });
  } catch (err) {
    next(err);
  }
});

const accountUpdateSchema = accountSchema.partial().omit({ accountId: true });

settingsRoutes.put('/accounts/:accountId', async (req, res, next) => {
  try {
    const updates = accountUpdateSchema.parse(req.body);
    const accounts = await accountService.updateAccount(req.params.accountId, updates);
    res.json({ data: { accounts }, meta: { timestamp: new Date().toISOString() } });
  } catch (err) {
    next(err);
  }
});

settingsRoutes.delete('/accounts/:accountId', async (req, res, next) => {
  try {
    const accounts = await accountService.removeAccount(req.params.accountId);
    res.json({ data: { accounts }, meta: { timestamp: new Date().toISOString() } });
  } catch (err) {
    next(err);
  }
});
