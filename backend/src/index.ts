import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import scraperRoutes from './api/scraper/scraper.routes.js';
import anilistRoutes from './api/anilist/anilist.routes.js';
import hianimeRoutes from './api/scraper/hianime.routes.js';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/anilist', anilistRoutes);
app.use('/api/scraper', scraperRoutes);
app.use('/api/hianime', hianimeRoutes);

app.get('/', (req, res) => {
    res.send('Miru Backend is running');
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
}

export default app;
