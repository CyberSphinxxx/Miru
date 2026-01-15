import express from 'express';
import cors from 'cors';
import anilistRoutes from './api/anilist/anilist.routes';
import scraperRoutes from './api/scraper/scraper.routes';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/anilist', anilistRoutes);
app.use('/api/scraper', scraperRoutes);

app.get('/', (req, res) => {
    res.json({
        message: 'Miru Backend API',
        version: '2.0.0',
        endpoints: {
            anilist: '/api/anilist',
            scraper: '/api/scraper'
        }
    });
});

// Standalone mode
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`🎬 Miru Backend running on http://localhost:${port}`);
    });
}

export default app;
