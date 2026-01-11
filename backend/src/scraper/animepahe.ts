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
    private page: Page | null = null;
    private isInitialized: boolean = false;

    private async getBrowser(): Promise<Browser> {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
            }) as unknown as Browser;

            // Handle browser disconnect
            this.browser.on('disconnected', () => {
                this.browser = null;
                this.page = null;
                this.isInitialized = false;
            });
        }
        return this.browser;
    }

    private async ensureInitialized(): Promise<Page> {
        const browser = await this.getBrowser();

        if (this.page && this.isInitialized) {
            return this.page;
        }

        if (!this.page) {
            this.page = await browser.newPage();
            await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        }

        if (!this.isInitialized) {
            try {
                console.log('Initializing Access: Bypassing Cloudflare...');
                await this.page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
                // Smart wait: wait for a key element that indicates the site is loaded
                // Fallback to minimal wait if already ready
                await Promise.race([
                    this.page.waitForSelector('.main-content', { timeout: 15000 }),
                    this.page.waitForSelector('.content-wrapper', { timeout: 15000 }),
                    new Promise(r => setTimeout(r, 5000)) // Use a 5s fallback just in case
                ]);
                this.isInitialized = true;
                console.log('Access Initialized.');
            } catch (e) {
                console.error('Initialization warning:', e);
                // Try to continue anyway, maybe we are already through
            }
        }

        return this.page;
    }

    async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
            this.isInitialized = false;
        }
    }

    async search(query: string): Promise<AnimeSearchResult[]> {
        const page = await this.ensureInitialized();

        try {
            const searchUrl = `${API_URL}?m=search&q=${encodeURIComponent(query)}`;
            console.log(`Searching: ${searchUrl}`);

            await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

            // Check if we got JSON text directly
            const responseText = await page.evaluate(() => document.body.innerText);

            let response: { data?: Array<Record<string, unknown>> } | null = null;
            try {
                response = JSON.parse(responseText);
            } catch {
                console.error('Failed to parse search JSON - re-initializing...');
                this.isInitialized = false; // Force re-init next time
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
            this.isInitialized = false;
            return [];
        }
    }

    async getEpisodes(animeSessionId: string, pageNum: number = 1): Promise<{ episodes: Episode[], lastPage: number }> {
        const page = await this.ensureInitialized();

        try {
            const apiUrl = `${API_URL}?m=release&id=${animeSessionId}&sort=episode_asc&page=${pageNum}`;
            console.log(`Fetching episodes: ${apiUrl}`);

            await page.goto(apiUrl, { waitUntil: 'domcontentloaded' });
            const responseText = await page.evaluate(() => document.body.innerText);

            let response: { data?: Array<Record<string, unknown>>, last_page?: number } | null = null;
            try {
                response = JSON.parse(responseText);
            } catch {
                console.error('Failed to parse episodes JSON - re-initializing...');
                this.isInitialized = false;
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
            this.isInitialized = false;
            return { episodes: [], lastPage: 1 };
        }
    }

    async getLinks(animeSession: string, episodeSession: string): Promise<StreamLink[]> {
        // For getting links, we need to visit the actual page page, so we might need a fresh tab
        // effectively reusing the browser context but not necessarily the same page object if we want parallel requests
        // But for simplicity, let's use a new page component within the same authorized browser context

        const browser = await this.getBrowser();
        const page = await browser.newPage(); // New page for playback to avoid interfering with API page
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        const fullUrl = `${BASE_URL}/play/${animeSession}/${episodeSession}`;

        try {
            await page.goto(fullUrl, { waitUntil: 'domcontentloaded' });
            // Only wait if necessary
            try {
                await page.waitForSelector('#resolutionMenu button', { timeout: 8000 });
            } catch (e) {
                console.log('Timeout waiting for buttons, trying to parse anyway');
            }

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
