import React, { useEffect } from 'react';
import { Anime, Episode, StreamLink } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface WatchPageProps {
    anime: Anime;
    episodes: Episode[];
    currentEpisode: Episode | null;
    streams: StreamLink[];
    selectedStreamIndex: number;
    playerMode: 'hls' | 'embed';
    isAutoQuality: boolean;
    epLoading: boolean;
    streamLoading: boolean;
    onBack: () => void;
    onEpisodeClick: (episode: Episode) => void;
    onQualityChange: (index: number) => void;
    onModeChange: (mode: 'hls' | 'embed') => void;
    onAutoQuality: () => void;
}

const WatchPage: React.FC<WatchPageProps> = ({
    anime,
    episodes,
    currentEpisode,
    streams,
    selectedStreamIndex,
    playerMode,
    isAutoQuality,
    epLoading,
    streamLoading,
    onBack,
    onEpisodeClick,
    onQualityChange,
    onModeChange,
    onAutoQuality,
}) => {
    const currentStream = streams[selectedStreamIndex];

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-miru-bg pt-20 pb-0 flex flex-col h-screen overflow-hidden">
            {/* Header / Nav */}
            <div className="px-6 pb-4 flex-shrink-0">
                <nav className="flex items-center gap-2 text-sm text-gray-400">
                    <button onClick={onBack} className="hover:text-white transition-colors flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                        </svg>
                        Back to Details
                    </button>
                    <span>|</span>
                    <span className="text-white font-bold truncate">{anime.title}</span>
                    {currentEpisode && (
                        <>
                            <span className="text-gray-600">•</span>
                            <span className="text-miru-primary">Episode {currentEpisode.episodeNumber}</span>
                        </>
                    )}
                </nav>
            </div>

            {/* Main Content - Flex Row */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Player Area */}
                <div className="flex-1 bg-black flex flex-col relative">
                    {streamLoading ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <LoadingSpinner size="lg" text="Loading stream..." />
                        </div>
                    ) : streams.length > 0 && currentStream ? (
                        <div className="flex-1 relative">
                            {playerMode === 'embed' ? (
                                <iframe
                                    src={currentStream.url}
                                    className="w-full h-full absolute inset-0"
                                    allowFullScreen
                                    allow="autoplay; encrypted-media"
                                />
                            ) : currentStream.directUrl ? (
                                <video
                                    key={currentStream.directUrl}
                                    src={currentStream.directUrl}
                                    controls
                                    autoPlay
                                    className="w-full h-full absolute inset-0"
                                />
                            ) : (
                                <iframe
                                    src={currentStream.url}
                                    className="w-full h-full absolute inset-0"
                                    allowFullScreen
                                    allow="autoplay; encrypted-media"
                                />
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-500">
                            {currentEpisode ? 'No stream available' : 'Select an episode to start watching'}
                        </div>
                    )}

                    {/* Quality Controls Bar (Bottom of Player) */}
                    {streams.length > 0 && (
                        <div className="bg-miru-surface p-3 flex items-center gap-3 overflow-x-auto shadow-lg z-10">
                            <button
                                onClick={onAutoQuality}
                                className={`px-3 py-1.5 rounded text-xs font-bold transition-all whitespace-nowrap ${isAutoQuality
                                    ? 'bg-miru-primary text-white'
                                    : 'bg-white/10 text-gray-400 hover:text-white'
                                    }`}
                            >
                                AUTO
                            </button>
                            <div className="h-4 w-px bg-white/10 mx-1" />
                            <div className="flex items-center gap-2">
                                {streams.map((stream, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => onQualityChange(idx)}
                                        className={`px-3 py-1.5 rounded text-xs font-bold transition-all whitespace-nowrap ${selectedStreamIndex === idx && !isAutoQuality
                                            ? 'bg-miru-primary text-white'
                                            : 'bg-white/10 text-gray-400 hover:text-white'
                                            }`}
                                    >
                                        {stream.quality}p
                                    </button>
                                ))}
                            </div>
                            <div className="flex-1" />
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => onModeChange('embed')}
                                    className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${playerMode === 'embed'
                                        ? 'bg-miru-accent text-white'
                                        : 'bg-white/10 text-gray-400 hover:text-white'
                                        }`}
                                >
                                    Embed
                                </button>
                                <button
                                    onClick={() => onModeChange('hls')}
                                    className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${playerMode === 'hls'
                                        ? 'bg-white text-black'
                                        : 'bg-white/10 text-gray-400 hover:text-white'
                                        }`}
                                >
                                    Player
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Episodes Sidebar */}
                <div className="w-[350px] bg-miru-surface border-l border-white/5 flex flex-col flex-shrink-0">
                    <div className="p-4 border-b border-white/5 bg-miru-surface z-10 shadow-md">
                        <h2 className="font-bold text-white mb-1">Episodes</h2>
                        <p className="text-xs text-gray-500">{episodes.length} episodes available</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-miru-primary/20 scrollbar-track-transparent">
                        {epLoading ? (
                            <div className="flex justify-center py-10">
                                <LoadingSpinner size="md" />
                            </div>
                        ) : episodes.length > 0 ? (
                            episodes.map((ep) => (
                                <button
                                    key={ep.id}
                                    onClick={() => onEpisodeClick(ep)}
                                    className={`w-full p-3 rounded-lg text-left transition-all group relative overflow-hidden ${currentEpisode?.id === ep.id
                                        ? 'bg-miru-primary text-white shadow-lg shadow-miru-primary/20'
                                        : 'bg-white/5 hover:bg-white/10 text-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-3 relative z-10">
                                        <div className={`w-8 h-8 rounded flex items-center justify-center text-sm font-bold ${currentEpisode?.id === ep.id ? 'bg-white/20' : 'bg-black/20'
                                            }`}>
                                            {ep.episodeNumber}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium truncate ${currentEpisode?.id === ep.id ? 'text-white' : 'text-gray-200'}`}>
                                                {ep.title || `Episode ${ep.episodeNumber}`}
                                            </p>
                                        </div>
                                        {currentEpisode?.id === ep.id && (
                                            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                        )}
                                    </div>
                                    {/* Playing indicator bg */}
                                    {currentEpisode?.id === ep.id && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="text-center py-10 text-gray-500 text-sm px-4">
                                No episodes found for this anime.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WatchPage;
