
import axios from 'axios';
import * as cheerio from 'cheerio';
import { AnimeSearchResult, Episode, StreamLink } from './animepahe';

const BASE_URL = 'https://hianime.to';

// Common headers to mimic a browser
const PROXY_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': BASE_URL,
    'Origin': BASE_URL,
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json, text/javascript, */*; q=0.01'
};

export class HiAnimeScraper {

    /**
     * Search for anime on HiAnime
     */
    async search(query: string): Promise<AnimeSearchResult[]> {
        try {
            const searchUrl = `${BASE_URL}/search?keyword=${encodeURIComponent(query)}`;
            const { data } = await axios.get(searchUrl, { headers: PROXY_HEADERS });
            const $ = cheerio.load(data);

            const results: AnimeSearchResult[] = [];

            $('.film_list-wrap .flw-item').each((_, element) => {
                const $el = $(element);
                const $title = $el.find('.film-name a');
                const id = $el.find('.film-poster a').attr('href')?.replace('/', '') || '';
                const title = $title.text();
                const poster = $el.find('.film-poster img').attr('data-src') || $el.find('.film-poster img').attr('src');
                const type = $el.find('.fdi-item').first().text().trim(); // TV, Movie, etc.
                const year = $el.find('.fdi-item').last().text().trim();

                // Extract session/ID from href (e.g., /watch/one-piece-100)
                // HiAnime IDs are usually like 'one-piece-100'
                const session = id;

                if (session && title) {
                    results.push({
                        id: session,
                        session: session,
                        title: title,
                        url: `/anime/${session}`,
                        poster: poster,
                        type: type,
                        status: 'Unknown', // Not easily available on list card
                        year: year
                    });
                }
            });

            return results;

        } catch (error) {
            console.error('HiAnime Search Error:', error);
            return [];
        }
    }

    /**
     * Get episodes for an anime
     * HiAnime uses an AJAX call to get the episode list HTML
     * ID format: anime-name-1234
     */
    async getEpisodes(animeSession: string): Promise<{ episodes: Episode[], lastPage: number }> {
        try {
            // We need the numeric ID for the AJAX call
            // Usually the session has it at the end, but safest is to scrape the anime page to get the data-id
            // However, HiAnime URLs are like /watch/one-piece-100
            // We can try to visit the value and scrape the ID.

            // Step 1: Visit anime page to get the movie/anime ID
            // Actually, for optimization, we can try to guess or use the 'watch' page which loads episodes.
            // But let's assume we visit the page.

            // Clean the session ID if it starts with /
            const cleanSession = animeSession.startsWith('/') ? animeSession.substring(1) : animeSession;
            // Ensure we are hitting the watch page style URL or info page?
            // HiAnime info page: /one-piece-100
            // HiAnime watch page: /watch/one-piece-100

            // Let's try to get the anime page to find the ID.
            const animePageUrl = `${BASE_URL}/${cleanSession}`;
            const { data: pageData } = await axios.get(animePageUrl, { headers: PROXY_HEADERS });
            const $ = cheerio.load(pageData);

            // Extract the numeric ID from the page
            // Usually in <div id="wrapper" data-id="..."> or similar, or in the URL of the "Watch now" button
            const movie_id = $('#wrapper').attr('data-id') ||
                $('.anisc-detail .film-buttons a.btn-play').attr('href')?.split('/').pop();

            if (!movie_id) {
                console.error('Could not find movie ID for HiAnime session:', animeSession);
                return { episodes: [], lastPage: 1 };
            }

            // Step 2: Call AJAX to get episodes
            const ajaxUrl = `${BASE_URL}/ajax/v2/episode/list/${movie_id}`;
            const { data: ajaxData } = await axios.get(ajaxUrl, { headers: PROXY_HEADERS });

            if (!ajaxData.html) return { episodes: [], lastPage: 1 };

            const $ep = cheerio.load(ajaxData.html);
            const episodes: Episode[] = [];

            $ep('.ssl-item.ep-item').each((_, el) => {
                const $el = $ep(el);
                const id = $el.attr('data-id') || '';
                const number = parseFloat($el.attr('data-number') || '0');
                const title = $el.attr('title') || '';
                const url = $el.attr('href') || ''; // /watch/one-piece-100?ep=12345

                if (id) {
                    episodes.push({
                        id: id, // This is the episode ID for fetching servers
                        session: id, // Use same ID for session
                        episodeNumber: number,
                        title: title,
                        url: url,
                        // We don't get snapshot/duration here easily
                    });
                }
            });

            // Sort episodes by number ascending (1 -> N)
            episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);

            return { episodes, lastPage: 1 };

        } catch (error) {
            console.error('HiAnime Episodes Error:', error);
            return { episodes: [], lastPage: 1 };
        }
    }

    /**
     * Get server links for an episode
     * @param episodeId This is the data-id of the episode (e.g. 12345)
     */
    async getLinks(episodeId: string): Promise<StreamLink[]> {
        try {
            // Step 1: Get list of servers
            const serversUrl = `${BASE_URL}/ajax/v2/episode/servers?episodeId=${episodeId}`;
            const { data: serversData } = await axios.get(serversUrl, { headers: PROXY_HEADERS });

            if (!serversData.html) return [];

            const $ = cheerio.load(serversData.html);
            const servers: { id: string, name: string, type: string }[] = [];

            // Parse servers (Sub & Dub)
            $('.server-item').each((_, el) => {
                const $el = $(el);
                const id = $el.attr('data-id');
                const name = $el.text().trim().toUpperCase(); // VIDSTREAMING, MEGACLOUD, STREAMTAPE
                const type = $el.attr('data-type'); // sub, dub

                if (id && name) {
                    servers.push({ id, name, type: type || 'sub' });
                }
            });

            const streamLinks: StreamLink[] = [];

            // Step 2: Resolve sources for each server
            // We use Promise.all to fetch them in parallel
            const serverPromises = servers.map(async (server) => {
                try {
                    const sourcesUrl = `${BASE_URL}/ajax/v2/episode/sources?id=${server.id}`;
                    const { data: sourceData } = await axios.get(sourcesUrl, { headers: PROXY_HEADERS });

                    if (sourceData && sourceData.link) {
                        // The link returned is usually an embed URL (e.g. https://megacloud.tv/embed-2/...)
                        // Or if it's Vidstreaming, it might return a JSON with sources?
                        // HiAnime usually returns a structure like { link: "https://..." }

                        // Check if it's an embed or direct
                        const type = sourceData.type || 'iframe';

                        // Map server names to our UI names
                        let quality = server.name;
                        const lowerName = server.name.toLowerCase();

                        if (lowerName.includes('vidstream') || lowerName === 'hd-1') quality = 'Vidstreaming';
                        else if (lowerName.includes('mega') || lowerName === 'hd-2') quality = 'MegaCloud';
                        else if (lowerName.includes('streamtape') || lowerName === 'hd-3') quality = 'Streamtape';

                        // Check for duplicate names/server types from HiAnime
                        if (server.id === '4') quality = 'Vidstreaming';
                        if (server.id === '1') quality = 'MegaCloud';

                        // Add Dub/Sub indicator
                        const label = `${quality} ${server.type === 'dub' ? '(Dub)' : '(Sub)'}`;

                        streamLinks.push({
                            quality: label, // We use 'quality' field to store the server name for now or we update the type
                            audio: server.type,
                            url: sourceData.link,
                            isHls: type !== 'iframe', // If it's an iframe, it's not direct HLS
                        });
                    }
                } catch (e) {
                    console.error(`Error fetching source for server ${server.name}:`, e);
                }
            });

            await Promise.all(serverPromises);

            return streamLinks;

        } catch (error) {
            console.error('HiAnime Links Error:', error);
            return [];
        }
    }
}
