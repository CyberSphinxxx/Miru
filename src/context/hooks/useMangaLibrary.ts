import { useCallback } from 'react';
import { Manga } from '../../types/manga';
import { UserData, MangaLibraryStatus } from '../../types/user';
import { INITIAL_DATA } from '../userUtils';

export const useMangaLibrary = (
    userData: UserData,
    updateUserData: (newData: UserData) => void
) => {
    /**
     * Adds or moves a manga to a specific list.
     */
    const updateMangaStatus = useCallback((manga: Manga, newStatus: MangaLibraryStatus) => {
        const newMangaLibrary = { ...(userData.mangaLibrary || INITIAL_DATA.mangaLibrary) };
        const mangaId = manga.id;

        // Remove from ALL lists
        (Object.keys(newMangaLibrary) as MangaLibraryStatus[]).forEach(status => {
            newMangaLibrary[status] = (newMangaLibrary[status] || []).filter(entry => entry.manga.id !== mangaId);
        });

        // Add to the new list
        newMangaLibrary[newStatus].push({
            manga,
            addedAt: new Date().toISOString()
        });

        const newData = {
            ...userData,
            mangaLibrary: newMangaLibrary
        };

        updateUserData(newData);
    }, [userData, updateUserData]);

    /**
     * Removes a manga from the library entirely.
     */
    const removeFromMangaLibrary = useCallback((mangaId: number) => {
        const newMangaLibrary = { ...(userData.mangaLibrary || INITIAL_DATA.mangaLibrary) };

        (Object.keys(newMangaLibrary) as MangaLibraryStatus[]).forEach(status => {
            newMangaLibrary[status] = (newMangaLibrary[status] || []).filter(entry => entry.manga.id !== mangaId);
        });

        const newData = {
            ...userData,
            mangaLibrary: newMangaLibrary
        };

        updateUserData(newData);
    }, [userData, updateUserData]);

    /**
     * Returns the current status of a manga.
     */
    const getMangaStatus = useCallback((mangaId: number): MangaLibraryStatus | null => {
        const mangaLibrary = userData.mangaLibrary || INITIAL_DATA.mangaLibrary;
        const statuses = Object.keys(mangaLibrary) as MangaLibraryStatus[];

        for (const status of statuses) {
            if ((mangaLibrary[status] || []).some(entry => entry.manga.id === mangaId)) {
                return status;
            }
        }

        return null;
    }, [userData.mangaLibrary]);

    return {
        updateMangaStatus,
        removeFromMangaLibrary,
        getMangaStatus
    };
};
