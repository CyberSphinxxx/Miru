import { Anime } from '../types';

const WATCH_HISTORY_KEY = 'miru_watch_history';
const MAX_HISTORY_ITEMS = 20;

export interface WatchHistoryItem {
    mal_id: number;
    title: string;
    image_url: string;
    type: string;
    episodes: number | null;
    currentEpisode: number;
    progress: number; // 0-100 percentage
    lastWatched: string;
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
    const filtered = history.filter(item => item.mal_id !== anime.mal_id);

    const newItem: WatchHistoryItem = {
        mal_id: anime.mal_id,
        title: anime.title,
        image_url: anime.images.jpg.large_image_url,
        type: anime.type,
        episodes: anime.episodes,
        currentEpisode: episodeNumber,
        progress: Math.min(100, Math.max(0, progress)),
        lastWatched: new Date().toISOString(),
    };

    // Add to front of list
    filtered.unshift(newItem);

    // Keep only max items
    const trimmed = filtered.slice(0, MAX_HISTORY_ITEMS);

    localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(trimmed));
};

export const removeFromHistory = (mal_id: number): void => {
    const history = getWatchHistory();
    const filtered = history.filter(item => item.mal_id !== mal_id);
    localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(filtered));
};

export const clearWatchHistory = (): void => {
    localStorage.removeItem(WATCH_HISTORY_KEY);
};

export const getLastWatchedEpisode = (mal_id: number): number | null => {
    const history = getWatchHistory();
    const item = history.find(h => h.mal_id === mal_id);
    return item ? item.currentEpisode : null;
};
