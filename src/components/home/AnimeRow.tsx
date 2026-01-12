/**
 * AnimeRow Component
 * 
 * Horizontal scrolling row of anime cards with title and optional "View All" link.
 * Includes error state handling and loading placeholder.
 */

import React from 'react';
import { Anime } from '../../types';
import AnimeCard from '../AnimeCard';

// ============================================================================
// Types
// ============================================================================

export interface AnimeRowProps {
    /** Row title */
    title: string;
    /** Icon element to display next to title */
    icon?: React.ReactNode;
    /** Anime list to display */
    anime: Anime[];
    /** Error state - shows error message if true */
    hasError?: boolean;
    /** Error message to display */
    errorMessage?: string;
    /** Callback when anime card is clicked */
    onAnimeClick: (anime: Anime) => void;
    /** Callback when play button is clicked */
    onPlayClick?: (anime: Anime) => void;
    /** Callback when "View All" is clicked */
    onViewAllClick?: () => void;
    /** Callback when retry is clicked (for error state) */
    onRetry?: () => void;
    /** Callback when watchlist changes */
    onWatchlistChange?: () => void;
    /** Maximum number of items to show */
    maxItems?: number;
}

// ============================================================================
// Component
// ============================================================================

function AnimeRow({
    title,
    icon,
    anime,
    hasError = false,
    errorMessage = 'Failed to load. The API might be temporarily unavailable.',
    onAnimeClick,
    onPlayClick,
    onViewAllClick,
    onRetry,
    onWatchlistChange,
    maxItems = 10,
}: AnimeRowProps): React.ReactElement {
    // Error State
    if (hasError) {
        return (
            <section className="mb-12 animate-fade-in">
                <div className="content-row-header">
                    <h2 className="content-row-title flex items-center gap-2">
                        {icon}
                        {title}
                    </h2>
                </div>
                <div className="flex items-center gap-4 py-8 px-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5 text-orange-500"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                            />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-gray-400">{errorMessage}</p>
                    </div>
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className="px-4 py-2 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors text-sm font-medium"
                        >
                            Retry
                        </button>
                    )}
                </div>
            </section>
        );
    }

    // Normal Content
    return (
        <section className="mb-12 animate-fade-in">
            {/* Header */}
            <div className="content-row-header">
                <h2 className="content-row-title flex items-center gap-2">
                    {icon}
                    {title}
                </h2>
                {onViewAllClick && (
                    <button
                        onClick={onViewAllClick}
                        className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                    >
                        View All
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-4 h-4"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m8.25 4.5 7.5 7.5-7.5 7.5"
                            />
                        </svg>
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="horizontal-scroll gap-4 py-4">
                {anime.slice(0, maxItems).map((item) => (
                    <div key={item.mal_id} className="flex-shrink-0 w-56 md:w-64">
                        <AnimeCard
                            anime={item}
                            onClick={() => onAnimeClick(item)}
                            onPlayClick={onPlayClick ? () => onPlayClick(item) : undefined}
                            onWatchlistChange={onWatchlistChange}
                        />
                    </div>
                ))}
            </div>
        </section>
    );
}

export default AnimeRow;
