import { UserData, Library, LibraryStatus, MangaLibrary, MangaLibraryStatus, MovieLibrary, MovieLibraryStatus, HistoryItem, LibraryEntry, MangaLibraryEntry, MovieLibraryEntry } from '../types/user';

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


    // Helper to get status priority (higher is "better")
    const getStatusPriority = (s: LibraryStatus): number => {
        const priorities: Record<LibraryStatus, number> = {
            completed: 100,
            watching: 80,
            on_hold: 60,
            plan_to_watch: 40,
            dropped: 20
        };
        return priorities[s] || 0;
    };

    // Build map of best entries across all statuses
    // Prioritize by status first, then by addedAt date
    const resolveLibraryEntries = (libA: Library, libB: Library): Library => {
        const bestEntries = new Map<number, { entry: LibraryEntry, status: LibraryStatus }>();

        const processLibrary = (lib: Library) => {
            (Object.keys(lib) as LibraryStatus[]).forEach(status => {
                const list = lib[status] || [];
                list.forEach(entry => {
                    const id = entry.anime.id;
                    const existing = bestEntries.get(id);

                    if (!existing ||
                        getStatusPriority(status) > getStatusPriority(existing.status) ||
                        (status === existing.status && new Date(entry.addedAt) > new Date(existing.entry.addedAt))) {
                        bestEntries.set(id, { entry, status });
                    }
                });
            });
        };

        processLibrary(libA);
        processLibrary(libB);

        const result: Library = {
            watching: [],
            completed: [],
            plan_to_watch: [],
            on_hold: [],
            dropped: [],
        };

        bestEntries.forEach(({ entry, status }) => {
            result[status].push(entry);
        });

        return result;
    };

    const mergedLibrary = resolveLibraryEntries(cloud.library || INITIAL_DATA.library, local.library || INITIAL_DATA.library);

    // Resolve manga library
    const resolveMangaLibraryEntries = (libA: MangaLibrary, libB: MangaLibrary): MangaLibrary => {
        const getMangaStatusPriority = (s: MangaLibraryStatus): number => {
            const priorities: Record<MangaLibraryStatus, number> = {
                completed: 100,
                reading: 80,
                on_hold: 60,
                plan_to_read: 40,
                dropped: 20
            };
            return priorities[s] || 0;
        };

        const bestEntries = new Map<number, { entry: MangaLibraryEntry, status: MangaLibraryStatus }>();

        const processLibrary = (lib: MangaLibrary) => {
            if (!lib) return;
            (Object.keys(lib) as MangaLibraryStatus[]).forEach(status => {
                const list = lib[status] || [];
                list.forEach(entry => {
                    if (!entry?.manga?.id) return;
                    const id = entry.manga.id;
                    const existing = bestEntries.get(id);

                    if (!existing ||
                        getMangaStatusPriority(status) > getMangaStatusPriority(existing.status) ||
                        (status === existing.status && new Date(entry.addedAt) > new Date(existing.entry.addedAt))) {
                        bestEntries.set(id, { entry, status });
                    }
                });
            });
        };

        processLibrary(libA);
        processLibrary(libB);

        const result: MangaLibrary = {
            reading: [],
            completed: [],
            plan_to_read: [],
            on_hold: [],
            dropped: [],
        };

        bestEntries.forEach(({ entry, status }) => {
            result[status].push(entry);
        });

        return result;
    };

    const mergedMangaLibrary = resolveMangaLibraryEntries(cloud.mangaLibrary!, local.mangaLibrary!);

    // Resolve movie library
    const resolveMovieLibraryEntries = (libA: MovieLibrary, libB: MovieLibrary): MovieLibrary => {
        const getMovieStatusPriority = (s: MovieLibraryStatus): number => {
            const priorities: Record<MovieLibraryStatus, number> = {
                watched: 100,
                on_hold: 60,
                plan_to_watch: 40,
                dropped: 20
            };
            return priorities[s] || 0;
        };

        const bestEntries = new Map<number, { entry: MovieLibraryEntry, status: MovieLibraryStatus }>();

        const processLibrary = (lib: MovieLibrary) => {
            if (!lib) return;
            (Object.keys(lib) as MovieLibraryStatus[]).forEach(status => {
                const list = lib[status] || [];
                list.forEach(entry => {
                    if (!entry?.movie?.id) return;
                    const id = entry.movie.id;
                    const existing = bestEntries.get(id);

                    if (!existing ||
                        getMovieStatusPriority(status) > getMovieStatusPriority(existing.status) ||
                        (status === existing.status && new Date(entry.addedAt) > new Date(existing.entry.addedAt))) {
                        bestEntries.set(id, { entry, status });
                    }
                });
            });
        };

        processLibrary(libA);
        processLibrary(libB);

        const result: MovieLibrary = {
            watched: [],
            plan_to_watch: [],
            on_hold: [],
            dropped: [],
        };

        bestEntries.forEach(({ entry, status }) => {
            result[status].push(entry);
        });

        return result;
    };

    const mergedMovieLibrary = resolveMovieLibraryEntries(cloud.movieLibrary!, local.movieLibrary!);

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
