
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Simple in-memory cache to prevent duplicate requests
const cache = new Map<string, any>();

interface FanartImage {
    id: string;
    url: string;
    lang: string;
    likes: string;
}

interface FanartMovieResponse {
    name: string;
    tmdb_id: string;
    imdb_id: string;
    hdmovielogo?: FanartImage[];
    movielogo?: FanartImage[];
    movieart?: FanartImage[];
    hdmovieclearart?: FanartImage[];
    movieclearart?: FanartImage[];
}

export const fanartService = {
    /**
     * Get images for a movie by TMDB ID
     * Fanart.tv requires TMDB ID for movies
     * PROXIED via Backend to avoid CORS
     */
    async getMovieImages(tmdbId: number): Promise<FanartMovieResponse | null> {
        const cacheKey = `movie-${tmdbId}`;
        if (cache.has(cacheKey)) return cache.get(cacheKey);

        try {
            // Call our own backend proxy
            const response = await fetch(`${API_BASE}/fanart/movies/${tmdbId}`);

            if (!response.ok) {
                if (response.status === 404) {
                    cache.set(cacheKey, null);
                    return null;
                }
                throw new Error(`Fanart Service Error: ${response.statusText}`);
            }

            const data = await response.json();

            // Check if backend returned error object
            if (data.error) {
                return null;
            }

            cache.set(cacheKey, data);
            return data;
        } catch (error) {
            console.warn(`Failed to fetch Fanart images for movie ${tmdbId}:`, error);
            return null;
        }
    },

    /**
     * Get best logo URL from response
     * Priority: HD Movie Logo (en) -> Movie Logo (en) -> HD Clearart -> Clearart
     */
    getLogoUrl(data: FanartMovieResponse | null): string | null {
        if (!data) return null;

        // Helper to find english or first available
        const findBest = (images?: FanartImage[]) => {
            if (!images || images.length === 0) return null;
            return images.find(img => img.lang === 'en')?.url || images[0].url;
        };

        return findBest(data.hdmovielogo) ||
            findBest(data.movielogo) ||
            findBest(data.hdmovieclearart) ||
            findBest(data.movieclearart) ||
            null;
    }
};
