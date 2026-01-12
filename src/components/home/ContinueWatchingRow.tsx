/**
 * ContinueWatchingRow Component
 * 
 * Horizontal scrolling row showing recently watched anime with progress indicators.
 */

import React from 'react';
import { WatchHistoryItem } from '../../services/watchHistoryService';

// ============================================================================
// Types
// ============================================================================

export interface ContinueWatchingRowProps {
    /** Watch history items to display */
    items: WatchHistoryItem[];
    /** Callback when an item is clicked */
    onItemClick: (item: WatchHistoryItem) => void;
    /** Maximum number of items to show (default: 10) */
    maxItems?: number;
}

// ============================================================================
// Component
// ============================================================================

function ContinueWatchingRow({
    items,
    onItemClick,
    maxItems = 10,
}: ContinueWatchingRowProps): React.ReactElement | null {
    if (items.length === 0) {
        return null;
    }

    return (
        <section className="mb-12 animate-fade-in">
            {/* Header */}
            <div className="content-row-header">
                <h2 className="content-row-title flex items-center gap-2">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5 text-miru-primary"
                    >
                        <path
                            fillRule="evenodd"
                            d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm14.024-.983a1.125 1.125 0 0 1 0 1.966l-5.603 3.113A1.125 1.125 0 0 1 9 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113Z"
                            clipRule="evenodd"
                        />
                    </svg>
                    Continue Watching
                </h2>
            </div>

            {/* Horizontal Scroll Container */}
            <div className="horizontal-scroll">
                {items.slice(0, maxItems).map((item) => (
                    <div
                        key={item.mal_id}
                        onClick={() => onItemClick(item)}
                        className="flex-shrink-0 w-72 landscape-card group cursor-pointer"
                    >
                        {/* Thumbnail */}
                        <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                        {/* Content */}
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                            <p className="text-xs text-miru-primary font-medium mb-1">
                                Episode {item.currentEpisode}
                            </p>
                            <h3 className="font-bold text-white text-sm line-clamp-1 landscape-card-title">
                                {item.title}
                            </h3>
                        </div>

                        {/* Progress Bar */}
                        <div
                            className="progress-overlay"
                            style={
                                { '--progress': `${item.progress}%` } as React.CSSProperties
                            }
                        />
                    </div>
                ))}
            </div>
        </section>
    );
}

export default ContinueWatchingRow;
