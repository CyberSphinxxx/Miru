import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AnimeCard from '../../components/AnimeCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import SubNav from '../../components/SubNav';
import AnimeSchedule from '../../components/AnimeSchedule';
import { Anime, Genre } from '../../types';
import { Manga } from '../../types/manga';
import { getWatchHistory, WatchHistoryItem } from '../../services/watchHistoryService';
import { getReadHistory, ReadHistoryItem } from '../../services/readHistoryService';
import {
    animeService,
    mangaService,
    getPopularAnime,
    getGenres,
    getCached
} from '../../services/api';
import { getMangaCached } from '../../services/api/manga.api';
import { movieService } from '../../services/api/movies.api';
import HeroCarousel, { SpotlightItem } from '../../components/HeroCarousel';
import ContinueWatchingRow from './components/ContinueWatchingRow';
import TrendingRow from './components/TrendingRow';
import ContinueReadingRow from './components/ContinueReadingRow';
import TrendingMangaRow from './components/TrendingMangaRow';
import TrendingMoviesRow from './components/TrendingMoviesRow';
import GenreSelectorView from './components/GenreSelectorView';
import { Movie } from '../../types/tmdb';

interface HomeProps {
    viewMode: 'home' | 'anime' | 'trending' | 'genres';
    selectedGenreId?: string;
}

// Helper to get initial state from cache (prevents layout shift on refresh)
const getInitialTrendingAnime = (): Anime[] => {
    const cached = getCached('trending-1-10', 'trending');
    return cached?.data || [];
};

const getInitialTrendingManga = (): Manga[] => {
    const cached = getMangaCached('trending-manga-1-10', 'trending');
    return cached?.data || [];
};

