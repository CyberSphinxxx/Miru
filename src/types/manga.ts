/**
 * Manga Types
 * 
 * Interfaces for manga data from AniList API.
 * Mirrors the structure of Anime types for consistency.
 */

export interface Manga {
    mal_id: number;
    id?: number; // AniList ID
    title: string;
    title_japanese?: string;
    title_english?: string;
    title_romaji?: string;
    images: {
        jpg: {
            image_url: string;
            large_image_url: string;
            banner_image?: string;
        };
    };
    score: number;
    rank?: number;
    status?: string;
    type?: string;
    chapters: number | null;
    volumes: number | null;
    synopsis?: string;
    genres?: { mal_id: number; name: string }[];
    authors?: { mal_id: number; name: string }[];
    published?: {
        from?: string;
        to?: string | null;
        string?: string;
    };
}

export interface MangaChapter {
    id: string;
    title: string;
    url: string;
    chapterNumber: string | number;
    uploadDate?: string;
}

export interface MangaPage {
    pageNumber: number;
    imageUrl: string;
}
