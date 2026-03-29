// API Service for Anime operations - Using AniList + AnimePahe (Yorumi Architecture)
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper to map AniList response to our Anime interface format
const mapAnilistToAnime = (item: any) => {
    return {
        id: item.id,
        title: item.title?.english || item.title?.romaji || item.title?.native || 'Unknown',
        title_japanese: item.title?.native,
        title_english: item.title?.english,
        title_romaji: item.title?.romaji,
        synonyms: item.synonyms || [],
        images: {
            jpg: {
                image_url: item.coverImage?.large || '',
                large_image_url: item.coverImage?.extraLarge || item.coverImage?.large || '',
                banner_image: item.bannerImage || ''
            }
        },
        synopsis: item.description?.replace(/<[^>]*>/g, '') || '',
        type: item.format,
        episodes: item.episodes,
        score: item.averageScore ? item.averageScore / 10 : 0,
        status: item.status,
        duration: item.duration ? `${item.duration} min` : undefined,
        rating: item.isAdult ? 'R+ - Mild Nudity' : undefined,
        genres: item.genres?.map((g: string) => ({ name: g, id: g })) || [],
        studios: item.studios?.nodes?.map((s: any) => ({ name: s.name, id: s.id || s.name })) || [],
        year: item.seasonYear || item.startDate?.year,
        season: item.season?.toLowerCase(),
        aired: {
            from: item.startDate ? `${item.startDate.year}-${item.startDate.month}-${item.startDate.day}` : undefined,
            to: item.endDate ? `${item.endDate.year}-${item.endDate.month}-${item.endDate.day}` : undefined,
            string: item.startDate?.year ? `${item.season || ''} ${item.startDate.year}`.trim() : undefined
        },
        anilist_banner_image: item.bannerImage,
        anilist_cover_image: item.coverImage?.extraLarge || item.coverImage?.large,
        nextAiringEpisode: item.nextAiringEpisode ? {
            episode: item.nextAiringEpisode.episode,
            timeUntilAiring: item.nextAiringEpisode.timeUntilAiring ?? (item.nextAiringEpisode.airingAt ? item.nextAiringEpisode.airingAt - Math.floor(Date.now() / 1000) : 0)
        } : undefined,
        latestEpisode: item.nextAiringEpisode ? item.nextAiringEpisode.episode - 1 : undefined,
        characters: item.characters,
        trailer: item.trailer ? {
            id: item.trailer.id,
            site: item.trailer.site,
            thumbnail: item.trailer.thumbnail,
            youtube_id: item.trailer.site === 'youtube' ? item.trailer.id : undefined,
            url: item.trailer.site === 'youtube' ? `https://www.youtube.com/watch?v=${item.trailer.id}` : undefined,
            embed_url: item.trailer.site === 'youtube' ? `https://www.youtube.com/embed/${item.trailer.id}` : undefined
        } : undefined,
        episodeMetadata: item.streamingEpisodes?.map((e: any) => ({
            title: e.title,
            thumbnail: e.thumbnail,
            url: e.url,
            site: e.site
        })) || [],
        relations: item.relations?.edges?.map((edge: any) => ({
            relation: (edge.relationType === 'PREQUEL' || edge.relationType === 'SEQUEL') 
                ? edge.relationType 
                : edge.relationType.replace(/_/g, ' '),
            entry: [{
                id: edge.node.id,
                title: edge.node.title?.english || edge.node.title?.romaji || edge.node.title?.native || 'Unknown',
                title_japanese: edge.node.title?.native,
                title_english: edge.node.title?.english,
                title_romaji: edge.node.title?.romaji,
                images: {
                    jpg: {
                        image_url: edge.node.coverImage?.large || '',
                        large_image_url: edge.node.coverImage?.large || '',
                        banner_image: edge.node.bannerImage || ''
                    }
                },
                synopsis: edge.node.description?.replace(/<[^>]*>/g, '') || '',
                type: edge.node.format,
                episodes: edge.node.episodes,
                score: edge.node.averageScore ? edge.node.averageScore / 10 : 0,
                status: edge.node.status,
                genres: edge.node.genres?.map((g: string) => ({ name: g, id: g })) || [],
                year: edge.node.seasonYear || edge.node.startDate?.year,
                season: edge.node.season?.toLowerCase(),
                anilist_banner_image: edge.node.bannerImage,
                anilist_cover_image: edge.node.coverImage?.large,
                url: ''
            }]
        })) || [],
        recommendations: item.recommendations
    };
};

