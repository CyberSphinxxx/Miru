import React, { useEffect, useState, useMemo } from 'react';
import { Anime, Episode, StreamLink } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface WatchPageProps {
    anime: Anime;
    episodes: Episode[];
    currentEpisode: Episode | null;
    streams: StreamLink[];
    selectedStreamIndex: number;
    isAutoQuality: boolean;
    epLoading: boolean;
    streamLoading: boolean;
    onBack: () => void;
    onEpisodeClick: (episode: Episode) => void;
    onQualityChange: (index: number) => void;
    onAutoQuality: () => void;
    externalUrl?: string | null;
}

const WatchPage: React.FC<WatchPageProps> = ({
    anime,
    episodes,
    currentEpisode,
    streams,
    selectedStreamIndex,
    isAutoQuality,
    epLoading,
    streamLoading,
    onBack,
    onEpisodeClick,
    onQualityChange,
    onAutoQuality,
    externalUrl,
}) => {
    const currentStream = streams[selectedStreamIndex];
    const [cinemaMode, setCinemaMode] = useState(false);
    const [episodeSearch, setEpisodeSearch] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [isMobileEpisodeOpen, setIsMobileEpisodeOpen] = useState(false);

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Close mobile episode panel when episode changes
    useEffect(() => {
        setIsMobileEpisodeOpen(false);
    }, [currentEpisode]);

    // Filter episodes based on search
    const filteredEpisodes = useMemo(() => {
        if (!episodeSearch.trim()) return episodes;
        const query = episodeSearch.toLowerCase();
        return episodes.filter(ep =>
            ep.episodeNumber.toString().includes(query) ||
            (ep.title?.toLowerCase().includes(query))
        );
    }, [episodes, episodeSearch]);

    // Find current episode index for navigation
    const currentEpisodeIndex = useMemo(() => {
        return episodes.findIndex(ep => ep.id === currentEpisode?.id);
    }, [episodes, currentEpisode]);

    const hasPrevious = currentEpisodeIndex > 0;
    const hasNext = currentEpisodeIndex < episodes.length - 1 && currentEpisodeIndex !== -1;
    const useGridLayout = viewMode === 'grid';

    const handlePrevious = () => {
        if (hasPrevious) {
            onEpisodeClick(episodes[currentEpisodeIndex - 1]);
        }
    };

    const handleNext = () => {
        if (hasNext) {
            onEpisodeClick(episodes[currentEpisodeIndex + 1]);
        }
    };

    const handleReload = () => {
        if (currentEpisode) {
            onEpisodeClick(currentEpisode);
        }
    };

    // Episode Panel Component (shared between desktop sidebar and mobile sheet)
    const EpisodePanel = ({ isMobile = false }: { isMobile?: boolean }) => (
        <div className={`flex flex-col h-full ${isMobile ? 'max-h-[70vh]' : ''}`}>
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-white/5 flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <h2 className="font-bold text-white text-sm sm:text-base">Episodes</h2>
                        <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">
                            {episodes.length} eps
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        {isMobile && (
                            <button
                                onClick={() => setIsMobileEpisodeOpen(false)}
                                className="p-1.5 rounded bg-white/5 text-gray-400 hover:text-white lg:hidden"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                        {/* View Toggle */}
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-miru-primary text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                            title="List View"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-miru-primary text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                            title="Grid View"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Search Input */}
                <div className="relative">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search episode..."
                        value={episodeSearch}
                        onChange={(e) => setEpisodeSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-miru-primary/50 focus:ring-1 focus:ring-miru-primary/30 transition-all"
                    />
                </div>
            </div>

            {/* Episode List / Grid */}
            <div className="flex-1 min-h-0 overflow-hidden">
                {epLoading ? (
                    <div className="flex justify-center py-10">
                        <LoadingSpinner size="md" />
                    </div>
                ) : filteredEpisodes.length > 0 ? (
                    useGridLayout ? (
                        /* Compact Grid Layout for 50+ episodes */
                        <div className="h-full overflow-y-auto custom-scrollbar">
                            <div className="episode-grid">
                                {filteredEpisodes.map((ep) => (
                                    <button
                                        key={ep.id}
                                        onClick={() => onEpisodeClick(ep)}
                                        className={`episode-grid-item ${currentEpisode?.id === ep.id ? 'active' : ''}`}
                                        title={ep.title || `Episode ${ep.episodeNumber}`}
                                    >
                                        {ep.episodeNumber}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* List Layout for fewer episodes */
                        <div className="h-full overflow-y-auto custom-scrollbar">
                            <div className="p-2 space-y-1">
                                {filteredEpisodes.map((ep) => (
                                    <button
                                        key={ep.id}
                                        onClick={() => onEpisodeClick(ep)}
                                        className={`w-full p-2 sm:p-3 rounded-lg text-left transition-all group relative overflow-hidden flex items-center gap-2 sm:gap-3 ${currentEpisode?.id === ep.id
                                            ? 'episode-active'
                                            : 'bg-white/[0.03] hover:bg-white/[0.06]'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-xs sm:text-sm font-bold transition-all ${currentEpisode?.id === ep.id
                                            ? 'bg-miru-primary text-white'
                                            : 'bg-white/5 text-gray-400 group-hover:bg-white/10 group-hover:text-white'
                                            }`}>
                                            {ep.episodeNumber}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs sm:text-sm font-medium truncate ${currentEpisode?.id === ep.id ? 'text-white' : 'text-gray-300'
                                                }`}>
                                                {ep.title || `Episode ${ep.episodeNumber}`}
                                            </p>
                                            {ep.duration && (
                                                <p className="text-xs text-gray-500 mt-0.5">{ep.duration}</p>
                                            )}
                                        </div>
                                        {currentEpisode?.id === ep.id && (
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs text-miru-primary font-medium hidden sm:block">Playing</span>
                                                <div className="flex gap-0.5">
                                                    <div className="w-0.5 h-3 bg-miru-primary rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                                                    <div className="w-0.5 h-3 bg-miru-primary rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                                                    <div className="w-0.5 h-3 bg-miru-primary rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )
                ) : (
                    <div className="text-center py-10 text-gray-500 text-sm px-4">
                        {episodeSearch ? 'No episodes match your search' : 'No episodes found for this anime.'}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <>
            {/* Cinema Mode Overlay */}
            <div className={`cinema-overlay ${cinemaMode ? 'active' : ''}`} />

            {/* Mobile Episode Panel Overlay */}
            {isMobileEpisodeOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-[60] lg:hidden"
                    onClick={() => setIsMobileEpisodeOpen(false)}
                />
            )}

            {/* Mobile Episode Bottom Sheet */}
            <div className={`fixed inset-x-0 bottom-0 z-[70] lg:hidden transform transition-transform duration-300 ease-out ${isMobileEpisodeOpen ? 'translate-y-0' : 'translate-y-full'}`}>
                <div
                    className="glass rounded-t-2xl border-t border-x border-white/10"
                    style={{
                        background: 'rgba(15, 15, 15, 0.95)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                    }}
                >
                    {/* Drag Handle */}
                    <div className="flex justify-center py-2">
                        <div className="w-10 h-1 rounded-full bg-white/20" />
                    </div>
                    <EpisodePanel isMobile />
                </div>
            </div>

            <div className="min-h-screen bg-miru-bg pt-16 sm:pt-20 pb-0 flex flex-col h-screen overflow-hidden">
                {/* Header / Nav */}
                <div className="px-3 sm:px-6 pb-2 sm:pb-4 flex-shrink-0 relative z-50">
                    <nav className="flex items-center gap-2 text-sm text-gray-400">
                        <button onClick={onBack} className="hover:text-white transition-colors flex items-center gap-1 group cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                            </svg>
                            <span className="hidden sm:inline">Back to Details</span>
                            <span className="sm:hidden">Back</span>
                        </button>
                    </nav>
                </div>

                {/* Main Content - Flex Row on desktop, column on mobile */}
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                    {/* Left: Player Area */}
                    <div className={`flex-1 flex flex-col relative ${cinemaMode ? 'z-50' : ''}`}>
                        {/* Video Player */}
                        <div className="flex-1 bg-black relative min-h-[200px] sm:min-h-[300px]">
                            {streamLoading ? (
                                <div className="w-full h-full flex items-center justify-center">
                                    <LoadingSpinner size="lg" text="Loading stream..." />
                                </div>
                            ) : streams.length > 0 && currentStream ? (
                                <div className="absolute inset-0">
                                    <iframe
                                        key={currentStream.url}
                                        src={currentStream.url}
                                        className="w-full h-full border-0"
                                        allowFullScreen
                                        allow="autoplay; fullscreen"
                                    />
                                </div>
                            ) : externalUrl ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gray-900 p-4">
                                    <p className="mb-4 text-base sm:text-lg text-center">Stream not directly available.</p>
                                    <a
                                        href={externalUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 sm:px-6 py-2 sm:py-3 bg-miru-primary text-white rounded-lg hover:bg-miru-primary/80 transition-colors flex items-center gap-2 text-sm sm:text-base"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                        </svg>
                                        Watch on Info Source
                                    </a>
                                    <p className="mt-4 text-xs text-gray-600 text-center">Clicking will open the source in a new tab.</p>
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm sm:text-base text-center px-4">
                                    {currentEpisode ? 'No stream available' : 'Select an episode to start watching'}
                                </div>
                            )}
                        </div>

                        {/* Unified Control Bar */}
                        <div className="bg-miru-surface/95 backdrop-blur-md border-t border-white/5 px-2 sm:px-4 py-2 sm:py-3 flex-shrink-0">
                            <div className="flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
                                {/* Quality Pills */}
                                {streams.length > 0 && (
                                    <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                                        <span className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mr-1 hidden sm:block">Quality</span>
                                        <button
                                            onClick={onAutoQuality}
                                            className={`pill-btn text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 ${isAutoQuality ? 'active' : ''}`}
                                        >
                                            AUTO
                                        </button>
                                        {streams.map((stream, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => onQualityChange(idx)}
                                                className={`pill-btn text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 ${selectedStreamIndex === idx && !isAutoQuality ? 'active' : ''}`}
                                            >
                                                {stream.quality}p
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Utility Buttons */}
                                <div className="flex items-center gap-1 sm:gap-2 ml-auto">
                                    {/* Reload Button */}
                                    <button
                                        onClick={handleReload}
                                        className="pill-btn text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5"
                                        title="Reload stream"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 sm:w-3.5 sm:h-3.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                        </svg>
                                        <span className="hidden sm:inline">Reload</span>
                                    </button>

                                    {/* Cinema Mode Toggle */}
                                    <button
                                        onClick={() => setCinemaMode(!cinemaMode)}
                                        className={`pill-btn text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 ${cinemaMode ? 'accent' : ''}`}
                                        title={cinemaMode ? 'Turn lights on' : 'Turn lights off'}
                                    >
                                        {cinemaMode ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 sm:w-3.5 sm:h-3.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 sm:w-3.5 sm:h-3.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                                            </svg>
                                        )}
                                        <span className="hidden sm:inline">{cinemaMode ? 'Lights On' : 'Cinema'}</span>
                                    </button>

                                    {/* Mobile Episodes Toggle Button */}
                                    <button
                                        onClick={() => setIsMobileEpisodeOpen(true)}
                                        className="pill-btn text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 lg:hidden"
                                        title="Show episodes"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 sm:w-3.5 sm:h-3.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
                                        </svg>
                                        <span>Episodes</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Title & Navigation Section */}
                        <div className={`bg-miru-surface/80 backdrop-blur-sm border-t border-white/5 px-3 sm:px-6 py-3 sm:py-4 flex-shrink-0 ${cinemaMode ? '' : ''}`}>
                            {/* Title Section */}
                            <div className="mb-3 sm:mb-4">
                                <h1 className="text-lg sm:text-2xl font-bold text-white mb-1 line-clamp-1">
                                    {anime.title}
                                </h1>
                                {currentEpisode && (
                                    <h2 className="text-xs sm:text-sm text-gray-400">
                                        <span className="text-miru-primary font-medium">Episode {currentEpisode.episodeNumber}</span>
                                        {currentEpisode.title && (
                                            <span className="mx-2 text-gray-600">—</span>
                                        )}
                                        {currentEpisode.title && (
                                            <span className="text-gray-300 hidden sm:inline">{currentEpisode.title}</span>
                                        )}
                                    </h2>
                                )}
                            </div>

                            {/* Navigation Buttons */}
                            <div className="flex items-center justify-between gap-2 sm:gap-4">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <button
                                        onClick={handlePrevious}
                                        disabled={!hasPrevious}
                                        className="nav-btn prev text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2.5"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                                        </svg>
                                        <span className="hidden sm:inline">Previous</span>
                                        <span className="sm:hidden">Prev</span>
                                    </button>
                                    <button
                                        onClick={handleNext}
                                        disabled={!hasNext}
                                        className="nav-btn next bg-gradient-to-r from-miru-primary to-purple-600 border-miru-primary/50 text-white shadow-lg shadow-miru-primary/25 hover:shadow-miru-primary/40 hover:scale-[1.02] text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2.5"
                                    >
                                        Next
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Report Issue */}
                                <button className="text-[10px] sm:text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1 sm:gap-1.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
                                    </svg>
                                    <span className="hidden sm:inline">Report Issue</span>
                                    <span className="sm:hidden">Report</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right: Episodes Sidebar - Hidden on mobile, shown on lg+ */}
                    <div className={`hidden lg:flex w-[320px] xl:w-[350px] glass border-l border-white/5 flex-col flex-shrink-0 h-full ${cinemaMode ? 'opacity-30 hover:opacity-100 transition-opacity duration-300' : ''}`}>
                        <EpisodePanel />
                    </div>
                </div>
            </div>
        </>
    );
};

export default WatchPage;

