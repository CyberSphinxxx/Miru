import React from 'react';
import { MediaMode, AnimeTab, MangaTab, MovieTab } from '../hooks/useProfileData';
import { getMediaColors } from '../utils/mediaColors';

interface ProfileTabsProps {
    mediaMode: MediaMode;
    currentTabs: { label: string; count: number }[];
    activeTab: string;
    watchHistoryLength: number;
    readHistoryLength: number;
    handleClearWatchHistory: () => void;
    handleClearReadHistory: () => void;
    setAnimeTab: (tab: AnimeTab) => void;
    setMangaTab: (tab: MangaTab) => void;
    setMovieTab: (tab: MovieTab) => void;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({
    mediaMode,
    currentTabs,
    activeTab,
    watchHistoryLength,
    readHistoryLength,
    handleClearWatchHistory,
    handleClearReadHistory,
    setAnimeTab,
    setMangaTab,
    setMovieTab
}) => {
    const colors = getMediaColors(mediaMode);

    return (
        <div className="sticky top-16 z-20 bg-miru-bg/80 backdrop-blur-lg border-b border-white/5 mb-8 flex items-center justify-between px-2">
            <div className="flex gap-6 overflow-x-auto pb-px">
                {currentTabs.map(tab => (
                    <button
                        key={tab.label}
                        onClick={() => {
                            if (mediaMode === 'anime') setAnimeTab(tab.label as AnimeTab);
                            else if (mediaMode === 'manga') setMangaTab(tab.label as MangaTab);
                            else setMovieTab(tab.label as MovieTab);
                        }}
                        className={`relative py-4 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                            activeTab === tab.label ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        {tab.label}
                        <span className={`text-xs px-1.5 py-0.5 rounded-md ${
                            activeTab === tab.label
                                ? colors.tabBadgeActive
                                : 'bg-white/5 text-gray-500'
                        }`}>
                            {tab.count}
                        </span>
                        {activeTab === tab.label && (
                            <span className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full transition-all ${colors.tabUnderline}`}></span>
                        )}
                    </button>
                ))}
            </div>

            {/* Clear History Button */}
            {activeTab === 'History' && (
                <>
                    {mediaMode === 'anime' && watchHistoryLength > 0 && (
                        <button
                            onClick={handleClearWatchHistory}
                            className="text-red-400 hover:text-red-300 text-xs font-medium px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors whitespace-nowrap"
                        >
                            Clear History
                        </button>
                    )}
                    {mediaMode === 'manga' && readHistoryLength > 0 && (
                        <button
                            onClick={handleClearReadHistory}
                            className="text-red-400 hover:text-red-300 text-xs font-medium px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors whitespace-nowrap"
                        >
                            Clear History
                        </button>
                    )}
                </>
            )}
        </div>
    );
};

export default ProfileTabs;
