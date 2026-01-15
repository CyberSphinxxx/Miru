import { Browser, Page } from 'puppeteer-core';
import { getBrowserInstance } from '../utils/browser';

const BASE_URL = 'https://animepahe.si';
const API_URL = 'https://animepahe.si/api';

export interface AnimeSearchResult {
    id: string;
    title: string;
    url: string;
    poster?: string;
    status?: string;
    type?: string;
    episodes?: number;
    year?: string;
    score?: string;
    session: string;
}

export interface Episode {
    id: string;
    episodeNumber: number;
    url: string;
    title?: string;
    duration?: string;
    date?: string;
    snapshot?: string;
    session: string;
}

export interface StreamLink {
    quality: string;
    audio: string;
    url: string;
    directUrl?: string;
    isHls: boolean;
}

export class AnimePaheScraper {
    private browser: Browser | null = null;

    private async getBrowser(): Promise<Browser> {
        if (!this.browser) {
            this.browser = await getBrowserInstance();
        }
        return this.browser;
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    async search(query: string): Promise<AnimeSearchResult[]> {
        const browser = await this.getBrowser();
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        try {
            const searchUrl = `${API_URL}?m=search&q=${encodeURIComponent(query)}`;
            console.log(`Searching: ${searchUrl}`);

            await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

            try {
                await page.waitForFunction(
                    () => document.body.innerText.trim().startsWith('{'),
                    { timeout: 8000 }
                );
            } catch (e) {
                console.log('Timeout waiting for JSON expectation, trying to parse anyway...');
            }

            const responseText = await page.evaluate(() => document.body.innerText);

            let response: any;
            try {
                response = JSON.parse(responseText);
            } catch (e) {
                console.error("Failed to parse search JSON:", responseText);
                return [];
            }

            console.log("Search Response:", JSON.stringify(response));

            if (response && response.data) {
                return response.data.map((item: any) => ({
                    id: item.id,
                    session: item.session,
                    title: item.title,
                    url: `/anime/${item.session}`,
                    poster: item.poster,
                    status: item.status,
                    type: item.type,
                    episodes: item.episodes,
                    year: item.year,
                    score: item.score
                }));
            }
            return [];
        } catch (error) {
            console.error('Error during search:', error);
            return [];
        } finally {
            await page.close();
        }
    }

    async getEpisodes(animeSessionId: string, pageNum: number = 1): Promise<{ episodes: Episode[], lastPage: number }> {
        const browser = await this.getBrowser();
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        try {
            const apiUrl = `${API_URL}?m=release&id=${animeSessionId}&sort=episode_asc&page=${pageNum}`;
            console.log(`Fetching episodes: ${apiUrl}`);

            await page.goto(apiUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

            try {
                await page.waitForFunction(
                    () => document.body.innerText.trim().startsWith('{'),
                    { timeout: 8000 }
                );
            } catch (e) {
                console.log('Timeout waiting for JSON in getEpisodes, parsing anyway...');
            }

            const responseText = await page.evaluate(() => document.body.innerText);

            let response: any;
            try {
                response = JSON.parse(responseText);
            } catch (e) {
                console.error("Failed to parse episodes JSON:", responseText);
                return { episodes: [], lastPage: 1 };
            }

            if (response && response.data) {
                const episodes: Episode[] = response.data.map((item: any) => ({
                    id: item.id.toString(),
                    session: item.session,
                    episodeNumber: item.episode,
                    url: `/play/${animeSessionId}/${item.session}`,
                    title: item.title,
                    duration: item.duration,
                    snapshot: item.snapshot
                }));

                return {
                    episodes,
                    lastPage: response.last_page
                };
            }

            return { episodes: [], lastPage: 1 };
        } catch (error) {
            console.error('Error getting episodes:', error);
            return { episodes: [], lastPage: 1 };
        } finally {
            await page.close();
        }
    }

    async getLinks(animeSession: string, episodeSession: string): Promise<StreamLink[]> {
        const browser = await this.getBrowser();
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        const fullUrl = `${BASE_URL}/play/${animeSession}/${episodeSession}`;

        try {
            await page.goto(fullUrl, { waitUntil: 'domcontentloaded' });

            // Wait for buttons to load
            await page.waitForSelector('#resolutionMenu button', { timeout: 10000 });

            // Extract Kwik links
            const buttons = await page.$$('#resolutionMenu button');
            const links: { kwik: string, quality: string, audio: string }[] = [];

            for (const btn of buttons) {
                const kwik = await btn.evaluate(el => el.getAttribute('data-src'));
                const quality = await btn.evaluate(el => el.getAttribute('data-resolution'));
                const audio = await btn.evaluate(el => el.getAttribute('data-audio'));
                if (kwik) links.push({ kwik, quality: quality || '', audio: audio || '' });
            }

            const streamLinks: StreamLink[] = [];

            for (const link of links) {
                try {
                    const directUrl = await this.resolveKwik(link.kwik);
                    streamLinks.push({
                        quality: link.quality,
                        audio: link.audio,
                        url: link.kwik,
                        directUrl: directUrl || undefined,
                        isHls: false
                    });
                } catch (e) {
                    console.error(`Failed to resolve kwik link ${link.kwik}:`, e);
                }
            }

            return streamLinks;

        } catch (error) {
            console.error('Error getting links:', error);
            return [];
        } finally {
            await page.close();
        }
    }

    private async resolveKwik(url: string): Promise<string | null> {
        const browser = await this.getBrowser();
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setExtraHTTPHeaders({
            'referer': 'https://kwik.cx/',
            'origin': 'https://kwik.cx'
        });

        try {
            await page.goto(url, { waitUntil: 'domcontentloaded' });

            const content = await page.content();

            const directUrl = await page.evaluate(() => {
                const scripts = Array.from(document.querySelectorAll('script'));
                for (const script of scripts) {
                    const text = script.textContent || '';
                    if (text.includes('eval(function(p,a,c,k,e,d)')) {
                        // This is the packed script
                    }
                }
                return (window as any).source || (document.querySelector('source') as any)?.src || null;
            });

            if (directUrl) return directUrl;

            const packedMatch = content.match(/eval\(function\(p,a,c,k,e,d\)\{.*\}\(.*\)\)/);
            if (packedMatch) {
                const solved = await page.evaluate((packed) => {
                    try {
                        let result = '';
                        const originalEval = window.eval;
                        (window as any).eval = (s: string) => { result = s; return originalEval(s); };
                        originalEval(packed);
                        (window as any).eval = originalEval;
                        return result;
                    } catch (e) {
                        return null;
                    }
                }, packedMatch[0]);

                if (solved) {
                    const urlMatch = solved.match(/source=['"](.*?)['"]/);
                    if (urlMatch) return urlMatch[1];
                }
            }

            return null;
        } catch (e) {
            return null;
        } finally {
            await page.close();
        }
    }
}
