import React, { useState, useRef, useEffect } from 'react';
import { Anime } from '../types';
import { isInWatchlist, toggleWatchlist } from '../services/watchlistService';

interface AnimeCardProps {
    anime: Anime;
    onClick: () => void;
    onPlayClick?: () => void;
    onWatchlistChange?: () => void;
}

const AnimeCard: React.FC<AnimeCardProps> = ({ anime, onClick, onPlayClick, onWatchlistChange }) => {

    const [isHovered, setIsHovered] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [inWatchlist, setInWatchlist] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setInWatchlist(isInWatchlist(anime.mal_id));
    }, [anime.mal_id]);

    const handleMouseEnter = () => {
        setIsHovered(true);
        // Delay showing details overlay
        hoverTimeoutRef.current = setTimeout(() => {
            setShowDetails(true);
        }, 300);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
        setShowDetails(false);
    };

    const handleWatchlistClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const nowInList = toggleWatchlist(anime);
        setInWatchlist(nowInList);
        onWatchlistChange?.();
    };

    const handlePlayClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onPlayClick?.();
    };

    return (
        <div
            ref={cardRef}
            className="relative group"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Main Card */}
            <div
                className={`relative rounded-xl overflow-hidden bg-miru-surface cursor-pointer transition-all duration-300 ${isHovered ? 'scale-105 shadow-2xl shadow-miru-primary/20 z-20' : 'shadow-lg shadow-black/20'
                    }`}
                onClick={onClick}
            >
                {/* Image */}
                <div className="relative aspect-[2/3] overflow-hidden">
                    <img
                        src={anime.images.jpg.large_image_url}
                        alt={anime.title}
                        className={`w-full h-full object-cover transition-all duration-500 ${showDetails ? 'scale-110 brightness-[0.3]' : isHovered ? 'scale-105 brightness-90' : 'scale-100'
                            }`}
                        loading="lazy"
                    />

                    {/* Gradient Overlay - Always present, stronger on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20 transition-opacity duration-300 ${showDetails ? 'opacity-90' : 'opacity-60'
                        }`} />

                    {/* Score Badge - Hidden when showing details */}
                    {anime.score > 0 && !showDetails && (
                        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-yellow-400">
                                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs font-bold text-white">{anime.score}</span>
                        </div>
                    )}

                    {/* Rank Badge - Hidden when showing details */}
                    {anime.rank && anime.rank <= 100 && !showDetails && (
                        <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-gradient-to-r from-miru-primary to-miru-accent text-xs font-bold text-white shadow-lg">
                            #{anime.rank}
                        </div>
                    )}

                    {/* Default Bottom Info - Visible when NOT showing details */}
                    <div className={`absolute bottom-0 left-0 right-0 p-3 transition-all duration-300 ${showDetails ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
                        }`}>
                        <h3 className="text-sm font-bold text-white line-clamp-2 mb-1.5 drop-shadow-lg">
                            {anime.title}
                        </h3>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {anime.type && (
                                <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-medium text-white/80">
                                    {anime.type}
                                </span>
                            )}
                            {anime.episodes && (
                                <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-medium text-white/80">
                                    {anime.episodes} eps
                                </span>
                            )}
                        </div>
                    </div>

                    {/* In-Card Details Overlay - Visible on hover */}
                    <div
                        className={`absolute inset-0 flex flex-col justify-between p-3 transition-all duration-300 ${showDetails ? 'opacity-100' : 'opacity-0 pointer-events-none'
                            }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Top Section - Title and Meta */}
                        <div>
                            <h4 className="font-bold text-white text-sm mb-2 line-clamp-2 drop-shadow-lg">
                                {anime.title}
                            </h4>

                            {/* Meta row */}
                            <div className="flex items-center gap-1.5 flex-wrap mb-2">
                                {anime.score > 0 && (
                                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-[10px] font-medium">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5">
                                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                        </svg>
                                        {anime.score}
                                    </span>
                                )}
                                <span className="px-1.5 py-0.5 rounded bg-miru-primary/20 text-miru-primary text-[10px] font-medium">HD</span>
                                {anime.episodes && (
                                    <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/80 text-[10px] font-medium">
                                        {anime.episodes} eps
                                    </span>
                                )}
                                <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/80 text-[10px] font-medium">
                                    {anime.type}
                                </span>
                            </div>

                            {/* Synopsis */}
                            {anime.synopsis && (
                                <p className="text-gray-300 text-[11px] line-clamp-4 leading-relaxed">
                                    {anime.synopsis}
                                </p>
                            )}
                        </div>

                        {/* Bottom Section - Info and Buttons */}
                        <div>
                            {/* Extra Info: Japanese & Status */}
                            <div className="mb-2 space-y-0.5">
                                {anime.title_japanese && (
                                    <div className="flex items-center gap-2 text-[10px]">
                                        <span className="text-gray-400">Japanese:</span>
                                        <span className="text-white/90 truncate max-w-[150px]">{anime.title_japanese}</span>
                                    </div>
                                )}
                                {anime.status && (
                                    <div className="flex items-center gap-2 text-[10px]">
                                        <span className="text-gray-400">Status:</span>
                                        <span className={`font-medium ${anime.status.includes('Airing') ? 'text-miru-primary' : 'text-white/90'}`}>
                                            {anime.status}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Genres */}
                            {anime.genres && anime.genres.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                    {anime.genres.slice(0, 3).map(g => (
                                        <span
                                            key={g.mal_id}
                                            className="px-1.5 py-0.5 rounded-full bg-miru-primary/20 text-miru-primary text-[9px] font-medium"
                                        >
                                            {g.name}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handlePlayClick}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-miru-accent hover:bg-miru-accent/90 text-white text-xs font-medium transition-all shadow-lg"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                                        <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                                    </svg>
                                    Watch now
                                </button>
                                <button
                                    onClick={handleWatchlistClick}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all shadow-lg ${inWatchlist
                                        ? 'bg-miru-primary/30 border-miru-primary text-miru-primary'
                                        : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
                                        }`}
                                    title={inWatchlist ? 'Remove from list' : 'Add to list'}
                                >
                                    {inWatchlist ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                            <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 0 1 1.04-.208Z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Glow Effect */}
            <div className={`absolute -inset-1 rounded-xl bg-gradient-to-r from-miru-primary to-miru-accent opacity-0 blur-xl transition-opacity duration-500 -z-10 ${isHovered ? 'opacity-30' : ''
                }`} />
        </div>
    );
};

export default AnimeCard;
