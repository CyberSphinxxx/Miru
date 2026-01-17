import React, { useState, useEffect } from 'react';
import VideoModal from './VideoModal';
import StatusButton from './StatusButton';
import { Anime, Character, RelatedAnime, PromoVideo, Recommendation, Episode } from '../types';
import { animeService } from '../services/api';

interface AnimeDetailPageProps {
    anime: Anime;
    characters: Character[];
    relations: RelatedAnime[];
    videos: PromoVideo[];
    recommendations: Recommendation[];
    similar: Anime[];
    loading?: boolean;
    onBack: () => void;
    onWatchClick: () => void;
    onRelatedClick: (anime: Anime) => void;
}

// Episode Grid Component (similar to Yorumi)
const EpisodeList = ({
    episodes,
    onEpisodeClick,
    loading
}: {
    episodes: Episode[],
    onEpisodeClick: (ep: Episode) => void,
    loading?: boolean
}) => {
    const ITEMS_PER_PAGE = 30;
    const [page, setPage] = useState(1);
    const totalPages = Math.ceil(episodes.length / ITEMS_PER_PAGE);

    const currentEpisodes = episodes.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    if (loading) {
        return (
            <div className="py-8 flex justify-center">
                <div className="w-8 h-8 border-4 border-miru-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (episodes.length === 0) {
        return (
            <div className="text-gray-500 text-center py-4">No episodes found.</div>
        );
    }

    return (
        <div className="mt-4">
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {currentEpisodes.map((ep) => (
                    <button
                        key={ep.session || ep.episodeNumber}
                        onClick={() => onEpisodeClick(ep)}
                        className="aspect-square flex items-center justify-center rounded-lg transition-all duration-200 relative group bg-miru-surface hover:bg-miru-primary hover:text-black hover:scale-105 hover:shadow-lg hover:shadow-miru-primary/20 text-gray-300 cursor-pointer border border-white/5 hover:border-miru-primary font-bold text-sm"
                        title={ep.title || `Episode ${ep.episodeNumber}`}
                    >
                        <span>{ep.episodeNumber}</span>
                    </button>
                ))}
            </div>

            {totalPages > 1 && (
                <div className="flex flex-col items-center gap-4 mt-6">
                    <div className="flex flex-wrap justify-center gap-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors flex-shrink-0
                                    ${page === p ? 'bg-miru-primary text-black font-bold' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const AnimeDetailPage: React.FC<AnimeDetailPageProps> = ({
    anime,
    characters,
    relations,
    videos,
    recommendations,
    similar,
    onBack,
    onWatchClick,
    onRelatedClick,
    loading,
}) => {
    const [trailerId, setTrailerId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'summary' | 'relations'>('summary');
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [episodesLoading, setEpisodesLoading] = useState(true);

    // Fetch episodes when anime changes
    useEffect(() => {
        const fetchEpisodes = async () => {
            if (!anime) return;

            setEpisodesLoading(true);
            try {
                // Check if we have prefetched data
                const prefetchKey = `watch_prefetch_${anime.id || anime.mal_id}`;
                const cached = sessionStorage.getItem(prefetchKey);

                if (cached) {
                    const data = JSON.parse(cached);
                    setEpisodes(data.episodes || []);
                    setEpisodesLoading(false);
                    return;
                }

                // Fetch from scraper
                const searchTitle = anime.title_english || anime.title_romaji || anime.title;
                const searchRes = await animeService.searchScraper(searchTitle);

                if (searchRes && searchRes.length > 0) {
                    const epsData = await animeService.getEpisodes(searchRes[0].session);
                    const mappedEpisodes = (epsData.episodes || []).map((ep: any) => ({
                        id: ep.session,
                        session: ep.session,
                        episodeNumber: ep.episodeNumber || ep.episode || ep.number,
                        title: ep.title || `Episode ${ep.episodeNumber || ep.episode || ep.number}`,
                        snapshot: ep.snapshot
                    }));
                    setEpisodes(mappedEpisodes);

                    // Cache for later
                    sessionStorage.setItem(prefetchKey, JSON.stringify({
                        session: searchRes[0].session,
                        episodes: mappedEpisodes,
                        timestamp: Date.now()
                    }));
                }
            } catch (e) {
                console.error('Failed to fetch episodes:', e);
            } finally {
                setEpisodesLoading(false);
            }
        };

        fetchEpisodes();
    }, [anime?.id, anime?.mal_id]);

    const handleCardClick = (id: number) => {
        const minimalAnime = {
            mal_id: id,
            title: 'Loading...',
            images: { jpg: { image_url: '', large_image_url: '' } },
            score: 0,
            status: '',
            type: '',
            episodes: null
        } as Anime;

        onRelatedClick(minimalAnime);
    };

    const handleEpisodeClick = (ep: Episode) => {
        // Navigate to watch page with episode
        window.location.href = `/watch/${anime.id || anime.mal_id}?ep=${ep.episodeNumber}`;
    };

    // Get banner image - fallback to cover if no banner
    const bannerImage = anime.anilist_banner_image || anime.images.jpg.large_image_url;
    const hasTrueBanner = !!anime.anilist_banner_image;

    return (
        <div className="min-h-screen bg-miru-bg animate-fade-in pb-20">
            {/* Banner Section */}
            <div className="relative h-[50vh] w-full">
                <div className="absolute inset-0">
                    <img
                        src={bannerImage}
                        alt={anime.title}
                        className={`w-full h-full object-cover ${!hasTrueBanner ? 'blur-xl opacity-50 scale-110' : ''}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-miru-bg via-miru-bg/60 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-miru-bg to-transparent" />
                </div>

                <button
                    onClick={onBack}
                    className="absolute top-24 left-6 z-50 p-3 bg-black/50 hover:bg-white/20 rounded-full backdrop-blur-sm transition-colors text-white group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 group-hover:-translate-x-1 transition-transform">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                </button>
            </div>

            {/* Content Section */}
            <div className="container mx-auto px-6 -mt-32 relative z-10">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Portrait Cover */}
                    <div className="flex-shrink-0 mx-auto md:mx-0 w-64 md:w-72">
                        <div className="rounded-xl overflow-hidden shadow-2xl shadow-miru-primary/20">
                            <img
                                src={anime.images.jpg.large_image_url}
                                alt={anime.title}
                                className="w-full h-full object-cover aspect-[2/3]"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3 mt-6">
                            <button
                                onClick={onWatchClick}
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-miru-primary to-miru-accent text-white font-bold shadow-lg shadow-miru-primary/25 hover:shadow-miru-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                                </svg>
                                Watch Now
                            </button>

                            <StatusButton anime={anime} />
                        </div>
                    </div>

                    {/* Details Column */}
                    <div className="flex-1 pt-4 md:pt-8 text-center md:text-left space-y-4">
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight">{anime.title}</h1>

                        {/* Badges */}
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-sm">
                            <span className="bg-miru-primary text-black px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                </svg>
                                {anime.score || 'N/A'}
                            </span>
                            {(episodes.length > 0 || anime.episodes) && (
                                <span className="bg-green-500 text-white px-2.5 py-1 rounded text-xs font-bold">
                                    {episodes.length > 0 ? episodes.length : anime.episodes} eps
                                </span>
                            )}
                            <span className="px-2.5 py-1 bg-white/10 rounded text-gray-300 text-xs">
                                {anime.type}
                            </span>
                            {anime.status && (
                                <span className="px-2.5 py-1 bg-white/10 rounded text-gray-300 text-xs">
                                    {anime.status}
                                </span>
                            )}
                            {anime.year && (
                                <span className="px-2.5 py-1 bg-white/10 rounded text-gray-300 text-xs">
                                    {anime.year}
                                </span>
                            )}
                        </div>

                        {/* Genres */}
                        <div className="flex flex-wrap justify-center md:justify-start gap-2">
                            {anime.genres?.map(genre => (
                                <span key={genre.mal_id} className="px-3 py-1 rounded-lg bg-miru-surface-light border border-white/5 text-xs font-semibold text-gray-300 hover:text-white transition-colors cursor-default">
                                    {genre.name}
                                </span>
                            ))}
                        </div>

                        {/* Tabs */}
                        <div className="flex items-center gap-8 border-b border-white/10 mb-6">
                            <button
                                onClick={() => setActiveTab('summary')}
                                className={`pb-3 text-lg font-bold transition-colors relative ${activeTab === 'summary' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
                            >
                                Summary
                                {activeTab === 'summary' && <div className="absolute bottom-0 inset-x-0 h-0.5 bg-miru-primary" />}
                            </button>
                            <button
                                onClick={() => setActiveTab('relations')}
                                className={`pb-3 text-lg font-bold transition-colors relative ${activeTab === 'relations' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
                            >
                                Relations
                                {activeTab === 'relations' && <div className="absolute bottom-0 inset-x-0 h-0.5 bg-miru-primary" />}
                            </button>
                        </div>

                        {activeTab === 'summary' && (
                            <>
                                {/* Synopsis */}
                                <div className="mb-8">
                                    <p className="text-gray-400 leading-relaxed text-base md:text-lg text-left">{anime.synopsis}</p>
                                </div>

                                {/* Episodes Section */}
                                <div className="py-6 border-t border-white/10">
                                    <h3 className="text-xl font-bold text-white mb-4">Episodes</h3>
                                    <EpisodeList
                                        episodes={episodes}
                                        onEpisodeClick={handleEpisodeClick}
                                        loading={episodesLoading}
                                    />
                                </div>

                                {/* Loading Indicator for Extra Details */}
                                {loading && (
                                    <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
                                        <div className="w-8 h-8 border-4 border-miru-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                                        <p className="text-gray-400 text-sm font-medium">Loading more details...</p>
                                    </div>
                                )}

                                {/* Characters */}
                                {characters.length > 0 && (
                                    <div className="py-6 border-t border-white/10 animate-fade-in-up">
                                        <h3 className="text-xl font-bold text-white mb-4">Characters & Voice Actors</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                            {characters.slice(0, 6).map((item, idx) => (
                                                <div key={`${item.character.mal_id}-${idx}`} className="flex bg-miru-surface rounded-xl overflow-hidden border border-white/5 hover:border-miru-primary/30 transition-colors">
                                                    <img src={item.character.images.jpg.image_url} alt={item.character.name} className="w-16 h-24 object-cover" />
                                                    <div className="flex-1 p-3 flex flex-col justify-center">
                                                        <h4 className="font-bold text-sm line-clamp-1">{item.character.name}</h4>
                                                        <p className="text-xs text-gray-400">{item.role}</p>
                                                    </div>
                                                    {item.voice_actors[0] && (
                                                        <>
                                                            <div className="flex-1 p-3 flex flex-col justify-center items-end text-right bg-white/5">
                                                                <h4 className="font-bold text-sm line-clamp-1">{item.voice_actors[0].person.name}</h4>
                                                                <p className="text-xs text-gray-400">{item.voice_actors[0].language}</p>
                                                            </div>
                                                            <img src={item.voice_actors[0].person.images.jpg.image_url} alt={item.voice_actors[0].person.name} className="w-16 h-24 object-cover" />
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Promotion Videos */}
                                {videos.length > 0 && (
                                    <div className="py-6 border-t border-white/10 animate-fade-in-up delay-100">
                                        <h3 className="text-xl font-bold text-white mb-4">Trailers & PVs</h3>
                                        <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                                            {videos.map((pv, idx) => {
                                                const trailerUrl = pv.trailer.url ||
                                                    (pv.trailer.youtube_id ? `https://www.youtube.com/watch?v=${pv.trailer.youtube_id}` : null) ||
                                                    pv.trailer.embed_url;

                                                if (!trailerUrl) return null;

                                                const handleTrailerClick = (e: React.MouseEvent) => {
                                                    if (pv.trailer.youtube_id) {
                                                        e.preventDefault();
                                                        setTrailerId(pv.trailer.youtube_id);
                                                    }
                                                };

                                                return (
                                                    <a
                                                        key={idx}
                                                        href={trailerUrl}
                                                        onClick={handleTrailerClick}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex-shrink-0 w-64 group relative snap-start cursor-pointer"
                                                    >
                                                        <div className="aspect-video rounded-xl overflow-hidden bg-black relative">
                                                            <img src={pv.trailer.images.medium_image_url} alt={pv.title} className="w-full h-full object-cover group-hover:opacity-75 transition-opacity" />
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center group-hover:bg-miru-primary transition-colors">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                                                                        <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <p className="mt-2 text-sm font-medium line-clamp-1 group-hover:text-miru-primary transition-colors">{pv.title}</p>
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Video Modal */}
                                {trailerId && (
                                    <VideoModal
                                        isOpen={!!trailerId}
                                        onClose={() => setTrailerId(null)}
                                        videoId={trailerId}
                                    />
                                )}

                                {/* Recommendations */}
                                {recommendations.length > 0 && (
                                    <div className="py-6 border-t border-white/10 animate-fade-in-up delay-300">
                                        <h3 className="text-xl font-bold text-white mb-4">Recommended For You</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                            {recommendations.slice(0, 5).map(rec => (
                                                <button
                                                    key={rec.entry.mal_id}
                                                    onClick={() => handleCardClick(rec.entry.mal_id)}
                                                    className="group text-left"
                                                >
                                                    <div className="aspect-[2/3] rounded-xl overflow-hidden mb-2 relative bg-gray-800">
                                                        <img
                                                            src={rec.entry.images?.jpg?.large_image_url || rec.entry.images?.jpg?.image_url || ''}
                                                            alt={rec.entry.title}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.display = 'none';
                                                            }}
                                                        />
                                                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-xs font-bold flex items-center gap-1">
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-miru-primary">
                                                                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                                                            </svg>
                                                            {rec.votes}
                                                        </div>
                                                    </div>
                                                    <h4 className="font-bold text-sm line-clamp-2 group-hover:text-miru-primary transition-colors">{rec.entry.title}</h4>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Similar Anime */}
                                {similar.length > 0 && (
                                    <div className="py-6 border-t border-white/10 animate-fade-in-up delay-400">
                                        <h3 className="text-xl font-bold text-white mb-4">More like this</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                            {similar.filter(s => s.mal_id !== anime.mal_id).slice(0, 5).map(s => (
                                                <button
                                                    key={s.mal_id}
                                                    onClick={() => handleCardClick(s.mal_id)}
                                                    className="group text-left"
                                                >
                                                    <div className="aspect-[2/3] rounded-xl overflow-hidden mb-2 relative">
                                                        <img src={s.images.jpg.large_image_url} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-xs font-bold flex items-center gap-1">
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-yellow-500">
                                                                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                                            </svg>
                                                            {s.score || 'N/A'}
                                                        </div>
                                                    </div>
                                                    <h4 className="font-bold text-sm line-clamp-2 group-hover:text-miru-primary transition-colors">{s.title}</h4>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Info Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-white/5 rounded-2xl border border-white/5 mt-6">
                                    <div>
                                        <h4 className="text-gray-500 text-xs font-bold uppercase mb-1">Studios</h4>
                                        <p className="font-medium">{anime.studios?.map(s => s.name).join(', ') || 'Unknown'}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-gray-500 text-xs font-bold uppercase mb-1">Source</h4>
                                        <p className="font-medium">{anime.source || '-'}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-gray-500 text-xs font-bold uppercase mb-1">Season</h4>
                                        <p className="font-medium capitalize">{anime.season} {anime.year}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-gray-500 text-xs font-bold uppercase mb-1">Duration</h4>
                                        <p className="font-medium">{anime.duration || 'Unknown'}</p>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'relations' && (
                            <>
                                {/* Related Anime */}
                                {relations.length > 0 ? (
                                    <div className="animate-fade-in-up">
                                        <div className="border border-white/5 rounded-2xl bg-miru-surface/50 overflow-hidden">
                                            {relations.map((rel, idx) => (
                                                <div key={idx} className="p-4 border-b border-white/5 last:border-0 flex flex-col md:flex-row gap-4">
                                                    <span className="text-sm font-bold text-miru-primary min-w-[100px]">{rel.relation}</span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {rel.entry.map(entry => (
                                                            <button
                                                                key={entry.mal_id}
                                                                onClick={() => handleCardClick(entry.mal_id)}
                                                                className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
                                                            >
                                                                {entry.name} ({entry.type})
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-gray-500 text-center py-8">No relations found.</div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnimeDetailPage;
