import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { Anime } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface HistoryItem {
    animeId: number;
    episodeId: string;
    timestamp: number; // in seconds
    lastWatched: string; // ISO date string
}

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

export interface UserData {
    history: HistoryItem[];
    library: Library;
}

interface UserContextType {
    userData: UserData;
    loading: boolean;
    updateHistory: (animeId: number, episodeId: string, timestamp: number) => void;
    updateStatus: (anime: Anime, newStatus: LibraryStatus) => void;
    getAnimeStatus: (animeId: number) => LibraryStatus | null;
    removeFromLibrary: (animeId: number) => void;
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

    return {
        history: Array.from(historyMap.values()),
        library: mergedLibrary,
    };
};

// ============================================================================
// Context
// ============================================================================

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const [userData, setUserData] = useState<UserData>(INITIAL_DATA);
    const [loading, setLoading] = useState(true);

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
                            await setDoc(userDocRef, mergedData);
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
                        await setDoc(userDocRef, localData);
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

    // Save data helper
    const saveData = useCallback(async (newData: UserData) => {
        setUserData(newData);

        if (currentUser) {
            // Save to Firestore
            try {
                const userDocRef = doc(db, 'users', currentUser.uid);
                await setDoc(userDocRef, newData);
            } catch (error) {
                console.error('Error saving to Firestore:', error);
                // Fallback: save locally
                setLocalData(newData);
            }
        } else {
            // Guest Mode: Save to localStorage
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

    return (
        <UserContext.Provider value={{
            userData,
            loading,
            updateHistory,
            updateStatus,
            getAnimeStatus,
            removeFromLibrary
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
