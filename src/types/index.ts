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
    producers?: { mal_id: number; name: string }[];
    aired?: {
        from: string;
        to: string | null;
        string: string;
    };
    trailer?: {
        youtube_id: string;
        url: string;
        embed_url: string;
    };
    source?: string;
}

export interface WatchlistItem {
    mal_id: number;
    title: string;
    image_url: string;
    type: string;
    episodes: number | null;
    score: number;
    addedAt: string;
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

export interface Character {
    character: {
        mal_id: number;
        url: string;
        images: {
            jpg: {
                image_url: string;
            };
        };
        name: string;
    };
    role: string;
    voice_actors: {
        person: {
            mal_id: number;
            url: string;
            images: {
                jpg: {
                    image_url: string;
                };
            };
            name: string;
        };
        language: string;
    }[];
}

export interface RelatedAnime {
    relation: string;
    entry: {
        mal_id: number;
        type: string;
        name: string;
        url: string;
    }[];
}

export interface PromoVideo {
    title: string;
    trailer: {
        youtube_id: string;
        url: string;
        embed_url: string;
        images: {
            image_url: string;
            small_image_url: string;
            medium_image_url: string;
            large_image_url: string;
            maximum_image_url: string;
        };
    };
}

export interface Recommendation {
    entry: {
        mal_id: number;
        url: string;
        images: {
            jpg: {
                image_url: string;
                large_image_url: string;
                small_image_url: string;
            };
        };
        title: string;
    };
    url: string;
    votes: number;
}

export interface Genre {
    mal_id: number;
    name: string;
    count: number;
}
