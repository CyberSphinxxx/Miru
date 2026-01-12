/**
 * Consumet API Service
 * 
 * This module provides functions to interact with the Consumet API
 * and transforms responses to match the existing Miru type definitions.
 */

import { Anime, Episode, StreamLink, Character, Recommendation, Genre } from '../types';

// Base URL for Consumet API (kept for backward compatibility if needed externally)
export const CONSUMET_BASE = import.meta.env.VITE_API_URL || 'https://miru-consumet.vercel.app';

// List of API providers to try in order
const API_PROVIDERS = [
    CONSUMET_BASE,                                       // Primary (User's)
    'https://consumet-api.herokuapp.com',                // Fallback 1 (Public)
    'https://api.consumet.org',                          // Fallback 2 (Official)
];

// Keep track of the currently working provider index to avoid retrying dead ones
let currentProviderIndex = 0;

// Retry configuration
const MAX_RETRIES_PER_PROVIDER = 1; // Don't retry too much on a single provider if we have backups
const RETRY_DELAY_MS = 1000;

/**
 * Helper function to fetch with failover capability
 * Tries the current provider first, then falls back to others if needed.
 */
async function fetchWithRetry(endpoint: string): Promise<Response> {
    const totalProviders = API_PROVIDERS.length;
    let lastError: Error | null = null;

    // We try up to totalProviders * (retries + 1) times effectively, 
    // but the logic here is to loop through providers starting from the current one.

    for (let i = 0; i < totalProviders; i++) {
        // Calculate which provider to try (round-robin starting from current)
        const providerIndex = (currentProviderIndex + i) % totalProviders;
        const providerUrl = API_PROVIDERS[providerIndex];

        // Remove leading slash from endpoint if present to avoid double slashes
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
        const url = `${providerUrl}/${cleanEndpoint}`;

        try {
            // Try fetching from this provider
            const res = await fetch(url);

            // If successful or client error (4xx), return immediately
            // We consider 5xx errors as "provider failure"
            if (res.ok || (res.status >= 400 && res.status < 500)) {

                // If we successfully switched to a new provider, update the pointer
                if (providerIndex !== currentProviderIndex) {
                    console.log(`Switched API provider to: ${providerUrl}`);
                    currentProviderIndex = providerIndex;
                }
                return res;
            }

            throw new Error(`Provider ${providerUrl} returned ${res.status}`);

        } catch (error) {
            console.warn(`Provider failed: ${providerUrl}`, error);
            lastError = error instanceof Error ? error : new Error('Network error');

            // If this was the last provider to try, don't wait, just loop and fail
        }
    }

    throw lastError || new Error('All API providers failed');
}

// ============================================================================
// Consumet Response Types (raw API responses)
// ============================================================================

interface ConsumetAnimeResult {
    id: string;
    malId?: number;
    title: {
        romaji?: string;
        english?: string;
        native?: string;
        userPreferred?: string;
    };
    image: string;
    cover?: string;
    rating?: number;
    releaseDate?: string;
    type?: string;
    status?: string;
    totalEpisodes?: number;
    currentEpisode?: number;
    description?: string;
    genres?: string[];
    duration?: number;
    studios?: string[];
    season?: string;
    popularity?: number;
    color?: string;
    trailer?: {
        id?: string;
        site?: string;
        thumbnail?: string;
    };
    recommendations?: ConsumetRecommendation[];
    characters?: ConsumetCharacter[];
    relations?: ConsumetRelation[];
    episodes?: ConsumetEpisode[];
}

interface ConsumetEpisode {
    id: string;
    number: number;
    title?: string;
    description?: string;
    image?: string;
    airDate?: string;
    url?: string;
}

interface ConsumetStreamSource {
    url: string;
    quality: string;
    isM3U8: boolean;
}

interface ConsumetStreamResponse {
    sources: ConsumetStreamSource[];
    subtitles?: { url: string; lang: string }[];
    intro?: { start: number; end: number };
    headers?: Record<string, string>;
}

interface ConsumetCharacter {
    id: number;
    name: {
        first?: string;
        last?: string;
        full?: string;
        native?: string;
        userPreferred?: string;
    };
    image: string;
    role?: string;
    voiceActors?: {
        id: number;
        name: {
            first?: string;
            last?: string;
            full?: string;
            native?: string;
            userPreferred?: string;
        };
        image: string;
        language?: string;
    }[];
}

interface ConsumetRecommendation {
    id: number;
    malId?: number;
    title: {
        romaji?: string;
        english?: string;
        native?: string;
        userPreferred?: string;
    };
    image: string;
    cover?: string;
    rating?: number;
    type?: string;
    status?: string;
    episodes?: number;
}

interface ConsumetRelation {
    id: number;
    malId?: number;
    title: {
        romaji?: string;
        english?: string;
        native?: string;
        userPreferred?: string;
    };
    image: string;
    type?: string;
    relationType?: string;
    status?: string;
}

