import {
    collection,
    doc,
    getDocs,
    setDoc,
    deleteDoc,
    query,
    orderBy,
    Timestamp,
    onSnapshot,
    Unsubscribe
} from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { Anime, WatchlistItem } from '../../types';

export interface FirebaseWatchlistItem extends Omit<WatchlistItem, 'addedAt'> {
    addedAt: Timestamp;
    status?: 'planning' | 'watching' | 'completed' | 'dropped' | 'on_hold';
}

/**
 * Get the current user's watchlist collection reference
 */
function getWatchlistCollection() {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    return collection(db, 'users', user.uid, 'watchlist');
}

/**
 * Fetch all items from the user's Firebase watchlist
 */
export async function getFirebaseWatchlist(): Promise<WatchlistItem[]> {
    try {
        const watchlistRef = getWatchlistCollection();
        const q = query(watchlistRef, orderBy('addedAt', 'desc'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data() as FirebaseWatchlistItem;
            return {
                ...data,
                addedAt: data.addedAt.toDate().toISOString(),
            };
        });
    } catch (error) {
        console.error('Failed to fetch Firebase watchlist:', error);
        return [];
    }
}

/**
 * Add an anime to the user's Firebase watchlist
 */
export async function addToFirebaseWatchlist(anime: Anime): Promise<void> {
    try {
        const watchlistRef = getWatchlistCollection();
        const docRef = doc(watchlistRef, anime.mal_id.toString());

        const item: FirebaseWatchlistItem = {
            mal_id: anime.mal_id,
            title: anime.title,
            image_url: anime.images.jpg.large_image_url,
            type: anime.type,
            episodes: anime.episodes,
            score: anime.score,
            addedAt: Timestamp.now(),
            status: 'planning',
        };

        await setDoc(docRef, item);
    } catch (error) {
        console.error('Failed to add to Firebase watchlist:', error);
        throw error;
    }
}

/**
 * Remove an anime from the user's Firebase watchlist
 */
export async function removeFromFirebaseWatchlist(mal_id: number): Promise<void> {
    try {
        const watchlistRef = getWatchlistCollection();
        const docRef = doc(watchlistRef, mal_id.toString());
        await deleteDoc(docRef);
    } catch (error) {
        console.error('Failed to remove from Firebase watchlist:', error);
        throw error;
    }
}

/**
 * Check if an anime is in the user's Firebase watchlist
 */
export async function isInFirebaseWatchlist(mal_id: number): Promise<boolean> {
    try {
        const watchlist = await getFirebaseWatchlist();
        return watchlist.some(item => item.mal_id === mal_id);
    } catch {
        return false;
    }
}

/**
 * Subscribe to real-time watchlist updates
 */
export function subscribeToWatchlist(
    callback: (items: WatchlistItem[]) => void
): Unsubscribe {
    try {
        const watchlistRef = getWatchlistCollection();
        const q = query(watchlistRef, orderBy('addedAt', 'desc'));

        return onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => {
                const data = doc.data() as FirebaseWatchlistItem;
                return {
                    ...data,
                    addedAt: data.addedAt.toDate().toISOString(),
                };
            });
            callback(items);
        });
    } catch (error) {
        console.error('Failed to subscribe to watchlist:', error);
        return () => { }; // Return empty unsubscribe function
    }
}

/**
 * Migrate local watchlist to Firebase (one-time sync on first login)
 */
export async function migrateLocalWatchlist(localItems: WatchlistItem[]): Promise<void> {
    const user = auth.currentUser;
    if (!user || localItems.length === 0) return;

    try {
        const watchlistRef = getWatchlistCollection();

        // Get existing Firebase items to avoid duplicates
        const existingItems = await getFirebaseWatchlist();
        const existingIds = new Set(existingItems.map(item => item.mal_id));

        // Only migrate items that don't already exist in Firebase
        const newItems = localItems.filter(item => !existingIds.has(item.mal_id));

        for (const item of newItems) {
            const docRef = doc(watchlistRef, item.mal_id.toString());
            const firebaseItem: FirebaseWatchlistItem = {
                ...item,
                addedAt: Timestamp.fromDate(new Date(item.addedAt)),
            };
            await setDoc(docRef, firebaseItem);
        }

        console.log(`Migrated ${newItems.length} items to Firebase watchlist`);
    } catch (error) {
        console.error('Failed to migrate local watchlist:', error);
    }
}
