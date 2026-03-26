import { Chapter, ScraperManga } from '../../../types/scraper';

interface Props {
    showControls: boolean;
    navigate: (path: string) => void;
    sidebarOpen: boolean;
    setSidebarOpen: (b: boolean) => void;
    selectedManga: ScraperManga | null;
    mangaTitle: string;
    currentChapter: Chapter | null;
    goToPrevChapter: () => void;
    goToNextChapter: () => void;
    currentChapterIndex: number;
    chaptersLength: number;
    showSettings: boolean;
    setShowSettings: (b: boolean) => void;
    readingMode: string;
    setReadingMode: (m: 'long-strip' | 'long-strip-gaps' | 'paged-ltr' | 'paged-rtl' | 'paged-vertical') => void;
    zoomLevel: number;
    handleZoomOut: () => void;
    handleZoomIn: () => void;
    handleZoomReset: () => void;
    isFullscreen: boolean;
    toggleFullscreen: () => void;
}

export default function ReaderHeader({
    showControls, navigate, sidebarOpen, setSidebarOpen, selectedManga, mangaTitle, currentChapter,
    goToPrevChapter, goToNextChapter, currentChapterIndex, chaptersLength,
    showSettings, setShowSettings, readingMode, setReadingMode,
    zoomLevel, handleZoomOut, handleZoomIn, handleZoomReset,
    isFullscreen, toggleFullscreen
}: Props) {
    const readingModes = [
        { id: 'long-strip' as const, label: 'Long Strip', icon: '📜' },
        { id: 'long-strip-gaps' as const, label: 'Long Strip (Gaps)', icon: '📄' },
        { id: 'paged-ltr' as const, label: 'Paged (L→R)', icon: '➡️' },
        { id: 'paged-rtl' as const, label: 'Paged (R→L)', icon: '⬅️' },
        { id: 'paged-vertical' as const, label: 'Paged (Vertical)', icon: '⬇️' },
    ];

    return (
        <>
            {showSettings && (
                <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
            )}
            <header
                className={`relative z-50 flex items-center justify-between px-4 py-3 bg-[#111]/95 backdrop-blur-md border-b border-white/5 transition-all duration-300 ${showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
                    }`}
            >
                <div className="flex items-center gap-4">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate('/manga')}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                        title="Back to Manga"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                    </button>

                    {/* Toggle Sidebar */}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className={`p-2 rounded-lg transition-colors ${sidebarOpen ? 'bg-miru-primary/20 text-miru-primary' : 'bg-white/5 hover:bg-white/10'}`}
                        title="Toggle Sidebar (S)"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    </button>

                    {/* Title */}
                    <div className="hidden sm:block">
                        <h1 className="text-base font-bold truncate max-w-[300px] lg:max-w-[500px]">
                            {selectedManga?.title || mangaTitle}
                        </h1>
                        {currentChapter && (
                            <p className="text-xs text-gray-400">{currentChapter.title}</p>
                        )}
                    </div>
                </div>

                {/* Center Controls */}
                <div className="flex items-center gap-2">
                    {/* Chapter Navigation */}
                    <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                        <button
                            onClick={goToPrevChapter}
                            disabled={currentChapterIndex >= chaptersLength - 1}
                            className="p-2 rounded-md hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Previous Chapter (←)"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                        </button>
                        <span className="px-3 text-sm font-medium min-w-[100px] text-center truncate">
                            {currentChapter?.title?.match(/Chapter\s*\d+|Ch\.?\s*\d+|[\d.]+/i)?.[0] || currentChapter?.title?.slice(0, 12) || 'Select'}
                        </span>
                        <button
                            onClick={goToNextChapter}
                            disabled={currentChapterIndex <= 0}
                            className="p-2 rounded-md hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Next Chapter (→)"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-2">
                    {/* Settings Button */}
                    <div className="relative">
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-miru-primary text-black' : 'bg-white/5 hover:bg-white/10'}`}
                            title="Reading Settings"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            </svg>
                        </button>

                        {showSettings && (
                            <>
                                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-[#111] border border-white/10 shadow-xl z-50 overflow-hidden animate-fade-in">
                                    <div className="px-3 py-2 border-b border-white/10 bg-white/5">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase">Reading Mode</h4>
                                    </div>
                                    <div className="p-2">
                                        {readingModes.map((mode) => (
                                            <button
                                                key={mode.id}
                                                onClick={() => {
                                                    setReadingMode(mode.id as any);
                                                    setShowSettings(false);
                                                }}
                                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${readingMode === mode.id
                                                    ? 'bg-miru-primary/20 text-miru-primary'
                                                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                                    }`}
                                            >
                                                <span className="text-base">{mode.icon}</span>
                                                {mode.label}
                                                {readingMode === mode.id && (
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 ml-auto">
                                                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Zoom Controls */}
                    <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                        <button
                            onClick={handleZoomOut}
                            className="p-2 rounded-md hover:bg-white/10 transition-colors"
                            title="Zoom Out (-)"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6" />
                            </svg>
                        </button>
                        <button
                            onClick={handleZoomReset}
                            className="px-2 py-1 text-xs font-bold min-w-[50px] text-center hover:bg-white/10 rounded-md transition-colors"
                            title="Reset Zoom (0)"
                        >
                            {zoomLevel}%
                        </button>
                        <button
                            onClick={handleZoomIn}
                            className="p-2 rounded-md hover:bg-white/10 transition-colors"
                            title="Zoom In (+)"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                            </svg>
                        </button>
                    </div>

                    {/* Fullscreen Toggle */}
                    <button
                        onClick={toggleFullscreen}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        title="Fullscreen (F)"
                    >
                        {isFullscreen ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                            </svg>
                        )}
                    </button>
                </div>
            </header>
        </>
    );
}
