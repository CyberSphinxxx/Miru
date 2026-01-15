import { useState, useEffect } from 'react';
import { Genre } from '../types';
import { getGenreCoverImage, getGenreGradient, DEFAULT_IMAGE } from '../services/api/genreImages';
import { animeService } from '../services/api';

interface GenreCardProps {
    genre: Genre;
    onClick: () => void;
    index: number;
}

function GenreCard({ genre, onClick, index }: GenreCardProps) {
    // Static images - no async needed, just get the curated image directly
    const staticImage = getGenreCoverImage(genre.name);

    // Initialize with cached image if available, otherwise static or default
    const [coverImage, setCoverImage] = useState<string>(() => {
        const cached = localStorage.getItem(`genre_img_${genre.mal_id}`);
        return cached || staticImage;
    });

    const [isLoading, setIsLoading] = useState(true);
    const [hasAttemptedDynamicFetch, setHasAttemptedDynamicFetch] = useState(false);

    const handleImageError = () => {
        // If the image fails to load, use the default fallback image
        // But do NOT block dynamic fetch if we haven't tried it yet
        setCoverImage(DEFAULT_IMAGE);
    };

    // Self-healing: If we are using the default image (either initially or after error),
    // try to fetch the most popular anime for this genre dynamically.
    useEffect(() => {
        // Only try dynamic fetch if:
        // 1. We are using the default image
        // 2. We haven't tried fetching yet
        // 3. We don't have a cached value (though useState check covers initialization, we check again to be safe)
        const isDefault = coverImage === DEFAULT_IMAGE;

        if (isDefault && !hasAttemptedDynamicFetch) {
            // Stagger requests to avoid API rate limits
            // Use index to delay: e.g. 0ms, 300ms, 600ms...
            const delay = index * 200;

            const timer = setTimeout(() => {
                const fetchDynamicImage = async () => {
                    setHasAttemptedDynamicFetch(true);

                    // distinct check before network call
                    if (localStorage.getItem(`genre_img_${genre.mal_id}`)) return;

                    try {
                        // Fetch top 1 anime by popularity for this genre
                        const result = await animeService.searchAnime(genre.name, 1);
                        if (result.data && result.data.length > 0) {
                            const topAnime = result.data[0];
                            const newImage = topAnime.images.jpg.large_image_url || topAnime.images.jpg.image_url;

                            if (newImage) {
                                console.log(`[GenreCard] Dynamic fetch for "${genre.name}": Found "${topAnime.title}"`);
                                setCoverImage(newImage);
                                // Cache it so we don't hit API next time
                                localStorage.setItem(`genre_img_${genre.mal_id}`, newImage);
                            }
                        }
                    } catch (err) {
                        console.error(`[GenreCard] Failed to fetch dynamic image for ${genre.name}`, err);
                    }
                };
                fetchDynamicImage();
            }, delay);

            return () => clearTimeout(timer);
        }
    }, [coverImage, hasAttemptedDynamicFetch, genre.name, genre.mal_id, index]);

    const fallbackGradient = getGenreGradient(genre.name);

    return (
        <button
            onClick={onClick}
            className="genre-card genre-card-animate group"
            style={{ '--index': index } as React.CSSProperties}
        >
            {/* Background Layer */}
            <div className="absolute inset-0">
                {/* Shimmer Loading State */}
                {isLoading && (
                    <div
                        className="absolute inset-0 animate-pulse"
                        style={{ background: fallbackGradient }}
                    />
                )}

                {/* Cover Image - Always show since we always have a URL */}
                <img
                    src={coverImage}
                    alt=""
                    onError={handleImageError}
                    className={`genre-card-bg absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                    onLoad={() => setIsLoading(false)}
                />

                {/* Dark Overlay */}
                <div className="genre-card-overlay absolute inset-0" />

                {/* Glass Border Effect */}
                <div className="absolute inset-0 rounded-2xl border border-white/10 group-hover:border-miru-accent/60 transition-colors duration-300" />
            </div>

            {/* Content Layer */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center p-4">
                {/* Genre Name */}
                <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider text-center drop-shadow-lg group-hover:scale-105 transition-transform duration-300">
                    {genre.name}
                </h3>

                {/* Anime Count Badge */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-xs text-gray-300 border border-white/10 font-medium">
                        {genre.count.toLocaleString()} anime
                    </span>
                </div>
            </div>
        </button>
    );
}

export default GenreCard;
