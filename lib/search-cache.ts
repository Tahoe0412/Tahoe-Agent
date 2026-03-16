/**
 * Simple in-memory cache for hot-topics search results.
 *
 * Prevents redundant API calls when the user navigates away and back,
 * or searches the same query multiple times within a short window.
 *
 * Cache lives in the browser tab's JS heap and resets on full page reload.
 * Default TTL: 10 minutes.
 */

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export function getCached<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache<T>(key: string, data: T): void {
  store.set(key, { data, timestamp: Date.now() });
}

export function makeCacheKey(query: string, platforms: string[]): string {
  return `hot-topics:${query.trim().toLowerCase()}:${platforms.sort().join(",")}`;
}
