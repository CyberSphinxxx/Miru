import { db } from '../config/firebase.config.js';

/**
 * Cache Service for Firestore-based caching
 * Implements the "Scrape-and-Save" strategy
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
    STREAMS: 1      // Stream URLs: 1 hour (they can change)
};

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
        console.log(`Cache expired: ${collection}/${docId}`);
        return null;
    }

    console.log(`Cache hit: ${collection}/${docId}`);
    return cached.data;
}

export const cacheService = {
    get,
    set,
    isExpired,
    getIfFresh,
    TTL_HOURS
};
