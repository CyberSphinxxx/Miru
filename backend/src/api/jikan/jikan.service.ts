import axios, { AxiosError } from 'axios';

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';

const apiClient = axios.create({
    baseURL: JIKAN_BASE_URL,
    timeout: 15000
});

// In-memory cache
interface CacheEntry {
    data: unknown;
    timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache
const REQUEST_DELAY = 350; // 350ms between requests (Jikan allows ~3/sec)

let lastRequestTime = 0;

// Helper to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Rate limit queue - ensures requests are spaced out
async function rateLimitedRequest<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;

    if (timeSinceLastRequest < REQUEST_DELAY) {
        await delay(REQUEST_DELAY - timeSinceLastRequest);
    }

    lastRequestTime = Date.now();
    return fn();
}

// Cache wrapper
function getCached<T>(key: string): T | null {
    const entry = cache.get(key);
    if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
        console.log(`Cache hit: ${key}`);
        return entry.data as T;
    }
    if (entry) {
        cache.delete(key); // Remove stale entry
    }
    return null;
}

function setCache(key: string, data: unknown): void {
    cache.set(key, { data, timestamp: Date.now() });
}

// Retry wrapper with exponential backoff for rate limits
async function withRetry<T>(cacheKey: string, fn: () => Promise<T>, retries: number = 3): Promise<T> {
    // Check cache first
    const cached = getCached<T>(cacheKey);
    if (cached) return cached;

    for (let i = 0; i < retries; i++) {
        try {
            const result = await rateLimitedRequest(fn);
            setCache(cacheKey, result);
            return result;
        } catch (error) {
            const axiosError = error as AxiosError;
            if (axiosError.response?.status === 429 && i < retries - 1) {
                const waitTime = 2000 * (i + 1);
                console.log(`Rate limited, retrying in ${waitTime / 1000}s... (attempt ${i + 2}/${retries})`);
                await delay(waitTime);
                continue;
            }
            throw error;
        }
    }
    throw new Error('Max retries exceeded');
}

export const searchAnime = async (query: string, page: number = 1, limit: number = 24) => {
    const cacheKey = `search:${query}:${page}:${limit}`;
    return withRetry(cacheKey, async () => {
        const response = await apiClient.get('/anime', {
            params: { q: query, page, limit }
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
            params: { page, limit }
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
                limit
            }
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

export const getAnimeByGenre = async (genreId: number, page: number = 1, limit: number = 24) => {
    const cacheKey = `genre:${genreId}:${page}:${limit}`;
    return withRetry(cacheKey, async () => {
        const response = await apiClient.get('/anime', {
            params: {
                genres: genreId,
                order_by: 'score',
                sort: 'desc',
                page,
                limit
            }
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

// Pre-warm cache on startup (delayed to avoid rate limits)
export const preWarmCache = async () => {
    console.log('Pre-warming cache...');
    try {
        await delay(1000);
        await getTopAnime(1, 24);
        console.log('Cache pre-warmed: top anime');

        await delay(500);
        await getGenres();
        console.log('Cache pre-warmed: genres');
    } catch (e) {
        console.log('Pre-warm failed (will load on demand):', (e as Error).message);
    }
};
