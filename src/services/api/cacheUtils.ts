/**
 * Shared Cache Utilities
 * 
 * Centralized caching logic for API services.
 * Uses in-memory cache (fastest) with sessionStorage fallback (persists across navigation).
 */

const CACHE_PREFIX = 'miru_cache_';

export const CACHE_TTL = {
    default: 5 * 60 * 1000,      // 5 minutes
    trending: 10 * 60 * 1000,    // 10 minutes
    top: 10 * 60 * 1000,         // 10 minutes  
    details: 30 * 60 * 1000,     // 30 minutes
    genre: 5 * 60 * 1000,        // 5 minutes
    search: 5 * 60 * 1000,       // 5 minutes
    chapters: 30 * 60 * 1000,    // 30 minutes (manga chapters rarely change)
    pages: 10 * 60 * 1000,       // 10 minutes (manga pages)
};

// In-memory cache for instant access
const memoryCache = new Map<string, { data: any, timestamp: number }>();

/**
 * Get cached data - checks memory first, then sessionStorage
 */
export function getCached<T = any>(
    key: string,
    ttlType: keyof typeof CACHE_TTL = 'default',
    prefix: string = CACHE_PREFIX
): T | null {
    const ttl = CACHE_TTL[ttlType];
    const fullKey = prefix + key;

    // Check memory cache first (fastest)
    if (memoryCache.has(fullKey)) {
        const entry = memoryCache.get(fullKey)!;
        if (Date.now() - entry.timestamp < ttl) {
            return entry.data;
        }
        memoryCache.delete(fullKey);
    }

    // Check sessionStorage (persists across navigation)
    try {
        const stored = sessionStorage.getItem(fullKey);
        if (stored) {
            const entry = JSON.parse(stored);
            if (Date.now() - entry.timestamp < ttl) {
                // Restore to memory cache for faster subsequent access
                memoryCache.set(fullKey, entry);
                return entry.data;
            }
            // Expired - clean up
            sessionStorage.removeItem(fullKey);
        }
    } catch (e) {
        // sessionStorage might be unavailable or full
    }

    return null;
}

/**
 * Set cached data - saves to both memory and sessionStorage
 */
export function setCache(
    key: string,
    data: any,
    prefix: string = CACHE_PREFIX
): void {
    const fullKey = prefix + key;
    const entry = { data, timestamp: Date.now() };

    // Save to memory cache
    memoryCache.set(fullKey, entry);

    // Save to sessionStorage for persistence
    try {
        sessionStorage.setItem(fullKey, JSON.stringify(entry));
    } catch (e) {
        // sessionStorage might be full - clear old entries
        try {
            clearOldCacheEntries(prefix);
            sessionStorage.setItem(fullKey, JSON.stringify(entry));
        } catch {
            // Still failed - just use memory cache
        }
    }
}

/**
 * Clear expired cache entries from sessionStorage
 */
export function clearOldCacheEntries(prefix: string = CACHE_PREFIX): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith(prefix)) {
            try {
                const entry = JSON.parse(sessionStorage.getItem(key) || '{}');
                if (Date.now() - entry.timestamp > CACHE_TTL.default) {
                    keysToRemove.push(key);
                }
            } catch {
                keysToRemove.push(key!);
            }
        }
    }
    keysToRemove.forEach(k => sessionStorage.removeItem(k));
}

/**
 * Completely clear all app cache
 */
export function clearCache(prefix: string = CACHE_PREFIX): void {
    // Clear memory
    memoryCache.clear();

    // Clear session storage
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith(prefix)) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(k => sessionStorage.removeItem(k));
}

// Track in-flight requests to prevent duplicates
export const inFlightRequests = new Map<string, Promise<any>>();

/**
 * Helper to wrap async fetches with cache and deduplication
 */
export async function cachedFetch<T>(
    cacheKey: string,
    fetchFn: () => Promise<T>,
    ttlType: keyof typeof CACHE_TTL = 'default',
    prefix: string = CACHE_PREFIX
): Promise<T> {
    // Check cache first
    const cached = getCached<T>(cacheKey, ttlType, prefix);
    if (cached) return cached;

    // Check if request is already in-flight
    const fullKey = prefix + cacheKey;
    if (inFlightRequests.has(fullKey)) {
        return inFlightRequests.get(fullKey)!;
    }

    // Start the fetch
    const fetchPromise = (async () => {
        try {
            const result = await fetchFn();
            setCache(cacheKey, result, prefix);
            return result;
        } finally {
            inFlightRequests.delete(fullKey);
        }
    })();

    inFlightRequests.set(fullKey, fetchPromise);
    return fetchPromise;
}
