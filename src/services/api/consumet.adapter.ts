/**
 * Consumet API Adapter Functions
 * 
 * Transforms Consumet API responses into Miru domain types.
 * This separation allows the API contract to change independently
 * from the application's internal data structures.
 */

import { Anime, Episode, StreamLink, Character, Recommendation } from '../../types';
import {
    ConsumetAnimeResult,
    ConsumetEpisode,
    ConsumetStreamSource,
    ConsumetCharacter,
    ConsumetRecommendation,
    ConsumetTitle,
} from './consumet.types';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the preferred title from Consumet's multi-language title object
 * Priority: English > Romaji > User Preferred > Native > Fallback
 */
export function getPreferredTitle(title: ConsumetTitle): string {
    return (
        title.english ||
        title.romaji ||
        title.userPreferred ||
        title.native ||
        'Unknown'
    );
}

/**
 * Get a full name from Consumet's name parts
 */
function getFullName(name: {
    first?: string;
    last?: string;
    full?: string;
    userPreferred?: string;
}): string {
    if (name.full) return name.full;
    if (name.userPreferred) return name.userPreferred;
    return `${name.first || ''} ${name.last || ''}`.trim() || 'Unknown';
}

// ============================================================================
// Adapter Functions
// ============================================================================

/**
 * Transform Consumet anime result to Miru Anime type
 */
export function adaptConsumetToAnime(item: ConsumetAnimeResult): Anime {
    return {
        // Use Anilist ID (item.id) NOT malId, because Consumet API requires Anilist IDs
        mal_id: parseInt(item.id) || 0,
        title: getPreferredTitle(item.title),
        images: {
            jpg: {
                image_url: item.image || '',
                // Prioritize image (poster) over cover (banner) for vertical cards
                large_image_url: item.image || item.cover || '',
                // Banner/cover image for landscape/hero sections
                banner_image: item.cover || undefined,
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
        trailer: item.trailer?.id
            ? {
                youtube_id: item.trailer.id,
                url: `https://www.youtube.com/watch?v=${item.trailer.id}`,
                embed_url: `https://www.youtube.com/embed/${item.trailer.id}`,
            }
            : undefined,
    };
}

/**
 * Transform Consumet episode to Miru Episode type
 */
export function adaptConsumetEpisode(ep: ConsumetEpisode): Episode {
    return {
        id: ep.id,
        session: ep.id, // Use episode id as session
        episodeNumber: ep.number,
        title: ep.title,
        description: ep.description,
        image: ep.image,
        snapshot: ep.image,
        airDate: ep.airDate,
        url: ep.url,
    };
}

/**
 * Transform Consumet stream source to Miru StreamLink type
 */
export function adaptConsumetStream(source: ConsumetStreamSource): StreamLink {
    return {
        quality: source.quality,
        audio: 'default',
        url: source.url,
        directUrl: source.isM3U8 ? undefined : source.url,
        isHls: source.isM3U8,
    };
}

/**
 * Transform Consumet character to Miru Character type
 */
export function adaptConsumetCharacter(char: ConsumetCharacter): Character {
    return {
        character: {
            mal_id: char.id,
            url: '',
            images: {
                jpg: {
                    image_url: char.image,
                },
            },
            name: getFullName(char.name),
        },
        role: char.role || 'Supporting',
        voice_actors:
            char.voiceActors?.map((va) => ({
                person: {
                    mal_id: va.id,
                    url: '',
                    images: {
                        jpg: {
                            image_url: va.image,
                        },
                    },
                    name: getFullName(va.name),
                },
                language: va.language || 'Japanese',
            })) || [],
    };
}

/**
 * Transform Consumet recommendation to Miru Recommendation type
 */
export function adaptConsumetRecommendation(
    rec: ConsumetRecommendation
): Recommendation {
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
