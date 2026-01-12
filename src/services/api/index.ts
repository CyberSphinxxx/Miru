/**
 * API Module - Barrel Export
 * 
 * Re-exports all API functions for convenient imports.
 * This maintains backward compatibility with existing import paths.
 */

// Core API functions
export {
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

// Failover utilities
export {
    fetchWithRetry,
    getCurrentProvider,
    getProviders,
    setProviderIndex,
    resetToDefaultProvider,
    CONSUMET_BASE,
    API_BASE,
} from './failover';

// Adapters (for use in components if needed)
export {
    adaptConsumetToAnime,
    adaptConsumetEpisode,
    adaptConsumetStream,
    adaptConsumetCharacter,
    adaptConsumetRecommendation,
    getPreferredTitle,
} from './consumet.adapter';

// Types
export type {
    ConsumetAnimeResult,
    ConsumetEpisode,
    ConsumetStreamSource,
    ConsumetStreamResponse,
    ConsumetSearchResponse,
    ConsumetCharacter,
    ConsumetRecommendation,
    PaginatedResponse,
} from './consumet.types';
