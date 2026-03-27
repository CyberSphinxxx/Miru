import { useCallback } from 'react';
import { Anime } from '../../types';
import { UserData, LibraryStatus, HistoryItem } from '../../types/user';

export const useAnimeLibrary = (
    userData: UserData,
    updateUserData: (newData: UserData) => void
) => {
    /**
     * Updates watch history for an anime/episode.
     * Automatically moves 'plan_to_watch' anime to 'watching'.
     */
    const updateHistory = useCallback((animeId: number, episodeId: string, timestamp: number) => {
        const newHistory = [...userData.history];
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
        let newLibrary = { ...userData.library };
        const planToWatchIndex = newLibrary.plan_to_watch.findIndex(e => e.anime.id === animeId);

        if (planToWatchIndex >= 0) {
            const entry = newLibrary.plan_to_watch[planToWatchIndex];
            const newPlanToWatch = [...newLibrary.plan_to_watch];
            newPlanToWatch.splice(planToWatchIndex, 1);

            const newWatching = [...newLibrary.watching];
            if (!newWatching.find(e => e.anime.id === animeId)) {
                newWatching.push({ ...entry, addedAt: new Date().toISOString() });
            }

            newLibrary = {
                ...newLibrary,
                plan_to_watch: newPlanToWatch,
                watching: newWatching,
            };
        }

        const newData = {
            ...userData,
            history: newHistory,
            library: newLibrary
        };

        updateUserData(newData);
    }, [userData, updateUserData]);

    /**
     * Adds real playback seconds to the cumulative watch time counter.
     */
    const addWatchTime = useCallback((seconds: number) => {
        if (seconds <= 0) return;
        const newData = {
            ...userData,
            totalWatchTimeSeconds: (userData.totalWatchTimeSeconds || 0) + seconds
        };
        updateUserData(newData);
    }, [userData, updateUserData]);

    /**
     * Adds or moves an anime to a specific list.
     */
    const updateStatus = useCallback((anime: Anime, newStatus: LibraryStatus) => {
        const newLibrary = { ...userData.library };
        const animeId = anime.id;

        // Remove from ALL lists
        (Object.keys(newLibrary) as LibraryStatus[]).forEach(status => {
            newLibrary[status] = newLibrary[status].filter(entry => entry.anime.id !== animeId);
        });

        // Add to the new list
        newLibrary[newStatus].push({
            anime,
            addedAt: new Date().toISOString()
        });

        const newData = {
            ...userData,
            library: newLibrary
        };

        updateUserData(newData);
    }, [userData, updateUserData]);

    /**
     * Removes an anime from the library entirely.
     */
    const removeFromLibrary = useCallback((animeId: number) => {
        const newLibrary = { ...userData.library };

        (Object.keys(newLibrary) as LibraryStatus[]).forEach(status => {
            newLibrary[status] = newLibrary[status].filter(entry => entry.anime.id !== animeId);
        });

        const newData = {
            ...userData,
            library: newLibrary
        };

        updateUserData(newData);
    }, [userData, updateUserData]);

    /**
     * Returns the current status of an anime.
     */
    const getAnimeStatus = useCallback((animeId: number): LibraryStatus | null => {
        const statuses = Object.keys(userData.library) as LibraryStatus[];

        for (const status of statuses) {
            if (userData.library[status].some(entry => entry.anime.id === animeId)) {
                return status;
            }
        }

        return null;
    }, [userData.library]);

    return {
        updateHistory,
        addWatchTime,
        updateStatus,
        removeFromLibrary,
        getAnimeStatus
    };
};