/**
 * Groups relations by type to match the RelatedAnime interface
 */
export const groupRelations = (rawRelations: any[]): any[] => {
    if (!rawRelations || !Array.isArray(rawRelations)) return [];
    
    const groups = new Map<string, any>();
    
    rawRelations.forEach(rel => {
        const type = rel.relation;
        if (!groups.has(type)) {
            groups.set(type, { relation: type, entry: [] });
        }
        groups.get(type).entry.push(...rel.entry);
    });
    
    return Array.from(groups.values());
};

// ============================================================================
// CLIENT-SIDE CACHE with SessionStorage
// Persists across navigation, reduces duplicate API calls
// ============================================================================

const CACHE_PREFIX = 'miru_cache_';
const CACHE_TTL_CONFIG = {
    default: 5 * 60 * 1000,      // 5 minutes
    trending: 10 * 60 * 1000,    // 10 minutes
    top: 10 * 60 * 1000,         // 10 minutes  
    details: 30 * 60 * 1000,     // 30 minutes
    genre: 5 * 60 * 1000,        // 5 minutes
    search: 5 * 60 * 1000,       // 5 minutes
    streams: 4 * 60 * 60 * 1000, // 4 hours - matches backend TTL for episode streams
};

// In-memory cache for instant access (falls back to sessionStorage)
const memoryCache = new Map<string, { data: any, timestamp: number }>();

/**
 * Get cached data - checks memory first, then sessionStorage
 * Exported for synchronous initial state hydration in components
 */
export const getCached = (key: string, ttlType: keyof typeof CACHE_TTL_CONFIG = 'default') => {
    const ttl = CACHE_TTL_CONFIG[ttlType];
    const fullKey = CACHE_PREFIX + key;

    // Check memory cache first (fastest)
    if (memoryCache.has(fullKey)) {
        const entry = memoryCache.get(fullKey)!;
        if (Date.now() - entry.timestamp < ttl) {
            // Cache HIT - Memory
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
                // Cache HIT from SessionStorage
                return entry.data;
            }
            // Expired - clean up
            sessionStorage.removeItem(fullKey);
        }
    } catch (e) {
        // sessionStorage might be unavailable or full
    }

    return null;
};

/**
 * Set cached data - saves to both memory and sessionStorage
 */
const setCache = (key: string, data: any) => {
    const fullKey = CACHE_PREFIX + key;
    const entry = { data, timestamp: Date.now() };

    // Save to memory cache
    memoryCache.set(fullKey, entry);

    // Save to sessionStorage for persistence
    try {
        sessionStorage.setItem(fullKey, JSON.stringify(entry));
        // Cache SET
    } catch (e) {
        // sessionStorage might be full - clear old entries
        try {
            clearOldCacheEntries();
            sessionStorage.setItem(fullKey, JSON.stringify(entry));
        } catch {
            // Still failed - just use memory cache
        }
    }
};

/**
 * Clear expired cache entries from sessionStorage
 */
const clearOldCacheEntries = () => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith(CACHE_PREFIX)) {
            try {
                const entry = JSON.parse(sessionStorage.getItem(key) || '{}');
                if (Date.now() - entry.timestamp > CACHE_TTL_CONFIG.default) {
                    keysToRemove.push(key);
                }
            } catch {
                keysToRemove.push(key!);
            }
        }
    }
    keysToRemove.forEach(k => sessionStorage.removeItem(k));
};

// Track in-flight requests to prevent duplicates
const inFlightRequests = new Map<string, Promise<any>>();

/**
 * Intelligent matching function to find the best scraper result for an AniList anime.
 * Uses year, episode count, and title similarity.
 */
