import { AnimePaheScraper } from '../../scraper/animepahe';

class ScraperService {
    private scraper: AnimePaheScraper;

    constructor() {
        this.scraper = new AnimePaheScraper();
    }

    async search(query: string) {
        return this.scraper.search(query);
    }

    async getEpisodes(session: string) {
        return this.scraper.getEpisodes(session, 1);
    }

    async getStreams(animeSession: string, epSession: string) {
        return this.scraper.getLinks(animeSession, epSession);
    }
}

export const scraperService = new ScraperService();
