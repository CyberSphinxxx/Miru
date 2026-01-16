import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
 */
function MangaReader() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Search state
    const [searchResults, setSearchResults] = useState<ScraperManga[]>([]);
    const [selectedManga, setSelectedManga] = useState<ScraperManga | null>(null);
    const [searchLoading, setSearchLoading] = useState(true);
    const [searchError, setSearchError] = useState<string | null>(null);

    // Chapter state
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
    const [chaptersLoading, setChaptersLoading] = useState(false);
    const [chapterSearchQuery, setChapterSearchQuery] = useState('');

    // Pages state
    const [pages, setPages] = useState<Page[]>([]);
    const [pagesLoading, setPagesLoading] = useState(false);

    // UI state
    const [zoomLevel, setZoomLevel] = useState(80);

    // Decode title from URL
    const mangaTitle = id ? decodeURIComponent(id) : '';

    // Search for manga on MangaKatana
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

    // Load chapters when manga is selected
    useEffect(() => {
        if (!selectedManga) return;

        const loadChapters = async () => {
            setChaptersLoading(true);
            try {
                const chapterList = await mangaService.getChapters(selectedManga.id);
                setChapters(chapterList);
            } catch (err) {
                console.error('Failed to load chapters:', err);
            } finally {
                setChaptersLoading(false);
            }
        };

        loadChapters();
    }, [selectedManga]);

    // Load chapter pages
    const loadChapter = useCallback(async (chapter: Chapter) => {
        setCurrentChapter(chapter);
        setPagesLoading(true);
        setPages([]);

        try {
            const pageList = await mangaService.getChapterPages(chapter.url);
            setPages(pageList);
        } catch (err) {
            console.error('Failed to load pages:', err);
        } finally {
            setPagesLoading(false);
        }
    }, []);

    // Filter chapters by search
    const filteredChapters = chapters.filter(chapter => {
        if (!chapterSearchQuery) return true;
        return chapter.title.toLowerCase().includes(chapterSearchQuery.toLowerCase());
    });

    // Zoom controls
    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 10, 150));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 10, 30));

    // Loading state
    if (searchLoading) {
        return (
            <div className="min-h-screen bg-miru-bg flex items-center justify-center pt-20">
                <LoadingSpinner size="lg" text={`Searching for "${mangaTitle}" on MangaKatana...`} />
            </div>
        );
    }

    // Error state
    if (searchError || searchResults.length === 0) {
        return (
            <div className="min-h-screen bg-miru-bg flex flex-col items-center justify-center pt-20 px-4">
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
                    className="px-6 py-3 rounded-full bg-miru-primary hover:bg-miru-primary/80 text-white font-medium transition-all"
                >
                    Back to Manga
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            {/* Header */}
            <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-[#1a1a1a]/95 backdrop-blur-md border-b border-white/5">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/manga')}
                        className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-lg font-bold truncate max-w-[300px] md:max-w-[500px]">
                            {selectedManga?.title || mangaTitle}
                        </h1>
                        {currentChapter && (
                            <p className="text-sm text-gray-400">{currentChapter.title}</p>
                        )}
                    </div>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleZoomOut}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6" />
                        </svg>
                    </button>
                    <span className="text-sm font-bold text-white/80 w-12 text-center">{zoomLevel}%</span>
                    <button
                        onClick={handleZoomIn}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="flex pt-16 h-screen">
                {/* Chapter Sidebar */}
                <div className="w-64 bg-[#111] border-r border-white/5 flex flex-col flex-shrink-0">
                    {/* Search Chapters */}
                    <div className="p-4 border-b border-white/5 bg-[#161616]">
                        <div className="flex items-center gap-2 mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                            </svg>
                            <h3 className="font-semibold text-white text-sm">Chapters ({chapters.length})</h3>
                        </div>
                        <input
                            type="text"
                            placeholder="Search chapters..."
                            value={chapterSearchQuery}
                            onChange={(e) => setChapterSearchQuery(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-miru-primary/50 transition-colors"
                        />
                    </div>

                    {/* Chapter List */}
                    <div className="flex-1 overflow-y-auto">
                        {chaptersLoading ? (
                            <div className="flex justify-center p-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-miru-primary"></div>
                            </div>
                        ) : filteredChapters.length > 0 ? (
                            <div className="space-y-0.5">
                                {filteredChapters.map((chapter) => (
                                    <button
                                        key={chapter.id}
                                        onClick={() => loadChapter(chapter)}
                                        className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-l-2 ${currentChapter?.id === chapter.id
                                                ? 'bg-miru-primary/10 border-miru-primary'
                                                : 'border-transparent'
                                            }`}
                                    >
                                        <div className="text-sm font-medium truncate">{chapter.title}</div>
                                        {chapter.uploadDate && (
                                            <div className="text-xs text-gray-500 mt-0.5">{chapter.uploadDate}</div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                {chapters.length === 0 ? 'No chapters found' : 'No matching chapters'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Reading Area */}
                <div className="flex-1 bg-[#0a0a0a] overflow-y-auto">
                    {pagesLoading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-miru-primary"></div>
                            <p className="text-gray-400 animate-pulse">Loading pages...</p>
                        </div>
                    ) : pages.length > 0 ? (
                        <div className="flex flex-col items-center py-4">
                            {pages.map((page) => (
                                <img
                                    key={page.pageNumber}
                                    src={page.imageUrl}
                                    alt={`Page ${page.pageNumber}`}
                                    className="block transition-all duration-200"
                                    style={{ width: `${zoomLevel}%`, maxWidth: '100%' }}
                                    loading="lazy"
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                                </svg>
                            </div>
                            <p>Select a chapter to start reading</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MangaReader;
