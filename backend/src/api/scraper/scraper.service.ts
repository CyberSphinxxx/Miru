import { AnimePaheScraper } from '../../scraper/animepahe';

class ScraperService {
    private scraper: AnimePaheScraper;

    private cache = new Map<string, { data: any, timestamp: number }>();
    private CACHE_TTL = 30 * 60 * 1000; // 30 minutes cache

    constructor() {
        this.scraper = new AnimePaheScraper();
    }

    private getCached<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (entry && Date.now() - entry.timestamp < this.CACHE_TTL) {
            console.log(`Cache hit: ${key}`);
            return entry.data as T;
        }
        return null;
    }

    private setCache(key: string, data: any) {
        this.cache.set(key, { data, timestamp: Date.now() });
    }

    async search(query: string) {
        const cacheKey = `search:${query}`;
        const cached = this.getCached<any>(cacheKey);
        if (cached) return cached;

        const result = await this.scraper.search(query);
        if (result.length > 0) this.setCache(cacheKey, result);
        return result;
    }

    async getEpisodes(session: string, page: number = 1) {
        const cacheKey = `episodes:${session}:${page}`;
        const cached = this.getCached<any>(cacheKey);
        if (cached) return cached;

        const result = await this.scraper.getEpisodes(session, page);
        if (result.episodes.length > 0) this.setCache(cacheKey, result);
        return result;
    }

    async getStreams(animeSession: string, epSession: string) {
        const cacheKey = `streams:${animeSession}:${epSession}`;
        const cached = this.getCached<any>(cacheKey);
        if (cached) return cached;

        const result = await this.scraper.getLinks(animeSession, epSession);
        if (result.length > 0) this.setCache(cacheKey, result);
        return result;
    }
}

export const scraperService = new ScraperService();
