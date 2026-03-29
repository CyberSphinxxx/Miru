import express, { Request, Response } from 'express';
import { scraperService } from './scraper.service.js';

const router = (express as any).Router();

router.get('/search', async (req: Request, res: Response) => {
    try {
        const query = req.query.q as string;
        if (!query) {
            return res.status(400).json({ error: 'Query parameter q is required' });
        }
        const result = await scraperService.search(query);
        return res.json(result);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
});

router.get('/episodes', async (req: Request, res: Response) => {
    try {
        const session = req.query.session as string;
        if (!session) {
            return res.status(400).json({ error: 'Query parameter session is required' });
        }
        const result = await scraperService.getEpisodes(session);
        return res.json(result);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
});

router.get('/streams', async (req: Request, res: Response) => {
    try {
        const animeSession = req.query.anime_session as string;
        const epSession = req.query.ep_session as string;

        if (!epSession || !animeSession) {
            return res.status(400).json({ error: 'anime_session and ep_session are required' });
        }
        const result = await scraperService.getStreams(animeSession, epSession);
        return res.json(result);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
});

export default router;
