import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import type { Browser, Page } from 'puppeteer';

puppeteer.use(StealthPlugin());

const BASE_URL = 'https://animepahe.si';
const API_URL = 'https://animepahe.si/api';
const DDOS_WAIT = 10000;

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
            this.browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
            }) as unknown as Browser;
        }
        return this.browser;
    }

    async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    async search(query: string): Promise<AnimeSearchResult[]> {
        const browser = await this.getBrowser();
        const page: Page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        try {
            await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await new Promise(r => setTimeout(r, DDOS_WAIT));

            const searchUrl = `${API_URL}?m=search&q=${encodeURIComponent(query)}`;
            console.log(`Searching: ${searchUrl}`);

            await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
            const responseText = await page.evaluate(() => document.body.innerText);

            let response: { data?: Array<Record<string, unknown>> } | null = null;
            try {
                response = JSON.parse(responseText);
            } catch {
                console.error('Failed to parse search JSON');
                return [];
            }

            if (response?.data) {
                return response.data.map((item: Record<string, unknown>) => ({
                    id: String(item.id),
                    session: String(item.session),
                    title: String(item.title),
                    url: `/anime/${item.session}`,
                    poster: item.poster as string | undefined,
                    status: item.status as string | undefined,
                    type: item.type as string | undefined,
                    episodes: item.episodes as number | undefined,
                    year: item.year as string | undefined,
                    score: item.score as string | undefined
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
        const page: Page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        try {
            await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
            await new Promise(r => setTimeout(r, DDOS_WAIT));

            const apiUrl = `${API_URL}?m=release&id=${animeSessionId}&sort=episode_asc&page=${pageNum}`;
            console.log(`Fetching episodes: ${apiUrl}`);

            await page.goto(apiUrl, { waitUntil: 'domcontentloaded' });
            const responseText = await page.evaluate(() => document.body.innerText);

            let response: { data?: Array<Record<string, unknown>>, last_page?: number } | null = null;
            try {
                response = JSON.parse(responseText);
            } catch {
                console.error('Failed to parse episodes JSON');
                return { episodes: [], lastPage: 1 };
            }

            if (response?.data) {
                const episodes: Episode[] = response.data.map((item: Record<string, unknown>) => ({
                    id: String(item.id),
                    session: String(item.session),
                    episodeNumber: Number(item.episode),
                    url: `/play/${animeSessionId}/${item.session}`,
                    title: item.title as string | undefined,
                    duration: item.duration as string | undefined,
                    snapshot: item.snapshot as string | undefined
                }));

                return { episodes, lastPage: response.last_page || 1 };
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
        const page: Page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        const fullUrl = `${BASE_URL}/play/${animeSession}/${episodeSession}`;

        try {
            await page.goto(fullUrl, { waitUntil: 'domcontentloaded' });
            await page.waitForSelector('#resolutionMenu button', { timeout: 10000 });

            const buttons = await page.$$('#resolutionMenu button');
            const links: { kwik: string, quality: string, audio: string }[] = [];

            for (const btn of buttons) {
                const kwik = await btn.evaluate((el: Element) => el.getAttribute('data-src'));
                const quality = await btn.evaluate((el: Element) => el.getAttribute('data-resolution'));
                const audio = await btn.evaluate((el: Element) => el.getAttribute('data-audio'));
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
                    console.error(`Failed to resolve kwik link:`, e);
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
        const page: Page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setExtraHTTPHeaders({
            'referer': 'https://kwik.cx/',
            'origin': 'https://kwik.cx'
        });

        try {
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            const content = await page.content();

            const directUrl = await page.evaluate(() => {
                const win = window as unknown as Record<string, unknown>;
                const sourceEl = document.querySelector('source');
                return (win.source as string) || (sourceEl as HTMLSourceElement | null)?.src || null;
            });

            if (directUrl) return directUrl;

            const packedMatch = content.match(/eval\(function\(p,a,c,k,e,d\)\{.*\}\(.*\)\)/);
            if (packedMatch) {
                const solved = await page.evaluate((packed: string) => {
                    try {
                        let result = '';
                        const originalEval = window.eval;
                        const win = window as unknown as Record<string, unknown>;
                        win.eval = ((s: string) => { result = s; return originalEval(s); }) as typeof eval;
                        originalEval(packed);
                        win.eval = originalEval;
                        return result;
                    } catch {
                        return null;
                    }
                }, packedMatch[0]);

                if (solved) {
                    const urlMatch = solved.match(/source=['"](.*?)['"]/);
                    if (urlMatch) return urlMatch[1];
                }
            }

            return null;
        } catch {
            return null;
        } finally {
            await page.close();
        }
    }
}
