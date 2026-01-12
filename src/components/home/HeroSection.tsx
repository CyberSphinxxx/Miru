/**
 * HeroSection Component
 * 
 * Featured anime showcase with backdrop, metadata, and action buttons.
 * Used on the home page to highlight a featured anime.
 */

import React from 'react';
import { Anime } from '../../types';

// ============================================================================
// Types
// ============================================================================

export interface HeroSectionProps {
    /** The featured anime to display */
    featuredAnime: Anime;
    /** Callback when "Watch Now" is clicked */
    onWatchClick: (anime: Anime) => void;
    /** Callback when "Details" is clicked */
    onDetailsClick: (anime: Anime) => void;
}

// ============================================================================
// Component
// ============================================================================

function HeroSection({
    featuredAnime,
    onWatchClick,
    onDetailsClick,
}: HeroSectionProps): React.ReactElement {
    const handleWatchNow = (e: React.MouseEvent) => {
        e.stopPropagation();
        onWatchClick(featuredAnime);
    };

    const handleDetails = () => {
        onDetailsClick(featuredAnime);
    };

    return (
        <section className="relative h-[75vh] min-h-[500px] overflow-hidden">
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: `url(${featuredAnime.images.jpg.large_image_url})`,
                    backgroundPosition: 'center 20%',
                }}
            />

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-miru-bg via-miru-bg/90 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-miru-bg via-miru-bg/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-miru-bg to-transparent" />
            <div className="absolute inset-0 bg-black/20" />

            {/* Content */}
            <div className="relative z-10 h-full flex items-end pb-16">
                <div className="container mx-auto px-6">
                    <div className="max-w-2xl">
                        {/* Spotlight Badge */}
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 rounded-md bg-miru-accent text-xs font-bold text-white">
                                #1 Spotlight
                            </span>
                        </div>

                        {/* Title */}
                        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-4 drop-shadow-2xl">
                            {featuredAnime.title}
                        </h1>

                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-sm text-gray-300 mb-4">
                            <span className="flex items-center gap-1">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="w-4 h-4 text-yellow-400"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span className="font-bold text-yellow-400">
                                    {featuredAnime.score}
                                </span>
                            </span>
                            <span className="text-gray-500">•</span>
                            <span>{featuredAnime.type}</span>
                            {featuredAnime.episodes && (
                                <>
                                    <span className="text-gray-500">•</span>
                                    <span>{featuredAnime.episodes} eps</span>
                                </>
                            )}
                            <span className="px-2 py-0.5 rounded bg-white/10 text-xs">
                                HD
                            </span>
                        </div>

                        {/* Genre Pills */}
                        {featuredAnime.genres && featuredAnime.genres.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {featuredAnime.genres.slice(0, 4).map((genre) => (
                                    <span key={genre.mal_id} className="genre-pill">
                                        {genre.name}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Synopsis */}
                        <p
                            className="text-gray-300 text-base mb-6 line-clamp-3 leading-relaxed"
                            style={{ maxWidth: '600px' }}
                        >
                            {featuredAnime.synopsis}
                        </p>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleWatchNow}
                                className="flex items-center gap-2 px-6 py-3 rounded-full bg-miru-accent hover:bg-miru-accent/90 text-white font-bold transition-all hover:scale-105"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="w-5 h-5"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                Watch Now
                            </button>
                            <button
                                onClick={handleDetails}
                                className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium hover:bg-white/20 transition-all"
                            >
                                Detail
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
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default HeroSection;
