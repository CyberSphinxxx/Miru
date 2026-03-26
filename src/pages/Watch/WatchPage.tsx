import React, { useEffect, useState, useMemo } from 'react';
import { Anime, Episode, StreamLink } from '../../types';
import EpisodePanel from './components/EpisodePanel';
import VideoPlayerContainer from './components/VideoPlayerContainer';
import StreamSelector from './components/StreamSelector';


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
    onNextEpisode?: () => void;
    externalUrl?: string | null;
    initialTime?: number;
    onTimeUpdate?: (time: number) => void;
    watchedEpisodes?: Set<string>;
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
    initialTime,
    onTimeUpdate,
    onNextEpisode,
    watchedEpisodes = new Set(),
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

    // Auto Next State
    const [showAutoNext, setShowAutoNext] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [isAutoNextEnabled, setIsAutoNextEnabled] = useState(() => {
        const saved = localStorage.getItem('miru_auto_next');
        // Default to TRUE unless explicitly set to false
        return saved !== null ? JSON.parse(saved) : true;
    });

    // Reset auto next state when episode changes
    useEffect(() => {
        setShowAutoNext(false);
        setCountdown(5);
    }, [currentEpisode]);

    // Handle Auto Next Toggle
    const toggleAutoNext = () => {
        const newValue = !isAutoNextEnabled;
        setIsAutoNextEnabled(newValue);
        localStorage.setItem('miru_auto_next', JSON.stringify(newValue));
    };

    // Countdown Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (showAutoNext && isAutoNextEnabled && countdown > 0) {
            interval = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        } else if (countdown === 0 && showAutoNext && isAutoNextEnabled) {
            // Countdown finished, play next
            handleNextEpisode();
        }
        return () => clearInterval(interval);
    }, [showAutoNext, countdown, isAutoNextEnabled]);

    // Internal handle next that also hides overlay
    const handleNextEpisode = () => {
        setShowAutoNext(false);
        if (onNextEpisode) onNextEpisode();
    };

    // Cancel Auto Next
    const cancelAutoNext = () => {
        setShowAutoNext(false);
        setCountdown(5); // Reset for next time
    };

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
                    <EpisodePanel
                        isMobile
                        episodes={episodes}
                        currentEpisode={currentEpisode}
                        episodeSearch={episodeSearch}
                        setEpisodeSearch={setEpisodeSearch}
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                        setIsMobileEpisodeOpen={setIsMobileEpisodeOpen}
                        epLoading={epLoading}
                        filteredEpisodes={filteredEpisodes}
                        watchedEpisodes={watchedEpisodes}
                        onEpisodeClick={onEpisodeClick}
                    />
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
                    <div className={`flex-1 flex flex-col relative overflow-y-auto custom-scrollbar ${cinemaMode ? 'z-50' : ''}`}>
                        {/* Video Player Container */}
                        <VideoPlayerContainer
                            streamLoading={streamLoading}
                            streams={streams}
                            currentStream={currentStream}
                            hasNext={hasNext}
                            showAutoNext={showAutoNext}
                            setShowAutoNext={setShowAutoNext}
                            episodes={episodes}
                            currentEpisodeIndex={currentEpisodeIndex}
                            isAutoNextEnabled={isAutoNextEnabled}
                            countdown={countdown}
                            initialTime={initialTime}
                            onTimeUpdate={onTimeUpdate}
                            handleNextEpisode={handleNextEpisode}
                            cancelAutoNext={cancelAutoNext}
                            toggleAutoNext={toggleAutoNext}
                            externalUrl={externalUrl}
                            currentEpisode={currentEpisode}
                        />

                        {/* Stream Selector */}
                        <StreamSelector
                            streams={streams}
                            selectedStreamIndex={selectedStreamIndex}
                            isAutoQuality={isAutoQuality}
                            onAutoQuality={onAutoQuality}
                            onQualityChange={onQualityChange}
                            handleReload={handleReload}
                            isAutoNextEnabled={isAutoNextEnabled}
                            toggleAutoNext={toggleAutoNext}
                            cinemaMode={cinemaMode}
                            setCinemaMode={setCinemaMode}
                            setIsMobileEpisodeOpen={setIsMobileEpisodeOpen}
                        />

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

                        {/* Details Section */}
                        <div className="bg-miru-surface/50 backdrop-blur-sm border-t border-white/5 px-4 sm:px-6 py-8 space-y-8 pb-12">
                            {/* Badges & Genres */}
                            <div className="space-y-4">
                                {/* Badges */}
                                <div className="flex flex-wrap items-center gap-3 text-sm">
                                    <span className="bg-miru-primary text-black px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                        </svg>
                                        {anime.score || 'N/A'}
                                    </span>
                                    <span className="bg-white/10 text-white px-2.5 py-1 rounded text-xs font-bold">
                                        {episodes.length} eps
                                    </span>
                                    <span className="px-2.5 py-1 bg-white/10 rounded text-gray-300 text-xs uppercase">
                                        {anime.type}
                                    </span>
                                    {anime.status && (
                                        <span className="px-2.5 py-1 bg-white/10 rounded text-gray-300 text-xs">
                                            {anime.status}
                                        </span>
                                    )}
                                    {anime.year && (
                                        <span className="px-2.5 py-1 bg-white/10 rounded text-gray-300 text-xs">
                                            {anime.year}
                                        </span>
                                    )}
                                </div>

                                {/* Genres */}
                                <div className="flex flex-wrap gap-2">
                                    {anime.genres?.map(genre => (
                                        <span key={genre.id} className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-xs font-semibold text-gray-300 hover:text-white transition-colors cursor-default">
                                            {genre.name}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Synopsis */}
                            <div className="text-gray-300 leading-relaxed text-sm sm:text-base">
                                <h3 className="text-white font-bold mb-3 text-lg">Synopsis</h3>
                                <p className="opacity-90">{anime.synopsis || 'No synopsis available.'}</p>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-white/5 rounded-2xl border border-white/5">
                                <div>
                                    <h4 className="text-gray-500 text-xs font-bold uppercase mb-1">Studios</h4>
                                    <p className="font-medium text-sm text-white">{anime.studios?.map(s => s.name).join(', ') || 'Unknown'}</p>
                                </div>
                                <div>
                                    <h4 className="text-gray-500 text-xs font-bold uppercase mb-1">Source</h4>
                                    <p className="font-medium text-sm text-white">{anime.source || '-'}</p>
                                </div>
                                <div>
                                    <h4 className="text-gray-500 text-xs font-bold uppercase mb-1">Season</h4>
                                    <p className="font-medium text-sm text-white capitalize">{anime.season} {anime.year}</p>
                                </div>
                                <div>
                                    <h4 className="text-gray-500 text-xs font-bold uppercase mb-1">Duration</h4>
                                    <p className="font-medium text-sm text-white">{anime.duration || 'Unknown'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Episodes Sidebar - Hidden on mobile, shown on lg+ */}
                    <div className={`hidden lg:flex w-[320px] xl:w-[350px] glass border-l border-white/5 flex-col flex-shrink-0 h-full ${cinemaMode ? 'opacity-30 hover:opacity-100 transition-opacity duration-300' : ''}`}>
                        <EpisodePanel
                            episodes={episodes}
                            currentEpisode={currentEpisode}
                            episodeSearch={episodeSearch}
                            setEpisodeSearch={setEpisodeSearch}
                            viewMode={viewMode}
                            setViewMode={setViewMode}
                            setIsMobileEpisodeOpen={setIsMobileEpisodeOpen}
                            epLoading={epLoading}
                            filteredEpisodes={filteredEpisodes}
                            watchedEpisodes={watchedEpisodes}
                            onEpisodeClick={onEpisodeClick}
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

export default WatchPage;


