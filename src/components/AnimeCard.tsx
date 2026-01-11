import React from 'react';
import { Anime } from '../types';

interface AnimeCardProps {
    anime: Anime;
    onClick: (anime: Anime) => void;
}

const AnimeCard: React.FC<AnimeCardProps> = ({ anime, onClick }) => {
    return (
        <div
            onClick={() => onClick(anime)}
            className="group relative bg-miru-surface rounded-xl overflow-hidden card-hover cursor-pointer"
        >
            {/* Image Container */}
            <div className="relative aspect-[2/3] overflow-hidden">
                <img
                    src={anime.images.jpg.large_image_url || anime.images.jpg.image_url}
                    alt={anime.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-miru-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Play Button on Hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="w-14 h-14 rounded-full bg-miru-accent/90 flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300 shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white ml-1">
                            <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>

                {/* Score Badge */}
                {anime.score && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-yellow-400">
                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-bold text-white">{anime.score}</span>
                    </div>
                )}

                {/* Rank Badge */}
                {anime.rank && anime.rank <= 100 && (
                    <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-miru-accent font-bold text-xs text-white">
                        #{anime.rank}
                    </div>
                )}
            </div>

            {/* Info Container */}
            <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-miru-accent">
                        {anime.type || 'TV'}
                    </span>
                    {anime.episodes && (
                        <>
                            <span className="text-gray-600">•</span>
                            <span className="text-[10px] text-gray-500">{anime.episodes} eps</span>
                        </>
                    )}
                </div>

                <h3 className="text-white font-semibold text-sm line-clamp-2 leading-tight h-10" title={anime.title}>
                    {anime.title}
                </h3>

                <div className="flex items-center justify-between mt-3">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${anime.status === 'Currently Airing'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-700/50 text-gray-400'
                        }`}>
                        {anime.status === 'Currently Airing' ? 'AIRING' : 'COMPLETED'}
                    </span>
                    {anime.year && (
                        <span className="text-[10px] text-gray-500">{anime.year}</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnimeCard;
