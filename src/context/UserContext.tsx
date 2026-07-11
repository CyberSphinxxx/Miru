import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { clearCache } from '../services/api/cacheUtils';
export * from '../types/user';
import { UserData, UserContextType, AppSettings, LibraryEntry, LibraryStatus } from '../types/user';
import { INITIAL_DATA, LOCAL_STORAGE_KEY, getLocalData, setLocalData, mergeUserData, sanitizeForFirestore } from './userUtils';
import { useAnimeLibrary } from './hooks/useAnimeLibrary';
import { useMangaLibrary } from './hooks/useMangaLibrary';
import { useMovieLibrary } from './hooks/useMovieLibrary';

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const [userData, setUserData] = useState<UserData>(INITIAL_DATA);
    const [loading, setLoading] = useState(true);

    const debouncedSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingDataRef = useRef<UserData | null>(null);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);

            if (currentUser) {
                try {
                    const userDocRef = doc(db, 'users', currentUser.uid);
                    const userDoc = await getDoc(userDocRef);

                    let finalData: UserData;

                    if (userDoc.exists()) {
                        const cloudData = userDoc.data() as UserData;
                        const localData = getLocalData();

                        const hasLocalData = localData.history.length > 0 ||
                            Object.values(localData.library).some(list => list.length > 0);

                        if (hasLocalData) {
                            console.info('[UserContext] Local data found, merging with cloud...');
                            finalData = mergeUserData(localData, cloudData);
                            await setDoc(userDocRef, sanitizeForFirestore(finalData));
                            localStorage.removeItem(LOCAL_STORAGE_KEY);
                        } else {
                            console.info('[UserContext] No local data, using cloud data.');
                            finalData = {
                                ...INITIAL_DATA,
                                ...cloudData,
                                library: {
                                    ...INITIAL_DATA.library,
                                    ...(cloudData.library || {})
                                },
                                mangaLibrary: {
                                    ...INITIAL_DATA.mangaLibrary,
                                    ...(cloudData.mangaLibrary || {})
                                },
                                movieLibrary: {
                                    ...INITIAL_DATA.movieLibrary,
                                    ...(cloudData.movieLibrary || {})
                                },
                                settings: {
                                    ...INITIAL_DATA.settings,
                                    ...(cloudData.settings || {})
                                }
                            };
                        }
                    } else {
                        const localData = getLocalData();
                        await setDoc(userDocRef, sanitizeForFirestore(localData));
                        finalData = localData;
                        localStorage.removeItem(LOCAL_STORAGE_KEY);
                    }

                    // --- EMERGENCY DATA RESTORATION ---
                    try {
                        let recoveryCount = 0;
                        console.info('[Migration] Starting EMERGENCY Deep Recovery...');

                        // 0. Cloud Shape Diagnostic
                        const cloudKeys = Object.keys(userDoc.data() || {});
                        console.info(`[Migration] Cloud Document Shape: [${cloudKeys.join(', ')}]`);
                        
                        // 1. Exhaustive LocalStorage Scan
                        console.info('[Migration] Scanning all local miru_* keys...');
                        for (let i = 0; i < localStorage.length; i++) {
                            const key = localStorage.key(i);
                            if (key && key.startsWith('miru_') && key !== LOCAL_STORAGE_KEY) {
                                try {
                                    const value = localStorage.getItem(key);
                                    if (value && value.startsWith('[')) {
                                        const items = JSON.parse(value);
                                        if (Array.isArray(items)) {
                                            console.info(`[Migration] Analyzing shadow collection: ${key} (${items.length} items)`);
                                            items.forEach((item: any) => {
                                                const itemId = item.id || item.mal_id || item.animeId;
                                                if (!itemId) return;

                                                // If it's a history-like item, merge into history
                                                if (item.lastWatched || item.progress || item.currentEpisode) {
                                                    const alreadyExists = finalData.history.some(h => h.animeId === itemId);
                                                    if (!alreadyExists) {
                                                        finalData.history.push({
                                                            animeId: itemId,
                                                            episodeId: item.episodeId || item.currentEpisode?.toString() || '1',
                                                            timestamp: item.timestamp || item.progress || 0,
                                                            lastWatched: item.lastWatched || new Date().toISOString()
                                                        });
                                                        recoveryCount++;
                                                    }
                                                }

                                                // If it's a watchlist-like item, merge into library
                                                const status: LibraryStatus = (item.status || 'plan_to_watch').replace('planning', 'plan_to_watch') as LibraryStatus;
                                                const inLibrary = Object.values(finalData.library).some(list => list.some((e: LibraryEntry) => e.anime.id === itemId));
                                                if (!inLibrary) {
                                                    finalData.library[status].push({
                                                        addedAt: item.addedAt || item.lastWatched || new Date().toISOString(),
                                                        anime: { id: itemId, title: item.title, images: { jpg: { image_url: item.image_url, large_image_url: item.image_url } }, type: item.type || 'anime', episodes: item.episodes, score: item.score || 0 } as any
                                                    });
                                                    recoveryCount++;
                                                }
                                            });
                                        }
                                    }
                                } catch (e) { /* skip */ }
                            }
                        }

                        // 2. Check Firebase subcollection 'users/{uid}/watchlist' -> Library
                        try {
                            const subWatchlistRef = collection(db, 'users', currentUser.uid, 'watchlist');
                            const subSnapshot = await getDocs(subWatchlistRef);
                            if (!subSnapshot.empty) {
                                console.info(`[Migration] Found ${subSnapshot.size} items in Firebase 'watchlist' subcollection`);
                                subSnapshot.docs.forEach(docSnap => {
                                    const item = docSnap.data();
                                    const itemId = item.id || item.mal_id || item.animeId;
                                    if (!itemId) return;
                                    const status: LibraryStatus = (item.status || 'plan_to_watch').replace('planning', 'plan_to_watch') as LibraryStatus;
                                    const alreadyExists = Object.values(finalData.library).some(list => list.some((e: LibraryEntry) => e.anime.id === itemId));
                                    if (!alreadyExists) {
                                        const rawAddedAt = item.addedAt;
                                        const addedAt = (rawAddedAt && typeof rawAddedAt.toDate === 'function') ? rawAddedAt.toDate().toISOString() : (typeof rawAddedAt === 'string' ? rawAddedAt : new Date().toISOString());
                                        finalData.library[status].push({
                                            addedAt,
                                            anime: { id: itemId, title: item.title, images: { jpg: { image_url: item.image_url, large_image_url: item.image_url } }, type: item.type, episodes: item.episodes, score: item.score || 0 } as any
                                        });
                                        recoveryCount++;
                                    }
                                });
                            }
                        } catch (e: any) {
                            if (e.code === 'permission-denied') console.warn('[Migration] Firebase Watchlist subcollection blocked by Firestore Rules.');
                        }

                        // 3. Check Firebase subcollection 'users/{uid}/watchHistory' -> History
                        try {
                            const subHistoryRef = collection(db, 'users', currentUser.uid, 'watchHistory');
                            const subHistorySnapshot = await getDocs(subHistoryRef);
                            if (!subHistorySnapshot.empty) {
                                console.info(`[Migration] Found ${subHistorySnapshot.size} items in Firebase 'watchHistory' subcollection`);
                                subHistorySnapshot.docs.forEach(docSnap => {
                                    const item = docSnap.data();
                                    const itemId = item.id || item.mal_id || item.animeId;
                                    if (!itemId) return;
                                    const alreadyExists = finalData.history.some(h => h.animeId === itemId);
                                    if (!alreadyExists) {
                                        const rawLastWatched = item.lastWatched;
                                        const lastWatched = (rawLastWatched && typeof rawLastWatched.toDate === 'function') ? rawLastWatched.toDate().toISOString() : (typeof rawLastWatched === 'string' ? rawLastWatched : new Date().toISOString());
                                        finalData.history.push({ animeId: itemId, episodeId: item.episodeId || item.currentEpisode?.toString() || '1', timestamp: item.timestamp || item.progress || 0, lastWatched });
                                        recoveryCount++;
                                    }
                                });
                            }
                        } catch (e: any) {
                            if (e.code === 'permission-denied') console.warn('[Migration] Firebase WatchHistory subcollection blocked by Firestore Rules.');
                        }

                        // 4. Auto-Promotion Heuristic: Reconstruct "Completed" list from History
                        console.info('[Migration] Running Auto-Promotion heuristic...');
                        let promotionCount = 0;
                        
                        // We need a list of all library IDs to check if they are already in library
                        const libraryIds = new Set();
                        Object.values(finalData.library).forEach(list => list.forEach((e: LibraryEntry) => libraryIds.add(e.anime.id)));

                        // Create a map to look up anime data (title, episodes) from history
                        const historyMap = new Map();
                        // Also check legacy LocalStorage for extra data to reconcile
                        const legacyHistoryStr = localStorage.getItem('miru_watch_history');
                        if (legacyHistoryStr) {
                            try {
                                const legacy = JSON.parse(legacyHistoryStr);
                                if (Array.isArray(legacy)) legacy.forEach(item => historyMap.set(item.id || item.mal_id, item));
                            } catch (e) {}
                        }

                        finalData.history.forEach(h => {
                            if (libraryIds.has(h.animeId)) return; // Already in library

                            const extra = historyMap.get(h.animeId);
                            const isCompleted = extra?.status === 'completed' || 
                                              (extra?.episodes && extra.currentEpisode >= extra.episodes) ||
                                              (extra?.progress >= 95);

                            if (isCompleted) {
                                console.info(`[Migration] Auto-promoting "${extra?.title || h.animeId}" to Completed based on history progress.`);
                                finalData.library.completed.push({
                                    addedAt: h.lastWatched,
                                    anime: {
                                        id: h.animeId,
                                        title: extra?.title || `Anime #${h.animeId}`,
                                        images: { jpg: { image_url: extra?.image_url || '', large_image_url: extra?.image_url || '' } },
                                        type: extra?.type || 'anime',
                                        episodes: extra?.episodes || 0,
                                        score: extra?.score || 0
                                    } as any
                                });
                                libraryIds.add(h.animeId);
                                promotionCount++;
                            }
                        });


                        if (recoveryCount > 0 || promotionCount > 0) {
                            console.info(`[Migration] SUCCESS: Recovered ${recoveryCount} items and Auto-Promoted ${promotionCount} completed items.`);
                            await setDoc(userDocRef, sanitizeForFirestore(finalData));
                        } else {
                            console.info('[Migration] Scan complete: No reconstructible data found.');
                        }
                    } catch (migrationError) {
                        console.error('[Migration] Critical unexpected error during emergency recovery:', migrationError);
                    }

                    setUserData(finalData);
                } catch (error) {
                    console.error('Error loading user data from Firestore:', error);
                    setUserData(getLocalData());
                }
            } else {
                setUserData(getLocalData());
            }

            setLoading(false);
        };

        loadData();
    }, [currentUser]);

    const persistData = useCallback(async (newData: UserData) => {
        if (currentUser) {
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
                    setLocalData(pendingDataRef.current!);
                }
            }, 500);
        } else {
            setLocalData(newData);
        }
    }, [currentUser]);

    // Helper to update state and persist
    const updateUserData = useCallback((newData: UserData) => {
        setUserData(newData);
        persistData(newData);
    }, [persistData]);

    // Library Hooks
    const animeControls = useAnimeLibrary(userData, updateUserData);
    const mangaControls = useMangaLibrary(userData, updateUserData);
    const movieControls = useMovieLibrary(userData, updateUserData);

    // Settings & Utils
    const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
        const updatedSettings = { ...userData.settings, ...newSettings };
        const newData = { ...userData, settings: updatedSettings };
        updateUserData(newData);
    }, [userData, updateUserData]);

    const getStorageUsage = useCallback(() => {
        let total = 0;
        for (const key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += (localStorage[key].length + key.length) * 2;
            }
        }
        return total;
    }, []);

    const clearAppCache = useCallback(() => {
        clearCache();
        window.location.reload();
    }, []);

    const exportData = useCallback(() => {
        const dataStr = JSON.stringify(userData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = `miru-backup-${new Date().toISOString().slice(0, 10)}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }, [userData]);

    const importData = useCallback(async (jsonString: string): Promise<boolean> => {
        try {
            const parsed = JSON.parse(jsonString);
            if (!parsed.history || !parsed.library || !parsed.settings) {
                console.error("Invalid backup file format");
                return false;
            }

            const newData = { ...INITIAL_DATA, ...parsed };
            updateUserData(newData);
            return true;
        } catch (e) {
            console.error("Failed to import data:", e);
            return false;
        }
    }, [updateUserData]);

    return (
        <UserContext.Provider value={{
            userData,
            loading,
            ...animeControls,
            ...mangaControls,
            ...movieControls,
            updateSettings,
            getStorageUsage,
            clearAppCache,
            exportData,
            importData
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useLocalUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useLocalUser must be used within a UserProvider');
    }
    return context;
};
