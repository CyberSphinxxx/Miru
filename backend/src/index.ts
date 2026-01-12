import express from 'express';
import cors from 'cors';
import jikanRoutes from './api/jikan/jikan.routes';
import scraperRoutes from './api/scraper/scraper.routes';
import { preWarmCache } from './api/jikan/jikan.service';
import http from 'http';

const app = express();

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

/**
 * Creates and starts the server on the specified port.
 * Used for embedding in Electron.
 */
export function createServer(port: number): http.Server {
    const server = app.listen(port, () => {
        console.log(`🎬 Miru Backend running on http://localhost:${port}`);

        // Pre-warm cache after a short delay
        setTimeout(() => {
            preWarmCache();
        }, 2000);
    });

    return server;
}

// Standalone mode: run directly with node/ts-node
const isMainModule = require.main === module;
if (isMainModule) {
    const PORT = process.env.PORT || 3001;
    createServer(Number(PORT));
}

export default app;

