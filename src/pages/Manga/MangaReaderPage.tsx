import { useState, useEffect, useCallback, useRef } from 'react';
import { VirtuosoHandle } from 'react-virtuoso';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import { mangaService } from '../../services/api';
import ReaderHeader from './components/ReaderHeader';
import ChapterSidebar from './components/ChapterSidebar';
import ReaderArea from './components/ReaderArea';

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
    const [chapterPage, setChapterPage] = useState(1);

    // Pages state
    const [pages, setPages] = useState<Page[]>([]);
    const [pagesLoading, setPagesLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    // UI state
    const [zoomLevel, setZoomLevel] = useState(100);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showControls, setShowControls] = useState(true);
    const [readingMode, setReadingMode] = useState<'long-strip' | 'long-strip-gaps' | 'paged-ltr' | 'paged-rtl' | 'paged-vertical'>('long-strip');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [chapterViewMode, setChapterViewMode] = useState<'list' | 'grid'>('list');
    const [showSettings, setShowSettings] = useState(false);

    // Refs
    const readingAreaRef = useRef<HTMLDivElement>(null);
    const virtuosoRef = useRef<VirtuosoHandle>(null);
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
                        if (virtuosoRef.current) {
                            virtuosoRef.current.scrollTo({ top: 0 });
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
            if (virtuosoRef.current) {
                virtuosoRef.current.scrollTo({ top: 0 });
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

    // Preload next chapter when current chapter is loaded
    useEffect(() => {
        if (currentChapterIndex >= 0 && chapters.length > 0) {
            // Calculate next chapter index (reversed: next is index - 1)
            // But verify logic: 
            // chapters is [Newest ... Oldest]
            // If I am at chapter 1 (index N), next is Chapter 2 (index N-1)
            // Wait, if chapters is descending (Ch 100, Ch 99 ... Ch 1),
            // Current is Ch 100 (Index 0). Next (Ch 101) doesn't exist. Prev (Ch 99) is Index 1.
            // "Next Chapter" in UI calls goToNextChapter which does index - 1.
            // So if I am at Index 5 (Ch 50), Next is Index 4 (Ch 51).
            // So yes, next chapter to read is index - 1.

            const nextIndex = currentChapterIndex - 1;

            if (nextIndex >= 0 && nextIndex < chapters.length) {
                const nextChapter = chapters[nextIndex];
                const cacheKey = `chapter_pages_${nextChapter.id}`;

                // Only preload if not already in cache
                if (!sessionStorage.getItem(cacheKey)) {
                    console.log(`[Reader] Preloading next chapter: ${nextChapter.title}`);
                    mangaService.getChapterPages(nextChapter.url)
                        .then(pages => {
                            sessionStorage.setItem(cacheKey, JSON.stringify({
                                pages: pages,
                                chapterId: nextChapter.id,
                                timestamp: Date.now()
                            }));
                            console.log(`[Reader] Preloaded ${pages.length} pages for ${nextChapter.title}`);
                        })
                        .catch(err => {
                            console.error(`[Reader] Failed to preload ${nextChapter.title}:`, err);
                        });
                }
            }
        }
    }, [currentChapterIndex, chapters]);

    // Chapter navigation (works with reversed display order)
    // Since display is reversed (ch1 at top), prev = higher index in original array
    const goToPrevChapter = () => {
        if (currentChapterIndex < chapters.length - 1) {
            loadChapterByIndex(currentChapterIndex + 1);
        }
    };

    const goToNextChapter = () => {
        if (currentChapterIndex > 0) {
            loadChapterByIndex(currentChapterIndex - 1);
        }
    };

    // Filter and reverse chapters for display (ch1 at top, latest at bottom)
    const filteredChapters = chapters.filter(chapter => {
        if (!chapterSearchQuery) return true;
        return chapter.title.toLowerCase().includes(chapterSearchQuery.toLowerCase());
    }).slice().reverse();

    // Zoom controls - increased range (25% to 300%)
    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 10, 300));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 10, 25));
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
    }, [pages.length, readingMode]);

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
            <ReaderHeader
                showControls={showControls}
                navigate={navigate}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                selectedManga={selectedManga}
                mangaTitle={mangaTitle}
                currentChapter={currentChapter}
                goToPrevChapter={goToPrevChapter}
                goToNextChapter={goToNextChapter}
                currentChapterIndex={currentChapterIndex}
                chaptersLength={chapters.length}
                showSettings={showSettings}
                setShowSettings={setShowSettings}
                readingMode={readingMode}
                setReadingMode={setReadingMode as any}
                zoomLevel={zoomLevel}
                handleZoomOut={handleZoomOut}
                handleZoomIn={handleZoomIn}
                handleZoomReset={handleZoomReset}
                isFullscreen={isFullscreen}
                toggleFullscreen={toggleFullscreen}
            />

            <div className="flex flex-1 overflow-hidden">
                <ChapterSidebar
                    sidebarOpen={sidebarOpen}
                    chapterViewMode={chapterViewMode}
                    setChapterViewMode={setChapterViewMode}
                    chaptersLength={chapters.length}
                    chapterSearchQuery={chapterSearchQuery}
                    setChapterSearchQuery={setChapterSearchQuery}
                    chaptersLoading={chaptersLoading}
                    filteredChapters={filteredChapters}
                    chapterPage={chapterPage}
                    setChapterPage={setChapterPage}
                    currentChapter={currentChapter}
                    loadChapter={loadChapter}
                />

                <ReaderArea
                    pagesLoading={pagesLoading}
                    pages={pages}
                    readingMode={readingMode}
                    zoomLevel={zoomLevel}
                    currentChapter={currentChapter}
                    currentChapterIndex={currentChapterIndex}
                    chaptersLength={chapters.length}
                    goToPrevChapter={goToPrevChapter}
                    goToNextChapter={goToNextChapter}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    readingAreaRef={readingAreaRef as any}
                    virtuosoRef={virtuosoRef as any}
                />
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
