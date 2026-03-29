import express, { Request, Response } from 'express';
// @ts-ignore
import fetch from 'node-fetch';

const router = (express as any).Router();
const BASE_URL = 'http://webservice.fanart.tv/v3';
const API_KEY = process.env.FANART_API_KEY;

router.get('/movies/:tmdbId', async (req: Request, res: Response) => {
    try {
        const { tmdbId } = req.params;

        if (!API_KEY) {
            console.error('FANART_API_KEY is missing in backend .env');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        const response = await fetch(`${BASE_URL}/movies/${tmdbId}?api_key=${API_KEY}`);

        if (!response.ok) {
            if (response.status === 404) {
                return res.status(404).json({ error: 'Images not found' });
            }
            throw new Error(`Fanart API Error: ${response.statusText}`);
        }

        const data = await response.json();
        return res.json(data);
    } catch (error: any) {
        console.error('Error fetching Fanart images:', error.message);
        return res.status(500).json({ error: 'Failed to fetch images' });
    }
});

export default router;
