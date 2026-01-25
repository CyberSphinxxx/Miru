import React, { useState, useRef } from 'react';
import { Movie } from '../types/tmdb';

import MovieQuickAddDropdown from './MovieQuickAddDropdown';

const TMDB_GENRES: Record<number, string> = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
    99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
    27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
    10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
};

interface MovieCardProps {
    movie: Movie;
    onClick: () => void;
    onPlayClick?: () => void;
    onDelete?: () => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick, onPlayClick, onDelete }) => {

    const [isHovered, setIsHovered] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        setIsHovered(true);
        hoverTimeoutRef.current = setTimeout(() => {
            setShowDetails(true);
        }, 300);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        setShowDetails(false);
    };

    React.useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        };
    }, []);

    const handlePlayClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onPlayClick?.();
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete?.();
    };





    // Image logic: TMDB uses poster_path, need to construct URL
    const imageUrl = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : 'https://via.placeholder.com/300x450?text=No+Poster';

    return (
        <div
            ref={cardRef}
            className="relative group"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Main Card */}
            <div
                className={`relative rounded-xl overflow-hidden bg-miru-surface cursor-pointer transition-all duration-300 ${isHovered ? 'scale-105 shadow-2xl shadow-miru-primary/20 z-20' : 'shadow-lg shadow-black/20'}`}
                onClick={onClick}
            >
                {/* Image */}
                <div className="relative aspect-[2/3] overflow-hidden">
                    <img
                        src={imageUrl}
                        alt={movie.title}
                        className={`w-full h-full object-cover transition-all duration-500 ${showDetails ? 'scale-110 brightness-[0.3]' : isHovered ? 'scale-105 brightness-90' : 'scale-100'}`}
                        loading="lazy"
                    />

                    {/* Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20 transition-opacity duration-300 ${showDetails ? 'opacity-90' : 'opacity-60'}`} />

                    {/* Score Badge - Hidden on detail view */}
                    {movie.vote_average > 0 && !showDetails && (
                        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-yellow-400">
                                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs font-bold text-white">{movie.vote_average.toFixed(1)}</span>
                        </div>
                    )}

                    {/* Default Bottom Info - Visible when NOT showing details */}
                    <div className={`absolute bottom-0 left-0 right-0 p-3 transition-all duration-300 ${showDetails ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
                        <h3 className="text-sm font-bold text-white line-clamp-2 mb-1.5 drop-shadow-lg">{movie.title}</h3>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-medium text-white/80">
                                {new Date(movie.release_date).getFullYear() || 'TBA'}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-medium text-white/80">
                                Movie
                            </span>
                        </div>
                    </div>

                    {/* Overlay Details */}
                    <div
                        className={`absolute inset-0 flex flex-col justify-between p-3 transition-all duration-300 ${showDetails ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Top Section - Title and Meta */}
                        <div className="relative pr-6">
                            {onDelete && (
                                <button
                                    onClick={handleDeleteClick}
                                    className="absolute -top-1 -right-0 p-1.5 hover:bg-red-500/80 rounded-full text-white/50 hover:text-white transition-all z-20"
                                    title="Delete"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                            <h4 className="font-bold text-white text-sm mb-2 line-clamp-2 drop-shadow-lg pr-4">{movie.title}</h4>

                            {/* Meta Row */}
                            <div className="flex items-center gap-1.5 flex-wrap mb-2">
                                {movie.vote_average > 0 && (
                                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-[10px] font-medium">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5">
                                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                        </svg>
                                        {movie.vote_average.toFixed(1)}
                                    </span>
                                )}
                                <span className="px-1.5 py-0.5 rounded bg-miru-primary/20 text-miru-primary text-[10px] font-medium">HD</span>
                                <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/80 text-[10px] font-medium">
                                    {new Date(movie.release_date).getFullYear() || 'TBA'}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/80 text-[10px] font-medium">Movie</span>
                            </div>

                            <p className="text-gray-300 text-[11px] line-clamp-4 leading-relaxed">
                                {movie.overview || 'No overview available.'}
                            </p>
                        </div>

                        {/* Bottom Section */}
                        <div>
                            {/* Extra Info: Japanese & Status */}
                            <div className="mb-2 space-y-0.5">
                                <div className="flex items-center gap-2 text-[10px]">
                                    <span className="text-gray-400">Original:</span>
                                    <span className="text-white/90 truncate max-w-[150px]">{movie.original_title}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px]">
                                    <span className="text-gray-400">Status:</span>
                                    <span className="text-white/90 font-medium">Released</span>
                                </div>
                            </div>

                            {/* Genres */}
                            <div className="flex flex-wrap gap-1 mb-2">
                                {movie.genre_ids?.slice(0, 3).map(id => {
                                    const genreName = TMDB_GENRES[id];
                                    if (!genreName) return null;
                                    return (
                                        <span key={id} className="px-1.5 py-0.5 rounded-full bg-miru-primary/20 text-miru-primary text-[9px] font-medium">
                                            {genreName}
                                        </span>
                                    );
                                })}
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onClick(); }}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-medium transition-all shadow-lg backdrop-blur-sm group/btn"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 transition-transform group-hover/btn:scale-110">
                                        <path fillRule="evenodd" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" clipRule="evenodd" />
                                    </svg>
                                    Details
                                </button>
                                <button
                                    onClick={handlePlayClick}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-miru-accent hover:bg-miru-accent/90 text-white text-xs font-medium transition-all shadow-lg group/btn"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 transition-transform group-hover/btn:scale-110">
                                        <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                                    </svg>
                                    Watch
                                </button>
                                <MovieQuickAddDropdown movie={movie} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Glow Effect */}
            <div className={`absolute -inset-1 rounded-xl bg-gradient-to-r from-miru-primary to-miru-accent opacity-0 blur-xl transition-opacity duration-500 -z-10 ${isHovered ? 'opacity-30' : ''}`} />
        </div>
    );
};

export default React.memo(MovieCard);
