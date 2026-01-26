import { Anime } from '../types';
import { Movie, MovieDetail } from '../types/tmdb';

const WATCH_HISTORY_KEY = 'miru_watch_history';
const MAX_HISTORY_ITEMS = 20;

export interface WatchHistoryItem {
    id: number; // ID
    title: string;
    image_url: string;
    type: 'anime' | 'movie'; // Distinguish type
    episodes: number | null; // Null for movies
    currentEpisode: number; // 1 for movies
    progress: number; // 0-100 percentage
    lastWatched: string;
    // Extra details for card display
    synopsis?: string;
    genres?: { id: number; name: string }[];
    score?: number;
    status?: string;
    rank?: number;
    title_japanese?: string;
    release_date?: string; // For movies
    runtime?: number; // For movies
}

export const getWatchHistory = (): WatchHistoryItem[] => {
    try {
        const data = localStorage.getItem(WATCH_HISTORY_KEY);
        const items: WatchHistoryItem[] = data ? JSON.parse(data) : [];
        // Sort by most recently watched
        return items.sort((a, b) =>
            new Date(b.lastWatched).getTime() - new Date(a.lastWatched).getTime()
        );
    } catch {
        return [];
    }
};

export const saveWatchProgress = (
    anime: Anime,
    episodeNumber: number,
    progress: number = 0
): void => {
    const history = getWatchHistory();

    // Remove existing entry for this anime if present
    const filtered = history.filter(item => item.id !== anime.id || item.type !== 'anime');

    const newItem: WatchHistoryItem = {
        id: anime.id,
        title: anime.title,
        image_url: anime.images.jpg.large_image_url || anime.images.jpg.image_url,
        type: 'anime',
        episodes: anime.episodes,
        currentEpisode: episodeNumber,
        progress: Math.min(100, Math.max(0, progress)),
        lastWatched: new Date().toISOString(),
        // Extra details
        synopsis: anime.synopsis,
        genres: anime.genres,
        score: anime.score,
        status: anime.status,
        rank: anime.rank,
        title_japanese: anime.title_japanese
    };

    // Add to front of list
    filtered.unshift(newItem);

    // Keep only max items
    const trimmed = filtered.slice(0, MAX_HISTORY_ITEMS);

    localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(trimmed));
};

export const saveMovieProgress = (
    movie: MovieDetail | Movie,
    progress: number = 0,
    duration: number = 0
): void => {
    const history = getWatchHistory();

    // Remove existing entry for this movie if present
    const filtered = history.filter(item => item.id !== movie.id || item.type !== 'movie');

    const posterPath = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : 'https://via.placeholder.com/300x450';

    const newItem: WatchHistoryItem = {
        id: movie.id,
        title: movie.title,
        image_url: posterPath,
        type: 'movie',
        episodes: 1,
        currentEpisode: 1,
        progress: Math.min(100, Math.max(0, progress)),
        lastWatched: new Date().toISOString(),
        // Extra details
        synopsis: movie.overview,
        // Adapt partial fields
        genres: (movie as any).genres || [],
        score: movie.vote_average,
        release_date: movie.release_date,
        // detail has runtime, basic movie might not
        runtime: (movie as any).runtime || duration
    };

    filtered.unshift(newItem);
    const trimmed = filtered.slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(trimmed));
};

export const removeFromHistory = (id: number): void => {
    const history = getWatchHistory();
    const filtered = history.filter(item => item.id !== id);
    localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(filtered));
};

export const clearWatchHistory = (): void => {
    localStorage.removeItem(WATCH_HISTORY_KEY);
};

export const getLastWatchedEpisode = (id: number): number | null => {
    const history = getWatchHistory();
    // Logic might be ambiguous if same ID exists for anime/movie (unlikely given different ID spaces usually)
    // checking type implicitly by how it's used
    const item = history.find(h => h.id === id);
    return item ? item.currentEpisode : null;
};

