import { Anime } from './index';
import { Manga } from './manga';
import { Movie } from './tmdb';

export interface HistoryItem {
    animeId: number;
    episodeId: string;
    timestamp: number; // in seconds
    lastWatched: string; // ISO date string
}

// Anime Library Types
export type LibraryStatus = 'watching' | 'completed' | 'plan_to_watch' | 'on_hold' | 'dropped';

export interface LibraryEntry {
    anime: Anime;
    addedAt: string;
}

export interface Library {
    watching: LibraryEntry[];
    completed: LibraryEntry[];
    plan_to_watch: LibraryEntry[];
    on_hold: LibraryEntry[];
    dropped: LibraryEntry[];
}

// Manga Library Types
export type MangaLibraryStatus = 'reading' | 'completed' | 'plan_to_read' | 'on_hold' | 'dropped';

export interface MangaLibraryEntry {
    manga: Manga;
    addedAt: string;
}

export interface MangaLibrary {
    reading: MangaLibraryEntry[];
    completed: MangaLibraryEntry[];
    plan_to_read: MangaLibraryEntry[];
    on_hold: MangaLibraryEntry[];
    dropped: MangaLibraryEntry[];
}

// Movie Library Types
export type MovieLibraryStatus = 'watched' | 'plan_to_watch' | 'on_hold' | 'dropped';

export interface MovieLibraryEntry {
    movie: Movie;
    addedAt: string;
}

export interface MovieLibrary {
    watched: MovieLibraryEntry[];
    plan_to_watch: MovieLibraryEntry[];
    on_hold: MovieLibraryEntry[];
    dropped: MovieLibraryEntry[];
}

export interface AppSettings {
    _version: number;
    autoPlayNext: boolean;
    defaultQuality: '1080p' | '720p' | '480p' | 'auto';
    // Appearance
    themeAccent: 'purple' | 'blue' | 'green' | 'orange';
    backgroundMode: 'simple' | 'glow' | 'mesh';
    baseColor: 'black' | 'midnight' | 'slate';
    showNSFW: boolean;
    // Notifications
    notifications: {
        airing: boolean;
        completed: boolean;
        news: boolean;
    };
}

export interface UserData {
    history: HistoryItem[];
    library: Library;
    mangaLibrary: MangaLibrary;
    movieLibrary: MovieLibrary;
    settings: AppSettings;
    totalWatchTimeSeconds: number;
}

export interface UserContextType {
    userData: UserData;
    loading: boolean;
    // Anime
    updateHistory: (animeId: number, episodeId: string, timestamp: number) => void;
    addWatchTime: (seconds: number) => void;
    updateStatus: (anime: Anime, newStatus: LibraryStatus) => void;
    getAnimeStatus: (animeId: number) => LibraryStatus | null;
    removeFromLibrary: (animeId: number) => void;
    // Manga
    updateMangaStatus: (manga: Manga, newStatus: MangaLibraryStatus) => void;
    getMangaStatus: (mangaId: number) => MangaLibraryStatus | null;
    removeFromMangaLibrary: (mangaId: number) => void;
    // Movie
    updateMovieStatus: (movie: Movie, newStatus: MovieLibraryStatus) => void;
    getMovieStatus: (movieId: number) => MovieLibraryStatus | null;
    removeFromMovieLibrary: (movieId: number) => void;
    updateSettings: (newSettings: Partial<AppSettings>) => void;
    // Data Management
    getStorageUsage: () => number;
    clearAppCache: () => void;
    exportData: () => void;
    importData: (jsonData: string) => Promise<boolean>;
}
