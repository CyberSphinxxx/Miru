import { UserData, Library, LibraryStatus, MangaLibrary, MangaLibraryStatus, MovieLibrary, MovieLibraryStatus, HistoryItem } from '../types/user';

export const LOCAL_STORAGE_KEY = 'miru_local_user';

export const INITIAL_DATA: UserData = {
    history: [],
    library: {
        watching: [],
        completed: [],
        plan_to_watch: [],
        on_hold: [],
        dropped: [],
    },
    mangaLibrary: {
        reading: [],
        completed: [],
        plan_to_read: [],
        on_hold: [],
        dropped: [],
    },
    movieLibrary: {
        watched: [],
        plan_to_watch: [],
        on_hold: [],
        dropped: [],
    },
    settings: {
        _version: 1,
        autoPlayNext: true,
        defaultQuality: 'auto',
        themeAccent: 'purple',
        backgroundMode: 'glow',
        baseColor: 'black',
        showNSFW: false,
        notifications: {
            airing: true,
            completed: true,
            news: true,
        }
    },
    totalWatchTimeSeconds: 0
};

export const getLocalData = (): UserData => {
    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!stored) return INITIAL_DATA;

        const parsed = JSON.parse(stored);
        return {
            ...INITIAL_DATA,
            ...parsed,
            settings: {
                ...INITIAL_DATA.settings,
                ...(parsed.settings || {})
            }
        };
    } catch (error) {
        console.error('Failed to parse local user data:', error);
        return INITIAL_DATA;
    }
};

export const setLocalData = (data: UserData) => {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Failed to save local user data:', error);
    }
};

export const mergeUserData = (local: UserData, cloud: UserData): UserData => {
    // Merge history (keep unique by animeId, prefer most recent)
    const historyMap = new Map<number, HistoryItem>();
    [...cloud.history, ...local.history].forEach(item => {
        const existing = historyMap.get(item.animeId);
        if (!existing || new Date(item.lastWatched) > new Date(existing.lastWatched)) {
            historyMap.set(item.animeId, item);
        }
    });

    // Merge library (keep unique by id, prefer cloud)
    const mergedLibrary: Library = {
        watching: [],
        completed: [],
        plan_to_watch: [],
        on_hold: [],
        dropped: [],
    };

    const seenIds = new Set<number>();

    // Process cloud library first (priority)
    (Object.keys(mergedLibrary) as LibraryStatus[]).forEach(status => {
        cloud.library[status].forEach(entry => {
            if (!seenIds.has(entry.anime.id)) {
                mergedLibrary[status].push(entry);
                seenIds.add(entry.anime.id);
            }
        });
    });

    // Add local items not in cloud
    (Object.keys(mergedLibrary) as LibraryStatus[]).forEach(status => {
        local.library[status].forEach(entry => {
            if (!seenIds.has(entry.anime.id)) {
                mergedLibrary[status].push(entry);
                seenIds.add(entry.anime.id);
            }
        });
    });

    // Also merge manga library in same pattern
    const mergedMangaLibrary: MangaLibrary = {
        reading: [],
        completed: [],
        plan_to_read: [],
        on_hold: [],
        dropped: [],
    };

    const seenMangaIds = new Set<number>();

    // Process cloud manga library first
    if (cloud.mangaLibrary) {
        (Object.keys(mergedMangaLibrary) as MangaLibraryStatus[]).forEach(status => {
            (cloud.mangaLibrary[status] || []).forEach(entry => {
                if (!seenMangaIds.has(entry.manga.id)) {
                    mergedMangaLibrary[status].push(entry);
                    seenMangaIds.add(entry.manga.id);
                }
            });
        });
    }

    // Add local manga items not in cloud
    if (local.mangaLibrary) {
        (Object.keys(mergedMangaLibrary) as MangaLibraryStatus[]).forEach(status => {
            (local.mangaLibrary[status] || []).forEach(entry => {
                if (!seenMangaIds.has(entry.manga.id)) {
                    mergedMangaLibrary[status].push(entry);
                    seenMangaIds.add(entry.manga.id);
                }
            });
        });
    }

    // Also merge movie library
    const mergedMovieLibrary: MovieLibrary = {
        watched: [],
        plan_to_watch: [],
        on_hold: [],
        dropped: [],
    };

    const seenMovieIds = new Set<number>();

    // Process cloud movie library first
    if (cloud.movieLibrary) {
        (Object.keys(mergedMovieLibrary) as MovieLibraryStatus[]).forEach(status => {
            (cloud.movieLibrary[status] || []).forEach(entry => {
                if (!seenMovieIds.has(entry.movie.id)) {
                    mergedMovieLibrary[status].push(entry);
                    seenMovieIds.add(entry.movie.id);
                }
            });
        });
    }

    // Add local movie items not in cloud
    if (local.movieLibrary) {
        (Object.keys(mergedMovieLibrary) as MovieLibraryStatus[]).forEach(status => {
            (local.movieLibrary[status] || []).forEach(entry => {
                if (!seenMovieIds.has(entry.movie.id)) {
                    mergedMovieLibrary[status].push(entry);
                    seenMovieIds.add(entry.movie.id);
                }
            });
        });
    }

    return {
        history: Array.from(historyMap.values()),
        library: mergedLibrary,
        mangaLibrary: mergedMangaLibrary,
        movieLibrary: mergedMovieLibrary,
        settings: {
            ...INITIAL_DATA.settings,
            ...(local.settings || {}),
            ...(cloud.settings || {}),
        },
        totalWatchTimeSeconds: Math.max(local.totalWatchTimeSeconds || 0, cloud.totalWatchTimeSeconds || 0)
    };
};

export const sanitizeForFirestore = (obj: any): any => {
    if (obj === undefined) return null;
    if (obj === null || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
        return obj.map(sanitizeForFirestore);
    }

    const result: any = {};
    for (const key in obj) {
        const value = obj[key];
        if (value !== undefined) {
            result[key] = sanitizeForFirestore(value);
        }
    }
    return result;
};
