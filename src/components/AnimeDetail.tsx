import React, { useState } from 'react';
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
    const [showFullSynopsis, setShowFullSynopsis] = useState(false);

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
                <div className="w-72 lg:w-80 bg-miru-surface border-r border-white/5 flex flex-col z-10 transition-transform duration-300">
                    <div className="p-4 border-b border-white/5 bg-miru-surface">
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
                <div className="flex-1 flex flex-col bg-black relative">
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

                {/* Anime Info Sidebar (Desktop) - Premium Glass Design */}
                <div className="hidden xl:flex w-[500px] relative bg-black/40 backdrop-blur-2xl border-l border-white/5 overflow-hidden flex-col">
                    {/* Ambient Background Glow */}
                    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                        <img
                            src={anime.images.jpg.large_image_url}
                            alt=""
                            className="w-full h-[60%] object-cover blur-3xl opacity-20 scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/60 to-black" />
                    </div>

                    {/* Scrollable Content */}
                    <div className="relative z-10 overflow-y-auto custom-scrollbar flex-1 flex flex-col">
                        {/* Hero Image */}
                        <div className="relative aspect-[16/9] w-full shrink-0 group">
                            <img
                                src={anime.images.jpg.large_image_url}
                                alt={anime.title}
                                className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />

                            {/* Floating Rank Badge */}
                            {anime.rank && (
                                <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2 shadow-xl">
                                    <span className="text-xs font-bold text-miru-accent">RANK</span>
                                    <span className="text-sm font-bold text-white">#{anime.rank}</span>
                                </div>
                            )}
                        </div>

                        {/* Content Body */}
                        <div className="px-8 pb-8 -mt-24 flex flex-col gap-6">
                            {/* Header */}
                            <div>
                                <h1 className="text-4xl font-black leading-none mb-2 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 drop-shadow-2xl font-sans tracking-tight">
                                    {anime.title}
                                </h1>
                                {anime.title_japanese && (
                                    <h2 className="text-lg text-white/50 font-serif italic tracking-wide mb-6">{anime.title_japanese}</h2>
                                )}
                            </div>

                            {/* Bento Grid Stats */}
                            <div className="grid grid-cols-3 gap-3">
                                {/* Score Card */}
                                <div className="col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center justify-between group hover:bg-white/10 transition-colors">
                                    <div>
                                        <div className="text-xs text-miru-accent font-bold tracking-wider mb-1">SCORE</div>
                                        <div className="text-3xl font-black text-white">{anime.score || 'N/A'}</div>
                                    </div>
                                    <div className="h-10 w-10 rounded-full border-4 border-miru-accent/30 flex items-center justify-center relative">
                                        <div className="absolute inset-0 rounded-full border-4 border-miru-accent border-t-transparent animate-pulse" />
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
                                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Format Card */}
                                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col justify-center items-center hover:bg-white/10 transition-colors">
                                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">TYPE</span>
                                    <span className="text-lg font-bold text-white">{anime.type || '?'}</span>
                                </div>

                                {/* Status & Year */}
                                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col justify-center">
                                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">STATUS</span>
                                    <span className={`text-sm font-bold ${anime.status === 'Currently Airing' ? 'text-green-400' : 'text-white'}`}>
                                        {anime.status === 'Finished Airing' ? 'Finished' : anime.status}
                                    </span>
                                </div>
                                <div className="col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                                    <div className="flex-1">
                                        <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">STUDIO</span>
                                        <span className="text-sm font-bold text-white truncate block">
                                            {anime.studios && anime.studios.length > 0 ? anime.studios[0].name : 'Unknown'}
                                        </span>
                                    </div>
                                    <div className="w-px h-8 bg-white/10" />
                                    <div>
                                        <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">YEAR</span>
                                        <span className="text-sm font-bold text-white">{anime.year || anime.season || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Genres List */}
                            {anime.genres && anime.genres.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {anime.genres.map(genre => (
                                        <span
                                            key={genre.mal_id}
                                            className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/80 hover:bg-miru-accent hover:border-miru-accent hover:text-white transition-all duration-300 cursor-default shadow-lg shadow-black/20"
                                        >
                                            {genre.name}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Synopsis */}
                            <div className="relative">
                                <h4 className="text-xs font-bold text-miru-accent uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <span className="w-8 h-px bg-miru-accent/50" />
                                    SYNOPSIS
                                </h4>
                                <p className={`text-sm text-gray-300 leading-7 font-light tracking-wide ${!showFullSynopsis && 'line-clamp-6'}`}>
                                    {anime.synopsis || 'No synopsis available.'}
                                </p>
                                {anime.synopsis && anime.synopsis.length > 300 && (
                                    <button
                                        onClick={() => setShowFullSynopsis(!showFullSynopsis)}
                                        className="mt-4 text-xs font-bold text-white hover:text-miru-accent uppercase tracking-widest flex items-center gap-2 group transition-colors"
                                    >
                                        <span>{showFullSynopsis ? 'READ LESS' : 'READ MORE'}</span>
                                        <div className={`p-1 rounded-full bg-white/10 group-hover:bg-miru-accent transition-colors duration-300 ${showFullSynopsis ? 'rotate-180' : ''}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnimeDetail;