interface ConsumetSearchResponse {
    currentPage: number;
    hasNextPage: boolean;
    totalPages?: number;
    totalResults?: number;
    results: ConsumetAnimeResult[];
}

// ============================================================================
// Adapter Functions (transform Consumet → Miru types)
// ============================================================================

function getPreferredTitle(title: ConsumetAnimeResult['title']): string {
    return title.english || title.romaji || title.userPreferred || title.native || 'Unknown';
}

function adaptConsumetToAnime(item: ConsumetAnimeResult): Anime {
    return {
        // IMPORTANT: Use Anilist ID (item.id) NOT malId, because Consumet API requires Anilist IDs
        mal_id: parseInt(item.id) || 0,
        title: getPreferredTitle(item.title),
        images: {
            jpg: {
                image_url: item.image || '',
                // Prioritize image (poster) over cover (banner) for vertical cards
                large_image_url: item.image || item.cover || '',
            },
        },
        score: item.rating ? item.rating / 10 : 0, // Consumet uses 0-100, Miru uses 0-10
        status: item.status || 'Unknown',
        type: item.type || 'TV',
        episodes: item.totalEpisodes || null,
        year: item.releaseDate ? parseInt(item.releaseDate) : undefined,
        season: item.season,
        synopsis: item.description?.replace(/<[^>]*>/g, ''), // Strip HTML tags
        genres: item.genres?.map((g, i) => ({ mal_id: i, name: g })),
        studios: item.studios?.map((s, i) => ({ mal_id: i, name: s })),
        duration: item.duration ? `${item.duration} min` : undefined,
        trailer: item.trailer?.id ? {
            youtube_id: item.trailer.id,
            url: `https://www.youtube.com/watch?v=${item.trailer.id}`,
            embed_url: `https://www.youtube.com/embed/${item.trailer.id}`,
        } : undefined,
    };
}

function adaptConsumetEpisode(ep: ConsumetEpisode): Episode {
    return {
        id: ep.id,
        session: ep.id, // Use episode id as session
        episodeNumber: ep.number,
        title: ep.title,
        snapshot: ep.image,
        url: ep.url,
    };
}

function adaptConsumetStream(source: ConsumetStreamSource): StreamLink {
    return {
        quality: source.quality,
        audio: 'default',
        url: source.url,
        directUrl: source.isM3U8 ? undefined : source.url,
        isHls: source.isM3U8,
    };
}

function adaptConsumetCharacter(char: ConsumetCharacter): Character {
    return {
        character: {
            mal_id: char.id,
            url: '',
            images: {
                jpg: {
                    image_url: char.image,
                },
            },
            name: char.name.full || char.name.userPreferred || `${char.name.first || ''} ${char.name.last || ''}`.trim(),
        },
        role: char.role || 'Supporting',
        voice_actors: char.voiceActors?.map(va => ({
            person: {
                mal_id: va.id,
                url: '',
                images: {
                    jpg: {
                        image_url: va.image,
                    },
                },
                name: va.name.full || va.name.userPreferred || `${va.name.first || ''} ${va.name.last || ''}`.trim(),
            },
            language: va.language || 'Japanese',
        })) || [],
    };
}

