import express from 'express';
import cors from 'cors';
import jikanRoutes from './api/jikan/jikan.routes';
import scraperRoutes from './api/scraper/scraper.routes';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/jikan', jikanRoutes);
app.use('/api/scraper', scraperRoutes);

app.get('/', (_req, res) => {
    res.json({
        message: 'Miru Backend API',
        version: '1.0.0',
        endpoints: {
            jikan: '/api/jikan',
            scraper: '/api/scraper'
        }
    });
});

app.listen(PORT, () => {
    console.log(`🎬 Miru Backend running on http://localhost:${PORT}`);
});
