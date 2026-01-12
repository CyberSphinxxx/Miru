/**
 * Jikan API Service
 * 
 * Provides rate-limited, cached access to the Jikan (MyAnimeList) API.
 * Uses shared utilities for request queuing and caching.
 */

import axios, { AxiosError } from 'axios';
import { RequestQueue, MemoryCache, delay, RateLimitError } from '../../utils';

// ============================================================================
// Configuration
// ============================================================================

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const REQUEST_DELAY = 350; // 350ms between requests (Jikan allows ~3/sec)
const MAX_RETRIES = 3;

// ============================================================================
// API Client Setup
// ============================================================================

const apiClient = axios.create({
    baseURL: JIKAN_BASE_URL,
    timeout: 15000,
});

const cache = new MemoryCache<unknown>(CACHE_TTL);
const requestQueue = new RequestQueue(REQUEST_DELAY);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Execute a request through the rate-limited queue
 */
async function rateLimitedRequest<T>(fn: () => Promise<T>): Promise<T> {
    return requestQueue.add(fn);
}

/**
 * Execute a request with caching and exponential backoff retry
 */
async function withRetry<T>(
    cacheKey: string,
    fn: () => Promise<T>,
    retries: number = MAX_RETRIES
): Promise<T> {
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached !== null) {
        console.log(`[Jikan] Cache hit: ${cacheKey}`);
        return cached as T;
    }

    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const result = await rateLimitedRequest(fn);
            cache.set(cacheKey, result);
            return result;
        } catch (error) {
            const axiosError = error as AxiosError;

            // Handle rate limiting with exponential backoff
            if (axiosError.response?.status === 429 && attempt < retries - 1) {
                const waitTime = 2000 * (attempt + 1);
                console.log(
                    `[Jikan] Rate limited, retrying in ${waitTime / 1000}s... ` +
                    `(attempt ${attempt + 2}/${retries})`
                );
                await delay(waitTime);
                continue;
            }

            // Re-throw other errors
            throw error;
        }
    }

    throw new RateLimitError();
}

// ============================================================================
// API Functions
// ============================================================================

export const searchAnime = async (
    query: string,
    page: number = 1,
    limit: number = 24
) => {
    const cacheKey = `search:${query}:${page}:${limit}`;
    return withRetry(cacheKey, async () => {
        const response = await apiClient.get('/anime', {
            params: { q: query, page, limit },
        });
        return response.data;
    });
};

export const getAnimeById = async (id: number) => {
    const cacheKey = `anime:${id}`;
    return withRetry(cacheKey, async () => {
        const response = await apiClient.get(`/anime/${id}/full`);
        return response.data;
    });
};

export const getTopAnime = async (page: number = 1, limit: number = 24) => {
    const cacheKey = `top:${page}:${limit}`;
    return withRetry(cacheKey, async () => {
        const response = await apiClient.get('/top/anime', {
            params: { page, limit },
        });
        return response.data;
    });
};

export const getTrendingAnime = async (page: number = 1, limit: number = 24) => {
    const cacheKey = `trending:${page}:${limit}`;
    return withRetry(cacheKey, async () => {
        const response = await apiClient.get('/anime', {
            params: {
                status: 'airing',
                order_by: 'popularity',
                sort: 'asc',
                page,
                limit,
            },
        });
        return response.data;
    });
};

export const getGenres = async () => {
    const cacheKey = 'genres:all';
    return withRetry(cacheKey, async () => {
        const response = await apiClient.get('/genres/anime');
        return response.data;
    });
};

export const getAnimeByGenre = async (
    genreId: number,
    page: number = 1,
    limit: number = 24
) => {
    const cacheKey = `genre:${genreId}:${page}:${limit}`;
    return withRetry(cacheKey, async () => {
        const response = await apiClient.get('/anime', {
            params: {
                genres: genreId,
                order_by: 'score',
                sort: 'desc',
                page,
                limit,
            },
        });
        return response.data;
    });
};

export const getAnimeCharacters = async (id: number) => {
    const cacheKey = `anime:${id}:characters`;
    return withRetry(cacheKey, async () => {
        const response = await apiClient.get(`/anime/${id}/characters`);
        return response.data;
    });
};

export const getAnimeRelations = async (id: number) => {
    const cacheKey = `anime:${id}:relations`;
    return withRetry(cacheKey, async () => {
        const response = await apiClient.get(`/anime/${id}/relations`);
        return response.data;
    });
};

export const getAnimeVideos = async (id: number) => {
    const cacheKey = `anime:${id}:videos`;
    return withRetry(cacheKey, async () => {
        const response = await apiClient.get(`/anime/${id}/videos`);
        return response.data;
    });
};

export const getAnimeRecommendations = async (id: number) => {
    const cacheKey = `anime:${id}:recommendations`;
    return withRetry(cacheKey, async () => {
        const response = await apiClient.get(`/anime/${id}/recommendations`);
        return response.data;
    });
};

// ============================================================================
// Cache Management
// ============================================================================

/**
 * Pre-warm cache on startup (delayed to respect rate limits)
 */
export const preWarmCache = async (): Promise<void> => {
    console.log('[Jikan] Pre-warming cache...');
    try {
        await delay(1000);
        await getTopAnime(1, 24);
        console.log('[Jikan] Cache pre-warmed: top anime');

        await delay(500);
        await getGenres();
        console.log('[Jikan] Cache pre-warmed: genres');
    } catch (e) {
        console.log('[Jikan] Pre-warm failed (will load on demand):', (e as Error).message);
    }
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => ({
    size: cache.size,
    queueLength: requestQueue.length,
    isProcessing: requestQueue.isProcessing,
});
