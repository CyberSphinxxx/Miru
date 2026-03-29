/**
 * API Module - Barrel Export
 * 
 * Re-exports all API functions for convenient imports.
 * Using Yorumi AniList + AnimePahe architecture.
 */

// Core API functions
export {
    animeService,
    searchAnime,
    getPopularAnime,
    getAnimeInfo,
    getEpisodeStreams,
    getCached,
    findBestScraperMatch,
    groupRelations,
} from './anime.api';

export { default } from './anime.api';

// Manga API functions
export { mangaService } from './manga.api';

// Genre functions
export { getGenres, getGenreById, getGenreByName } from './genres';

// Movie API functions
export { movieService } from './movies.api';

