import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { Anime } from '../types';
import { Manga } from '../types/manga';

// ============================================================================
// Types
// ============================================================================

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

export interface UserData {
    history: HistoryItem[];
    library: Library;
    mangaLibrary: MangaLibrary;
}

interface UserContextType {
    userData: UserData;
    loading: boolean;
    // Anime
    updateHistory: (animeId: number, episodeId: string, timestamp: number) => void;
    updateStatus: (anime: Anime, newStatus: LibraryStatus) => void;
    getAnimeStatus: (animeId: number) => LibraryStatus | null;
    removeFromLibrary: (animeId: number) => void;
    // Manga
    updateMangaStatus: (manga: Manga, newStatus: MangaLibraryStatus) => void;
    getMangaStatus: (mangaId: number) => MangaLibraryStatus | null;
    removeFromMangaLibrary: (mangaId: number) => void;
}

// ============================================================================
// Constants
// ============================================================================

const LOCAL_STORAGE_KEY = 'miru_local_user';

const INITIAL_DATA: UserData = {
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
};

// ============================================================================
// Helper Functions
// ============================================================================

const getLocalData = (): UserData => {
    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        return stored ? JSON.parse(stored) : INITIAL_DATA;
    } catch (error) {
        console.error('Failed to parse local user data:', error);
        return INITIAL_DATA;
    }
};

const setLocalData = (data: UserData) => {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Failed to save local user data:', error);
    }
};

const mergeUserData = (local: UserData, cloud: UserData): UserData => {
    // Merge history (keep unique by animeId, prefer most recent)
    const historyMap = new Map<number, HistoryItem>();
    [...cloud.history, ...local.history].forEach(item => {
        const existing = historyMap.get(item.animeId);
        if (!existing || new Date(item.lastWatched) > new Date(existing.lastWatched)) {
            historyMap.set(item.animeId, item);
        }
    });

    // Merge library (keep unique by mal_id, prefer cloud)
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
            if (!seenIds.has(entry.anime.mal_id)) {
                mergedLibrary[status].push(entry);
                seenIds.add(entry.anime.mal_id);
            }
        });
    });

    // Add local items not in cloud
    (Object.keys(mergedLibrary) as LibraryStatus[]).forEach(status => {
        local.library[status].forEach(entry => {
            if (!seenIds.has(entry.anime.mal_id)) {
                mergedLibrary[status].push(entry);
                seenIds.add(entry.anime.mal_id);
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
                if (!seenMangaIds.has(entry.manga.mal_id)) {
                    mergedMangaLibrary[status].push(entry);
                    seenMangaIds.add(entry.manga.mal_id);
                }
            });
        });
    }

    // Add local manga items not in cloud
    if (local.mangaLibrary) {
        (Object.keys(mergedMangaLibrary) as MangaLibraryStatus[]).forEach(status => {
            (local.mangaLibrary[status] || []).forEach(entry => {
                if (!seenMangaIds.has(entry.manga.mal_id)) {
                    mergedMangaLibrary[status].push(entry);
                    seenMangaIds.add(entry.manga.mal_id);
                }
            });
        });
    }

    return {
        history: Array.from(historyMap.values()),
        library: mergedLibrary,
        mangaLibrary: mergedMangaLibrary,
    };
};

// ============================================================================
// Context
// ============================================================================

