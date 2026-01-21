import { db } from '../config/firebase.config.js';

/**
 * Cache Service for Firestore-based caching
 * Implements the "Read-Through" caching strategy with:
 * - In-memory cache layer for instant access
 * - Firestore persistence for durability
 * - Async write-back for non-blocking responses
 * 
 * Note: Uses Date instead of firebase Timestamp for Vercel compatibility
 */

interface CachedData<T> {
    data: T;
    cachedAt: Date | { toMillis: () => number };
}

// Default TTL values in hours
const TTL_HOURS = {
    SEARCH: 6,      // Search results: 6 hours
    EPISODES: 24,   // Episode lists: 24 hours  
    STREAMS: 4      // Stream URLs: 4 hours (extended for better caching)
};

// ============================================================================
// IN-MEMORY CACHE LAYER
// Provides instant access for repeated requests within a session
// ============================================================================

interface MemoryCacheEntry {
    data: any;
    cachedAt: number;
}

const memoryCache = new Map<string, MemoryCacheEntry>();
const MEMORY_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_MEMORY_ENTRIES = 100; // Limit memory usage

/**
 * Get data from in-memory cache (instant access)
 */
function getFromMemory<T>(key: string): T | null {
    const entry = memoryCache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.cachedAt > MEMORY_TTL_MS) {
        memoryCache.delete(key);
        return null;
    }

    console.log(`[Cache] Memory HIT: ${key}`);
    return entry.data as T;
}

/**
 * Store data in in-memory cache
 */
function setToMemory<T>(key: string, data: T): void {
    // Evict oldest entries if at capacity
    if (memoryCache.size >= MAX_MEMORY_ENTRIES) {
        const firstKey = memoryCache.keys().next().value;
        if (firstKey) memoryCache.delete(firstKey);
    }

    memoryCache.set(key, {
        data,
        cachedAt: Date.now()
    });
}

/**
 * Clear in-memory cache (for testing or memory pressure)
 */
function clearMemory(): void {
    memoryCache.clear();
}

/**
 * Get cached data from Firestore
 */
async function get<T>(collection: string, docId: string): Promise<CachedData<T> | null> {
    // If Firebase isn't available, caching is disabled
    if (!db) {
        return null;
    }

    try {
        // Sanitize docId to be Firestore-safe (no slashes, etc.)
        const safeDocId = sanitizeDocId(docId);
        const docRef = db.collection(collection).doc(safeDocId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return null;
        }

        return doc.data() as CachedData<T>;
    } catch (error) {
        console.error(`Cache get error [${collection}/${docId}]:`, error);
        return null;
    }
}

/**
 * Store data in Firestore cache
 */
async function set<T>(collection: string, docId: string, data: T): Promise<void> {
    // If Firebase isn't available, caching is disabled
    if (!db) {
        return;
    }

    try {
        const safeDocId = sanitizeDocId(docId);
        const docRef = db.collection(collection).doc(safeDocId);

        // Use Date object instead of Timestamp for compatibility
        await docRef.set({
            data,
            cachedAt: new Date()
        });

        console.log(`Cache set: ${collection}/${safeDocId}`);
    } catch (error) {
        console.error(`Cache set error [${collection}/${docId}]:`, error);
        // Don't throw - caching failure shouldn't break the scraper
    }
}

/**
 * Check if cached data is expired
 */
function isExpired(cachedAt: Date | { toMillis: () => number }, ttlHours: number): boolean {
    const now = Date.now();
    // Handle both Date objects and Firestore Timestamps
    const cachedTime = typeof cachedAt === 'object' && 'toMillis' in cachedAt
        ? cachedAt.toMillis()
        : new Date(cachedAt as any).getTime();
    const ttlMs = ttlHours * 60 * 60 * 1000;

    return (now - cachedTime) > ttlMs;
}

/**
 * Sanitize document ID for Firestore
 * Firestore doc IDs cannot contain: / 
 */
function sanitizeDocId(docId: string): string {
    return docId
        .replace(/\//g, '_')
        .replace(/\./g, '-')
        .substring(0, 1500); // Firestore limit is 1500 bytes
}

/**
 * Get cached data or return null if expired/missing
 */
async function getIfFresh<T>(collection: string, docId: string, ttlHours: number): Promise<T | null> {
    const cached = await get<T>(collection, docId);

    if (!cached) {
        return null;
    }

    if (isExpired(cached.cachedAt, ttlHours)) {
        console.log(`[Cache] Firestore EXPIRED: ${collection}/${docId}`);
        return null;
    }

    console.log(`[Cache] Firestore HIT: ${collection}/${docId}`);
    return cached.data;
}

/**
 * Async write-back - writes to Firestore in background without blocking
 * Used for the "return first, cache second" pattern
 */
function setAsync<T>(collection: string, docId: string, data: T): void {
    // Fire and forget - don't await
    set(collection, docId, data).catch(err => {
        console.error(`[Cache] Async write failed [${collection}/${docId}]:`, err);
    });
}

export const cacheService = {
    // Firestore operations
    get,
    set,
    setAsync,
    isExpired,
    getIfFresh,
    // In-memory operations
    getFromMemory,
    setToMemory,
    clearMemory,
    // Constants
    TTL_HOURS
};
