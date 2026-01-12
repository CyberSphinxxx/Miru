/**
 * Anime API Functions
 * 
 * Core API functions for fetching anime data from the Consumet API.
 * Uses failover for reliability and adapters for type transformation.
 */

import { Anime, Episode, StreamLink, Character, Recommendation } from '../../types';
import { fetchWithRetry } from './failover';
import {
    adaptConsumetToAnime,
    adaptConsumetEpisode,
    adaptConsumetStream,
    adaptConsumetCharacter,
    adaptConsumetRecommendation,
} from './consumet.adapter';
import {
    ConsumetSearchResponse,
    ConsumetAnimeResult,
    ConsumetStreamResponse,
    PaginatedResponse,
} from './consumet.types';

// ============================================================================
// Search & Browse Functions
// ============================================================================

/**
 * Search for anime by query
 */
export async function searchAnime(
    query: string,
    page = 1,
    perPage = 24
): Promise<PaginatedResponse<Anime>> {
    const endpoint = `meta/anilist/${encodeURIComponent(query)}?page=${page}&perPage=${perPage}`;
    const res = await fetchWithRetry(endpoint);

    if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
    }

    const data: ConsumetSearchResponse = await res.json();

    if (!data.results) {
        return { data: [], pagination: { last_visible_page: 1 } };
    }

    return {
        data: data.results.map(adaptConsumetToAnime),
        pagination: {
            last_visible_page: data.totalPages || (data.hasNextPage ? page + 1 : page),
        },
    };
}

/**
 * Get trending anime
 */
export async function getTrendingAnime(
    page = 1,
    perPage = 24
): Promise<PaginatedResponse<Anime>> {
    const endpoint = `meta/anilist/trending?page=${page}&perPage=${perPage}`;
    const res = await fetchWithRetry(endpoint);

    if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
    }

    const data: ConsumetSearchResponse = await res.json();

    if (!data.results) {
        return { data: [], pagination: { last_visible_page: 1 } };
    }

    return {
        data: data.results.map(adaptConsumetToAnime),
        pagination: {
            last_visible_page: data.totalPages || (data.hasNextPage ? page + 1 : page),
        },
    };
}

/**
 * Get popular anime (Top Rated - sorted by score descending)
 */
export async function getPopularAnime(
    page = 1,
    perPage = 24
): Promise<PaginatedResponse<Anime>> {
    const endpoint = `meta/anilist/advanced-search?sort=["SCORE_DESC"]&page=${page}&perPage=${perPage}`;
    const res = await fetchWithRetry(endpoint);

    if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
    }

    const data: ConsumetSearchResponse = await res.json();

    if (!data.results) {
        return { data: [], pagination: { last_visible_page: 1 } };
    }

    return {
        data: data.results.map(adaptConsumetToAnime),
        pagination: {
            last_visible_page: data.totalPages || (data.hasNextPage ? page + 1 : page),
        },
    };
}

/**
 * Get anime by genre using advanced search
 */

import { GENRE_ID_MAP } from './genreIds';
import { adaptJikanToAnime } from './jikan.adapter';

/**
 * Get anime by genre using strict ID filtering (Jikan)
 * Falls back to fuzzy search (Consumet) if genre not in map
 */
export async function getAnimeByGenre(
    genreName: string,
    page = 1,
    perPage = 24
): Promise<PaginatedResponse<Anime>> {
    try {
        const normalizedGenre = genreName.toLowerCase().trim();
        const genreId = GENRE_ID_MAP[normalizedGenre];

        // 1. Strict ID Filtering (if known genre)
        if (genreId) {
            console.log(`[API] Fetching genre "${genreName}" (ID: ${genreId}) from Jikan`);
            // Jikan API: https://api.jikan.moe/v4/anime?genres=1&order_by=score&sort=desc
            const endpoint = `https://api.jikan.moe/v4/anime?genres=${genreId}&order_by=score&sort=desc&page=${page}&limit=${perPage}&sfw=true`;

            const res = await fetch(endpoint);

            if (!res.ok) {
                if (res.status === 429) {
                    // Rate limited - Fallback or wait? Jikan rate limits are tight.
                    // For now, let's treat it as an error and fall back?
                    // Or better, just throw and let error handler try something else?
                    // Let's warn and fall through to old method if Jikan fails.
                    console.warn('[API] Jikan rate limited. Falling back to fuzzy search.');
                } else {
                    throw new Error(`Jikan API Error: ${res.status}`);
                }
            } else {
                const data = await res.json();

                return {
                    data: data.data.map(adaptJikanToAnime),
                    pagination: {
                        last_visible_page: data.pagination.last_visible_page,
                    }
                };
            }
        }

        // 2. Fallback: Fuzzy Text Search (Consumet)
        console.log(`[API] Genre "${genreName}" not mapped or Jikan failed. Using fuzzy search.`);
        const endpoint = `meta/anilist/advanced-search?genres=["${encodeURIComponent(genreName)}"]&page=${page}&perPage=${perPage}`;
        const res = await fetchWithRetry(endpoint);
        const data: ConsumetSearchResponse = await res.json();

        return {
            data: data.results.map(adaptConsumetToAnime),
            pagination: {
                last_visible_page: data.totalPages || (data.hasNextPage ? page + 1 : page),
            },
        };
    } catch (error) {
        console.error('[API] Genre search error:', error);
        // Retry with fuzzy search if Jikan failed and we haven't tried it yet
        // Simpler to just return empty or let global error handler catch it.
        // But for robustness, let's try fuzzy search as a last resort in case Jikan is down?
        // Risky if infinite loop. Let's just return empty for now.
        return { data: [], pagination: { last_visible_page: 1 } };
    }
}

