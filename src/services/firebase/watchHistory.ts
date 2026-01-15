import {
    collection,
    doc,
    getDocs,
    setDoc,
    deleteDoc,
    query,
    orderBy,
    limit,
    Timestamp,
    onSnapshot,
    Unsubscribe
} from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { Anime } from '../../types';
import { WatchHistoryItem } from '../watchHistoryService';

const MAX_HISTORY_ITEMS = 50;

export interface FirebaseWatchHistoryItem extends Omit<WatchHistoryItem, 'lastWatched'> {
    lastWatched: Timestamp;
}

/**
 * Get the current user's watch history collection reference
 */
function getHistoryCollection() {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    return collection(db, 'users', user.uid, 'watchHistory');
}

/**
 * Fetch the user's watch history from Firebase
 */
export async function getFirebaseWatchHistory(): Promise<WatchHistoryItem[]> {
    try {
        const historyRef = getHistoryCollection();
        const q = query(historyRef, orderBy('lastWatched', 'desc'), limit(MAX_HISTORY_ITEMS));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data() as FirebaseWatchHistoryItem;
            return {
                ...data,
                lastWatched: data.lastWatched.toDate().toISOString(),
            };
        });
    } catch (error) {
        console.error('Failed to fetch Firebase watch history:', error);
        return [];
    }
}

/**
 * Save watch progress to Firebase
 */
export async function saveFirebaseWatchProgress(
    anime: Anime,
    episodeNumber: number,
    progress: number = 0
): Promise<void> {
    try {
        const historyRef = getHistoryCollection();
        const docRef = doc(historyRef, anime.mal_id.toString());

        const item: FirebaseWatchHistoryItem = {
            id: anime.id || anime.mal_id, // AniList ID for navigation
            mal_id: anime.mal_id,
            title: anime.title,
            image_url: anime.images.jpg.large_image_url || anime.images.jpg.image_url,
            type: anime.type || 'TV',
            episodes: anime.episodes,
            currentEpisode: episodeNumber,
            progress: Math.min(100, Math.max(0, progress)),
            lastWatched: Timestamp.now(),
        };

        await setDoc(docRef, item);
    } catch (error) {
        console.error('Failed to save watch progress to Firebase:', error);
        throw error;
    }
}

/**
 * Remove an item from Firebase watch history
 */
export async function removeFromFirebaseHistory(mal_id: number): Promise<void> {
    try {
        const historyRef = getHistoryCollection();
        const docRef = doc(historyRef, mal_id.toString());
        await deleteDoc(docRef);
    } catch (error) {
        console.error('Failed to remove from Firebase history:', error);
        throw error;
    }
}

/**
 * Subscribe to real-time watch history updates
 */
export function subscribeToWatchHistory(
    callback: (items: WatchHistoryItem[]) => void
): Unsubscribe {
    try {
        const historyRef = getHistoryCollection();
        const q = query(historyRef, orderBy('lastWatched', 'desc'), limit(MAX_HISTORY_ITEMS));

        return onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => {
                const data = doc.data() as FirebaseWatchHistoryItem;
                return {
                    ...data,
                    lastWatched: data.lastWatched.toDate().toISOString(),
                };
            });
            callback(items);
        });
    } catch (error) {
        console.error('Failed to subscribe to watch history:', error);
        return () => { };
    }
}

/**
 * Get last watched episode for an anime
 */
export async function getFirebaseLastWatchedEpisode(mal_id: number): Promise<number | null> {
    try {
        const history = await getFirebaseWatchHistory();
        const item = history.find(h => h.mal_id === mal_id);
        return item ? item.currentEpisode : null;
    } catch {
        return null;
    }
}

/**
 * Migrate local watch history to Firebase
 */
export async function migrateLocalWatchHistory(localItems: WatchHistoryItem[]): Promise<void> {
    const user = auth.currentUser;
    if (!user || localItems.length === 0) return;

    try {
        const historyRef = getHistoryCollection();

        // Get existing Firebase items
        const existingItems = await getFirebaseWatchHistory();

        // Only migrate items that don't exist or have newer timestamps
        for (const item of localItems) {
            const existingItem = existingItems.find(e => e.mal_id === item.mal_id);

            // Skip if Firebase has newer data
            if (existingItem && new Date(existingItem.lastWatched) > new Date(item.lastWatched)) {
                continue;
            }

            const docRef = doc(historyRef, item.mal_id.toString());
            const firebaseItem: FirebaseWatchHistoryItem = {
                ...item,
                lastWatched: Timestamp.fromDate(new Date(item.lastWatched)),
            };
            await setDoc(docRef, firebaseItem);
        }

        console.log('Migrated local watch history to Firebase');
    } catch (error) {
        console.error('Failed to migrate local watch history:', error);
    }
}
