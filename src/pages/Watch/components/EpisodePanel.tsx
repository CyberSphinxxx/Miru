import React from 'react';
import { Episode } from '../../../types';
import AnimatedLoader from '../../../components/AnimatedLoader';

interface EpisodePanelProps {
    isMobile?: boolean;
    episodes: Episode[];
    currentEpisode: Episode | null;
    episodeSearch: string;
    setEpisodeSearch: (s: string) => void;
    viewMode: 'list' | 'grid';
    setViewMode: (m: 'list' | 'grid') => void;
    setIsMobileEpisodeOpen: (b: boolean) => void;
    epLoading: boolean;
    filteredEpisodes: Episode[];
    watchedEpisodes: Set<string>;
    onEpisodeClick: (ep: Episode) => void;
}

const EpisodePanel: React.FC<EpisodePanelProps> = ({
    isMobile = false,
    episodes,
    currentEpisode,
    episodeSearch,
    setEpisodeSearch,
    viewMode,
    setViewMode,
    setIsMobileEpisodeOpen,
    epLoading,
    filteredEpisodes,
    watchedEpisodes,
    onEpisodeClick
}) => {
    const useGridLayout = viewMode === 'grid';

    return (
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
                    <div className="flex justify-center">
                        <AnimatedLoader variant="episodes" size="sm" />
                    </div>
                ) : filteredEpisodes.length > 0 ? (
                    useGridLayout ? (
                        /* Compact Grid Layout for 50+ episodes */
                        <div className="h-full overflow-y-auto custom-scrollbar">
                            <div className="episode-grid">
                                {filteredEpisodes.map((ep) => {
                                    const isWatched = watchedEpisodes?.has(ep.session);
                                    return (
                                        <button
                                            key={ep.id}
                                            onClick={() => onEpisodeClick(ep)}
                                            className={`episode-grid-item ${currentEpisode?.id === ep.id ? 'active' : ''} ${isWatched && currentEpisode?.id !== ep.id ? 'opacity-50' : ''} relative overflow-hidden`}
                                            title={ep.title || `Episode ${ep.episodeNumber}`}
                                        >
                                            {ep.episodeNumber}
                                            {isWatched && currentEpisode?.id !== ep.id && (
                                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white/70">
                                                        <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        /* List Layout for fewer episodes */
                        <div className="h-full overflow-y-auto custom-scrollbar">
                            <div className="p-2 space-y-1">
                                {filteredEpisodes.map((ep) => {
                                    const isWatched = watchedEpisodes?.has(ep.session);
                                    return (
                                        <button
                                            key={ep.id}
                                            onClick={() => onEpisodeClick(ep)}
                                            className={`w-full p-2 sm:p-3 rounded-lg text-left transition-all group relative overflow-hidden flex items-center gap-2 sm:gap-3 ${currentEpisode?.id === ep.id
                                                ? 'episode-active'
                                                : isWatched
                                                    ? 'bg-white/[0.03] hover:bg-white/[0.06] opacity-70 hover:opacity-100' // Dim watched episodes
                                                    : 'bg-white/[0.03] hover:bg-white/[0.06]'
                                                }`}
                                        >
                                            <div className="relative">
                                                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-xs sm:text-sm font-bold transition-all ${currentEpisode?.id === ep.id
                                                    ? 'bg-miru-primary text-white'
                                                    : isWatched
                                                        ? 'bg-white/5 text-gray-500 group-hover:bg-white/10 group-hover:text-white'
                                                        : 'bg-white/5 text-gray-400 group-hover:bg-white/10 group-hover:text-white'
                                                    }`}>
                                                    {isWatched && currentEpisode?.id !== ep.id ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                                            <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                                                        </svg>
                                                    ) : (
                                                        ep.episodeNumber
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className={`text-xs sm:text-sm font-medium truncate ${currentEpisode?.id === ep.id ? 'text-white' : isWatched ? 'text-gray-400' : 'text-gray-300'
                                                        }`}>
                                                        {ep.title || `Episode ${ep.episodeNumber}`}
                                                    </p>
                                                    {isWatched && currentEpisode?.id !== ep.id && (
                                                        <span className="text-[10px] uppercase font-bold text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
                                                            Watched
                                                        </span>
                                                    )}
                                                </div>
                                                {ep.duration && (
                                                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                                                            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z" clipRule="evenodd" />
                                                        </svg>
                                                        {Math.round(parseInt(ep.duration) / 60)}m
                                                    </p>
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
                                    );
                                })}
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
};

export default EpisodePanel;
