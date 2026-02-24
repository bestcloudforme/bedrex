import { describe, it, expect, beforeEach } from 'vitest';
import { CacheManager } from '../../src/services/cache-manager.js';

describe('CacheManager', () => {
  let cache: CacheManager;

  beforeEach(() => {
    cache = new CacheManager();
  });

  it('stores and retrieves values', () => {
    cache.set('key1', { foo: 'bar' }, 60);
    expect(cache.get('key1')).toEqual({ foo: 'bar' });
  });

  it('returns undefined for missing keys', () => {
    expect(cache.get('nonexistent')).toBeUndefined();
  });

  it('invalidates specific keys', () => {
    cache.set('key1', 'value', 60);
    cache.invalidate('key1');
    expect(cache.get('key1')).toBeUndefined();
  });

  it('invalidates by prefix', () => {
    cache.set('agents:us-east-1', 'a', 60);
    cache.set('agents:us-west-2', 'b', 60);
    cache.set('metrics:us-east-1', 'c', 60);
    cache.invalidateByPrefix('agents:');
    expect(cache.get('agents:us-east-1')).toBeUndefined();
    expect(cache.get('agents:us-west-2')).toBeUndefined();
    expect(cache.get('metrics:us-east-1')).toEqual('c');
  });

  it('flushes all keys', () => {
    cache.set('a', 1, 60);
    cache.set('b', 2, 60);
    cache.flush();
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBeUndefined();
  });
});
