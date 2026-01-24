
import { AnimePaheScraper } from '../../scraper/animepahe.js';
import { HiAnimeScraper } from '../../scraper/hianime.js';

// Cache service import - loaded dynamically to prevent crashes
let cacheService: any = null;
let cacheServiceLoaded = false;

// Async initialization of cache service
const loadCacheService = async () => {
    if (cacheServiceLoaded) return;
    cacheServiceLoaded = true;
    try {
        const module = await import('../../services/cache.service.js');
        cacheService = module.cacheService;
    } catch (error) {
        console.warn('Cache service could not be loaded. Caching is disabled.');
    }
};

// Initialize cache service immediately
loadCacheService();

export class ScraperService {
    private animePahe: AnimePaheScraper;
    private hiAnime: HiAnimeScraper;

    constructor() {
        this.animePahe = new AnimePaheScraper();
        this.hiAnime = new HiAnimeScraper();
    }

    /**
     * Search for anime
     * Uses HiAnime as primary for better server support
     */
    async search(query: string) {
        // Try to use cache if available
        if (cacheService) {
            const cacheKey = `search_v2_${query.toLowerCase().trim()}`;
            try {
                const cached = await cacheService.getIfFresh(
                    'anime_search',
                    cacheKey,
                    cacheService.TTL_HOURS.SEARCH
                );
                if (cached) {
                    return cached;
                }
            } catch (e) {
                // Cache failed, continue with scraping
            }
        }

        // Scrape using HiAnime
        console.log(`[Scraper] Searching for "${query}" on HiAnime...`);
        let result = await this.hiAnime.search(query);

        // Fallback to AnimePahe if HiAnime fails or returns nothing
        if (!result || result.length === 0) {
            console.log(`[Scraper] HiAnime returned no results, trying AnimePahe...`);
            try {
                const paheResult = await this.animePahe.search(query);
                if (paheResult.length > 0) {
                    result = paheResult;
                }
            } catch (e) {
                console.error('[Scraper] AnimePahe fallback failed', e);
            }
        }

        // Try to save to cache if available
        if (cacheService) {
            const cacheKey = `search_v2_${query.toLowerCase().trim()}`;
            try {
                cacheService.set('anime_search', cacheKey, result);
            } catch (e) {
                // Cache save failed, ignore
            }
        }

        return result;
    }

    /**
     * Get episodes for an anime
     */
    async getEpisodes(session: string) {
        // Try to use cache if available
        if (cacheService) {
            try {
                const cached = await cacheService.getIfFresh(
                    'anime_episodes',
                    session,
                    cacheService.TTL_HOURS.EPISODES
                );
                if (cached) {
                    return cached;
                }
            } catch (e) {
                // Cache failed, continue with scraping
            }
        }

        // Detect source based on session ID format
        // HiAnime IDs are kebab-case strings (e.g. one-piece-100)
        // AnimePahe IDs are usually UUID-like or hashes (e.g. 7890a2b...)
        const isHiAnime = session.includes('-');

        let result;
        if (isHiAnime) {
            result = await this.hiAnime.getEpisodes(session);
        } else {
            result = await this.animePahe.getEpisodes(session);
        }

        // Try to save to cache if available
        if (cacheService && result.episodes.length > 0) {
            try {
                cacheService.set('anime_episodes', session, result);
            } catch (e) {
                // Cache save failed, ignore
            }
        }

        return result;
    }

    /**
     * Get stream URLs
     */
    async getStreams(animeSession: string, epSession: string) {
        const cacheKey = `${animeSession}_${epSession}`;

        // Step 1: Check in-memory cache
        if (cacheService) {
            const memCached = cacheService.getFromMemory(cacheKey);
            if (memCached) {
                return memCached;
            }
        }

        // Step 2: Check Firestore cache
        if (cacheService) {
            try {
                const cached = await cacheService.getIfFresh(
                    'anime_streams',
                    cacheKey,
                    cacheService.TTL_HOURS.STREAMS
                );
                if (cached) {
                    cacheService.setToMemory(cacheKey, cached);
                    return cached;
                }
            } catch (e) {
                console.warn('[Cache] Firestore check failed, falling back to scraper');
            }
        }

        // Step 3: Scrape
        console.log(`[Scraper] Cache MISS - Scraping streams for ${epSession}`);

        // Detect source
        // If episode session is numeric (HiAnime uses data-id like "12345"), it's likely HiAnime
        // AnimePahe uses specific session strings

        let result = [];
        // Heuristic: HiAnime episode IDs are usually numeric strings, but to be sure we check the anime session
        const isHiAnime = animeSession.includes('-');

        if (isHiAnime) {
            result = await this.hiAnime.getLinks(epSession);
        } else {
            result = await this.animePahe.getLinks(animeSession, epSession);
        }

        // Step 4: Cache
        if (cacheService && result && result.length > 0) {
            cacheService.setToMemory(cacheKey, result);
            cacheService.setAsync('anime_streams', cacheKey, result);
        }

        return result;
    }
}

export const scraperService = new ScraperService();

