export interface Movie {
    id: number;
    title: string;
    original_title: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: string;
    vote_average: number;
    vote_count: number;
    popularity: number;
    adult: boolean;
    genre_ids: number[];
}

export interface MovieDetail extends Movie {
    genres: { id: number; name: string }[];
    runtime: number | null;
    status: string;
    tagline: string | null;
    budget: number;
    revenue: number;
    homepage: string | null;
    imdb_id: string | null;
    credits: {
        cast: Cast[];
        crew: Crew[];
    };
    recommendations?: {
        results: Movie[];
    };
    videos?: {
        results: Video[];
    };
}

export interface Cast {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
    order: number;
}

export interface Crew {
    id: number;
    name: string;
    job: string;
    department: string;
    profile_path: string | null;
}

export interface Video {
    id: string;
    key: string;
    name: string;
    site: string;
    type: string;
    official: boolean;
}

export interface MovieResponse {
    page: number;
    results: Movie[];
    total_pages: number;
    total_results: number;
}
