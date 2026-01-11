import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AnimeCard from '../components/AnimeCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { Anime, Genre } from '../types';

const API_BASE = 'http://localhost:3001/api';

interface HomeProps {
    viewMode: 'home' | 'trending' | 'genres';
    selectedGenreId?: string;
}

function Home({ viewMode, selectedGenreId }: HomeProps) {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const searchQuery = searchParams.get('q') || '';

    // Data state
    const [animeList, setAnimeList] = useState<Anime[]>([]);
    const [featuredAnime, setFeaturedAnime] = useState<Anime | null>(null);
    const [genres, setGenres] = useState<Genre[]>([]);
    const [genresLoading, setGenresLoading] = useState(false);

    // UI state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastVisiblePage, setLastVisiblePage] = useState(1);
    const [watchlistRefresh, setWatchlistRefresh] = useState(0);

    // Reset page when view/search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [viewMode, selectedGenreId, searchQuery]);

    // Fetch Genres (only once or when needed)
    useEffect(() => {
        const fetchGenres = async () => {
            if (genres.length > 0) return;
            try {
                setGenresLoading(true);
                const res = await fetch(`${API_BASE}/jikan/genres`);
                const data = await res.json();
                if (data?.data) {
                    setGenres(data.data);
                }
            } catch (err) {
                console.error('Failed to fetch genres', err);
            } finally {
                setGenresLoading(false);
            }
        };
        fetchGenres();
    }, []);

    // Fetch Anime Data
    useEffect(() => {
        const fetchAnime = async () => {
            try {
                setLoading(true);
                setError(null);
                setAnimeList([]);

                let url = '';

                if (searchQuery) {
                    url = `${API_BASE}/jikan/search?q=${encodeURIComponent(searchQuery)}&page=${currentPage}&limit=24`;
                } else if (viewMode === 'trending') {
                    url = `${API_BASE}/jikan/trending?page=${currentPage}&limit=24`;
                } else if (viewMode === 'genres') {
                    if (selectedGenreId) {
                        url = `${API_BASE}/jikan/genres/${selectedGenreId}?page=${currentPage}&limit=24`;
                    } else {
                        // Just show genres list, no anime fetch needed yet
                        setLoading(false);
                        return;
                    }
                } else {
                    // Default Home (Top Anime)
                    url = `${API_BASE}/jikan/top?page=${currentPage}&limit=24`;
                }

                const res = await fetch(url);
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();

                if (data?.data) {
                    setAnimeList(data.data);
                    if (data.pagination) {
                        setLastVisiblePage(data.pagination.last_visible_page);
                    }
                    // Set featured from first result if on home and not searching
                    if (viewMode === 'home' && !searchQuery && currentPage === 1 && data.data.length > 0) {
                        setFeaturedAnime(data.data[0]);
                    }
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load anime. Please make sure the backend is running.');
            } finally {
                setLoading(false);
            }
        };

        fetchAnime();
    }, [viewMode, selectedGenreId, searchQuery, currentPage]);

    const handleAnimeClick = (anime: Anime) => {
        navigate(`/anime/${anime.mal_id}`);
    };

    const handleWatchNow = (e: React.MouseEvent, anime: Anime) => {
        e.stopPropagation();
        navigate(`/watch/${anime.mal_id}`);
    };

    const handleWatchlistChange = () => {
        setWatchlistRefresh(prev => prev + 1);
    };

    const handleGenreClick = (id: number) => {
        navigate(`/genres/${id}`);
    };

    const getPageTitle = () => {
        if (searchQuery) return `Results for "${searchQuery}"`;
        if (viewMode === 'trending') return 'Trending Now';
        if (viewMode === 'genres' && selectedGenreId) {
            const g = genres.find(g => g.mal_id.toString() === selectedGenreId);
            return g ? g.name : 'Genre Anime';
        }
        return 'Top Anime';
    };

    const getPageSubtitle = () => {
        if (searchQuery) return `Found results`;
        if (viewMode === 'trending') return 'Currently airing & popular anime';
        if (viewMode === 'genres' && selectedGenreId) {
            const g = genres.find(g => g.mal_id.toString() === selectedGenreId);
            return `Browse ${g?.name || ''} anime`;
        }
        return 'Discover the highest rated anime';
    };

    // Render Hero Section
    const renderHero = () => {
        if (viewMode !== 'home' || searchQuery || !featuredAnime) return null;

        return (
            <section className="relative h-[75vh] min-h-[500px] overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage: `url(${featuredAnime.images.jpg.large_image_url})`,
                        backgroundPosition: 'center 20%'
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-miru-bg via-miru-bg/80 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-miru-bg via-miru-bg/30 to-transparent" />
                <div className="absolute inset-0 bg-black/20" />

                <div className="relative z-10 h-full flex items-end pb-16">
                    <div className="container mx-auto px-6">
                        <div className="max-w-2xl">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="px-3 py-1 rounded-md bg-miru-accent text-xs font-bold text-white">
                                    #1 Spotlight
                                </span>
                            </div>
                            <h1 className="text-5xl md:text-6xl font-black leading-tight mb-4 drop-shadow-2xl">
                                {featuredAnime.title}
                            </h1>
                            <div className="flex items-center gap-4 text-sm text-gray-300 mb-4">
                                <span className="flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-400">
                                        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                    </svg>
                                    <span className="font-bold text-yellow-400">{featuredAnime.score}</span>
                                </span>
                                <span className="text-gray-500">•</span>
                                <span>{featuredAnime.type}</span>
                                {featuredAnime.episodes && (
                                    <>
                                        <span className="text-gray-500">•</span>
                                        <span>{featuredAnime.episodes} eps</span>
                                    </>
                                )}
                                <span className="px-2 py-0.5 rounded bg-white/10 text-xs">HD</span>
                            </div>
                            <p className="text-gray-300 text-base mb-6 line-clamp-3 leading-relaxed max-w-xl">
                                {featuredAnime.synopsis}
                            </p>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={(e) => handleWatchNow(e, featuredAnime)}
                                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-miru-accent hover:bg-miru-accent/90 text-white font-bold transition-all hover:scale-105"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                        <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                                    </svg>
                                    Watch Now
                                </button>
                                <button
                                    onClick={() => handleAnimeClick(featuredAnime)}
                                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium hover:bg-white/20 transition-all"
                                >
                                    Detail
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        );
    };

    return (
        <div className="pb-12">
            {renderHero()}

            <main className={`container mx-auto px-6 ${viewMode === 'home' && !searchQuery && featuredAnime ? 'pt-12' : 'pt-28'}`}>

                {/* Genre Selector View */}
                {viewMode === 'genres' && !selectedGenreId && (
                    <div className="mb-8 animate-fade-in">
                        <h2 className="text-3xl font-black mb-2 text-gradient">Browse by Genre</h2>
                        <p className="text-gray-500 text-sm mb-8">Select a genre to explore</p>

                        {genresLoading ? (
                            <div className="flex justify-center py-12">
                                <LoadingSpinner size="lg" text="Loading genres..." />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                {genres.map(genre => (
                                    <button
                                        key={genre.mal_id}
                                        onClick={() => handleGenreClick(genre.mal_id)}
                                        className="p-4 rounded-2xl bg-miru-surface hover:bg-miru-surface-light border border-white/5 hover:border-miru-primary/50 transition-all duration-300 text-left group hover:scale-105"
                                    >
                                        <h3 className="font-bold text-sm group-hover:text-gradient transition-colors">{genre.name}</h3>
                                        <p className="text-xs text-gray-500 mt-1">{genre.count.toLocaleString()} anime</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Anime Grid View */}
                {(viewMode !== 'genres' || selectedGenreId) && (
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
                                <p className="text-gray-500 text-sm">Make sure the backend server is running on port 3001</p>
                            </div>
                        ) : (
                            <>
                                {/* Anime Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                    {animeList.map((anime, index) => (
                                        <AnimeCard
                                            key={`${anime.mal_id}-${watchlistRefresh}`}
                                            anime={{
                                                ...anime,
                                                rank: viewMode === 'home' && !searchQuery ? ((currentPage - 1) * 24 + index + 1) : undefined
                                            }}
                                            onClick={() => handleAnimeClick(anime)}
                                            onPlayClick={() => navigate(`/watch/${anime.mal_id}`)}
                                            onWatchlistChange={handleWatchlistChange}
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
                                    <div className="flex justify-center items-center mt-12 gap-2">
                                        {/* Simplified Pagination logic */}
                                        <button
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            className="px-4 py-2 rounded-lg bg-white/5 disabled:opacity-50"
                                        >
                                            Previous
                                        </button>
                                        <span className="px-4 py-2 text-gray-400">Page {currentPage}</span>
                                        <button
                                            disabled={currentPage >= lastVisiblePage}
                                            onClick={() => setCurrentPage(p => p + 1)}
                                            className="px-4 py-2 rounded-lg bg-white/5 disabled:opacity-50"
                                        >
                                            Next
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
