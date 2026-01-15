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
} from './anime.api';

export { default } from './anime.api';

// Genre functions
export { getGenres, getGenreById, getGenreByName } from './genres';