export const findBestScraperMatch = (anilistAnime: any, scraperResults: any[]) => {
    if (!scraperResults || scraperResults.length === 0) return null;
    if (scraperResults.length === 1) return scraperResults[0];

    // Priority 1: Exact matches (Year + Episode Count + Title similarity)
    // Priority 2: Year + Title similarity
    // Priority 3: Title similarity + Episode Count
    // Priority 4: Title similarity

    const scores = scraperResults.map(res => {
        let score = 0;

        // 1. Year Match (Very strong signal)
        if (anilistAnime.year && res.year) {
            const scraperYear = parseInt(res.year);
            if (scraperYear === anilistAnime.year) {
                score += 100;
            } else if (Math.abs(scraperYear - anilistAnime.year) <= 1) {
                score += 50; 
            }
        }

        // 2. Episode Count Match (Strong signal)
        if (anilistAnime.episodes && res.episodes) {
            if (res.episodes === anilistAnime.episodes) {
                score += 80;
            } else if (Math.abs(res.episodes - anilistAnime.episodes) <= 2) {
                score += 40;
            }
        }

        // 3. Title Similarity (Base signal)
        const targetTitles = [
            anilistAnime.title,
            anilistAnime.title_english,
            anilistAnime.title_romaji,
            ...(anilistAnime.synonyms || [])
        ].filter(Boolean).map(t => t.toLowerCase());

        const scraperTitle = res.title?.toLowerCase() || '';

        // Check for keyword matches
        targetTitles.forEach(t => {
            if (scraperTitle.includes(t) || t.includes(scraperTitle)) {
                score += 60;
            }
            // Exact match is even better
            if (scraperTitle === t) {
                score += 100;
            }
        });

        return { res, score };
    });

    // Sort by score descending and return top
    scores.sort((a, b) => b.score - a.score);
    
    // Log for debugging
    console.log(`[Matching] Best match for "${anilistAnime.title}" (ID: ${anilistAnime.id}):`, scores[0].res.title, `(Score: ${scores[0].score})`);
    
    return scores[0].res;
};


