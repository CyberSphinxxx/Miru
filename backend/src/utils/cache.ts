/**
 * MemoryCache - Type-safe in-memory caching with TTL
 * 
 * Provides a simple caching layer for API responses to reduce
 * redundant requests and improve response times.
 */

export interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

/**
 * Generic in-memory cache with time-to-live support
 */
export class MemoryCache<T = unknown> {
    private cache = new Map<string, CacheEntry<T>>();
    private readonly ttl: number;

    /**
     * Create a new MemoryCache
     * @param ttl - Time to live in milliseconds
     */
    constructor(ttl: number) {
        this.ttl = ttl;
    }

    /**
     * Get a cached value if it exists and hasn't expired
     * @param key - Cache key
     * @returns Cached value or null if not found/expired
     */
    get(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        const isExpired = Date.now() - entry.timestamp >= this.ttl;

        if (isExpired) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    /**
     * Set a value in the cache
     * @param key - Cache key
     * @param data - Value to cache
     */
    set(key: string, data: T): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
        });
    }

    /**
     * Check if a key exists and is valid
     * @param key - Cache key
     */
    has(key: string): boolean {
        return this.get(key) !== null;
    }

    /**
     * Delete a specific key from cache
     * @param key - Cache key
     */
    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    /**
     * Clear all cached entries
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Get the current number of cached entries
     */
    get size(): number {
        return this.cache.size;
    }

    /**
     * Remove all expired entries from the cache
     * Useful for periodic cleanup
     */
    prune(): number {
        const now = Date.now();
        let removed = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp >= this.ttl) {
                this.cache.delete(key);
                removed++;
            }
        }

        return removed;
    }
}

/**
 * Default cache instance for general use
 * 5 minute TTL
 */
export const defaultCache = new MemoryCache(5 * 60 * 1000);
