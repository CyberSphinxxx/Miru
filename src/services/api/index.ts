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
    getTrendingAnime,
    getPopularAnime,
    getAnimeByGenre,
    getAnimeInfo,
    getEpisodeStreams,
    getAnimeExtraDetails,
    getSimilarAnime,
    prefetchEpisodes,
    clearSearchCache,
} from './anime.api';

export type { AnimeInfoResponse } from './anime.api';

// Genre functions
export { getGenres, getGenreById, getGenreByName } from './genres';
