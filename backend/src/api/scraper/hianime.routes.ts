import express, { Request, Response } from 'express';
import { HiAnimeScraper } from './hianime.service.js';

const router = (express as any).Router();
const scraper = new HiAnimeScraper();

router.get('/spotlight', async (req: Request, res: Response) => {
    try {
        const titles = await scraper.getSpotlightTitles();
        res.json({ titles });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch spotlight titles' });
    }
});

export default router;