export const animeService = {
    // Fetch top anime from AniList
    async getTopAnime(page: number = 1) {
        const cacheKey = `top-anime-${page}`;
        const cached = getCached(cacheKey, 'top');
        if (cached) return cached;

        if (inFlightRequests.has(cacheKey)) {
            return inFlightRequests.get(cacheKey);
        }

        const fetchPromise = (async () => {
            try {
                const res = await fetch(`${API_BASE}/anilist/top?page=${page}&limit=18`);
                if (!res.ok) throw new Error(`Failed to fetch top anime: ${res.statusText}`);
                const data = await res.json();
                const result = {
                    data: data.media?.map(mapAnilistToAnime) || [],
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

    // Search anime via AniList
    async searchAnime(query: string, page: number = 1) {
        try {
            const res = await fetch(`${API_BASE}/anilist/search?q=${encodeURIComponent(query)}&page=${page}&limit=18`);
            if (!res.ok) {
                console.warn(`Failed to search anime: ${res.statusText}`);
                return { data: [], pagination: { last_visible_page: 1, current_page: 1, has_next_page: false } };
            }
            const data = await res.json();
            return {
                data: data.media?.map(mapAnilistToAnime) || [],
                pagination: {
                    last_visible_page: data.pageInfo?.lastPage || 1,
                    current_page: data.pageInfo?.currentPage || 1,
                    has_next_page: data.pageInfo?.hasNextPage || false
                }
            };
        } catch (error) {
            console.error('Error searching anime:', error);
            return { data: [], pagination: { last_visible_page: 1, current_page: 1, has_next_page: false } };
        }
    },

    // Get anime details from AniList
    async getAnimeDetails(id: number) {
        const cacheKey = `details-${id}`;
        const cached = getCached(cacheKey, 'details');
        if (cached) return { data: cached };

        const res = await fetch(`${API_BASE}/anilist/anime/${id}`);
        const data = await res.json();

        if (!data || data.error) return { data: null };

        const mapped = mapAnilistToAnime(data);
        setCache(cacheKey, mapped);

        return { data: mapped };
    },

    // Search anime on scraper (AnimePahe)
    async searchScraper(title: string) {
        const cacheKey = `scraper-search-${title.toLowerCase().trim()}`;
        const cached = getCached(cacheKey, 'search');
        if (cached) return cached;

        if (inFlightRequests.has(cacheKey)) {
            return inFlightRequests.get(cacheKey);
        }

        const fetchPromise = (async () => {
            try {
                const res = await fetch(`${API_BASE}/scraper/search?q=${encodeURIComponent(title)}`);
                const data = await res.json();
                if (data && data.length > 0) setCache(cacheKey, data);
                return data;
            } finally {
                inFlightRequests.delete(cacheKey);
            }
        })();

        inFlightRequests.set(cacheKey, fetchPromise);
        return fetchPromise;
    },

    // Get episodes from scraper
    async getEpisodes(session: string) {
        const cacheKey = `scraper-episodes-${session}`;
        const cached = getCached(cacheKey, 'details');
        if (cached) return cached;

        if (inFlightRequests.has(cacheKey)) {
            return inFlightRequests.get(cacheKey);
        }

        const fetchPromise = (async () => {
            try {
                const res = await fetch(`${API_BASE}/scraper/episodes?session=${session}`);
                const data = await res.json();
                if (data) setCache(cacheKey, data);
                return data;
            } finally {
                inFlightRequests.delete(cacheKey);
            }
        })();

        inFlightRequests.set(cacheKey, fetchPromise);
        return fetchPromise;
    },

    // Get stream links from scraper - cached for 4 hours
    async getStreams(animeSession: string, episodeSession: string) {
        const cacheKey = `streams-${animeSession}-${episodeSession}`;

        // Check cache first
        const cached = getCached(cacheKey, 'streams');
        if (cached) {
            console.log('[Client Cache] Stream HIT:', cacheKey);
            return cached;
        }

        // Prevent duplicate in-flight requests
        if (inFlightRequests.has(cacheKey)) {
            return inFlightRequests.get(cacheKey);
        }

        const fetchPromise = (async () => {
            try {
                const res = await fetch(`${API_BASE}/scraper/streams?anime_session=${animeSession}&ep_session=${episodeSession}`);
                const data = await res.json();

                // Cache successful responses
                if (data && data.length > 0) {
                    setCache(cacheKey, data);
                }

                return data;
            } finally {
                inFlightRequests.delete(cacheKey);
            }
        })();

        inFlightRequests.set(cacheKey, fetchPromise);
        return fetchPromise;
    },

    // Get trending anime from AniList
    async getTrendingAnime(page: number = 1, limit: number = 10) {
        const cacheKey = `trending-${page}-${limit}`;
        const cached = getCached(cacheKey, 'trending');
        if (cached) return cached;

        if (inFlightRequests.has(cacheKey)) {
            return inFlightRequests.get(cacheKey);
        }

        const fetchPromise = (async () => {
            try {
                const res = await fetch(`${API_BASE}/anilist/trending?page=${page}&limit=${limit}`);
                if (!res.ok) {
                    console.warn(`Failed to fetch trending: ${res.statusText}`);
                    return { data: [], pagination: null };
                }

                const data = await res.json();
                const result = {
                    data: data.media?.map(mapAnilistToAnime) || [],
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

    // Get popular this season from AniList
    async getPopularThisSeason(page: number = 1, limit: number = 10) {
        const cacheKey = `popular-season-${page}-${limit}`;
        const cached = getCached(cacheKey);
        if (cached) return cached;

        if (inFlightRequests.has(cacheKey)) {
            return inFlightRequests.get(cacheKey);
        }

        const fetchPromise = (async () => {
            try {
                const res = await fetch(`${API_BASE}/anilist/popular-this-season?page=${page}&limit=${limit}`);
                if (!res.ok) {
                    console.warn(`Failed to fetch popular season: ${res.statusText}`);
                    return { data: [], pagination: null };
                }
                const data = await res.json();
                const result = {
                    data: data.media?.map(mapAnilistToAnime) || [],
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

    // Get anime by genre
    async getAnimeByGenre(genre: string, page: number = 1, limit: number = 24) {
        const cacheKey = `genre-${genre}-${page}-${limit}`;
        const cached = getCached(cacheKey, 'genre');
        if (cached) return cached;

        if (inFlightRequests.has(cacheKey)) {
            return inFlightRequests.get(cacheKey);
        }

        const fetchPromise = (async () => {
            try {
                const res = await fetch(`${API_BASE}/anilist/genre/${encodeURIComponent(genre)}?page=${page}&limit=${limit}`);
                if (!res.ok) {
                    console.warn(`Failed to fetch genre ${genre}: ${res.statusText}`);
                    return { data: [], pagination: null };
                }
                const data = await res.json();
                const result = {
                    data: data.media?.map(mapAnilistToAnime) || [],
                    pagination: {
                        last_visible_page: data.pageInfo?.lastPage || 1,
                        current_page: data.pageInfo?.currentPage || 1,
                        has_next_page: data.pageInfo?.hasNextPage || false
                    }
                };

                if (result.data.length > 0) setCache(cacheKey, result);
                return result;
            } catch (error) {
                console.error('Error fetching genre:', error);
                return { data: [], pagination: null };
            } finally {
                inFlightRequests.delete(cacheKey);
            }
        })();

        inFlightRequests.set(cacheKey, fetchPromise);
        return fetchPromise;
    },

    // Get airing schedule from AniList
    async getAiringSchedule(startTime?: number, endTime?: number, page: number = 1, limit: number = 50) {
        const now = Math.floor(Date.now() / 1000);
        const start = startTime || now;
        const end = endTime || now + (7 * 24 * 60 * 60); // Default 7 days

        const cacheKey = `schedule-${start}-${end}-${page}-${limit}`;
        const cached = getCached(cacheKey, 'trending'); // Use 10-minute TTL
        if (cached) return cached;

        if (inFlightRequests.has(cacheKey)) {
            return inFlightRequests.get(cacheKey);
        }

        const fetchPromise = (async () => {
            try {
                const res = await fetch(`${API_BASE}/anilist/schedule?start=${start}&end=${end}&page=${page}&limit=${limit}`);
                if (!res.ok) {
                    console.warn(`Failed to fetch schedule: ${res.statusText}`);
                    return { airingSchedules: [], pageInfo: {} };
                }
                const data = await res.json();

                // Transform schedule data with anime info
                const schedules = data.airingSchedules?.map((item: any) => ({
                    id: item.id,
                    airingAt: item.airingAt,
                    episode: item.episode,
                    media: item.media ? {
                        id: item.media.id,
                        idMal: item.media.idMal,
                        title: item.media.title?.english || item.media.title?.romaji || item.media.title?.native || 'Unknown',
                        coverImage: item.media.coverImage?.large || '',
                        format: item.media.format,
                        status: item.media.status,
                        isAdult: item.media.isAdult
                    } : null
                })).filter((item: any) => item.media && !item.media.isAdult) || [];

                const result = {
                    schedules,
                    pageInfo: data.pageInfo || {}
                };

                if (schedules.length > 0) setCache(cacheKey, result);
                return result;
            } finally {
                inFlightRequests.delete(cacheKey);
            }
        })();

        inFlightRequests.set(cacheKey, fetchPromise);
        return fetchPromise;
    }
};

// Legacy exports for backward compatibility with existing components
export const getPopularAnime = animeService.getTopAnime;
export const searchAnime = animeService.searchAnime;
export const getAnimeInfo = async (id: string | number) => {
    const result = await animeService.getAnimeDetails(Number(id));
    if (!result.data) return null;

    // Try to get episodes from scraper
    let episodes: any[] = [];
    try {
        const searchRes = await animeService.searchScraper(result.data.title);
        const bestMatch = findBestScraperMatch(result.data, searchRes || []);
        
        if (bestMatch) {
            const epsData = await animeService.getEpisodes(bestMatch.session);
            episodes = (epsData.episodes || []).map((ep: any) => ({
                id: ep.session,
                session: ep.session,
                episodeNumber: ep.episodeNumber,
                title: ep.title || `Episode ${ep.episodeNumber}`,
                image: ep.snapshot,
                url: ''
            }));
        }
    } catch (e) {
        console.warn('Failed to fetch episodes from scraper', e);
    }

    return {
        anime: result.data,
        episodes,
        characters: result.data.characters?.edges?.map((c: any) => ({
            character: {
                id: c.node.id,
                name: c.node.name.full,
                images: { jpg: { image_url: c.node.image?.large || '' } },
                url: ''
            },
            role: c.role,
            voice_actors: c.voiceActors?.map((va: any) => ({
                person: {
                    id: va.id,
                    name: va.name.full,
                    images: { jpg: { image_url: va.image?.large || '' } },
                    url: ''
                },
                language: va.languageV2
            })) || []
        })) || [],
        recommendations: result.data.recommendations?.nodes
            ?.filter((r: any) => r.mediaRecommendation?.id && r.mediaRecommendation?.coverImage?.large)
            ?.map((r: any) => ({
                entry: {
                    id: r.mediaRecommendation?.id,
                    title: r.mediaRecommendation?.title?.english || r.mediaRecommendation?.title?.romaji,
                    images: {
                        jpg: {
                            image_url: r.mediaRecommendation?.coverImage?.large || '',
                            large_image_url: r.mediaRecommendation?.coverImage?.extraLarge || r.mediaRecommendation?.coverImage?.large || '',
                            small_image_url: r.mediaRecommendation?.coverImage?.large || ''
                        }
                    },
                    url: ''
                },
                votes: 0,
                url: ''
            })) || []
    };
};

export const getEpisodeStreams = async (episodeSession: string, animeSession: string) => {
    return animeService.getStreams(animeSession, episodeSession);
};

export default animeService;

