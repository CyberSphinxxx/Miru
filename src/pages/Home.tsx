import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AnimeCard from '../components/AnimeCard';
import MangaCard from '../components/MangaCard';
import GenreCard from '../components/GenreCard';
import LoadingSpinner from '../components/LoadingSpinner';
import SubNav from '../components/SubNav';
import AnimeSchedule from '../components/AnimeSchedule';
import { Anime, Genre } from '../types';
import { Manga } from '../types/manga';
import { getWatchHistory, WatchHistoryItem } from '../services/watchHistoryService';
import { getReadHistory, ReadHistoryItem } from '../services/readHistoryService';
import {
    animeService,
    mangaService,
    getPopularAnime,
    getGenres
} from '../services/api';

// Mixed media spotlight item type
type SpotlightItem = {
    type: 'anime' | 'manga';
    data: Anime | Manga;
};

interface HomeProps {
    viewMode: 'home' | 'anime' | 'trending' | 'genres';
    selectedGenreId?: string;
}

function Home({ viewMode, selectedGenreId }: HomeProps) {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const searchQuery = searchParams.get('q') || '';

    // Data state
    const [animeList, setAnimeList] = useState<Anime[]>([]);
    // Mixed Media Spotlight Carousel State
    const [spotlightMedia, setSpotlightMedia] = useState<SpotlightItem[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    const [genres, setGenres] = useState<Genre[]>([]);
    const [genresLoading, setGenresLoading] = useState(false);
    const [genreFilter, setGenreFilter] = useState('');
    const [showAllGenres, setShowAllGenres] = useState(false);

    // UI state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastVisiblePage, setLastVisiblePage] = useState(1);

    // New state for homepage redesign
    const [trendingAnime, setTrendingAnime] = useState<Anime[]>([]);
    const [trendingError, setTrendingError] = useState(false);
    const [trendingManga, setTrendingManga] = useState<Manga[]>([]);
    const [trendingMangaError, setTrendingMangaError] = useState(false);
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
            if (viewMode !== 'home' || searchQuery) return;
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
                        const genre = genres.find(g => g.mal_id.toString() === selectedGenreId);

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
        if (viewMode !== 'home' || searchQuery) return;

        // Wait for both anime and manga data
        if (trendingAnime.length === 0 && trendingManga.length === 0) return;

        // Interleave top anime and manga (Netflix-style mixed carousel)
        const mixed: SpotlightItem[] = [];
        const animeSlice = trendingAnime.slice(0, 5);
        const mangaSlice = trendingManga.slice(0, 5);
        const maxPairs = Math.min(animeSlice.length, mangaSlice.length, 4);

        // Alternate between anime and manga
        for (let i = 0; i < maxPairs; i++) {
            if (animeSlice[i]) {
                mixed.push({ type: 'anime', data: animeSlice[i] });
            }
            if (mangaSlice[i]) {
                mixed.push({ type: 'manga', data: mangaSlice[i] });
            }
        }

        // Fill remaining slots if one array has more items
        if (animeSlice.length > maxPairs) {
            mixed.push({ type: 'anime', data: animeSlice[maxPairs] });
        }

        setSpotlightMedia(mixed);
    }, [viewMode, searchQuery, trendingAnime, trendingManga]);

    // Auto-slide effect
    useEffect(() => {
        if (!isAutoPlaying || spotlightMedia.length === 0) return;

        const interval = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % spotlightMedia.length);
        }, 5000); // 5 seconds per slide

        return () => clearInterval(interval);
    }, [isAutoPlaying, spotlightMedia.length]);

    const nextSlide = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentSlide(prev => (prev + 1) % spotlightMedia.length);
        setIsAutoPlaying(false); // Pause on user interaction
    };

    const prevSlide = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentSlide(prev => (prev - 1 + spotlightMedia.length) % spotlightMedia.length);
        setIsAutoPlaying(false);
    };

    const handleAnimeClick = (anime: Anime) => {
        navigate(`/anime/${anime.id || anime.mal_id}`);
    };

    const handleWatchNow = (e: React.MouseEvent, anime: Anime) => {
        e.stopPropagation();
        navigate(`/watch/${anime.id || anime.mal_id}`);
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
        return 'Popular Anime';
    };

    const getPageSubtitle = () => {
        if (searchQuery) return `Found results`;
        if (viewMode === 'trending') return 'Currently airing & popular anime';
        if (viewMode === 'genres' && selectedGenreId) {
            const g = genres.find(g => g.mal_id.toString() === selectedGenreId);
            return `Browse ${g?.name || ''} anime`;
        }
        return 'Discover the most popular anime';
    };

    // Render Hero Section (Mixed Media Carousel)
    const renderHero = () => {
        if (viewMode !== 'home' || searchQuery || spotlightMedia.length === 0) return null;

        return (
            <section className="relative h-[70vh] min-h-[450px] overflow-hidden group">
                {/* Carousel Slides */}
                {spotlightMedia.map((item, index) => {
                    const isAnime = item.type === 'anime';
                    const media = item.data;

                    // Get hero image
                    const heroImage = media.images.jpg.banner_image
                        || ((media as Anime).trailer?.youtube_id
                            ? `https://img.youtube.com/vi/${(media as Anime).trailer?.youtube_id}/maxresdefault.jpg`
                            : media.images.jpg.large_image_url);

                    return (
                        <div
                            key={`${item.type}-${media.mal_id}`}
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

                            {/* Primary Left Gradient - Strong fade for content area */}
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

                            {/* Color Overlay for Vibe */}
                            <div className="absolute inset-0 bg-purple-900/10 mix-blend-multiply" />

                            {/* Content */}
                            <div className="relative z-10 h-full flex items-end pb-16">
                                <div className="container mx-auto px-6">
                                    <div className="max-w-2xl animate-fade-in-up">
                                        <div className="flex items-center gap-3 mb-4">
                                            {/* Media Type Badge */}
                                            <span className={`px-3 py-1 rounded-md text-xs font-bold text-white shadow-lg flex items-center gap-1.5 ${isAnime ? 'bg-miru-primary shadow-miru-primary/50' : 'bg-emerald-500 shadow-emerald-500/50'
                                                }`}>
                                                {isAnime ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                                                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm14.024-.983a1.125 1.125 0 0 1 0 1.966l-5.603 3.113A1.125 1.125 0 0 1 9 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113Z" clipRule="evenodd" />
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                                                        <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
                                                    </svg>
                                                )}
                                                {isAnime ? 'ANIME' : 'MANGA'}
                                            </span>
                                            <span className="px-3 py-1 rounded-md bg-miru-accent text-xs font-bold text-white shadow-lg shadow-miru-accent/50">
                                                #{index + 1} Spotlight
                                            </span>
                                            <span className="px-2 py-1 rounded-md bg-white/10 backdrop-blur-md text-xs font-medium text-white border border-white/10">
                                                {media.status}
                                            </span>
                                        </div>

                                        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-4 drop-shadow-2xl line-clamp-2">
                                            {media.title}
                                        </h1>

                                        {/* Metadata */}
                                        <div className="flex items-center gap-4 text-sm text-gray-300 mb-6 font-medium">
                                            <span className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg backdrop-blur-sm border border-white/5">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-400">
                                                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                                </svg>
                                                <span className="font-bold text-yellow-400">{media.score}</span>
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-gray-500" />
                                            <span>{media.type}</span>
                                            {isAnime && (media as Anime).episodes && (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-gray-500" />
                                                    <span>{(media as Anime).episodes} eps</span>
                                                </>
                                            )}
                                            {!isAnime && (media as Manga).chapters && (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-gray-500" />
                                                    <span>{(media as Manga).chapters} chapters</span>
                                                </>
                                            )}
                                            <span className="px-2 py-0.5 rounded bg-white/10 text-xs border border-white/10">{isAnime ? 'HD' : 'HQ'}</span>
                                        </div>

                                        {/* Genre Pills */}
                                        {media.genres && media.genres.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-8">
                                                {media.genres.slice(0, 4).map((genre: { mal_id: number; name: string }) => (
                                                    <span key={genre.mal_id} className="genre-pill hover:bg-white/20 cursor-default">
                                                        {genre.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Description */}
                                        <p className="text-gray-300 text-base mb-8 line-clamp-3 leading-relaxed drop-shadow-md" style={{ maxWidth: '600px' }}>
                                            {media.synopsis}
                                        </p>

                                        {/* Action Buttons - Type-aware */}
                                        <div className="flex items-center gap-4">
                                            {isAnime ? (
                                                <button
                                                    onClick={(e) => handleWatchNow(e, media as Anime)}
                                                    className="flex items-center gap-3 px-8 py-4 rounded-full bg-miru-accent hover:bg-miru-accent/90 text-white font-bold transition-all hover:scale-105 hover:shadow-[0_0_30px_-5px_var(--miru-accent)] group/btn"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 group-hover/btn:scale-110 transition-transform">
                                                        <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                                                    </svg>
                                                    Watch Now
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => navigate(`/read/${encodeURIComponent(media.title)}`)}
                                                    className="flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold transition-all hover:scale-105 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)] group/btn"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 group-hover/btn:scale-110 transition-transform">
                                                        <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
                                                    </svg>
                                                    Read Now
                                                </button>
                                            )}
                                            <button
                                                onClick={() => isAnime ? handleAnimeClick(media as Anime) : navigate(`/manga/${media.id || media.mal_id}`)}
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
                    {spotlightMedia.map((item, index) => (
                        <button
                            key={index}
                            onClick={(e) => {
                                e.stopPropagation();
                                setCurrentSlide(index);
                                setIsAutoPlaying(false);
                            }}
                            className={`h-1.5 rounded-full transition-all duration-300 ${index === currentSlide
                                ? `w-8 ${item.type === 'anime' ? 'bg-miru-primary shadow-[0_0_10px_var(--miru-primary)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`
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
                    <section className="mb-12 animate-fade-in">
                        <div className="content-row-header">
                            <h2 className="content-row-title flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-miru-primary">
                                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm14.024-.983a1.125 1.125 0 0 1 0 1.966l-5.603 3.113A1.125 1.125 0 0 1 9 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113Z" clipRule="evenodd" />
                                </svg>
                                Continue Watching
                            </h2>
                        </div>
                        <div className="horizontal-scroll">
                            {watchHistory.slice(0, 10).map(item => (
                                <div
                                    key={item.mal_id}
                                    onClick={() => navigate(`/watch/${item.id}`)}
                                    className="flex-shrink-0 w-72 landscape-card group"
                                >
                                    <img
                                        src={item.image_url}
                                        alt={item.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                                    <div className="absolute bottom-0 left-0 right-0 p-4">
                                        <p className="text-xs text-miru-primary font-medium mb-1">
                                            Episode {item.currentEpisode}
                                        </p>
                                        <h3 className="font-bold text-white text-sm line-clamp-1 landscape-card-title">
                                            {item.title}
                                        </h3>
                                    </div>
                                    {/* Progress Bar Overlay */}
                                    <div
                                        className="progress-overlay"
                                        style={{ '--progress': `${item.progress}%` } as React.CSSProperties}
                                    />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Trending Row - Only show on home */}
                {viewMode === 'home' && !searchQuery && (trendingAnime.length > 0 || trendingError) && (
                    <section className="mb-12 animate-fade-in">
                        <div className="content-row-header">
                            <h2 className="content-row-title flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-orange-500">
                                    <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.177A7.547 7.547 0 0 1 6.648 6.61a.75.75 0 0 0-1.152.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248ZM15.75 14.25a3.75 3.75 0 1 1-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 0 1 1.925-3.545 3.75 3.75 0 0 1 3.255 3.717Z" clipRule="evenodd" />
                                </svg>
                                Trending Now
                            </h2>
                            <button
                                onClick={() => navigate('/trending')}
                                className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                            >
                                View All
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                </svg>
                            </button>
                        </div>
                        {trendingError ? (
                            <div className="flex items-center gap-4 py-8 px-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-orange-500">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-400">Failed to load trending anime. The API might be temporarily unavailable.</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setTrendingError(false);
                                        animeService.getTrendingAnime(1, 10)
                                            .then((result: any) => setTrendingAnime(result.data))
                                            .catch(() => setTrendingError(true));
                                    }}
                                    className="px-4 py-2 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors text-sm font-medium"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : (
                            <div className="horizontal-scroll gap-4 py-4">
                                {trendingAnime.slice(0, 10).map(anime => (
                                    <div key={anime.mal_id} className="flex-shrink-0 w-56 md:w-64">
                                        <AnimeCard
                                            anime={anime}
                                            onClick={() => handleAnimeClick(anime)}
                                            onPlayClick={() => navigate(`/watch/${anime.id || anime.mal_id}`)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* Continue Reading Row - Only show on home with read history */}
                {viewMode === 'home' && !searchQuery && readHistory.length > 0 && (
                    <section className="mb-12 animate-fade-in">
                        <div className="content-row-header">
                            <h2 className="content-row-title flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-emerald-400">
                                    <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
                                </svg>
                                Continue Reading
                            </h2>
                        </div>
                        <div className="horizontal-scroll">
                            {readHistory.slice(0, 10).map(item => (
                                <div
                                    key={item.mal_id}
                                    onClick={() => navigate(`/read/${encodeURIComponent(item.title)}`)}
                                    className="flex-shrink-0 w-72 landscape-card group"
                                >
                                    <img
                                        src={item.image_url}
                                        alt={item.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                                    <div className="absolute inset-x-0 bottom-0 p-4">
                                        <h3 className="font-bold text-white text-sm line-clamp-1 mb-1 drop-shadow-lg">{item.title}</h3>
                                        <div className="flex items-center gap-2 text-xs text-gray-300">
                                            <span>Ch. {item.currentChapter}</span>
                                            {item.chapters && <span className="text-gray-500">/ {item.chapters}</span>}
                                        </div>
                                        {/* Progress bar */}
                                        <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                                                style={{ width: `${item.progress}%` }}
                                            />
                                        </div>
                                    </div>
                                    {/* Play overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-sm">
                                        <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/50 group-hover:scale-110 transition-transform">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                                                <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Trending Manga Row - Only show on home */}
                {viewMode === 'home' && !searchQuery && trendingManga.length > 0 && (
                    <section className="mb-12 animate-fade-in">
                        <div className="content-row-header">
                            <h2 className="content-row-title flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-emerald-400">
                                    <path d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
                                    <path d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
                                </svg>
                                Trending Manga
                            </h2>
                            <button
                                onClick={() => navigate('/manga')}
                                className="view-all-btn"
                            >
                                View All
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                </svg>
                            </button>
                        </div>
                        {trendingMangaError ? (
                            <div className="flex items-center gap-4 py-8 px-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-orange-500">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-400">Failed to load trending manga. The API might be temporarily unavailable.</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setTrendingMangaError(false);
                                        mangaService.getTrendingManga(1, 10)
                                            .then((result: { data: Manga[] }) => setTrendingManga(result.data))
                                            .catch(() => setTrendingMangaError(true));
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
                                            onClick={() => navigate(`/manga/${manga.id || manga.mal_id}`)}
                                            onReadClick={() => navigate(`/read/${encodeURIComponent(manga.title)}`)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* Anime Schedule - Only show on home */}
                {viewMode === 'home' && !searchQuery && (
                    <AnimeSchedule />
                )}

                {/* Genre Selector View */}
                {viewMode === 'genres' && !selectedGenreId && (
                    <div className="mb-8 animate-fade-in">
                        <h2 className="text-3xl font-black mb-2 text-gradient">Browse by Genre</h2>
                        <p className="text-gray-500 text-sm mb-6">Select a genre to explore</p>

                        {/* Genre Search Filter */}
                        <div className="relative max-w-md mx-auto mb-8">
                            <input
                                type="text"
                                value={genreFilter}
                                onChange={(e) => setGenreFilter(e.target.value)}
                                placeholder="Filter genres... (e.g., 'Horror', 'Slice of Life')"
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-miru-accent focus:ring-2 focus:ring-miru-accent/20 transition-all"
                            />
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
                                </svg>
                            </div>
                            {genreFilter && (
                                <button
                                    onClick={() => setGenreFilter('')}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {genresLoading ? (
                            <div className="flex justify-center py-12">
                                <LoadingSpinner size="lg" text="Loading genres..." />
                            </div>
                        ) : (() => {
                            const filteredGenres = genres.filter(g =>
                                g.name.toLowerCase().includes(genreFilter.toLowerCase())
                            );

                            if (filteredGenres.length === 0) {
                                return (
                                    <div className="text-center py-16">
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-500">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                                            </svg>
                                        </div>
                                        <p className="text-gray-400 mb-2">No genres found matching "{genreFilter}"</p>
                                        <button
                                            onClick={() => setGenreFilter('')}
                                            className="text-miru-accent hover:underline text-sm"
                                        >
                                            Clear filter
                                        </button>
                                    </div>
                                );
                            }

                            // Limit to 20 initially unless showAll is true
                            // const [showAllGenres, setShowAllGenres] = useState(false); <- Removed, using top-level state
                            const displayedGenres = showAllGenres ? filteredGenres : filteredGenres.slice(0, 20);
                            const hasMore = filteredGenres.length > 20;

                            return (
                                <>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                        {displayedGenres.map((genre, index) => (
                                            <GenreCard
                                                key={genre.mal_id}
                                                genre={genre}
                                                onClick={() => handleGenreClick(genre.mal_id)}
                                                index={index}
                                            />
                                        ))}
                                    </div>

                                    {!showAllGenres && hasMore && (
                                        <div className="flex justify-center mt-8">
                                            <button
                                                onClick={() => setShowAllGenres(true)}
                                                className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium transition-all flex items-center gap-2"
                                            >
                                                <span>Show All Genres ({filteredGenres.length})</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
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
                                            key={anime.mal_id}
                                            anime={{
                                                ...anime,
                                                rank: viewMode === 'home' && !searchQuery ? ((currentPage - 1) * 24 + index + 1) : undefined
                                            }}
                                            onClick={() => handleAnimeClick(anime)}
                                            onPlayClick={() => navigate(`/watch/${anime.id || anime.mal_id}`)}
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
