import { Anime } from '../../types';

// Types for Jikan API response (partial)
interface JikanAnime {
    mal_id: number;
    title: string;
    title_english: string;
    title_japanese: string;
    images: {
        jpg: {
            image_url: string;
            large_image_url: string;
            small_image_url: string;
        };
        webp?: {
            image_url: string;
            large_image_url: string;
            small_image_url: string;
        };
    };
    trailer?: {
        youtube_id: string;
        url: string;
        embed_url: string;
    };
    type: string;
    source: string;
    episodes: number;
    status: string;
    duration: string;
    rating: string;
    score: number;
    year: number;
    season: string;
    synopsis: string;
    genres: { mal_id: number; name: string }[];
    studios: { mal_id: number; name: string }[];
}

export function adaptJikanToAnime(item: JikanAnime): Anime {
    return {
        mal_id: item.mal_id,
        title: item.title_english || item.title, // Prefer English
        images: {
            jpg: {
                image_url: item.images.jpg.image_url,
                large_image_url: item.images.jpg.large_image_url || item.images.jpg.image_url,
            },
        },
        score: item.score || 0,
        status: item.status || 'Unknown',
        type: item.type || 'TV',
        episodes: item.episodes || null,
        year: item.year,
        season: item.season,
        synopsis: item.synopsis,
        genres: item.genres,
        studios: item.studios,
        duration: item.duration,
        trailer: item.trailer?.youtube_id
            ? {
                youtube_id: item.trailer.youtube_id,
                url: item.trailer.url,
                embed_url: item.trailer.embed_url,
            }
            : undefined,
    };
}
