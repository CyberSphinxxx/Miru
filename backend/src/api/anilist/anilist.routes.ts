import express, { Request, Response } from 'express';
import axios from 'axios';
import { anilistService } from './anilist.service.js';

const router = (express as any).Router();

// Get top/popular anime
router.get('/top', async (req: Request, res: Response) => {
    try {
        const page = Number(req.query.page) || 1;
        const perPage = Number(req.query.limit) || 24;

        const data = await anilistService.getTopAnime(page, perPage);
        res.json(data);
    } catch (error: any) {
        console.error('Error in top anime route:', error.message);
        if (axios.isAxiosError(error) && error.response) {
            res.status(error.response.status).json({ error: error.response.data });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Get top/popular manga
router.get('/top/manga', async (req: Request, res: Response) => {
    try {
        const page = Number(req.query.page) || 1;
        const perPage = Number(req.query.limit) || 24;

        const data = await anilistService.getTopManga(page, perPage);
        res.json(data);
    } catch (error) {
        console.error('Error in top manga route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get trending anime
router.get('/trending', async (req: Request, res: Response) => {
    try {
        const page = Number(req.query.page) || 1;
        const perPage = Number(req.query.limit) || 50;

        const data = await anilistService.getTrendingAnime(page, perPage);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch trending anime' });
    }
});

// Get airing schedule
router.get('/schedule', async (req: Request, res: Response) => {
    try {
        const now = Math.floor(Date.now() / 1000);
        // Default to current week (7 days from now)
        const startTime = Number(req.query.start) || now;
        const endTime = Number(req.query.end) || now + (7 * 24 * 60 * 60);
        const page = Number(req.query.page) || 1;
        const perPage = Number(req.query.limit) || 50;

        const data = await anilistService.getAiringSchedule(startTime, endTime, page, perPage);
        res.json(data);
    } catch (error) {
        console.error('Error in schedule route:', error);
        res.status(500).json({ error: 'Failed to fetch airing schedule' });
    }
});

// Get popular this season
router.get('/popular-this-season', async (req: Request, res: Response) => {
    try {
        const page = Number(req.query.page) || 1;
        const perPage = Number(req.query.limit) || 50;

        const data = await anilistService.getPopularThisSeason(page, perPage);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch popular this season' });
    }
});

// Search anime
router.get('/search', async (req: Request, res: Response) => {
    try {
        const query = req.query.q as string;
        const page = Number(req.query.page) || 1;
        const perPage = Number(req.query.limit) || 24;

        if (!query) {
            return res.status(400).json({ error: 'Query parameter "q" is required' });
        }

        const data = await anilistService.searchAnime(query, page, perPage);
        return res.json(data);
    } catch (error) {
        console.error('Error in search route:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Search manga
router.get('/search/manga', async (req: Request, res: Response) => {
    try {
        const query = req.query.q as string;
        const page = Number(req.query.page) || 1;
        const perPage = Number(req.query.limit) || 24;

        if (!query) {
            return res.status(400).json({ error: 'Query parameter "q" is required' });
        }

        const data = await anilistService.searchManga(query, page, perPage);
        return res.json(data);
    } catch (error) {
        console.error('Error in search manga route:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Get anime by ID
router.get('/anime/:id', async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ID' });
        }

        const data = await anilistService.getAnimeById(id);
        if (!data) {
            return res.status(404).json({ error: 'Anime not found' });
        }
        return res.json(data);
    } catch (error) {
        console.error('Error in anime by ID route:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Get manga by ID
router.get('/manga/:id', async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ID' });
        }

        const data = await anilistService.getMangaById(id);
        if (!data) {
            return res.status(404).json({ error: 'Manga not found' });
        }
        return res.json(data);
    } catch (error) {
        console.error('Error in manga by ID route:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Get anime by genre
router.get('/genre/:genre', async (req: Request, res: Response) => {
    try {
        const genre = req.params.genre;
        const page = Number(req.query.page) || 1;
        const perPage = Number(req.query.limit) || 24;

        if (!genre) {
            return res.status(400).json({ error: 'Genre is required' });
        }

        const data = await anilistService.getAnimeByGenre(genre, page, perPage);
        return res.json(data);
    } catch (error) {
        console.error('Error in genre route:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Batch covers (keep for compatibility)
router.post('/batch-covers', async (req: Request, res: Response) => {
    try {
        const { malIds } = req.body;

        if (!malIds || !Array.isArray(malIds)) {
            return res.status(400).json({ error: 'Invalid malIds provided' });
        }

        const data = await anilistService.getCoverImages(malIds);
        return res.json(data);
    } catch (error) {
        console.error('Error in batch-covers route:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Legacy POST search (keep for compatibility with spotlight resolution)
router.post('/search', async (req: Request, res: Response) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        const data = await anilistService.searchAnime(query, 1, 5);
        return res.json(data.media || []);
    } catch (error) {
        console.error('Error in search route:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
