
import { AnimePaheScraper } from '../../scraper/animepahe.js';
import { cacheService } from '../../services/cache.service.js';

export class ScraperService {
    private scraper: AnimePaheScraper;

    constructor() {
        this.scraper = new AnimePaheScraper();
    }

    /**
     * Search for anime - cached for 6 hours
     */
    async search(query: string) {
        const cacheKey = `search_${query.toLowerCase().trim()}`;

        // Check cache first
        const cached = await cacheService.getIfFresh(
            'anime_search',
            cacheKey,
            cacheService.TTL_HOURS.SEARCH
        );
        if (cached) {
            return cached;
        }

        // Scrape if not cached
        const result = await this.scraper.search(query);

        // Save to cache (don't await - fire and forget)
        cacheService.set('anime_search', cacheKey, result);

        return result;
    }

    /**
     * Get episodes for an anime - cached for 24 hours
     */
    async getEpisodes(session: string) {
        // Check cache first
        const cached = await cacheService.getIfFresh<{ episodes: any[]; lastPage: number }>(
            'anime_episodes',
            session,
            cacheService.TTL_HOURS.EPISODES
        );
        if (cached) {
            return cached;
        }

        // Scrape if not cached
        // Fetch first page to see how many pages there are
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

        // Save to cache
        cacheService.set('anime_episodes', session, result);

        return result;
    }

    /**
     * Get stream URLs - cached for 1 hour (streams can expire)
     */
    async getStreams(animeSession: string, epSession: string) {
        const cacheKey = `${animeSession}_${epSession}`;

        // Check cache first
        const cached = await cacheService.getIfFresh(
            'anime_streams',
            cacheKey,
            cacheService.TTL_HOURS.STREAMS
        );
        if (cached) {
            return cached;
        }

        // Scrape if not cached
        const result = await this.scraper.getLinks(animeSession, epSession);

        // Save to cache
        cacheService.set('anime_streams', cacheKey, result);

        return result;
    }
}

export const scraperService = new ScraperService();
