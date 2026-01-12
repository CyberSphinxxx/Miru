import { useState } from 'react';
import { Genre } from '../types';
import { getGenreCoverImage, getGenreGradient } from '../services/api/genreImages';

interface GenreCardProps {
    genre: Genre;
    onClick: () => void;
    index: number;
}

function GenreCard({ genre, onClick, index }: GenreCardProps) {
    // Static images - no async needed, just get the curated image directly
    const staticImage = getGenreCoverImage(genre.name);
    console.log(`[GenreCard] Genre: "${genre.name}", Image: ${staticImage}`);
    const [coverImage, setCoverImage] = useState<string>(staticImage);
    const [isLoading, setIsLoading] = useState(true);

    const handleImageError = () => {
        // If the image fails to load, use Action's image as ultimate fallback
        setCoverImage(getGenreCoverImage('Action'));
    };

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
