import { Anime, WatchlistItem } from '../types';

const WATCHLIST_KEY = 'miru_watchlist';

export const getWatchlist = (): WatchlistItem[] => {
    try {
        const data = localStorage.getItem(WATCHLIST_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

export const addToWatchlist = (anime: Anime): void => {
    const watchlist = getWatchlist();

    // Check if already exists
    if (watchlist.some(item => item.id === anime.id)) {
        return;
    }

    const newItem: WatchlistItem = {
        id: anime.id,
        title: anime.title,
        image_url: anime.images.jpg.large_image_url,
        type: anime.type || 'TV',
        episodes: anime.episodes,
        score: anime.score,
        addedAt: new Date().toISOString(),
    };

    watchlist.unshift(newItem);
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
};

export const removeFromWatchlist = (id: number): void => {
    const watchlist = getWatchlist();
    const filtered = watchlist.filter(item => item.id !== id);
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(filtered));
};

export const isInWatchlist = (id: number): boolean => {
    const watchlist = getWatchlist();
    return watchlist.some(item => item.id === id);
};

export const toggleWatchlist = (anime: Anime): boolean => {
    if (isInWatchlist(anime.id)) {
        removeFromWatchlist(anime.id);
        return false;
    } else {
        addToWatchlist(anime);
        return true;
    }
};
