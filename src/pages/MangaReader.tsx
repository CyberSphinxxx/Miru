import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { mangaService } from '../services/api';

interface ScraperManga {
    id: string;
    title: string;
    url: string;
    thumbnail: string;
    source: string;
}

interface Chapter {
    id: string;
    title: string;
    url: string;
    uploadDate?: string;
}

interface Page {
    pageNumber: number;
    imageUrl: string;
}

/**
 * MangaReader Page
 * 
 * Displays manga chapters and pages for reading.
 * Uses MangaKatana scraper via backend API.
 * 
 * Features:
 * - Collapsible sidebar for chapter navigation
 * - Chapter navigation (prev/next)
 * - Page progress indicator
 * - Adjustable zoom and reading modes
 * - Keyboard shortcuts
 * - Fullscreen mode
 */
function MangaReader() {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Search state
    const [searchResults, setSearchResults] = useState<ScraperManga[]>([]);
    const [selectedManga, setSelectedManga] = useState<ScraperManga | null>(null);
    const [searchLoading, setSearchLoading] = useState(true);
    const [searchError, setSearchError] = useState<string | null>(null);

    // Chapter state
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
    const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(-1);
    const [chaptersLoading, setChaptersLoading] = useState(false);
    const [chapterSearchQuery, setChapterSearchQuery] = useState('');

    // Pages state
    const [pages, setPages] = useState<Page[]>([]);
    const [pagesLoading, setPagesLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    // UI state
    const [zoomLevel, setZoomLevel] = useState(100);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showControls, setShowControls] = useState(true);
    const [readingMode, setReadingMode] = useState<'vertical' | 'single'>('vertical');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [chapterViewMode, setChapterViewMode] = useState<'list' | 'grid'>('list');

    // Refs
    const readingAreaRef = useRef<HTMLDivElement>(null);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Decode title from URL
    const mangaTitle = id ? decodeURIComponent(id) : '';
    const initialChapter = searchParams.get('ch');

    // Search for manga on MangaKatana (or use cached data from details page)
    useEffect(() => {
        if (!mangaTitle) return;

        const searchManga = async () => {
            setSearchLoading(true);
            setSearchError(null);
            try {
                const results = await mangaService.searchMangaScraper(mangaTitle);
                setSearchResults(results);

                // Auto-select first result
                if (results.length > 0) {
                    setSelectedManga(results[0]);
                }
            } catch (err) {
                console.error('Failed to search manga:', err);
                setSearchError('Failed to find manga on MangaKatana');
            } finally {
                setSearchLoading(false);
            }
        };

        searchManga();
    }, [mangaTitle]);

    // Load chapters when manga is selected (check cache first)
    useEffect(() => {
        if (!selectedManga) return;

        const loadChapters = async () => {
            setChaptersLoading(true);
            try {
                // Check for cached chapters from MangaDetailPage
                // Try multiple cache keys since we might not know the manga ID
                let cachedChapters = null;
                const storageKeys = Object.keys(sessionStorage);
                for (const key of storageKeys) {
                    if (key.startsWith('manga_prefetch_')) {
                        try {
                            const data = JSON.parse(sessionStorage.getItem(key) || '');
                            if (data.mangaId === selectedManga.id && data.chapters?.length > 0) {
                                cachedChapters = data.chapters;
                                console.log('[Reader] Using cached chapters:', cachedChapters.length);
                                break;
                            }
                        } catch (e) { /* ignore */ }
                    }
                }

                if (cachedChapters) {
                    setChapters(cachedChapters);
                    // Auto-load chapter from URL param or first chapter (chapter 1 = last in list)
                    if (cachedChapters.length > 0) {
                        // Default to chapter 1 (last in list since newest is first)
                        let targetIndex = cachedChapters.length - 1;
                        if (initialChapter) {
                            const chNum = parseInt(initialChapter);
                            const foundIndex = cachedChapters.findIndex((ch: Chapter) =>
                                ch.title.includes(String(chNum)) || ch.id.includes(String(chNum))
                            );
                            if (foundIndex !== -1) targetIndex = foundIndex;
                        }
                        loadChapterByIndex(targetIndex, cachedChapters);
                    }
                } else {
                    // Fetch from API
                    const chapterList = await mangaService.getChapters(selectedManga.id);
                    setChapters(chapterList);

                    // Auto-load chapter from URL param or first chapter (chapter 1 = last in list)
                    if (chapterList.length > 0) {
                        // Default to chapter 1 (last in list since newest is first)
                        let targetIndex = chapterList.length - 1;
                        if (initialChapter) {
                            const chNum = parseInt(initialChapter);
                            const foundIndex = chapterList.findIndex((ch: Chapter) =>
                                ch.title.includes(String(chNum)) || ch.id.includes(String(chNum))
                            );
                            if (foundIndex !== -1) targetIndex = foundIndex;
                        }
                        loadChapterByIndex(targetIndex, chapterList);
                    }
                }
            } catch (err) {
                console.error('Failed to load chapters:', err);
            } finally {
                setChaptersLoading(false);
            }
        };

        loadChapters();
    }, [selectedManga]);

    // Load chapter by index (check for preloaded pages first)
    const loadChapterByIndex = useCallback(async (index: number, chapterList?: Chapter[]) => {
        const list = chapterList || chapters;
        if (index < 0 || index >= list.length) return;

        const chapter = list[index];
        setCurrentChapter(chapter);
        setCurrentChapterIndex(index);
        setPagesLoading(true);
        setPages([]);
        setCurrentPage(1);

        try {
            // Check for preloaded pages from MangaDetailPage
            const cacheKey = `chapter_pages_${chapter.id}`;
            const cached = sessionStorage.getItem(cacheKey);

            if (cached) {
                try {
                    const data = JSON.parse(cached);
                    // Check if cache is valid (15 minutes)
                    if (Date.now() - data.timestamp < 15 * 60 * 1000 && data.pages?.length > 0) {
                        console.log('[Reader] Using preloaded pages:', data.pages.length);
                        setPages(data.pages);
                        setPagesLoading(false);
                        if (readingAreaRef.current) {
                            readingAreaRef.current.scrollTop = 0;
                        }
                        return;
                    }
                } catch (e) { /* ignore parse errors */ }
            }

            // Fetch from API
            const pageList = await mangaService.getChapterPages(chapter.url);
            setPages(pageList);

            // Cache for future use
            sessionStorage.setItem(cacheKey, JSON.stringify({
                pages: pageList,
                chapterId: chapter.id,
                timestamp: Date.now()
            }));

            // Scroll to top when chapter changes
            if (readingAreaRef.current) {
                readingAreaRef.current.scrollTop = 0;
            }
        } catch (err) {
            console.error('Failed to load pages:', err);
        } finally {
            setPagesLoading(false);
        }
    }, [chapters]);

    // Load chapter by object
    const loadChapter = useCallback(async (chapter: Chapter) => {
        const index = chapters.findIndex(ch => ch.id === chapter.id);
        if (index !== -1) {
            loadChapterByIndex(index);
        }
    }, [chapters, loadChapterByIndex]);

    // Chapter navigation
    const goToPrevChapter = () => {
        if (currentChapterIndex > 0) {
            loadChapterByIndex(currentChapterIndex - 1);
        }
    };

    const goToNextChapter = () => {
        if (currentChapterIndex < chapters.length - 1) {
            loadChapterByIndex(currentChapterIndex + 1);
        }
    };

    // Filter chapters by search
    const filteredChapters = chapters.filter(chapter => {
        if (!chapterSearchQuery) return true;
        return chapter.title.toLowerCase().includes(chapterSearchQuery.toLowerCase());
    });

    // Zoom controls
    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 10, 200));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 10, 50));
    const handleZoomReset = () => setZoomLevel(100);

    // Fullscreen toggle
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement) return;

            switch (e.key) {
                case 'ArrowLeft':
                    goToPrevChapter();
                    break;
                case 'ArrowRight':
                    goToNextChapter();
                    break;
                case 'f':
                case 'F':
                    toggleFullscreen();
                    break;
                case 's':
                case 'S':
                    setSidebarOpen(prev => !prev);
                    break;
                case '+':
                case '=':
                    handleZoomIn();
                    break;
                case '-':
                    handleZoomOut();
                    break;
                case '0':
                    handleZoomReset();
                    break;
                case 'Escape':
                    if (isFullscreen) {
                        document.exitFullscreen();
                        setIsFullscreen(false);
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentChapterIndex, chapters.length, isFullscreen]);

    // Track scroll position for page indicator
    useEffect(() => {
        const container = readingAreaRef.current;
        if (!container || pages.length === 0) return;

        const handleScroll = () => {
            const scrollTop = container.scrollTop;
            const scrollHeight = container.scrollHeight - container.clientHeight;
            const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
            const pageNum = Math.min(Math.ceil(progress * pages.length) + 1, pages.length);
            setCurrentPage(pageNum);
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [pages.length]);

    // Auto-hide controls on mouse move
    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = setTimeout(() => {
            if (pages.length > 0) {
                setShowControls(false);
            }
        }, 3000);
    };

    // Loading state
    if (searchLoading) {
        return (
            <div className="fixed inset-0 z-[100] bg-[#0a0a0a] flex items-center justify-center">
                <LoadingSpinner size="lg" text={`Searching for "${mangaTitle}" on MangaKatana...`} />
            </div>
        );
    }

    // Error state
    if (searchError || searchResults.length === 0) {
        return (
            <div className="fixed inset-0 z-[100] bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
                <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-red-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Manga Not Found</h2>
                <p className="text-gray-400 mb-6 text-center max-w-md">
                    Could not find "{mangaTitle}" on MangaKatana. The manga may not be available for reading.
                </p>
                <button
                    onClick={() => navigate('/manga')}
                    className="px-6 py-3 rounded-xl bg-miru-primary hover:bg-miru-primary/80 text-white font-medium transition-all"
                >
                    Back to Manga
                </button>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 bg-[#0a0a0a] text-white z-[100] flex flex-col"
            onMouseMove={handleMouseMove}
        >
            {/* Top Header Bar */}
            <header
                className={`flex items-center justify-between px-4 py-3 bg-[#111]/95 backdrop-blur-md border-b border-white/5 transition-all duration-300 ${showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
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
                            disabled={currentChapterIndex <= 0}
                            className="p-2 rounded-md hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Previous Chapter (←)"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                        </button>
                        <span className="px-3 text-sm font-medium min-w-[80px] text-center">
                            {currentChapterIndex + 1} / {chapters.length}
                        </span>
                        <button
                            onClick={goToNextChapter}
                            disabled={currentChapterIndex >= chapters.length - 1}
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
                    {/* Reading Mode Toggle */}
                    <div className="hidden sm:flex items-center gap-1 bg-white/5 rounded-lg p-1">
                        <button
                            onClick={() => setReadingMode('vertical')}
                            className={`p-2 rounded-md transition-colors ${readingMode === 'vertical' ? 'bg-miru-primary text-black' : 'hover:bg-white/10'}`}
                            title="Vertical Scroll"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setReadingMode('single')}
                            className={`p-2 rounded-md transition-colors ${readingMode === 'single' ? 'bg-miru-primary text-black' : 'hover:bg-white/10'}`}
                            title="Single Page"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                        </button>
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

            <div className="flex flex-1 overflow-hidden">
                {/* Chapter Sidebar */}
                <aside
                    className={`bg-[#111] border-r border-white/5 flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-0'
                        } overflow-hidden`}
                >
                    {/* Sidebar Header */}
                    <div className="p-4 border-b border-white/5 bg-[#0a0a0a]">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-miru-primary">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                                </svg>
                                <h3 className="font-bold text-white">Chapters</h3>
                            </div>
                            <div className="flex items-center gap-1">
                                {/* List/Grid Toggle */}
                                <button
                                    onClick={() => setChapterViewMode('list')}
                                    className={`p-1.5 rounded transition-colors ${chapterViewMode === 'list' ? 'bg-miru-primary text-black' : 'bg-white/5 hover:bg-white/10 text-gray-400'}`}
                                    title="List View"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setChapterViewMode('grid')}
                                    className={`p-1.5 rounded transition-colors ${chapterViewMode === 'grid' ? 'bg-miru-primary text-black' : 'bg-white/5 hover:bg-white/10 text-gray-400'}`}
                                    title="Grid View"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                                    </svg>
                                </button>
                                <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-md ml-1">
                                    {chapters.length}
                                </span>
                            </div>
                        </div>
                        <input
                            type="text"
                            placeholder="Search chapters..."
                            value={chapterSearchQuery}
                            onChange={(e) => setChapterSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-miru-primary/50 focus:ring-1 focus:ring-miru-primary/25 transition-all"
                        />
                    </div>

                    {/* Chapter List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {chaptersLoading ? (
                            <div className="flex justify-center p-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-miru-primary"></div>
                            </div>
                        ) : filteredChapters.length > 0 ? (
                            chapterViewMode === 'grid' ? (
                                /* Grid View - Compact numbered buttons */
                                <div className="p-3 grid grid-cols-5 gap-2">
                                    {filteredChapters.map((chapter) => {
                                        const isActive = currentChapter?.id === chapter.id;
                                        // Extract chapter number from title
                                        const chapterNum = chapter.title.match(/\d+/)?.[0] || '?';
                                        return (
                                            <button
                                                key={chapter.id}
                                                onClick={() => loadChapter(chapter)}
                                                className={`aspect-square flex items-center justify-center rounded-lg transition-all duration-200 text-sm font-bold border ${isActive
                                                    ? 'bg-miru-primary text-black border-miru-primary shadow-lg shadow-miru-primary/20'
                                                    : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border-white/5 hover:border-miru-primary/50'
                                                    }`}
                                                title={chapter.title}
                                            >
                                                {chapterNum}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                /* List View - Detailed with titles */
                                <div>
                                    {filteredChapters.map((chapter) => {
                                        const isActive = currentChapter?.id === chapter.id;
                                        return (
                                            <button
                                                key={chapter.id}
                                                onClick={() => loadChapter(chapter)}
                                                className={`w-full text-left px-4 py-3 transition-all border-l-2 hover:bg-white/5 ${isActive
                                                    ? 'bg-miru-primary/10 border-miru-primary text-white'
                                                    : 'border-transparent text-gray-400 hover:text-white'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {isActive && (
                                                        <div className="w-2 h-2 rounded-full bg-miru-primary animate-pulse"></div>
                                                    )}
                                                    <span className="text-sm font-medium truncate flex-1">{chapter.title}</span>
                                                </div>
                                                {chapter.uploadDate && (
                                                    <div className="text-xs text-gray-500 mt-1 ml-4">{chapter.uploadDate}</div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                {chapters.length === 0 ? 'No chapters found' : 'No matching chapters'}
                            </div>
                        )}
                    </div>
                </aside>

                {/* Reading Area */}
                <main
                    ref={readingAreaRef}
                    className="flex-1 overflow-y-auto bg-[#0a0a0a] custom-scrollbar"
                >
                    {pagesLoading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-miru-primary"></div>
                            <p className="text-gray-400 animate-pulse">Loading pages...</p>
                        </div>
                    ) : pages.length > 0 ? (
                        <>
                            {readingMode === 'vertical' ? (
                                <div className="flex flex-col items-center py-4">
                                    {pages.map((page) => (
                                        <img
                                            key={page.pageNumber}
                                            src={page.imageUrl}
                                            alt={`Page ${page.pageNumber}`}
                                            className="block transition-all duration-200 max-w-full"
                                            style={{ width: `${zoomLevel}%` }}
                                            loading="lazy"
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center min-h-full py-4">
                                    <img
                                        src={pages[currentPage - 1]?.imageUrl}
                                        alt={`Page ${currentPage}`}
                                        className="block transition-all duration-200 max-h-full"
                                        style={{ width: `${zoomLevel}%`, maxWidth: '100%' }}
                                    />
                                </div>
                            )}

                            {/* End of Chapter Navigation */}
                            <div className="flex flex-col items-center gap-4 py-12 border-t border-white/5 mt-8">
                                <p className="text-gray-400 text-sm">End of {currentChapter?.title}</p>
                                <div className="flex gap-4">
                                    <button
                                        onClick={goToPrevChapter}
                                        disabled={currentChapterIndex <= 0}
                                        className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                        </svg>
                                        Previous Chapter
                                    </button>
                                    <button
                                        onClick={goToNextChapter}
                                        disabled={currentChapterIndex >= chapters.length - 1}
                                        className="px-6 py-3 rounded-xl bg-miru-primary hover:bg-miru-primary/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium"
                                    >
                                        Next Chapter
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-6">
                            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                                </svg>
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-bold text-white mb-2">Select a chapter to start reading</h3>
                                <p className="text-sm text-gray-500">Choose from the sidebar on the left</p>
                            </div>

                            {/* Keyboard Shortcuts Help */}
                            <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/5">
                                <h4 className="text-sm font-bold text-white mb-3">Keyboard Shortcuts</h4>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="flex items-center gap-2">
                                        <kbd className="px-2 py-1 bg-white/10 rounded text-gray-300">←</kbd>
                                        <span>Prev Chapter</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <kbd className="px-2 py-1 bg-white/10 rounded text-gray-300">→</kbd>
                                        <span>Next Chapter</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <kbd className="px-2 py-1 bg-white/10 rounded text-gray-300">S</kbd>
                                        <span>Toggle Sidebar</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <kbd className="px-2 py-1 bg-white/10 rounded text-gray-300">F</kbd>
                                        <span>Fullscreen</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <kbd className="px-2 py-1 bg-white/10 rounded text-gray-300">+/-</kbd>
                                        <span>Zoom In/Out</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <kbd className="px-2 py-1 bg-white/10 rounded text-gray-300">0</kbd>
                                        <span>Reset Zoom</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Bottom Progress Bar (only when reading) */}
            {pages.length > 0 && (
                <div
                    className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ${showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
                        }`}
                >
                    {/* Progress Bar */}
                    <div className="h-1 bg-white/5">
                        <div
                            className="h-full bg-gradient-to-r from-miru-primary to-miru-accent transition-all duration-200"
                            style={{ width: `${(currentPage / pages.length) * 100}%` }}
                        />
                    </div>
                    {/* Page Indicator */}
                    <div className="flex items-center justify-center gap-4 py-2 bg-[#111]/95 backdrop-blur-md border-t border-white/5">
                        <span className="text-sm text-gray-400">
                            Page <span className="text-white font-bold">{currentPage}</span> of <span className="text-white font-bold">{pages.length}</span>
                        </span>
                    </div>
                </div>
            )}

            {/* Custom scrollbar and scroll behavior styles */}
            <style>{`
                .custom-scrollbar {
                    scroll-behavior: smooth;
                    overscroll-behavior: contain;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                .manga-reader-scroll {
                    scroll-behavior: smooth;
                    overscroll-behavior: contain;
                    -webkit-overflow-scrolling: touch;
                }
            `}</style>
        </div>
    );
}

export default MangaReader;
