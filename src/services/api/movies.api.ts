import { Movie, MovieDetail, MovieResponse, CollectionDetail } from '../../types/tmdb';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const API_TOKEN = import.meta.env.VITE_TMDB_ACCESS_TOKEN;

const headers = {
    accept: 'application/json',
    Authorization: `Bearer ${API_TOKEN}`
};

async function fetchTMDB<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
        throw new Error(`TMDB API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

export const movieService = {
    getTrending: async (timeWindow: 'day' | 'week' = 'day'): Promise<Movie[]> => {
        const data = await fetchTMDB<MovieResponse>(`/trending/movie/${timeWindow}`);
        return data.results;
    },

    getPopular: async (page = 1): Promise<MovieResponse> => {
        return fetchTMDB<MovieResponse>('/movie/popular', { page: page.toString() });
    },

    getTopRated: async (page = 1): Promise<MovieResponse> => {
        return fetchTMDB<MovieResponse>('/movie/top_rated', { page: page.toString() });
    },

    getNowPlaying: async (page = 1): Promise<MovieResponse> => {
        return fetchTMDB<MovieResponse>('/movie/now_playing', { page: page.toString() });
    },

    search: async (query: string, page = 1): Promise<MovieResponse> => {
        return fetchTMDB<MovieResponse>('/search/movie', { query, page: page.toString() });
    },

    getDetail: async (id: number): Promise<MovieDetail> => {
        return fetchTMDB<MovieDetail>(`/movie/${id}`, {
            append_to_response: 'credits,videos,recommendations,similar'
        });
    },

    getByGenre: async (genreId: number, page = 1): Promise<MovieResponse> => {
        return fetchTMDB<MovieResponse>('/discover/movie', {
            with_genres: genreId.toString(),
            page: page.toString(),
            sort_by: 'popularity.desc'
        });
    },

    getCollection: async (id: number): Promise<CollectionDetail> => {
        return fetchTMDB<CollectionDetail>(`/collection/${id}`);
    }
};