function adaptConsumetRecommendation(rec: ConsumetRecommendation): Recommendation {
    return {
        entry: {
            mal_id: rec.id,
            url: '',
            images: {
                jpg: {
                    image_url: rec.image,
                    large_image_url: rec.cover || rec.image,
                    small_image_url: rec.image,
                },
            },
            title: getPreferredTitle(rec.title),
        },
        url: '',
        votes: 0,
    };
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Search for anime by query
 */
/**
 * Search for anime by query
 */
export async function searchAnime(query: string, page = 1, perPage = 24): Promise<{ data: Anime[]; pagination: { last_visible_page: number } }> {
    // Note: providing endpoint path relative to base
    const res = await fetchWithRetry(`meta/anilist/${encodeURIComponent(query)}?page=${page}&perPage=${perPage}`);

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
export async function getTrendingAnime(page = 1, perPage = 24): Promise<{ data: Anime[]; pagination: { last_visible_page: number } }> {
    const res = await fetchWithRetry(`meta/anilist/trending?page=${page}&perPage=${perPage}`);

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
 * Get popular anime (Restored to "Top Rated" as per user request)
 * Fetches anime sorted by Score Descending
 */
export async function getPopularAnime(page = 1, perPage = 24): Promise<{ data: Anime[]; pagination: { last_visible_page: number } }> {
    // Switch to advanced-search with SCORE_DESC sorting to get "Top Rated"
    // equivalent to "Top Anime" on MAL/Anilist
    const res = await fetchWithRetry(`meta/anilist/advanced-search?sort=["SCORE_DESC"]&page=${page}&perPage=${perPage}`);

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
 * Get anime info by Anilist ID
 * Returns anime details along with episodes, characters, recommendations
 */
export async function getAnimeInfo(id: string | number): Promise<{
    anime: Anime;
    episodes: Episode[];
    characters: Character[];
    recommendations: Recommendation[];
} | null> {
    try {
        const res = await fetchWithRetry(`meta/anilist/info/${id}?provider=gogoanime`);
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
        console.error('Get anime info error:', error);
        return null;
    }
}

/**
 * Get streaming sources for an episode
 */
export async function getEpisodeStreams(episodeId: string): Promise<StreamLink[]> {
    try {
        const res = await fetchWithRetry(`meta/anilist/watch/${encodeURIComponent(episodeId)}`);
        const data: ConsumetStreamResponse = await res.json();

        if (!data || !data.sources) {
            return [];
        }

        // Sort by quality (highest first)
        const sorted = [...data.sources].sort((a, b) => {
            const qualityOrder: Record<string, number> = { '1080p': 4, '720p': 3, '480p': 2, '360p': 1, 'default': 0, 'backup': 0, 'auto': 5 };
            return (qualityOrder[b.quality] || 0) - (qualityOrder[a.quality] || 0);
        });

        return sorted.map(adaptConsumetStream);
    } catch (error) {
        console.error('Get streams error:', error);
        return [];
    }
}

/**
 * Get anime by genre using advanced search
 */
export async function getAnimeByGenre(genreName: string, page = 1, perPage = 24): Promise<{ data: Anime[]; pagination: { last_visible_page: number } }> {
    try {
        const res = await fetchWithRetry(`meta/anilist/advanced-search?genres=["${encodeURIComponent(genreName)}"]&page=${page}&perPage=${perPage}`);
        const data: ConsumetSearchResponse = await res.json();

        return {
            data: data.results.map(adaptConsumetToAnime),
            pagination: {
                last_visible_page: data.totalPages || (data.hasNextPage ? page + 1 : page),
            },
        };
    } catch (error) {
        console.error('Genre search error:', error);
        return { data: [], pagination: { last_visible_page: 1 } };
    }
}

/**
 * Get static genre list (Consumet doesn't have a direct genres endpoint)
 */
export function getGenres(): Genre[] {
    // Hardcoded genre list based on Anilist genres
    return [
        { mal_id: 1, name: 'Action', count: 5000 },
        { mal_id: 2, name: 'Adventure', count: 4000 },
        { mal_id: 3, name: 'Comedy', count: 6000 },
        { mal_id: 4, name: 'Drama', count: 5500 },
        { mal_id: 5, name: 'Ecchi', count: 1500 },
        { mal_id: 6, name: 'Fantasy', count: 4500 },
        { mal_id: 7, name: 'Horror', count: 800 },
        { mal_id: 8, name: 'Mahou Shoujo', count: 600 },
        { mal_id: 9, name: 'Mecha', count: 1200 },
        { mal_id: 10, name: 'Music', count: 700 },
        { mal_id: 11, name: 'Mystery', count: 1800 },
        { mal_id: 12, name: 'Psychological', count: 1400 },
        { mal_id: 13, name: 'Romance', count: 5000 },
        { mal_id: 14, name: 'Sci-Fi', count: 2500 },
        { mal_id: 15, name: 'Slice of Life', count: 3500 },
        { mal_id: 16, name: 'Sports', count: 1000 },
        { mal_id: 17, name: 'Supernatural', count: 2800 },
        { mal_id: 18, name: 'Thriller', count: 900 },
    ];
}

// ============================================================================
// Legacy Exports (for backward compatibility during migration)
// ============================================================================

// Keep old API_BASE export for any remaining usages
export const API_BASE = API_PROVIDERS[0];

// Re-export adapter for use in components if needed
export { adaptConsumetToAnime, adaptConsumetEpisode };

/**
 * Legacy: Prefetch episodes (now a no-op since Consumet bundles episodes with info)
 */
export const prefetchEpisodes = async (_title: string): Promise<void> => {
    // No-op: Consumet API returns episodes with info, no need to prefetch
};

/**
 * Legacy: Get extra details (now handled by getAnimeInfo)
 */
export const getAnimeExtraDetails = async (id: number) => {
    const result = await getAnimeInfo(id.toString());
    if (!result) {
        return {
            characters: [],
            relations: [],
            videos: [],
            recommendations: [],
            similar: []
        };
    }
    return {
        characters: result.characters,
        relations: [],
        videos: [],
        recommendations: result.recommendations,
        similar: []
    };
};

/**
 * Legacy: Get similar anime by genre
 */
export const getSimilarAnime = async (genres: { mal_id: number; name?: string }[]): Promise<Anime[]> => {
    if (!genres || genres.length === 0) return [];
    try {
        const genreName = genres[0].name || 'Action';
        const result = await getAnimeByGenre(genreName, 1, 12);
        return result.data;
    } catch (error) {
        console.error('Error fetching similar anime:', error);
        return [];
    }
};

/**
 * Legacy: Clear search cache (no-op)
 */
export const clearSearchCache = (): void => {
    // No-op: Consumet handles caching on the server
};
