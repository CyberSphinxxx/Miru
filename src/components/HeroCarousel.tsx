import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Anime } from '../types';
import { Manga } from '../types/manga';
import { Movie } from '../types/tmdb';
import { fanartService } from '../services/api/fanart.api';

export type SpotlightType = 'anime' | 'manga' | 'movie';

export interface SpotlightItem {
    type: SpotlightType;
    data: Anime | Manga | Movie;
}

interface HeroCarouselProps {
    items: SpotlightItem[];
    autoPlayInterval?: number;
}

// Separate slide component to handle individual data fetching
const CarouselSlide: React.FC<{
    item: SpotlightItem;
    isCurrent: boolean;
}> = ({ item, isCurrent }) => {
    const navigate = useNavigate();
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    // Fetch logo logic
    useEffect(() => {
        let isMounted = true;

        const fetchLogo = async () => {
            if (item.type === 'movie') {
                const movie = item.data as Movie;
                const images = await fanartService.getMovieImages(movie.id);
                if (isMounted) {
                    const logo = fanartService.getLogoUrl(images);
                    if (logo) setLogoUrl(logo);
                }
            } else if (item.type === 'anime') {
                // TODO: Implement Anime logo fetching if mapping becomes available
                // For now, no logo for anime
            }
        };

        fetchLogo();

        return () => { isMounted = false; };
    }, [item]);

    const getImageUrl = (item: SpotlightItem) => {
        if (item.type === 'movie') {
            const movie = item.data as Movie;
            return movie.backdrop_path
                ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
                : `https://image.tmdb.org/t/p/original${movie.poster_path}`;
        }
        const media = item.data as Anime | Manga;
        // Check if it's Anime and has trailer
        if (item.type === 'anime') {
            const anime = media as Anime;
            if (anime.trailer?.youtube_id) {
                return `https://img.youtube.com/vi/${anime.trailer.youtube_id}/maxresdefault.jpg`;
            }
        }
        return media.images.jpg.large_image_url;
    };

    const getTitle = (item: SpotlightItem) => {
        if (item.type === 'movie') return (item.data as Movie).title;
        return (item.data as Anime | Manga).title;
    };

    const getSynopsis = (item: SpotlightItem) => {
        if (item.type === 'movie') return (item.data as Movie).overview;
        return (item.data as Anime | Manga).synopsis;
    };

    const getScore = (item: SpotlightItem) => {
        if (item.type === 'movie') return (item.data as Movie).vote_average.toFixed(1);
        return (item.data as Anime | Manga).score;
    };

    const getTypeLabel = (type: SpotlightType) => {
        switch (type) {
            case 'anime': return 'ANIME';
            case 'manga': return 'MANGA';
            case 'movie': return 'MOVIE';
        }
    };

    const getTypeColor = (type: SpotlightType) => {
        switch (type) {
            case 'anime': return 'bg-miru-primary shadow-miru-primary/50';
            case 'manga': return 'bg-emerald-500 shadow-emerald-500/50';
            case 'movie': return 'bg-blue-500 shadow-blue-500/50';
        }
    };

    const handleWatchClick = (e: React.MouseEvent, item: SpotlightItem) => {
        e.stopPropagation();
        if (item.type === 'anime') {
            navigate(`/watch/${(item.data as Anime).id}`);
        } else if (item.type === 'manga') {
            navigate(`/read/${encodeURIComponent((item.data as Manga).title)}`);
        } else if (item.type === 'movie') {
            navigate(`/movies/${(item.data as Movie).id}`);
        }
    };

    const handleInfoClick = (item: SpotlightItem) => {
        if (item.type === 'anime') {
            navigate(`/anime/${(item.data as Anime).id}`);
        } else if (item.type === 'manga') {
            navigate(`/manga/${(item.data as Manga).id}`);
        } else if (item.type === 'movie') {
            navigate(`/movies/${(item.data as Movie).id}`);
        }
    };

    return (
        <div
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isCurrent ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
            {/* Background Image */}
            <div
                className="absolute inset-0 transition-transform duration-[10000ms] ease-linear"
                style={{
                    backgroundImage: `url(${getImageUrl(item)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center top',
                    transform: isCurrent ? 'scale(1.02)' : 'scale(1)'
                }}
            />

            {/* Gradient Overlays */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(90deg, #050505 0%, #050505 20%, rgba(5,5,5,0.95) 35%, rgba(5,5,5,0.6) 55%, transparent 75%)'
                }}
            />
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-miru-bg via-miru-bg/80 to-transparent" />
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-miru-bg/40 to-transparent" />
            <div className="absolute inset-0 bg-purple-900/10 mix-blend-multiply" />

            {/* Content */}
            <div className="relative z-10 h-full flex items-end pb-16">
                <div className="container mx-auto px-6">
                    <div className={`max-w-2xl transition-all duration-700 delay-300 ${isCurrent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <span className={`px-3 py-1 rounded-md text-xs font-bold text-white shadow-lg flex items-center gap-1.5 ${getTypeColor(item.type)}`}>
                                {item.type === 'anime' && (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm14.024-.983a1.125 1.125 0 0 1 0 1.966l-5.603 3.113A1.125 1.125 0 0 1 9 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113Z" clipRule="evenodd" />
                                    </svg>
                                )}
                                {item.type === 'manga' && (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                                        <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
                                    </svg>
                                )}
                                {item.type === 'movie' && (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                                        <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clipRule="evenodd" />
                                    </svg>
                                )}
                                {getTypeLabel(item.type)}
                            </span>
                        </div>

                        {/* Title OR Logo */}
                        {logoUrl ? (
                            <img
                                src={logoUrl}
                                alt={getTitle(item)}
                                className="max-w-[280px] md:max-w-md max-h-32 md:max-h-48 object-contain mb-6 drop-shadow-2xl"
                            />
                        ) : (
                            <h1 className="text-4xl md:text-6xl font-black leading-tight mb-4 drop-shadow-2xl line-clamp-2">
                                {getTitle(item)}
                            </h1>
                        )}

                        <div className="flex items-center gap-4 text-sm text-gray-300 mb-6 font-medium">
                            <span className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg backdrop-blur-sm border border-white/5">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-400">
                                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                </svg>
                                <span className="font-bold text-yellow-400">{getScore(item)}</span>
                            </span>
                            <span className="w-1 h-1 rounded-full bg-gray-500" />
                            <span>{item.type.toUpperCase()}</span>
                            {item.type === 'anime' && (item.data as Anime).episodes && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-gray-500" />
                                    <span>{(item.data as Anime).episodes} eps</span>
                                </>
                            )}
                            {item.type === 'manga' && (item.data as Manga).chapters && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-gray-500" />
                                    <span>{(item.data as Manga).chapters} chapters</span>
                                </>
                            )}
                        </div>

                        <p className="text-gray-300 text-base mb-8 line-clamp-3 leading-relaxed drop-shadow-md" style={{ maxWidth: '600px' }}>
                            {getSynopsis(item)}
                        </p>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={(e) => handleWatchClick(e, item)}
                                className="flex items-center gap-3 px-8 py-4 rounded-full bg-miru-accent hover:bg-miru-accent/90 text-white font-bold transition-all hover:scale-105 hover:shadow-[0_0_30px_-5px_var(--miru-accent)] group/btn"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 group-hover/btn:scale-110 transition-transform">
                                    {item.type === 'manga' ? (
                                        <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
                                    ) : (
                                        <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                                    )}
                                </svg>
                                {item.type === 'manga' ? 'Read Now' : 'Watch Now'}
                            </button>
                            <button
                                onClick={() => handleInfoClick(item)}
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
};

const HeroCarousel: React.FC<HeroCarouselProps> = ({ items, autoPlayInterval = 5000 }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    useEffect(() => {
        if (!isAutoPlaying || items.length === 0) return;

        const interval = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % items.length);
        }, autoPlayInterval);

        return () => clearInterval(interval);
    }, [isAutoPlaying, items.length, autoPlayInterval]);

    if (items.length === 0) return null;

    const nextSlide = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentSlide(prev => (prev + 1) % items.length);
        setIsAutoPlaying(false);
    };

    const prevSlide = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentSlide(prev => (prev - 1 + items.length) % items.length);
        setIsAutoPlaying(false);
    };

    const getTypeColor = (type: SpotlightType) => {
        switch (type) {
            case 'anime': return 'bg-miru-primary';
            case 'manga': return 'bg-emerald-500';
            case 'movie': return 'bg-blue-500';
        }
    };

    return (
        <section className="relative h-[50vh] md:h-[65vh] min-h-[400px] overflow-hidden group">
            {items.map((item, index) => (
                <CarouselSlide
                    key={`${item.type}-${(item.data as any).id}`}
                    item={item}
                    isCurrent={index === currentSlide}
                />
            ))}

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
                {items.map((item, index) => (
                    <button
                        key={index}
                        onClick={(e) => {
                            e.stopPropagation();
                            setCurrentSlide(index);
                            setIsAutoPlaying(false);
                        }}
                        className={`h-1.5 rounded-full transition-all duration-300 ${index === currentSlide
                            ? `w-8 ${getTypeColor(item.type)}`
                            : 'w-2 bg-white/20 hover:bg-white/40'
                            }`}
                    />
                ))}
            </div>
        </section>
    );
};

export default HeroCarousel;