// Helper to recursively remove undefined values or convert them to null for Firestore
const sanitizeForFirestore = (obj: any): any => {
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
        } else {
            // Option 1: Convert undefined to null
            // result[key] = null;
            // Option 2: Delete the key (preferred for cleaner Firestore docs)
            // Do nothing, key is skipped
        }
    }
    return result;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const [userData, setUserData] = useState<UserData>(INITIAL_DATA);
    const [loading, setLoading] = useState(true);

    // Debounced Firebase write refs
    const debouncedSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingDataRef = useRef<UserData | null>(null);

    // Load user data based on auth state
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);

            if (currentUser) {
                // Authenticated: Load from Firestore
                try {
                    const userDocRef = doc(db, 'users', currentUser.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        const cloudData = userDoc.data() as UserData;
                        const localData = getLocalData();

                        // Check if local data has content to merge
                        const hasLocalData = localData.history.length > 0 ||
                            Object.values(localData.library).some(list => list.length > 0);

                        if (hasLocalData) {
                            // Merge local data with cloud data
                            const mergedData = mergeUserData(localData, cloudData);
                            await setDoc(userDocRef, sanitizeForFirestore(mergedData));
                            setUserData(mergedData);
                            // Clear local storage after successful merge
                            localStorage.removeItem(LOCAL_STORAGE_KEY);
                            console.log('Local data merged with cloud account');
                        } else {
                            setUserData(cloudData);
                        }
                    } else {
                        // New user: Check for local data to upload
                        const localData = getLocalData();
                        await setDoc(userDocRef, sanitizeForFirestore(localData));
                        setUserData(localData);
                        // Clear local storage after upload
                        localStorage.removeItem(LOCAL_STORAGE_KEY);
                        console.log('Local data uploaded to new cloud account');
                    }
                } catch (error) {
                    console.error('Error loading user data from Firestore:', error);
                    // Fallback to local data
                    setUserData(getLocalData());
                }
            } else {
                // Guest Mode: Load from localStorage
                setUserData(getLocalData());
            }

            setLoading(false);
        };

        loadData();
    }, [currentUser]);

    // Save data helper with debounced Firebase writes
    const saveData = useCallback(async (newData: UserData) => {
        // Immediately update local state for responsive UI
        setUserData(newData);

        if (currentUser) {
            // Debounce Firebase writes to batch rapid updates
            pendingDataRef.current = newData;
            if (debouncedSaveRef.current) {
                clearTimeout(debouncedSaveRef.current);
            }
            debouncedSaveRef.current = setTimeout(async () => {
                if (!pendingDataRef.current) return;
                try {
                    const userDocRef = doc(db, 'users', currentUser.uid);
                    await setDoc(userDocRef, sanitizeForFirestore(pendingDataRef.current));
                } catch (error) {
                    console.error('Error saving to Firestore:', error);
                    // Fallback: save locally
                    setLocalData(pendingDataRef.current!);
                }
            }, 500); // 500ms debounce delay
        } else {
            // Guest Mode: Save to localStorage immediately
            setLocalData(newData);
        }
    }, [currentUser]);

    /**
     * Updates watch history for an anime/episode.
     * Automatically moves 'plan_to_watch' anime to 'watching'.
     */
    const updateHistory = useCallback((animeId: number, episodeId: string, timestamp: number) => {
        setUserData(prev => {
            const newHistory = [...prev.history];
            const existingIndex = newHistory.findIndex(h => h.animeId === animeId);

            const historyItem: HistoryItem = {
                animeId,
                episodeId,
                timestamp,
                lastWatched: new Date().toISOString(),
            };

            if (existingIndex >= 0) {
                newHistory[existingIndex] = historyItem;
            } else {
                newHistory.push(historyItem);
            }

            // Check if anime is in 'plan_to_watch' and move to 'watching'
            let newLibrary = { ...prev.library };
            const planToWatchIndex = newLibrary.plan_to_watch.findIndex(e => e.anime.mal_id === animeId);

            if (planToWatchIndex >= 0) {
                const entry = newLibrary.plan_to_watch[planToWatchIndex];
                const newPlanToWatch = [...newLibrary.plan_to_watch];
                newPlanToWatch.splice(planToWatchIndex, 1);

                const newWatching = [...newLibrary.watching];
                if (!newWatching.find(e => e.anime.mal_id === animeId)) {
                    newWatching.push({ ...entry, addedAt: new Date().toISOString() });
                }

                newLibrary = {
                    ...newLibrary,
                    plan_to_watch: newPlanToWatch,
                    watching: newWatching,
                };
            }

            const newData = {
                ...prev,
                history: newHistory,
                library: newLibrary
            };

            // Save asynchronously
            saveData(newData);
            return newData;
        });
    }, [saveData]);

    /**
     * Adds or moves an anime to a specific list.
     * Ensures exclusivity (removes from old list first).
     */
    const updateStatus = useCallback((anime: Anime, newStatus: LibraryStatus) => {
        setUserData(prev => {
            const newLibrary = { ...prev.library };
            const animeId = anime.mal_id;

            // Remove from ALL lists
            (Object.keys(newLibrary) as LibraryStatus[]).forEach(status => {
                newLibrary[status] = newLibrary[status].filter(entry => entry.anime.mal_id !== animeId);
            });

            // Add to the new list
            newLibrary[newStatus].push({
                anime,
                addedAt: new Date().toISOString()
            });

            const newData = {
                ...prev,
                library: newLibrary
            };

            saveData(newData);
            return newData;
        });
    }, [saveData]);

    /**
     * Removes an anime from the library entirely.
     */
    const removeFromLibrary = useCallback((animeId: number) => {
        setUserData(prev => {
            const newLibrary = { ...prev.library };

            (Object.keys(newLibrary) as LibraryStatus[]).forEach(status => {
                newLibrary[status] = newLibrary[status].filter(entry => entry.anime.mal_id !== animeId);
            });

            const newData = {
                ...prev,
                library: newLibrary
            };

            saveData(newData);
            return newData;
        });
    }, [saveData]);

    /**
     * Returns the current status of an anime.
     */
    const getAnimeStatus = useCallback((animeId: number): LibraryStatus | null => {
        const statuses = Object.keys(userData.library) as LibraryStatus[];

        for (const status of statuses) {
            if (userData.library[status].some(entry => entry.anime.mal_id === animeId)) {
                return status;
            }
        }

        return null;
    }, [userData.library]);

    // ========== MANGA LIBRARY FUNCTIONS ==========

    /**
     * Adds or moves a manga to a specific list.
     */
    const updateMangaStatus = useCallback((manga: Manga, newStatus: MangaLibraryStatus) => {
        setUserData(prev => {
            const newMangaLibrary = { ...(prev.mangaLibrary || INITIAL_DATA.mangaLibrary) };
            const mangaId = manga.mal_id;

            // Remove from ALL lists
            (Object.keys(newMangaLibrary) as MangaLibraryStatus[]).forEach(status => {
                newMangaLibrary[status] = (newMangaLibrary[status] || []).filter(entry => entry.manga.mal_id !== mangaId);
            });

            // Add to the new list
            newMangaLibrary[newStatus].push({
                manga,
                addedAt: new Date().toISOString()
            });

            const newData = {
                ...prev,
                mangaLibrary: newMangaLibrary
            };

            saveData(newData);
            return newData;
        });
    }, [saveData]);

    /**
     * Removes a manga from the library entirely.
     */
    const removeFromMangaLibrary = useCallback((mangaId: number) => {
        setUserData(prev => {
            const newMangaLibrary = { ...(prev.mangaLibrary || INITIAL_DATA.mangaLibrary) };

            (Object.keys(newMangaLibrary) as MangaLibraryStatus[]).forEach(status => {
                newMangaLibrary[status] = (newMangaLibrary[status] || []).filter(entry => entry.manga.mal_id !== mangaId);
            });

            const newData = {
                ...prev,
                mangaLibrary: newMangaLibrary
            };

            saveData(newData);
            return newData;
        });
    }, [saveData]);

    /**
     * Returns the current status of a manga.
     */
    const getMangaStatus = useCallback((mangaId: number): MangaLibraryStatus | null => {
        const mangaLibrary = userData.mangaLibrary || INITIAL_DATA.mangaLibrary;
        const statuses = Object.keys(mangaLibrary) as MangaLibraryStatus[];

        for (const status of statuses) {
            if ((mangaLibrary[status] || []).some(entry => entry.manga.mal_id === mangaId)) {
                return status;
            }
        }

        return null;
    }, [userData.mangaLibrary]);

    return (
        <UserContext.Provider value={{
            userData,
            loading,
            updateHistory,
            updateStatus,
            getAnimeStatus,
            removeFromLibrary,
            updateMangaStatus,
            getMangaStatus,
            removeFromMangaLibrary
        }}>
            {children}
        </UserContext.Provider>
    );
};

// ============================================================================
// Hook
// ============================================================================

export const useLocalUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useLocalUser must be used within a UserProvider');
    }
    return context;
};
