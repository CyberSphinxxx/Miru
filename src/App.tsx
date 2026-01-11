import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AnimeCard from './components/AnimeCard';
import AnimeDetail from './components/AnimeDetail';
import LoadingSpinner from './components/LoadingSpinner';
import { Anime, Episode, StreamLink } from './types';

const API_BASE = 'http://localhost:3001/api';

function App() {
    // Main state
    const [topAnime, setTopAnime] = useState<Anime[]>([]);
    const [searchResults, setSearchResults] = useState<Anime[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastVisiblePage, setLastVisiblePage] = useState(1);
    const [error, setError] = useState<string | null>(null);

    // Watch state
    const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [scraperSession, setScraperSession] = useState<string | null>(null);
    const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
    const [streams, setStreams] = useState<StreamLink[]>([]);
    const [selectedStreamIndex, setSelectedStreamIndex] = useState<number>(0);
    const [isAutoQuality, setIsAutoQuality] = useState(true);
    const [playerMode, setPlayerMode] = useState<'hls' | 'embed'>('embed');
    const [epLoading, setEpLoading] = useState(false);
    const [streamLoading, setStreamLoading] = useState(false);

    // Fetch top anime
    useEffect(() => {
        const fetchTopAnime = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${API_BASE}/jikan/top?page=${currentPage}&limit=24`);
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();

                if (data?.data) {
                    setTopAnime(data.data);
                    if (data.pagination) {
                        setLastVisiblePage(data.pagination.last_visible_page);
                    }
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load anime. Please make sure the backend is running.');
            } finally {
                setLoading(false);
            }
        };

        if (!isSearching) {
            fetchTopAnime();
        }
    }, [currentPage, isSearching]);

    // Handle body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = selectedAnime ? 'hidden' : 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [selectedAnime]);

    // Perform search
    useEffect(() => {
        const performSearch = async () => {
            setSearchLoading(true);
            try {
                const res = await fetch(`${API_BASE}/jikan/search?q=${encodeURIComponent(searchQuery)}&page=${currentPage}&limit=24`);
                const data = await res.json();
                if (data?.data) {
                    setSearchResults(data.data);
                    if (data.pagination) {
                        setLastVisiblePage(data.pagination.last_visible_page);
                    }
                }
            } catch (err) {
                console.error('Search failed', err);
            } finally {
                setSearchLoading(false);
            }
        };

        if (isSearching && searchQuery.trim()) {
            performSearch();
        }
    }, [currentPage, isSearching, searchQuery]);

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim()) {
            setIsSearching(false);
            return;
        }
        setCurrentPage(1);
        setIsSearching(true);
    };

    const clearSearch = () => {
        setSearchQuery('');
        setIsSearching(false);
        setSearchResults([]);
        setSearchLoading(false);
        setCurrentPage(1);
    };

    const handleAnimeClick = async (anime: Anime) => {
        setSelectedAnime(anime);
        setEpLoading(true);
        setEpisodes([]);
        setCurrentEpisode(null);
        setStreams([]);
        setScraperSession(null);

        try {
            // Fetch full details
            const detailRes = await fetch(`${API_BASE}/jikan/anime/${anime.mal_id}`);
            const detailData = await detailRes.json();
            if (detailData?.data) {
                setSelectedAnime(detailData.data);
            }

            // Search for the anime on scraper
            let searchRes = await fetch(`${API_BASE}/scraper/search?q=${encodeURIComponent(anime.title)}`);
            let searchData = await searchRes.json();

            // Fallback search with simpler title
            if ((!searchData || searchData.length === 0) && anime.title.includes(':')) {
                const simpleTitle = anime.title.split(':')[0].trim();
                searchRes = await fetch(`${API_BASE}/scraper/search?q=${encodeURIComponent(simpleTitle)}`);
                searchData = await searchRes.json();
            }

            if (searchData?.length > 0) {
                const session = searchData[0].session || searchData[0].id;
                setScraperSession(session);

                const epRes = await fetch(`${API_BASE}/scraper/episodes?session=${session}`);
                const epData = await epRes.json();

                if (epData?.episodes) {
                    setEpisodes(epData.episodes);
                } else if (epData?.ep_details) {
                    setEpisodes(epData.ep_details);
                } else if (Array.isArray(epData)) {
                    setEpisodes(epData);
                }
            }
        } catch (e) {
            console.error('Failed to load episodes', e);
        } finally {
            setEpLoading(false);
        }
    };

    const getMappedQuality = (q: string): string => {
        const res = parseInt(q);
        if (res >= 1000) return '1080P';
        if (res >= 600) return '720P';
        return '360P';
    };

    const loadStream = async (episode: Episode) => {
        if (!scraperSession) return;
        setCurrentEpisode(episode);
        setStreamLoading(true);
        setStreams([]);
        setSelectedStreamIndex(0);
        setIsAutoQuality(true);

        try {
            const res = await fetch(`${API_BASE}/scraper/streams?anime_session=${scraperSession}&ep_session=${episode.session}`);
            const data = await res.json();

            if (data?.length > 0) {
                const qualityMap = new Map<string, StreamLink>();
                const sortedData = [...data].sort((a: StreamLink, b: StreamLink) =>
                    (parseInt(b.quality) || 0) - (parseInt(a.quality) || 0)
                );

                sortedData.forEach((s: StreamLink) => {
                    const mapped = getMappedQuality(s.quality);
                    if (!qualityMap.has(mapped)) {
                        qualityMap.set(mapped, s);
                    }
                });

                const standardizedStreams = Array.from(qualityMap.values());
                setStreams(standardizedStreams);

                if (!standardizedStreams[0].directUrl) setPlayerMode('embed');
            }
        } catch (e) {
            console.error('Failed to load stream', e);
        } finally {
            setStreamLoading(false);
        }
    };

    const handleQualityChange = (index: number) => {
        setSelectedStreamIndex(index);
        setIsAutoQuality(false);
    };

    const setAutoQuality = () => {
        setIsAutoQuality(true);
        setSelectedStreamIndex(0);
    };

    const closeDetails = () => {
        setSelectedAnime(null);
        setEpisodes([]);
        setCurrentEpisode(null);
        setStreams([]);
    };

    const displayedAnime = isSearching ? searchResults : topAnime;
    const maxPage = isSearching ? lastVisiblePage : Math.min(lastVisiblePage, 5);

    return (
        <div className="min-h-screen bg-miru-bg text-white">
            <Navbar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onSearch={handleSearch}
                onLogoClick={clearSearch}
                isSearching={isSearching}
            />

            {/* Main Content */}
            <main className="container mx-auto px-6 pt-24 pb-12">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold">
                            {isSearching ? `Results for "${searchQuery}"` : 'Top Anime'}
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">
                            {isSearching
                                ? `Found ${searchResults.length} results`
                                : 'Discover the highest rated anime'
                            }
                        </p>
                    </div>
                    {isSearching && (
                        <button
                            onClick={clearSearch}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                            Clear
                        </button>
                    )}
                </div>

                {/* Content */}
                {searchLoading || (loading && topAnime.length === 0) ? (
                    <div className="flex justify-center items-center h-96">
                        <LoadingSpinner size="lg" text="Loading anime..." />
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-red-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                            </svg>
                        </div>
                        <p className="text-red-400 mb-2">{error}</p>
                        <p className="text-gray-500 text-sm">Make sure the backend server is running on port 3001</p>
                    </div>
                ) : (
                    <>
                        {/* Anime Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                            {displayedAnime.slice(0, currentPage === 5 ? 4 : 24).map((anime, index) => (
                                <AnimeCard
                                    key={anime.mal_id}
                                    anime={{
                                        ...anime,
                                        rank: isSearching ? anime.rank : ((currentPage - 1) * 24 + index + 1)
                                    }}
                                    onClick={handleAnimeClick}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="flex justify-center items-center mt-12 gap-2">
                            {currentPage > 1 && (
                                <>
                                    <button
                                        onClick={() => setCurrentPage(1)}
                                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 transition-all font-bold text-sm"
                                    >
                                        «
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 transition-all font-bold text-sm"
                                    >
                                        ‹
                                    </button>
                                </>
                            )}

                            {(() => {
                                const pages = [];
                                let start = Math.max(1, currentPage - 1);
                                if (start + 3 > maxPage) start = Math.max(1, maxPage - 3);

                                for (let i = start; i <= Math.min(start + 3, maxPage); i++) {
                                    pages.push(i);
                                }

                                return pages.map(pageNum => (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${currentPage === pageNum
                                                ? 'bg-miru-accent text-white shadow-lg shadow-miru-accent/30'
                                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                ));
                            })()}

                            {currentPage < maxPage && (
                                <>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(maxPage, prev + 1))}
                                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 transition-all font-bold text-sm"
                                    >
                                        ›
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(maxPage)}
                                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 transition-all font-bold text-sm"
                                    >
                                        »
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Empty State for Search */}
                        {isSearching && searchResults.length === 0 && !searchLoading && (
                            <div className="text-center py-20">
                                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gray-500">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                                    </svg>
                                </div>
                                <p className="text-gray-400">No anime found matching "{searchQuery}"</p>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Anime Detail Modal */}
            {selectedAnime && (
                <AnimeDetail
                    anime={selectedAnime}
                    episodes={episodes}
                    currentEpisode={currentEpisode}
                    streams={streams}
                    selectedStreamIndex={selectedStreamIndex}
                    playerMode={playerMode}
                    isAutoQuality={isAutoQuality}
                    epLoading={epLoading}
                    streamLoading={streamLoading}
                    onClose={closeDetails}
                    onEpisodeClick={loadStream}
                    onQualityChange={handleQualityChange}
                    onModeChange={setPlayerMode}
                    onAutoQuality={setAutoQuality}
                />
            )}
        </div>
    );
}

export default App;
