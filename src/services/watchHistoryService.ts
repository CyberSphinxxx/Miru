import { Anime } from '../types';

const WATCH_HISTORY_KEY = 'miru_watch_history';
const MAX_HISTORY_ITEMS = 20;

export interface WatchHistoryItem {
    id: number; // AniList ID for navigation
    title: string;
    image_url: string;
    type: string;
    episodes: number | null;
    currentEpisode: number;
    progress: number; // 0-100 percentage
    lastWatched: string;
    // Extra details for card display
    synopsis?: string;
    genres?: { id: number; name: string }[];
    score?: number;
    status?: string;
    rank?: number;
    title_japanese?: string;
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
    const filtered = history.filter(item => item.id !== anime.id);

    const newItem: WatchHistoryItem = {
        id: anime.id,
        title: anime.title,
        image_url: anime.images.jpg.large_image_url || anime.images.jpg.image_url,
        type: anime.type || 'TV',
        episodes: anime.episodes,
        currentEpisode: episodeNumber,
        progress: Math.min(100, Math.max(0, progress)),
        lastWatched: new Date().toISOString(),
        // Store extra details
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
    const item = history.find(h => h.id === id);
    return item ? item.currentEpisode : null;
};