function Home({ viewMode, selectedGenreId }: HomeProps) {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const searchQuery = searchParams.get('q') || '';

    // Data state
    const [animeList, setAnimeList] = useState<Anime[]>([]);
    // Mixed Media Spotlight Carousel State
    const [spotlightMedia, setSpotlightMedia] = useState<SpotlightItem[]>([]);

    const [genres, setGenres] = useState<Genre[]>([]);
    const [genresLoading, setGenresLoading] = useState(false);
    const [genreFilter, setGenreFilter] = useState('');
    const [showAllGenres, setShowAllGenres] = useState(false);

    // UI state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastVisiblePage, setLastVisiblePage] = useState(1);

    // New state for homepage redesign - initialized from cache to prevent layout shift
    const [trendingAnime, setTrendingAnime] = useState<Anime[]>(getInitialTrendingAnime);
    const [trendingError, setTrendingError] = useState(false);
    const [trendingManga, setTrendingManga] = useState<Manga[]>(getInitialTrendingManga);
    const [trendingMangaError, setTrendingMangaError] = useState(false);
    const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
    const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
    const [readHistory, setReadHistory] = useState<ReadHistoryItem[]>([]);

    // Reset page when view/search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [viewMode, selectedGenreId, searchQuery]);

    // Fetch Genres (static list)
    useEffect(() => {
        const fetchGenres = async () => {
            if (genres.length > 0) return;
            try {
                setGenresLoading(true);
                const genreList = getGenres();
                setGenres(genreList);
            } catch (err) {
                console.error('Failed to fetch genres', err);
            } finally {
                setGenresLoading(false);
            }
        };
        fetchGenres();
    }, []);

    // Load watch history for Continue Watching row
    useEffect(() => {
        const history = getWatchHistory();
        setWatchHistory(history);
    }, []);

    // Load read history for Continue Reading row
    useEffect(() => {
        const history = getReadHistory();
        setReadHistory(history);
    }, []);

    // Fetch trending anime for the Trending row (home view only)
    useEffect(() => {
        const fetchTrending = async () => {
            if ((viewMode !== 'home' && viewMode !== 'anime') || searchQuery) return;
            setTrendingError(false);
            try {
                const result = await animeService.getTrendingAnime(1, 10);
                setTrendingAnime(result.data);
            } catch (err) {
                console.error('Failed to fetch trending', err);
                setTrendingError(true);
            }
        };
        fetchTrending();
    }, [viewMode, searchQuery]);

    // Fetch trending manga for the home page
    useEffect(() => {
        const fetchTrendingManga = async () => {
            if (viewMode !== 'home' || searchQuery) return;
            setTrendingMangaError(false);
            try {
                const result = await mangaService.getTrendingManga(1, 10);
                setTrendingManga(result.data);
            } catch (err) {
                console.error('Failed to fetch trending manga', err);
                setTrendingMangaError(true);
            }
        };
        fetchTrendingManga();
    }, [viewMode, searchQuery]);

    // Fetch trending manga for the home page
    useEffect(() => {
        const fetchTrendingManga = async () => {
            if (viewMode !== 'home' || searchQuery) return;
            setTrendingMangaError(false);
            try {
                const result = await mangaService.getTrendingManga(1, 10);
                setTrendingManga(result.data);
            } catch (err) {
                console.error('Failed to fetch trending manga', err);
                setTrendingMangaError(true);
            }
        };
        fetchTrendingManga();
    }, [viewMode, searchQuery]);

    // Fetch trending movies for the home page
    useEffect(() => {
        const fetchTrendingMovies = async () => {
            if (viewMode !== 'home' || searchQuery) return;

            try {
                const result = await movieService.getTrending();
                setTrendingMovies(result);
            } catch (err) {
                console.error('Failed to fetch trending movies', err);
            }
        };
        fetchTrendingMovies();
    }, [viewMode, searchQuery]);

    // Fetch Anime Data
    useEffect(() => {
        let isMounted = true;
        const fetchAnime = async () => {
            // If viewing a specific genre but genres list isn't loaded yet,
            // wait for it (loading state stays true from initial render)
            if (viewMode === 'genres' && selectedGenreId && genres.length === 0) {
                return;
            }

            try {
                setLoading(true);
                setError(null);

                let result: { data: Anime[]; pagination: { last_visible_page: number } };

                if (searchQuery) {
                    result = await animeService.searchAnime(searchQuery, currentPage);
                } else if (viewMode === 'trending') {
                    result = await animeService.getTrendingAnime(currentPage, 24);
                } else if (viewMode === 'genres') {
                    if (selectedGenreId) {
                        // Find genre name from ID
                        const genre = genres.find(g => g.id.toString() === selectedGenreId);

                        // Use dedicated genre endpoint
                        const genreName = genre?.name || 'Action';
                        result = await animeService.getAnimeByGenre(genreName, currentPage);
                    } else {
                        // Just show genres list, no anime fetch needed yet
                        setLoading(false);
                        return;
                    }
                } else {
                    // Default Home (Popular Anime - used as "Top")
                    result = await getPopularAnime(currentPage);
                }

                if (!isMounted) return;

                setAnimeList(result.data);
                if (result.pagination?.last_visible_page) {
                    setLastVisiblePage(result.pagination.last_visible_page);
                }
            } catch (err) {
                if (!isMounted) return;
                console.error(err);
                setError('Failed to load anime. Please make sure the API is accessible.');
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchAnime();

        return () => {
            isMounted = false;
        };
    }, [viewMode, selectedGenreId, searchQuery, currentPage, genres]);

    // Build mixed media spotlight from trending anime and manga
    useEffect(() => {
        if (searchQuery) return;

        // Anime View: Show just trending anime
        if (viewMode === 'anime') {
            if (trendingAnime.length > 0) {
                const spotlights = trendingAnime.slice(0, 10).map(a => ({ type: 'anime', data: a } as SpotlightItem));
                setSpotlightMedia(spotlights);
            }
            return;
        }

        if (viewMode !== 'home') return;

        // Wait for data (at least one source)
        if (trendingAnime.length === 0 && trendingManga.length === 0 && trendingMovies.length === 0) return;

        // Interleave top items
        const mixed: SpotlightItem[] = [];
        const animeSlice = trendingAnime.slice(0, 5);
        const mangaSlice = trendingManga.slice(0, 5);
        const movieSlice = trendingMovies.slice(0, 5);

        const maxPairs = Math.max(animeSlice.length, mangaSlice.length, movieSlice.length);

        // Mix them: Anime -> Manga -> Movie
        for (let i = 0; i < maxPairs; i++) {
            if (animeSlice[i]) mixed.push({ type: 'anime', data: animeSlice[i] });
            if (mangaSlice[i]) mixed.push({ type: 'manga', data: mangaSlice[i] });
            if (movieSlice[i]) mixed.push({ type: 'movie', data: movieSlice[i] });
        }

        setSpotlightMedia(mixed);
    }, [viewMode, searchQuery, trendingAnime, trendingManga, trendingMovies]);

    const handleAnimeClick = (anime: Anime) => {
        navigate(`/anime/${anime.id}`);
    };

    const handleGenreClick = (id: number) => {
        navigate(`/genres/${id}`);
    };

    const getPageTitle = () => {
        if (searchQuery) return `Results for "${searchQuery}"`;
        if (viewMode === 'trending') return 'Trending Now';
        if (viewMode === 'genres' && selectedGenreId) {
            const g = genres.find(g => g.id.toString() === selectedGenreId);
            return g ? g.name : 'Genre Anime';
        }
        return 'Popular Anime';
    };

    const getPageSubtitle = () => {
        if (searchQuery) return `Found results`;
        if (viewMode === 'trending') return 'Currently airing & popular anime';
        if (viewMode === 'genres' && selectedGenreId) {
            const g = genres.find(g => g.id.toString() === selectedGenreId);
            return `Browse ${g?.name || ''} anime`;
        }
        return 'Discover the most popular anime';
    };

    return (
        <div className="pb-12">
            {!searchQuery && spotlightMedia.length > 0 && (viewMode === 'home' || viewMode === 'anime') && (
                <HeroCarousel items={spotlightMedia} />
            )}

            {/* Sub-navigation for anime browse pages */}
            {(viewMode === 'anime' || viewMode === 'trending' || viewMode === 'genres') && (
                <div className="pt-24">
                    <SubNav
                        items={[
                            {
                                label: 'Trending',
                                path: '/trending',
                                icon: (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                        <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.177A7.547 7.547 0 0 1 6.648 6.61a.75.75 0 0 0-1.152.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248ZM15.75 14.25a3.75 3.75 0 1 1-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 0 1 1.925-3.545 3.75 3.75 0 0 1 3.255 3.717Z" clipRule="evenodd" />
                                    </svg>
                                )
                            },
                            {
                                label: 'Genres',
                                path: '/genres',
                                icon: (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                        <path fillRule="evenodd" d="M3 6a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3v2.25a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Zm9.75 0a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3v2.25a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3V6ZM3 15.75a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-2.25Zm9.75 0a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3v-2.25Z" clipRule="evenodd" />
                                    </svg>
                                )
                            }
                        ]}
                    />
                </div>
            )}

            <main className={`container mx-auto px-6 ${viewMode === 'home' && !searchQuery && spotlightMedia.length > 0 ? 'pt-12' : (viewMode === 'anime' || viewMode === 'trending' || viewMode === 'genres') ? 'pt-6' : 'pt-28'}`}>

                {/* Continue Watching Row - Only show on home with history */}
                {viewMode === 'home' && !searchQuery && watchHistory.length > 0 && (
                    <ContinueWatchingRow watchHistory={watchHistory} navigate={navigate} />
                )}

                {/* Trending Row - Only show on home */}
                {viewMode === 'home' && !searchQuery && (trendingAnime.length > 0 || trendingError) && (
                    <TrendingRow
                        trendingAnime={trendingAnime}
                        trendingError={trendingError}
                        navigate={navigate}
                        onRetry={() => {
                            setTrendingError(false);
                            animeService.getTrendingAnime(1, 10).then((res) => setTrendingAnime(res.data)).catch(() => setTrendingError(true));
                        }}
                        onAnimeClick={handleAnimeClick}
                    />
                )}

                {/* Continue Reading Row - Only show on home with read history */}
                {viewMode === 'home' && !searchQuery && readHistory.length > 0 && (
                    <ContinueReadingRow readHistory={readHistory} navigate={navigate} />
                )}

                {/* Trending Manga Row - Only show on home */}
                {viewMode === 'home' && !searchQuery && trendingManga.length > 0 && (
                    <TrendingMangaRow
                        trendingManga={trendingManga}
                        trendingMangaError={trendingMangaError}
                        navigate={navigate}
                        onRetry={() => {
                            setTrendingMangaError(false);
                            mangaService.getTrendingManga(1, 10).then((res) => setTrendingManga(res.data)).catch(() => setTrendingMangaError(true));
                        }}
                    />
                )}

                {/* Trending Movies row - Only show on home */}
                {viewMode === 'home' && !searchQuery && trendingMovies.length > 0 && (
                    <TrendingMoviesRow trendingMovies={trendingMovies} navigate={navigate} />
                )}

                {/* Anime Schedule - Only show on home */}
                {viewMode === 'home' && !searchQuery && (
                    <AnimeSchedule />
                )}

                {/* Genre Selector View */}
                {viewMode === 'genres' && !selectedGenreId && (
                    <GenreSelectorView
                        genres={genres}
                        genresLoading={genresLoading}
                        genreFilter={genreFilter}
                        setGenreFilter={setGenreFilter}
                        showAllGenres={showAllGenres}
                        setShowAllGenres={setShowAllGenres}
                        onGenreClick={handleGenreClick}
                    />
                )}

                {/* Anime Grid View - Hide on home view (replaced by schedule), show for search/trending/genre */}
                {((viewMode !== 'genres' || selectedGenreId) && (viewMode !== 'home' || searchQuery)) && (
                    <div className="animate-fade-in">
                        {/* Section Header */}
                        <div className="flex justify-between items-end mb-8">
                            <div>
                                <h2 className="text-3xl font-black">{getPageTitle()}</h2>
                                <p className="text-gray-500 text-sm mt-1">{getPageSubtitle()}</p>
                            </div>
                            <div className="flex gap-2">
                                {selectedGenreId && (
                                    <button
                                        onClick={() => navigate('/genres')}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                                        </svg>
                                        All Genres
                                    </button>
                                )}
                                {searchQuery && (
                                    <button
                                        onClick={() => navigate('/')}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                        </svg>
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        {loading ? (
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
                                <p className="text-gray-500 text-sm">Make sure the backend API is running and accessible</p>
                            </div>
                        ) : (
                            <>
                                {/* Anime Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                    {animeList.map((anime, index) => (
                                        <AnimeCard
                                            key={anime.id}
                                            anime={{
                                                ...anime,
                                                rank: viewMode === 'home' && !searchQuery ? ((currentPage - 1) * 24 + index + 1) : undefined
                                            }}
                                            onClick={() => handleAnimeClick(anime)}
                                            onPlayClick={() => navigate(`/watch/${anime.id}`)}
                                        />
                                    ))}
                                </div>

                                {/* Pagination could go here - simplified for now */}
                                {animeList.length === 0 && (
                                    <div className="text-center py-20">
                                        <p className="text-gray-400">No anime found</p>
                                    </div>
                                )}

                                {animeList.length > 0 && (
                                    <div className="flex justify-center items-center mt-12 gap-2 flex-wrap">
                                        <button
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            className="nav-btn prev disabled:opacity-50 disabled:cursor-not-allowed group"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 transition-transform group-hover:-translate-x-1">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                                            </svg>
                                            Previous
                                        </button>

                                        {/* Smart Pagination Numbers */}
                                        <div className="flex items-center gap-2">
                                            {(() => {
                                                const pages = [];
                                                const range = 2; // Pages to show around current

                                                // Always show page 1
                                                if (lastVisiblePage >= 1) {
                                                    pages.push(
                                                        <button
                                                            key={1}
                                                            onClick={() => setCurrentPage(1)}
                                                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${currentPage === 1
                                                                ? 'bg-miru-accent text-white shadow-[0_0_15px_var(--miru-accent)]'
                                                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                                                }`}
                                                        >
                                                            1
                                                        </button>
                                                    );
                                                }

                                                // Start ellipsis
                                                if (currentPage - range > 2) {
                                                    pages.push(
                                                        <span key="start-ellipsis" className="text-gray-600 px-1">...</span>
                                                    );
                                                }

                                                // Middle pages
                                                const start = Math.max(2, currentPage - range);
                                                const end = Math.min(lastVisiblePage - 1, currentPage + range);

                                                for (let i = start; i <= end; i++) {
                                                    pages.push(
                                                        <button
                                                            key={i}
                                                            onClick={() => setCurrentPage(i)}
                                                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${currentPage === i
                                                                ? 'bg-miru-accent text-white shadow-[0_0_15px_var(--miru-accent)]'
                                                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                                                }`}
                                                        >
                                                            {i}
                                                        </button>
                                                    );
                                                }

                                                // End ellipsis
                                                if (currentPage + range < lastVisiblePage - 1) {
                                                    pages.push(
                                                        <span key="end-ellipsis" className="text-gray-600 px-1">...</span>
                                                    );
                                                }

                                                // Always show last page
                                                if (lastVisiblePage > 1) {
                                                    pages.push(
                                                        <button
                                                            key={lastVisiblePage}
                                                            onClick={() => setCurrentPage(lastVisiblePage)}
                                                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${currentPage === lastVisiblePage
                                                                ? 'bg-miru-accent text-white shadow-[0_0_15px_var(--miru-accent)]'
                                                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                                                }`}
                                                        >
                                                            {lastVisiblePage}
                                                        </button>
                                                    );
                                                }

                                                return pages;
                                            })()}
                                        </div>

                                        <button
                                            disabled={currentPage >= lastVisiblePage}
                                            onClick={() => setCurrentPage(p => p + 1)}
                                            className="nav-btn next disabled:opacity-50 disabled:cursor-not-allowed group"
                                        >
                                            Next
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 transition-transform group-hover:translate-x-1">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

export default Home;


