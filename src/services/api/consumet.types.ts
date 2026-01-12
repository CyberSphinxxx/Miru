/**
 * Consumet API Response Types
 * 
 * Raw types that match the Consumet API responses.
 * These are separate from domain types to allow for API changes
 * without affecting the rest of the application.
 */

// ============================================================================
// Title Types
// ============================================================================

export interface ConsumetTitle {
    romaji?: string;
    english?: string;
    native?: string;
    userPreferred?: string;
}

// ============================================================================
// Character Types
// ============================================================================

export interface ConsumetName {
    first?: string;
    last?: string;
    full?: string;
    native?: string;
    userPreferred?: string;
}

export interface ConsumetVoiceActor {
    id: number;
    name: ConsumetName;
    image: string;
    language?: string;
}

export interface ConsumetCharacter {
    id: number;
    name: ConsumetName;
    image: string;
    role?: string;
    voiceActors?: ConsumetVoiceActor[];
}

// ============================================================================
// Recommendation & Relation Types
// ============================================================================

export interface ConsumetRecommendation {
    id: number;
    malId?: number;
    title: ConsumetTitle;
    image: string;
    cover?: string;
    rating?: number;
    type?: string;
    status?: string;
    episodes?: number;
}

export interface ConsumetRelation {
    id: number;
    malId?: number;
    title: ConsumetTitle;
    image: string;
    type?: string;
    relationType?: string;
    status?: string;
}

// ============================================================================
// Episode Types
// ============================================================================

export interface ConsumetEpisode {
    id: string;
    number: number;
    title?: string;
    description?: string;
    image?: string;
    airDate?: string;
    url?: string;
}

// ============================================================================
// Stream Types
// ============================================================================

export interface ConsumetStreamSource {
    url: string;
    quality: string;
    isM3U8: boolean;
}

export interface ConsumetSubtitle {
    url: string;
    lang: string;
}

export interface ConsumetIntro {
    start: number;
    end: number;
}

export interface ConsumetStreamResponse {
    sources: ConsumetStreamSource[];
    subtitles?: ConsumetSubtitle[];
    intro?: ConsumetIntro;
    headers?: Record<string, string>;
}

// ============================================================================
// Anime Types
// ============================================================================

export interface ConsumetTrailer {
    id?: string;
    site?: string;
    thumbnail?: string;
}

export interface ConsumetAnimeResult {
    id: string;
    malId?: number;
    title: ConsumetTitle;
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
    trailer?: ConsumetTrailer;
    recommendations?: ConsumetRecommendation[];
    characters?: ConsumetCharacter[];
    relations?: ConsumetRelation[];
    episodes?: ConsumetEpisode[];
}

// ============================================================================
// Search Response Types
// ============================================================================

export interface ConsumetSearchResponse {
    currentPage: number;
    hasNextPage: boolean;
    totalPages?: number;
    totalResults?: number;
    results: ConsumetAnimeResult[];
}

// ============================================================================
// Paginated Response Type (used by API functions)
// ============================================================================

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        last_visible_page: number;
    };
}
