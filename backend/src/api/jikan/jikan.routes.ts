import { Router, Request, Response } from 'express';
import * as jikanService from './jikan.service';

const router = Router();

router.get('/search', async (req: Request, res: Response): Promise<void> => {
    try {
        const query = req.query.q as string;
        const page = req.query.page ? parseInt(req.query.page as string) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 24;

        if (!query) {
            res.status(400).json({ error: 'Query parameter "q" is required' });
            return;
        }

        const data = await jikanService.searchAnime(query, page, limit);
        res.json(data);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/anime/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ error: 'Invalid ID' });
            return;
        }

        const data = await jikanService.getAnimeById(id);
        res.json(data);
    } catch (error) {
        console.error('Get anime error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/top', async (req: Request, res: Response): Promise<void> => {
    try {
        const page = req.query.page ? parseInt(req.query.page as string) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 24;
        const data = await jikanService.getTopAnime(page, limit);
        res.json(data);
    } catch (error) {
        console.error('Top anime error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/trending', async (req: Request, res: Response): Promise<void> => {
    try {
        const page = req.query.page ? parseInt(req.query.page as string) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 24;
        const data = await jikanService.getTrendingAnime(page, limit);
        res.json(data);
    } catch (error) {
        console.error('Trending anime error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/genres', async (_req: Request, res: Response): Promise<void> => {
    try {
        const data = await jikanService.getGenres();
        res.json(data);
    } catch (error) {
        console.error('Genres error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/genres/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const genreId = parseInt(req.params.id);
        const page = req.query.page ? parseInt(req.query.page as string) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 24;

        if (isNaN(genreId)) {
            res.status(400).json({ error: 'Invalid genre ID' });
            return;
        }

        const data = await jikanService.getAnimeByGenre(genreId, page, limit);
        res.json(data);
    } catch (error) {
        console.error('Genre anime error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
