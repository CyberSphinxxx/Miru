/**
 * Manga API Service - Using AniList API
 * 
 * Provides methods to fetch manga data from AniList,
 * following the same patterns as anime.api.ts.
 */

import { Manga } from '../../types/manga';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper to map AniList response to our Manga interface format
const mapAnilistToManga = (item: any): Manga => {
    return {
        mal_id: item.idMal || item.id,
        id: item.id,
        title: item.title?.english || item.title?.romaji || item.title?.native || 'Unknown',
        title_japanese: item.title?.native,
        title_english: item.title?.english,
        title_romaji: item.title?.romaji,
        images: {
            jpg: {
                image_url: item.coverImage?.large || '',
                large_image_url: item.coverImage?.extraLarge || item.coverImage?.large || '',
                banner_image: item.bannerImage || ''
            }
        },
        synopsis: item.description?.replace(/<[^>]*>/g, '') || '',
        type: item.format,
        chapters: item.chapters,
        volumes: item.volumes,
        score: item.averageScore ? item.averageScore / 10 : 0,
        status: item.status,
        genres: item.genres?.map((g: string) => ({ name: g, mal_id: 0 })) || [],
        authors: item.staff?.edges
            ?.filter((s: any) => s.role === 'Story' || s.role === 'Art' || s.role === 'Story & Art')
            ?.map((s: any) => ({ name: s.node.name.full, mal_id: s.node.id })) || [],
        published: {
            from: item.startDate ? `${item.startDate.year}-${item.startDate.month}-${item.startDate.day}` : undefined,
            to: item.endDate ? `${item.endDate.year}-${item.endDate.month}-${item.endDate.day}` : undefined,
            string: item.startDate?.year ? `${item.startDate.year}` : undefined
        }
    };
};

// ============================================================================
// CLIENT-SIDE CACHE with SessionStorage (same pattern as anime.api.ts)
// ============================================================================

const CACHE_PREFIX = 'miru_manga_cache_';
const CACHE_TTL = {
    default: 5 * 60 * 1000,      // 5 minutes
    trending: 10 * 60 * 1000,    // 10 minutes
    top: 10 * 60 * 1000,         // 10 minutes  
    details: 30 * 60 * 1000,     // 30 minutes
    search: 5 * 60 * 1000,       // 5 minutes
};

const memoryCache = new Map<string, { data: any, timestamp: number }>();

const getCached = (key: string, ttlType: keyof typeof CACHE_TTL = 'default') => {
    const ttl = CACHE_TTL[ttlType];
    const fullKey = CACHE_PREFIX + key;

    // Check memory cache first
    if (memoryCache.has(fullKey)) {
        const entry = memoryCache.get(fullKey)!;
        if (Date.now() - entry.timestamp < ttl) {
            console.log(`[Manga Cache HIT - Memory] ${key}`);
            return entry.data;
        }
        memoryCache.delete(fullKey);
    }

    // Check sessionStorage
    try {
        const stored = sessionStorage.getItem(fullKey);
        if (stored) {
            const entry = JSON.parse(stored);
            if (Date.now() - entry.timestamp < ttl) {
                memoryCache.set(fullKey, entry);
                console.log(`[Manga Cache HIT - SessionStorage] ${key}`);
                return entry.data;
            }
            sessionStorage.removeItem(fullKey);
        }
    } catch (e) {
        // sessionStorage unavailable
    }

    return null;
};

const setCache = (key: string, data: any) => {
    const fullKey = CACHE_PREFIX + key;
    const entry = { data, timestamp: Date.now() };

    memoryCache.set(fullKey, entry);

    try {
        sessionStorage.setItem(fullKey, JSON.stringify(entry));
        console.log(`[Manga Cache SET] ${key}`);
    } catch (e) {
        // sessionStorage might be full - just use memory cache
    }
};

// Track in-flight requests to prevent duplicates
const inFlightRequests = new Map<string, Promise<any>>();

