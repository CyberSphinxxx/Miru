import { Manga } from '../types/manga';

const READ_HISTORY_KEY = 'miru_read_history';
const MAX_HISTORY_ITEMS = 20;

export interface ReadHistoryItem {
    id: number; // AniList ID for navigation
    mal_id: number;
    title: string;
    image_url: string;
    type: string;
    chapters: number | null;
    volumes: number | null;
    currentChapter: number;
    currentChapterTitle?: string;
    progress: number; // 0-100 percentage
    lastRead: string;
    // Extra details for card display
    synopsis?: string;
    genres?: { mal_id: number; name: string }[];
    score?: number;
    status?: string;
    rank?: number;
    title_japanese?: string;
}

export const getReadHistory = (): ReadHistoryItem[] => {
    try {
        const data = localStorage.getItem(READ_HISTORY_KEY);
        const items: ReadHistoryItem[] = data ? JSON.parse(data) : [];
        // Sort by most recently read
        return items.sort((a, b) =>
            new Date(b.lastRead).getTime() - new Date(a.lastRead).getTime()
        );
    } catch {
        return [];
    }
};

export const saveReadProgress = (
    manga: Manga,
    chapterNumber: number,
    chapterTitle?: string,
    progress: number = 0
): void => {
    const history = getReadHistory();

    // Remove existing entry for this manga if present
    const filtered = history.filter(item => item.mal_id !== manga.mal_id);

    const newItem: ReadHistoryItem = {
        id: manga.id || manga.mal_id, // AniList ID for navigation, fallback to mal_id
        mal_id: manga.mal_id,
        title: manga.title,
        image_url: manga.images.jpg.large_image_url || manga.images.jpg.image_url,
        type: manga.type || 'Manga',
        chapters: manga.chapters,
        volumes: manga.volumes,
        currentChapter: chapterNumber,
        currentChapterTitle: chapterTitle,
        progress: Math.min(100, Math.max(0, progress)),
        lastRead: new Date().toISOString(),
        // Store extra details
        synopsis: manga.synopsis,
        genres: manga.genres,
        score: manga.score,
        status: manga.status,
        rank: manga.rank,
        title_japanese: manga.title_japanese
    };

    // Add to front of list
    filtered.unshift(newItem);

    // Keep only max items
    const trimmed = filtered.slice(0, MAX_HISTORY_ITEMS);

    localStorage.setItem(READ_HISTORY_KEY, JSON.stringify(trimmed));
};

export const removeFromReadHistory = (mal_id: number): void => {
    const history = getReadHistory();
    const filtered = history.filter(item => item.mal_id !== mal_id);
    localStorage.setItem(READ_HISTORY_KEY, JSON.stringify(filtered));
};

export const clearReadHistory = (): void => {
    localStorage.removeItem(READ_HISTORY_KEY);
};

export const getLastReadChapter = (mal_id: number): number | null => {
    const history = getReadHistory();
    const item = history.find(h => h.mal_id === mal_id);
    return item ? item.currentChapter : null;
};

export const getReadHistoryItem = (mal_id: number): ReadHistoryItem | null => {
    const history = getReadHistory();
    return history.find(h => h.mal_id === mal_id) || null;
};
