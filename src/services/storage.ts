/**
 * Unified Storage Service
 * 
 * Automatically uses Firebase when authenticated, localStorage when guest.
 * Provides seamless data persistence regardless of auth state.
 */

import { auth } from '../lib/firebase';
import { Anime, WatchlistItem } from '../types';

// Local storage services
import * as localWatchlist from './watchlistService';
import * as localHistory from './watchHistoryService';
import { WatchHistoryItem } from './watchHistoryService';

// Firebase services
import * as firebaseWatchlist from './firebase/watchlist';
import * as firebaseHistory from './firebase/watchHistory';

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
    return auth.currentUser !== null;
}

// ============================================
// WATCHLIST OPERATIONS
// ============================================

/**
 * Get watchlist from appropriate storage
 */
export async function getWatchlist(): Promise<WatchlistItem[]> {
    if (isAuthenticated()) {
        return firebaseWatchlist.getFirebaseWatchlist();
    }
    return localWatchlist.getWatchlist();
}

/**
 * Add to watchlist in appropriate storage
 */
export async function addToWatchlist(anime: Anime): Promise<void> {
    if (isAuthenticated()) {
        await firebaseWatchlist.addToFirebaseWatchlist(anime);
    } else {
        localWatchlist.addToWatchlist(anime);
    }
}

/**
 * Remove from watchlist in appropriate storage
 */
export async function removeFromWatchlist(mal_id: number): Promise<void> {
    if (isAuthenticated()) {
        await firebaseWatchlist.removeFromFirebaseWatchlist(mal_id);
    } else {
        localWatchlist.removeFromWatchlist(mal_id);
    }
}

/**
 * Check if anime is in watchlist
 */
export async function isInWatchlist(mal_id: number): Promise<boolean> {
    if (isAuthenticated()) {
        return firebaseWatchlist.isInFirebaseWatchlist(mal_id);
    }
    return localWatchlist.isInWatchlist(mal_id);
}

/**
 * Toggle watchlist status
 */
export async function toggleWatchlist(anime: Anime): Promise<boolean> {
    const inList = await isInWatchlist(anime.mal_id);
    if (inList) {
        await removeFromWatchlist(anime.mal_id);
        return false;
    } else {
        await addToWatchlist(anime);
        return true;
    }
}

// ============================================
// WATCH HISTORY OPERATIONS
// ============================================

/**
 * Get watch history from appropriate storage
 */
export async function getWatchHistory(): Promise<WatchHistoryItem[]> {
    if (isAuthenticated()) {
        return firebaseHistory.getFirebaseWatchHistory();
    }
    return localHistory.getWatchHistory();
}

/**
 * Save watch progress to appropriate storage
 */
export async function saveWatchProgress(
    anime: Anime,
    episodeNumber: number,
    progress: number = 0
): Promise<void> {
    if (isAuthenticated()) {
        await firebaseHistory.saveFirebaseWatchProgress(anime, episodeNumber, progress);
    } else {
        localHistory.saveWatchProgress(anime, episodeNumber, progress);
    }
}

/**
 * Remove from watch history
 */
export async function removeFromHistory(mal_id: number): Promise<void> {
    if (isAuthenticated()) {
        await firebaseHistory.removeFromFirebaseHistory(mal_id);
    } else {
        localHistory.removeFromHistory(mal_id);
    }
}

/**
 * Get last watched episode
 */
export async function getLastWatchedEpisode(mal_id: number): Promise<number | null> {
    if (isAuthenticated()) {
        return firebaseHistory.getFirebaseLastWatchedEpisode(mal_id);
    }
    return localHistory.getLastWatchedEpisode(mal_id);
}

// ============================================
// MIGRATION (On First Login)
// ============================================

/**
 * Migrate all local data to Firebase when user logs in
 */
export async function migrateLocalDataToCloud(): Promise<void> {
    if (!isAuthenticated()) return;

    try {
        // Migrate watchlist
        const localWatchlistItems = localWatchlist.getWatchlist();
        if (localWatchlistItems.length > 0) {
            await firebaseWatchlist.migrateLocalWatchlist(localWatchlistItems);
        }

        // Migrate watch history
        const localHistoryItems = localHistory.getWatchHistory();
        if (localHistoryItems.length > 0) {
            await firebaseHistory.migrateLocalWatchHistory(localHistoryItems);
        }

        console.log('✅ Local data migrated to cloud');
    } catch (error) {
        console.error('Failed to migrate local data:', error);
    }
}