// ============================================================================
// Anime Detail Functions
// ============================================================================

/**
 * Anime info response structure
 */
export interface AnimeInfoResponse {
    anime: Anime;
    episodes: Episode[];
    characters: Character[];
    recommendations: Recommendation[];
}

/**
 * Get anime info by Anilist ID
 * Returns anime details along with episodes, characters, recommendations
 */
export async function getAnimeInfo(
    id: string | number
): Promise<AnimeInfoResponse | null> {
    try {
        const endpoint = `meta/anilist/info/${id}?provider=gogoanime`;
        const res = await fetchWithRetry(endpoint);
        const data: ConsumetAnimeResult = await res.json();

        if (!data || !data.id) {
            return null;
        }

        return {
            anime: adaptConsumetToAnime(data),
            episodes: data.episodes?.map(adaptConsumetEpisode) || [],
            characters: data.characters?.map(adaptConsumetCharacter) || [],
            recommendations: data.recommendations?.map(adaptConsumetRecommendation) || [],
        };
    } catch (error) {
        console.error('[API] Get anime info error:', error);
        return null;
    }
}

// ============================================================================
// Streaming Functions
// ============================================================================

/**
 * Quality order for sorting streams (higher is better)
 */
const QUALITY_ORDER: Record<string, number> = {
    '1080p': 4,
    '720p': 3,
    '480p': 2,
    '360p': 1,
    'default': 0,
    'backup': 0,
    'auto': 5,
};

/**
 * Get streaming sources for an episode
 */
// Streaming providers to try in order
const STREAM_PROVIDERS = [
    undefined, // Default (usually GogoAnime)
    'zoro',
    'animepahe',
    'gogoanime', // Explicit retry
    'marin'
];

/**
 * Get streaming sources for an episode
 */
export async function getEpisodeStreams(episodeId: string): Promise<StreamLink[]> {
    // Try each provider in order until one works
    for (const provider of STREAM_PROVIDERS) {
        try {
            // Construct endpoint with provider param if specified
            const endpoint = `meta/anilist/watch/${episodeId}${provider ? `?provider=${provider}` : ''}`;

            console.log(`[API] Fetching streams from provider: ${provider || 'default'}`);
            const res = await fetchWithRetry(endpoint);

            // Check for non-OK response locally before parsing (fetchWithRetry handles domain failover)
            if (!res.ok) {
                throw new Error(`Status ${res.status}`);
            }

            const data: ConsumetStreamResponse = await res.json();

            if (data && data.sources && data.sources.length > 0) {
                console.log(`[API] Successfully loaded streams from: ${provider || 'default'}`);

                // Sort by quality (highest first)
                const sorted = [...data.sources].sort((a, b) => {
                    return (QUALITY_ORDER[b.quality] || 0) - (QUALITY_ORDER[a.quality] || 0);
                });

                return sorted.map(adaptConsumetStream);
            }
        } catch (error) {
            console.warn(`[API] Provider ${provider || 'default'} failed:`, error);
            // Continue to next provider
        }
    }

    console.error('[API] All stream providers failed');
    return [];
}

// ============================================================================
// Legacy/Helper Functions
// ============================================================================

/**
 * Legacy: Get extra details (now handled by getAnimeInfo)
 */
export async function getAnimeExtraDetails(id: number) {
    const result = await getAnimeInfo(id.toString());
    if (!result) {
        return {
            characters: [],
            relations: [],
            videos: [],
            recommendations: [],
            similar: [],
        };
    }
    return {
        characters: result.characters,
        relations: [],
        videos: [],
        recommendations: result.recommendations,
        similar: [],
    };
}

/**
 * Legacy: Get similar anime by genre
 */
export async function getSimilarAnime(
    genres: { mal_id: number; name?: string }[]
): Promise<Anime[]> {
    if (!genres || genres.length === 0) return [];
    try {
        const genreName = genres[0].name || 'Action';
        const result = await getAnimeByGenre(genreName, 1, 12);
        return result.data;
    } catch (error) {
        console.error('[API] Error fetching similar anime:', error);
        return [];
    }
}

/**
 * Legacy: Prefetch episodes (no-op since Consumet bundles episodes with info)
 */
export const prefetchEpisodes = async (_title: string): Promise<void> => {
    // No-op: Consumet API returns episodes with info, no need to prefetch
};

/**
 * Legacy: Clear search cache (no-op)
 */
export const clearSearchCache = (): void => {
    // No-op: Consumet handles caching on the server
};
