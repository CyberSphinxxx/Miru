import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MangaCard from '../components/MangaCard';
import LoadingSpinner from '../components/LoadingSpinner';
import SubNav from '../components/SubNav';
import { Manga } from '../types/manga';
import { mangaService } from '../services/api';

interface MangaHomeProps {
    viewMode: 'home' | 'trending';
}

/**
 * MangaHome Page
 * 
 * Displays manga content with Hero carousel, Trending row, and Popular grid.
 * UI matches the anime Home page for consistency.
 */
function MangaHome({ viewMode }: MangaHomeProps) {
    const navigate = useNavigate();

    // Data state
    const [mangaList, setMangaList] = useState<Manga[]>([]);
    const [spotlightManga, setSpotlightManga] = useState<Manga[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    const [trendingManga, setTrendingManga] = useState<Manga[]>([]);
    const [trendingError, setTrendingError] = useState(false);

    // UI state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastVisiblePage, setLastVisiblePage] = useState(1);

    // Fetch trending manga for the row
    useEffect(() => {
        const fetchTrending = async () => {
            if (viewMode !== 'home') return;
            setTrendingError(false);
            try {
                const result = await mangaService.getTrendingManga(1, 10);
                setTrendingManga(result.data);
            } catch (err) {
                console.error('Failed to fetch trending manga', err);
                setTrendingError(true);
            }
        };
        fetchTrending();
    }, [viewMode]);

    // Fetch manga list
    useEffect(() => {
        let isMounted = true;
        const fetchManga = async () => {
            try {
                setLoading(true);
                setError(null);

                let result: { data: Manga[]; pagination: { last_visible_page: number } };

                if (viewMode === 'trending') {
                    result = await mangaService.getTrendingManga(currentPage, 24);
                } else {
                    result = await mangaService.getTopManga(currentPage, 24);
                }

                if (!isMounted) return;

                setMangaList(result.data);
                if (result.pagination?.last_visible_page) {
                    setLastVisiblePage(result.pagination.last_visible_page);
                }

                // Set spotlight from top results
                if (viewMode === 'home' && currentPage === 1 && result.data.length > 0) {
                    setSpotlightManga(result.data.slice(0, 5));
                }
            } catch (err) {
                if (!isMounted) return;
                console.error(err);
                setError('Failed to load manga. Please make sure the API is accessible.');
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchManga();

        return () => {
            isMounted = false;
        };
    }, [viewMode, currentPage]);

    // Auto-slide effect
    useEffect(() => {
        if (!isAutoPlaying || spotlightManga.length === 0) return;

        const interval = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % spotlightManga.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [isAutoPlaying, spotlightManga.length]);

    const nextSlide = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentSlide(prev => (prev + 1) % spotlightManga.length);
        setIsAutoPlaying(false);
    };

    const prevSlide = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentSlide(prev => (prev - 1 + spotlightManga.length) % spotlightManga.length);
        setIsAutoPlaying(false);
    };

    const handleMangaClick = (manga: Manga) => {
        // Navigate to manga reader with the title as URL param
        navigate(`/read/${encodeURIComponent(manga.title)}`);
    };

    // Render Hero Section (Carousel)
    const renderHero = () => {
        if (viewMode !== 'home' || spotlightManga.length === 0) return null;

        return (
            <section className="relative h-[70vh] min-h-[450px] overflow-hidden group">
                {/* Carousel Slides */}
                {spotlightManga.map((manga, index) => {
                    const heroImage = manga.images.jpg.banner_image || manga.images.jpg.large_image_url;

                    return (
                        <div
                            key={manga.mal_id}
                            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                        >
                            {/* Background Image */}
                            <div
                                className="absolute inset-0 transition-transform duration-[10000ms] ease-linear"
                                style={{
                                    backgroundImage: `url(${heroImage})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center 30%',
                                    transform: index === currentSlide ? 'scale(1.02)' : 'scale(1)'
                                }}
                            />

                            {/* Primary Left Gradient */}
                            <div
                                className="absolute inset-0"
                                style={{
                                    background: 'linear-gradient(90deg, #050505 0%, #050505 20%, rgba(5,5,5,0.95) 35%, rgba(5,5,5,0.6) 55%, transparent 75%)'
                                }}
                            />

                            {/* Bottom Fade */}
                            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-miru-bg via-miru-bg/80 to-transparent" />

                            {/* Top Subtle Vignette */}
                            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-miru-bg/40 to-transparent" />

                            {/* Color Overlay */}
                            <div className="absolute inset-0 bg-purple-900/10 mix-blend-multiply" />

                            {/* Content */}
                            <div className="relative z-10 h-full flex items-end pb-16">
                                <div className="container mx-auto px-6">
                                    <div className="max-w-2xl animate-fade-in-up">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="px-3 py-1 rounded-md bg-miru-accent text-xs font-bold text-white shadow-lg shadow-miru-accent/50">
                                                #{index + 1} Spotlight
                                            </span>
                                            <span className="px-2 py-1 rounded-md bg-white/10 backdrop-blur-md text-xs font-medium text-white border border-white/10">
                                                {manga.status}
                                            </span>
                                        </div>

                                        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-4 drop-shadow-2xl line-clamp-2">
                                            {manga.title}
                                        </h1>

                                        {/* Metadata */}
                                        <div className="flex items-center gap-4 text-sm text-gray-300 mb-6 font-medium">
                                            <span className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg backdrop-blur-sm border border-white/5">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-400">
                                                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                                </svg>
                                                <span className="font-bold text-yellow-400">{manga.score}</span>
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-gray-500" />
                                            <span>{manga.type}</span>
                                            {manga.chapters && (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-gray-500" />
                                                    <span>{manga.chapters} chapters</span>
                                                </>
                                            )}
                                            {manga.volumes && (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-gray-500" />
                                                    <span>{manga.volumes} volumes</span>
                                                </>
                                            )}
                                        </div>

                                        {/* Genre Pills */}
                                        {manga.genres && manga.genres.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-8">
                                                {manga.genres.slice(0, 4).map(genre => (
                                                    <span key={genre.mal_id || genre.name} className="genre-pill hover:bg-white/20 cursor-default">
                                                        {genre.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Description */}
                                        <p className="text-gray-300 text-base mb-8 line-clamp-3 leading-relaxed drop-shadow-md" style={{ maxWidth: '600px' }}>
                                            {manga.synopsis}
                                        </p>

                                        {/* Action Button */}
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => handleMangaClick(manga)}
                                                className="flex items-center gap-2 px-6 py-4 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white font-medium hover:bg-white/10 transition-all hover:border-white/20"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                                                </svg>
                                                More Info
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Navigation Arrows */}
                <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-miru-accent hover:border-miru-accent transition-all opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 duration-300"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                </button>
                <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-miru-accent hover:border-miru-accent transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 duration-300"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                </button>

                {/* Carousel Indicators */}
                <div className="absolute bottom-6 right-6 z-20 flex gap-2">
                    {spotlightManga.map((_, index) => (
                        <button
                            key={index}
                            onClick={(e) => {
                                e.stopPropagation();
                                setCurrentSlide(index);
                                setIsAutoPlaying(false);
                            }}
                            className={`h-1.5 rounded-full transition-all duration-300 ${index === currentSlide
                                ? 'w-8 bg-miru-accent shadow-[0_0_10px_var(--miru-accent)]'
                                : 'w-2 bg-white/20 hover:bg-white/40'
                                }`}
                        />
                    ))}
                </div>
            </section>
        );
    };

    return (
        <div className="pb-12">
            {renderHero()}

            {/* Sub-navigation for manga page */}
            <div className="pt-24">
                <SubNav
                    items={[
                        {
                            label: 'Trending',
                            path: '/manga',
                            icon: (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                    <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.177A7.547 7.547 0 0 1 6.648 6.61a.75.75 0 0 0-1.152.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248ZM15.75 14.25a3.75 3.75 0 1 1-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 0 1 1.925-3.545 3.75 3.75 0 0 1 3.255 3.717Z" clipRule="evenodd" />
                                </svg>
                            )
                        }
                    ]}
                />
            </div>

            <main className={`container mx-auto px-6 ${viewMode === 'home' && spotlightManga.length > 0 ? 'pt-6' : 'pt-6'}`}>

                {/* Trending Row - Only show on home */}
                {viewMode === 'home' && (trendingManga.length > 0 || trendingError) && (
                    <section className="mb-12 animate-fade-in">
                        <div className="content-row-header">
                            <h2 className="content-row-title flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-orange-500">
                                    <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.177A7.547 7.547 0 0 1 6.648 6.61a.75.75 0 0 0-1.152.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248ZM15.75 14.25a3.75 3.75 0 1 1-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 0 1 1.925-3.545 3.75 3.75 0 0 1 3.255 3.717Z" clipRule="evenodd" />
                                </svg>
                                Trending Manga
                            </h2>
                        </div>
                        {trendingError ? (
                            <div className="flex items-center gap-4 py-8 px-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-orange-500">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-400">Failed to load trending manga.</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setTrendingError(false);
                                        mangaService.getTrendingManga(1, 10)
                                            .then((result: any) => setTrendingManga(result.data))
                                            .catch(() => setTrendingError(true));
                                    }}
                                    className="px-4 py-2 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors text-sm font-medium"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : (
                            <div className="horizontal-scroll gap-4 py-4">
                                {trendingManga.slice(0, 10).map(manga => (
                                    <div key={manga.mal_id} className="flex-shrink-0 w-56 md:w-64">
                                        <MangaCard
                                            manga={manga}
                                            onClick={() => handleMangaClick(manga)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* Manga Grid View */}
                <div className="animate-fade-in">
                    {/* Section Header */}
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <h2 className="text-3xl font-black">
                                {viewMode === 'trending' ? 'Trending Manga' : 'Popular Manga'}
                            </h2>
                            <p className="text-gray-500 text-sm mt-1">
                                {viewMode === 'trending' ? 'Currently trending manga' : 'Discover the most popular manga'}
                            </p>
                        </div>
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="flex justify-center items-center h-96">
                            <LoadingSpinner size="lg" text="Loading manga..." />
                        </div>
                    ) : error ? (
                        <div className="text-center py-20">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-red-500">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                                </svg>
                            </div>
                            <p className="text-red-400 mb-2">{error}</p>
                            <p className="text-gray-500 text-sm">Make sure the backend API is running</p>
                        </div>
                    ) : (
                        <>
                            {/* Manga Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                {mangaList.map((manga, index) => (
                                    <MangaCard
                                        key={manga.mal_id}
                                        manga={{
                                            ...manga,
                                            rank: viewMode === 'home' ? ((currentPage - 1) * 24 + index + 1) : undefined
                                        }}
                                        onClick={() => handleMangaClick(manga)}
                                    />
                                ))}
                            </div>

                            {mangaList.length === 0 && (
                                <div className="text-center py-20">
                                    <p className="text-gray-400">No manga found</p>
                                </div>
                            )}

                            {/* Pagination */}
                            {mangaList.length > 0 && (
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

                                    <div className="flex items-center gap-2">
                                        <span className="px-4 py-2 text-sm text-gray-400">
                                            Page {currentPage} of {lastVisiblePage}
                                        </span>
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
            </main>
        </div>
    );
}

export default MangaHome;
