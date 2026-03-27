import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { clearCache } from '../services/api/cacheUtils';
export * from '../types/user';
import { UserData, UserContextType, AppSettings } from '../types/user';
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

                    if (userDoc.exists()) {
                        const cloudData = userDoc.data() as UserData;
                        const localData = getLocalData();

                        const hasLocalData = localData.history.length > 0 ||
                            Object.values(localData.library).some(list => list.length > 0);

                        if (hasLocalData) {
                            const mergedData = mergeUserData(localData, cloudData);
                            await setDoc(userDocRef, sanitizeForFirestore(mergedData));
                            setUserData(mergedData);
                            localStorage.removeItem(LOCAL_STORAGE_KEY);
                        } else {
                            setUserData({
                                ...INITIAL_DATA,
                                ...cloudData,
                                settings: {
                                    ...INITIAL_DATA.settings,
                                    ...(cloudData.settings || {})
                                }
                            });
                        }
                    } else {
                        const localData = getLocalData();
                        await setDoc(userDocRef, sanitizeForFirestore(localData));
                        setUserData(localData);
                        localStorage.removeItem(LOCAL_STORAGE_KEY);
                    }
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
