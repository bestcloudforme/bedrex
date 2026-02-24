import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { AccountConfig } from '@bedrex/shared';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readAccounts(): Promise<AccountConfig[]> {
  try {
    const data = await fs.readFile(ACCOUNTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return config.AWS_ACCOUNT_ID ? [{
      accountId: config.AWS_ACCOUNT_ID,
      displayName: 'Default Account',
      regions: [config.AWS_REGION],
      isActive: true,
    }] : [];
  }
}

async function writeAccounts(accounts: AccountConfig[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
}

export class AccountManagerService {
  async getAccounts(): Promise<AccountConfig[]> {
    return readAccounts();
  }

  async addAccount(account: AccountConfig): Promise<AccountConfig[]> {
    const accounts = await readAccounts();
    const existing = accounts.find((a) => a.accountId === account.accountId);
    if (existing) {
      throw new Error(`Account ${account.accountId} already exists`);
    }
    accounts.push(account);
    await writeAccounts(accounts);
    logger.info({ accountId: account.accountId }, 'Account added');
    return accounts;
  }

  async updateAccount(accountId: string, updates: Partial<AccountConfig>): Promise<AccountConfig[]> {
    const accounts = await readAccounts();
    const index = accounts.findIndex((a) => a.accountId === accountId);
    if (index === -1) throw new Error(`Account ${accountId} not found`);
    accounts[index] = { ...accounts[index], ...updates };
    await writeAccounts(accounts);
    logger.info({ accountId }, 'Account updated');
    return accounts;
  }

  async removeAccount(accountId: string): Promise<AccountConfig[]> {
    const accounts = await readAccounts();
    const filtered = accounts.filter((a) => a.accountId !== accountId);
    if (filtered.length === accounts.length) {
      throw new Error(`Account ${accountId} not found`);
    }
    await writeAccounts(filtered);
    logger.info({ accountId }, 'Account removed');
    return filtered;
  }
}
