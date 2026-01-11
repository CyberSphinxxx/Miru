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
    if (watchlist.some(item => item.mal_id === anime.mal_id)) {
        return;
    }

    const newItem: WatchlistItem = {
        mal_id: anime.mal_id,
        title: anime.title,
        image_url: anime.images.jpg.large_image_url,
        type: anime.type,
        episodes: anime.episodes,
        score: anime.score,
        addedAt: new Date().toISOString(),
    };

    watchlist.unshift(newItem);
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
};

export const removeFromWatchlist = (mal_id: number): void => {
    const watchlist = getWatchlist();
    const filtered = watchlist.filter(item => item.mal_id !== mal_id);
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(filtered));
};

export const isInWatchlist = (mal_id: number): boolean => {
    const watchlist = getWatchlist();
    return watchlist.some(item => item.mal_id === mal_id);
};

export const toggleWatchlist = (anime: Anime): boolean => {
    if (isInWatchlist(anime.mal_id)) {
        removeFromWatchlist(anime.mal_id);
        return false;
    } else {
        addToWatchlist(anime);
        return true;
    }
};
