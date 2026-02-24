import NodeCache from 'node-cache';
import { logger } from '../utils/logger.js';

export class CacheManager {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({ checkperiod: 30 });
  }

  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  set<T>(key: string, value: T, ttlSeconds: number): void {
    this.cache.set(key, value, ttlSeconds);
  }

  invalidate(key: string): void {
    this.cache.del(key);
  }

  invalidateByPrefix(prefix: string): void {
    const keys = this.cache.keys().filter((k) => k.startsWith(prefix));
    this.cache.del(keys);
    logger.debug({ prefix, count: keys.length }, 'Invalidated cache by prefix');
  }

  flush(): void {
    this.cache.flushAll();
    logger.info('Cache flushed');
  }

  getStats() {
    return this.cache.getStats();
  }
}

export const cacheManager = new CacheManager();