export const mangaService = {
    /**
     * Fetch top/popular manga from AniList
     */
    async getTopManga(page: number = 1, limit: number = 24) {
        const cacheKey = `top-manga-${page}-${limit}`;
        const cached = getCached(cacheKey, 'top');
        if (cached) return cached;

        if (inFlightRequests.has(cacheKey)) {
            return inFlightRequests.get(cacheKey);
        }

        const fetchPromise = (async () => {
            try {
                const res = await fetch(`${API_BASE}/anilist/top/manga?page=${page}&limit=${limit}`);
                if (!res.ok) throw new Error(`Failed to fetch top manga: ${res.statusText}`);
                const data = await res.json();
                const result = {
                    data: data.media?.map(mapAnilistToManga) || [],
                    pagination: {
                        last_visible_page: data.pageInfo?.lastPage || 1,
                        current_page: data.pageInfo?.currentPage || 1,
                        has_next_page: data.pageInfo?.hasNextPage || false
                    }
                };
                if (result.data.length > 0) setCache(cacheKey, result);
                return result;
            } finally {
                inFlightRequests.delete(cacheKey);
            }
        })();

        inFlightRequests.set(cacheKey, fetchPromise);
        return fetchPromise;
    },

    /**
     * Get trending manga (uses top manga endpoint sorted by trending)
     * Since AniList trending endpoint is same as top for manga
     */
    async getTrendingManga(page: number = 1, limit: number = 10) {
        const cacheKey = `trending-manga-${page}-${limit}`;
        const cached = getCached(cacheKey, 'trending');
        if (cached) return cached;

        if (inFlightRequests.has(cacheKey)) {
            return inFlightRequests.get(cacheKey);
        }

        const fetchPromise = (async () => {
            try {
                const res = await fetch(`${API_BASE}/anilist/top/manga?page=${page}&limit=${limit}`);
                if (!res.ok) {
                    console.warn(`Failed to fetch trending manga: ${res.statusText}`);
                    return { data: [], pagination: null };
                }
                const data = await res.json();
                const result = {
                    data: data.media?.map(mapAnilistToManga) || [],
                    pagination: {
                        last_visible_page: data.pageInfo?.lastPage || 1,
                        current_page: data.pageInfo?.currentPage || 1,
                        has_next_page: data.pageInfo?.hasNextPage || false
                    }
                };
                if (result.data.length > 0) setCache(cacheKey, result);
                return result;
            } finally {
                inFlightRequests.delete(cacheKey);
            }
        })();

        inFlightRequests.set(cacheKey, fetchPromise);
        return fetchPromise;
    },

    /**
     * Search manga via AniList
     */
    async searchManga(query: string, page: number = 1, limit: number = 18) {
        const cacheKey = `search-manga-${query}-${page}`;
        const cached = getCached(cacheKey, 'search');
        if (cached) return cached;

        const res = await fetch(`${API_BASE}/anilist/search/manga?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
        const data = await res.json();
        const result = {
            data: data.media?.map(mapAnilistToManga) || [],
            pagination: {
                last_visible_page: data.pageInfo?.lastPage || 1,
                current_page: data.pageInfo?.currentPage || 1,
                has_next_page: data.pageInfo?.hasNextPage || false
            }
        };
        if (result.data.length > 0) setCache(cacheKey, result);
        return result;
    },

    /**
     * Get manga details by ID
     */
    async getMangaById(id: number) {
        const cacheKey = `manga-details-${id}`;
        const cached = getCached(cacheKey, 'details');
        if (cached) return cached;

        const res = await fetch(`${API_BASE}/anilist/manga/${id}`);
        const data = await res.json();
        if (!data || data.error) return { data: null };

        const result = { data: mapAnilistToManga(data) };
        setCache(cacheKey, result);
        return result;
    },

    // ============================================================================
    // MANGA SCRAPER METHODS (MangaKatana)
    // ============================================================================

    /**
     * Search manga on MangaKatana scraper
     */
    async searchMangaScraper(query: string) {
        const res = await fetch(`${API_BASE}/manga/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        return data.data || [];
    },

    /**
     * Get manga details from MangaKatana
     */
    async getMangaDetails(mangaId: string) {
        const res = await fetch(`${API_BASE}/manga/details/${encodeURIComponent(mangaId)}`);
        const data = await res.json();
        return data.data || null;
    },

    /**
     * Get chapter list from MangaKatana
     */
    async getChapters(mangaId: string) {
        const res = await fetch(`${API_BASE}/manga/chapters/${encodeURIComponent(mangaId)}`);
        const data = await res.json();
        return data.chapters || [];
    },

    /**
     * Get chapter pages from MangaKatana
     */
    async getChapterPages(chapterUrl: string) {
        const res = await fetch(`${API_BASE}/manga/pages?url=${encodeURIComponent(chapterUrl)}`);
        const data = await res.json();
        return data.pages || [];
    }
};

export default mangaService;

