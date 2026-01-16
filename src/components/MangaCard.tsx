import React, { useState, useRef } from 'react';
import { Manga } from '../types/manga';

interface MangaCardProps {
    manga: Manga;
    onClick: () => void;
    onReadClick?: () => void;
}

/**
 * MangaCard Component
 * 
 * Displays a manga with cover image, title, score, chapters/volumes.
 * Adapted from AnimeCard with manga-specific fields.
 */
const MangaCard: React.FC<MangaCardProps> = ({ manga, onClick, onReadClick }) => {
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
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
        setShowDetails(false);
    };

    const handleReadClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onReadClick?.();
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
                        src={manga.images.jpg.large_image_url}
                        alt={manga.title}
                        className={`w-full h-full object-cover transition-all duration-500 ${showDetails ? 'scale-110 brightness-[0.3]' : isHovered ? 'scale-105 brightness-90' : 'scale-100'
                            }`}
                        loading="lazy"
                    />

                    {/* Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20 transition-opacity duration-300 ${showDetails ? 'opacity-90' : 'opacity-60'
                        }`} />

                    {/* Score Badge - Hidden when showing details */}
                    {manga.score > 0 && !showDetails && (
                        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-yellow-400">
                                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs font-bold text-white">{manga.score}</span>
                        </div>
                    )}

                    {/* Rank Badge */}
                    {manga.rank && manga.rank <= 100 && !showDetails && (
                        <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-gradient-to-r from-miru-primary to-miru-accent text-xs font-bold text-white shadow-lg">
                            #{manga.rank}
                        </div>
                    )}

                    {/* Default Bottom Info - Visible when NOT showing details */}
                    <div className={`absolute bottom-0 left-0 right-0 p-3 transition-all duration-300 ${showDetails ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
                        }`}>
                        <h3 className="text-sm font-bold text-white line-clamp-2 mb-1.5 drop-shadow-lg">
                            {manga.title}
                        </h3>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {manga.type && (
                                <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-medium text-white/80">
                                    {manga.type}
                                </span>
                            )}
                            {manga.chapters && (
                                <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-medium text-white/80">
                                    {manga.chapters} ch
                                </span>
                            )}
                            {manga.volumes && (
                                <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-medium text-white/80">
                                    {manga.volumes} vol
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
                        <div className="relative">
                            <h4 className="font-bold text-white text-sm mb-2 line-clamp-2 drop-shadow-lg">
                                {manga.title}
                            </h4>

                            {/* Meta row */}
                            <div className="flex items-center gap-1.5 flex-wrap mb-2">
                                {manga.score > 0 && (
                                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-[10px] font-medium">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5">
                                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                        </svg>
                                        {manga.score}
                                    </span>
                                )}
                                {manga.chapters && (
                                    <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/80 text-[10px] font-medium">
                                        {manga.chapters} ch
                                    </span>
                                )}
                                {manga.volumes && (
                                    <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/80 text-[10px] font-medium">
                                        {manga.volumes} vol
                                    </span>
                                )}
                                <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/80 text-[10px] font-medium">
                                    {manga.type}
                                </span>
                            </div>

                            {/* Synopsis */}
                            {manga.synopsis && (
                                <p className="text-gray-300 text-[11px] line-clamp-4 leading-relaxed">
                                    {manga.synopsis}
                                </p>
                            )}
                        </div>

                        {/* Bottom Section - Info and Buttons */}
                        <div>
                            {/* Extra Info */}
                            <div className="mb-2 space-y-0.5">
                                {manga.title_japanese && (
                                    <div className="flex items-center gap-2 text-[10px]">
                                        <span className="text-gray-400">Japanese:</span>
                                        <span className="text-white/90 truncate max-w-[150px]">{manga.title_japanese}</span>
                                    </div>
                                )}
                                {manga.status && (
                                    <div className="flex items-center gap-2 text-[10px]">
                                        <span className="text-gray-400">Status:</span>
                                        <span className={`font-medium ${manga.status.includes('RELEASING') ? 'text-miru-primary' : 'text-white/90'}`}>
                                            {manga.status}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Genres */}
                            {manga.genres && manga.genres.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                    {manga.genres.slice(0, 3).map(g => (
                                        <span
                                            key={g.mal_id || g.name}
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
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onClick();
                                    }}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-medium transition-all shadow-lg backdrop-blur-sm group/btn"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 transition-transform group-hover/btn:scale-110">
                                        <path fillRule="evenodd" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" clipRule="evenodd" />
                                    </svg>
                                    Details
                                </button>
                                {onReadClick && (
                                    <button
                                        onClick={handleReadClick}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-miru-accent hover:bg-miru-accent/90 text-white text-xs font-medium transition-all shadow-lg group/btn"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 transition-transform group-hover/btn:scale-110">
                                            <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
                                        </svg>
                                        Read
                                    </button>
                                )}
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

export default MangaCard;
