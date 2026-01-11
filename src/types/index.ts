export interface Anime {
    mal_id: number;
    title: string;
    images: {
        jpg: {
            image_url: string;
            large_image_url: string;
        };
    };
    score: number;
    rank?: number;
    status: string;
    type: string;
    episodes: number | null;
    year?: number;
    season?: string;
    synopsis?: string;
    title_japanese?: string;
    duration?: string;
    rating?: string;
    scored_by?: number;
    genres?: { mal_id: number; name: string }[];
    studios?: { mal_id: number; name: string }[];
}

export interface Episode {
    id: string;
    session: string;
    episodeNumber: string | number;
    duration?: string;
    title?: string;
    snapshot?: string;
}

export interface StreamLink {
    quality: string;
    audio: string;
    url: string;
    directUrl?: string;
    isHls: boolean;
}

export interface AnimeSearchResult {
    id: string;
    title: string;
    url: string;
    poster?: string;
    status?: string;
    type?: string;
    episodes?: number;
    year?: string;
    score?: string;
    session: string;
}
