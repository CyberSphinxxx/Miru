import React from 'react';
import { Anime, Episode, StreamLink } from '../types';
import EpisodeList from './EpisodeList';
import VideoPlayer from './VideoPlayer';

interface AnimeDetailProps {
    anime: Anime;
    episodes: Episode[];
    currentEpisode: Episode | null;
    streams: StreamLink[];
    selectedStreamIndex: number;
    playerMode: 'hls' | 'embed';
    isAutoQuality: boolean;
    epLoading: boolean;
    streamLoading: boolean;
    onClose: () => void;
    onEpisodeClick: (episode: Episode) => void;
    onQualityChange: (index: number) => void;
    onModeChange: (mode: 'hls' | 'embed') => void;
    onAutoQuality: () => void;
}

const AnimeDetail: React.FC<AnimeDetailProps> = ({
    anime,
    episodes,
    currentEpisode,
    streams,
    selectedStreamIndex,
    playerMode,
    isAutoQuality,
    epLoading,
    streamLoading,
    onClose,
    onEpisodeClick,
    onQualityChange,
    onModeChange,
    onAutoQuality
}) => {
    const currentStream = streams[selectedStreamIndex] || null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-xl">
            {/* Header */}
            <div className="flex items-center p-4 glass border-b border-white/5">
                <button
                    onClick={onClose}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
                >
                    <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                    </div>
                    <span className="text-sm font-medium">Back</span>
                </button>
                <h2 className="ml-4 text-lg font-bold truncate flex-1">{anime.title}</h2>
                {currentEpisode && (
                    <span className="px-3 py-1 rounded-lg bg-miru-accent/20 text-miru-accent text-sm font-medium">
                        EP {currentEpisode.episodeNumber}
                    </span>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Episode List Sidebar */}
                <div className="w-72 lg:w-80 bg-miru-surface border-r border-white/5 flex flex-col">
                    <div className="p-4 border-b border-white/5">
                        <h3 className="font-semibold text-gray-400 text-sm uppercase tracking-wide flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                            </svg>
                            Episodes ({episodes.length})
                        </h3>
                    </div>
                    <EpisodeList
                        episodes={episodes}
                        currentEpisode={currentEpisode}
                        onEpisodeClick={onEpisodeClick}
                        loading={epLoading}
                    />
                </div>

                {/* Video Player */}
                <div className="flex-1 flex flex-col bg-black">
                    <VideoPlayer
                        stream={currentStream}
                        playerMode={playerMode}
                        onModeChange={onModeChange}
                        streams={streams}
                        selectedStreamIndex={selectedStreamIndex}
                        onQualityChange={onQualityChange}
                        isAutoQuality={isAutoQuality}
                        onAutoQuality={onAutoQuality}
                        loading={streamLoading}
                    />
                </div>

                {/* Anime Info Sidebar (Desktop) */}
                <div className="hidden xl:flex w-80 bg-miru-surface border-l border-white/5 overflow-y-auto no-scrollbar p-6 flex-col gap-6">
                    {/* Poster */}
                    <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-2xl glow">
                        <img
                            src={anime.images.jpg.large_image_url}
                            alt={anime.title}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Title & Meta */}
                    <div>
                        <h1 className="text-xl font-bold leading-tight mb-3">{anime.title}</h1>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-white/10 rounded-lg text-xs font-medium">{anime.type}</span>
                            {anime.year && <span className="px-3 py-1 bg-white/10 rounded-lg text-xs font-medium">{anime.year}</span>}
                            {anime.score && (
                                <span className="px-3 py-1 bg-miru-accent rounded-lg text-xs font-bold flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                                        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                    </svg>
                                    {anime.score}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Genres */}
                    {anime.genres && anime.genres.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Genres</h4>
                            <div className="flex flex-wrap gap-2">
                                {anime.genres.map(genre => (
                                    <span key={genre.mal_id} className="px-2 py-1 bg-white/5 rounded text-xs text-gray-400">
                                        {genre.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Synopsis */}
                    <div className="flex-1">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Synopsis</h4>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            {anime.synopsis || 'No synopsis available.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnimeDetail;
