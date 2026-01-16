
import { AnimePaheScraper } from '../../scraper/animepahe.js';

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
    private scraper: AnimePaheScraper;

    constructor() {
        this.scraper = new AnimePaheScraper();
    }

    /**
     * Search for anime - cached for 6 hours if caching is available
     */
    async search(query: string) {
        // Try to use cache if available
        if (cacheService) {
            const cacheKey = `search_${query.toLowerCase().trim()}`;
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

        // Scrape
        const result = await this.scraper.search(query);

        // Try to save to cache if available
        if (cacheService) {
            const cacheKey = `search_${query.toLowerCase().trim()}`;
            try {
                cacheService.set('anime_search', cacheKey, result);
            } catch (e) {
                // Cache save failed, ignore
            }
        }

        return result;
    }

    /**
     * Get episodes for an anime - cached for 24 hours if caching is available
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

        // Scrape
        const firstPage = await this.scraper.getEpisodes(session, 1);
        let allEpisodes = [...firstPage.episodes];

        if (firstPage.lastPage > 1) {
            console.log(`Anime has ${firstPage.lastPage} pages of episodes. Fetching the rest...`);
            const pagePromises = [];
            for (let i = 2; i <= firstPage.lastPage; i++) {
                pagePromises.push(this.scraper.getEpisodes(session, i));
            }

            const results = await Promise.all(pagePromises);
            results.forEach(res => {
                allEpisodes = [...allEpisodes, ...res.episodes];
            });
        }

        const result = {
            episodes: allEpisodes,
            lastPage: firstPage.lastPage
        };

        // Try to save to cache if available
        if (cacheService) {
            try {
                cacheService.set('anime_episodes', session, result);
            } catch (e) {
                // Cache save failed, ignore
            }
        }

        return result;
    }

    /**
     * Get stream URLs - cached for 1 hour if caching is available
     */
    async getStreams(animeSession: string, epSession: string) {
        const cacheKey = `${animeSession}_${epSession}`;

        // Try to use cache if available
        if (cacheService) {
            try {
                const cached = await cacheService.getIfFresh(
                    'anime_streams',
                    cacheKey,
                    cacheService.TTL_HOURS.STREAMS
                );
                if (cached) {
                    return cached;
                }
            } catch (e) {
                // Cache failed, continue with scraping
            }
        }

        // Scrape
        const result = await this.scraper.getLinks(animeSession, epSession);

        // Try to save to cache if available
        if (cacheService) {
            try {
                cacheService.set('anime_streams', cacheKey, result);
            } catch (e) {
                // Cache save failed, ignore
            }
        }

        return result;
    }
}

export const scraperService = new ScraperService();

