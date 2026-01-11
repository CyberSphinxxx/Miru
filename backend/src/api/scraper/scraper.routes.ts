import { Router, Request, Response } from 'express';
import { scraperService } from './scraper.service';

const router = Router();

router.get('/search', async (req: Request, res: Response): Promise<void> => {
    try {
        const query = req.query.q as string;
        if (!query) {
            res.status(400).json({ error: 'Query parameter q is required' });
            return;
        }
        const result = await scraperService.search(query);
        res.json(result);
    } catch (error: unknown) {
        console.error('Scraper search error:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
});

router.get('/episodes', async (req: Request, res: Response): Promise<void> => {
    try {
        const session = req.query.session as string;
        const page = req.query.page ? parseInt(req.query.page as string) : 1;

        if (!session) {
            res.status(400).json({ error: 'Query parameter session is required' });
            return;
        }
        const result = await scraperService.getEpisodes(session, page);
        res.json(result);
    } catch (error: unknown) {
        console.error('Scraper episodes error:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
});

router.get('/streams', async (req: Request, res: Response): Promise<void> => {
    try {
        const animeSession = req.query.anime_session as string;
        const epSession = req.query.ep_session as string;

        if (!epSession || !animeSession) {
            res.status(400).json({ error: 'anime_session and ep_session are required' });
            return;
        }
        const result = await scraperService.getStreams(animeSession, epSession);
        res.json(result);
    } catch (error: unknown) {
        console.error('Scraper streams error:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
});

export default router;
