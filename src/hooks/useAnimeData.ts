/**
 * useAnimeData Hook
 * 
 * Custom hook for fetching anime data with loading and error states.
 * Encapsulates the common pattern of fetching anime info from the API.
 */

import { useState, useEffect, useCallback } from 'react';
import { Anime, Episode, Character, Recommendation } from '../types';
import { getAnimeInfo } from '../services/api';

// ============================================================================
// Types
// ============================================================================

export interface AnimeDataState {
    /** The anime details */
    anime: Anime | null;
    /** List of episodes */
    episodes: Episode[];
    /** List of characters */
    characters: Character[];
    /** List of recommendations */
    recommendations: Recommendation[];
    /** Whether data is currently loading */
    isLoading: boolean;
    /** Error message if fetch failed */
    error: string | null;
}

export interface UseAnimeDataReturn extends AnimeDataState {
    /** Refetch the anime data */
    refetch: () => Promise<void>;
}

// ============================================================================
// Hook
// ============================================================================

export function useAnimeData(id: string | number | undefined): UseAnimeDataReturn {
    const [state, setState] = useState<AnimeDataState>({
        anime: null,
        episodes: [],
        characters: [],
        recommendations: [],
        isLoading: true,
        error: null,
    });

    const fetchData = useCallback(async () => {
        if (!id) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: 'No anime ID provided',
            }));
            return;
        }

        setState(prev => ({
            ...prev,
            isLoading: true,
            error: null,
        }));

        try {
            const result = await getAnimeInfo(id);

            if (!result) {
                setState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: 'Anime not found',
                }));
                return;
            }

            setState({
                anime: result.anime,
                episodes: result.episodes,
                characters: result.characters,
                recommendations: result.recommendations,
                isLoading: false,
                error: null,
            });
        } catch (err) {
            console.error('[useAnimeData] Fetch error:', err);
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: err instanceof Error ? err.message : 'Failed to load anime data',
            }));
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        ...state,
        refetch: fetchData,
    };
}

export default useAnimeData;
