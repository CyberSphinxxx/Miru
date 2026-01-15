import React, { useState } from 'react';
import VideoModal from './VideoModal';
import StatusButton from './StatusButton';
import { Anime, Character, RelatedAnime, PromoVideo, Recommendation } from '../types';

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

    return (
        <div className="container mx-auto px-6 py-8 animate-fade-in relative z-10 pt-24">
            {/* Back Button */}
            <button
                onClick={onBack}
                className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:-translate-x-1 transition-transform">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
                Back to Browse
            </button>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Left Column: Poster & Actions */}
                <div className="lg:col-span-3">
                    <div className="sticky top-24">
                        <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl shadow-miru-primary/20 mb-6 group relative">
                            <img
                                src={anime.images.jpg.large_image_url}
                                alt={anime.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>

                        <div className="space-y-3">
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
                </div>

                {/* Center Column: Info & Details */}
                <div className="lg:col-span-9">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">{anime.title}</h1>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-400">
                            {anime.year && <span className="bg-white/5 px-3 py-1 rounded-full text-white font-medium">{anime.year}</span>}
                            <span>{anime.type}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                            <span>{anime.episodes ? `${anime.episodes} Episodes` : 'Unknown eps'}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                            <span>{anime.status}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                            <div className="flex items-center gap-1 text-miru-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                </svg>
                                <span className="font-bold">{anime.score || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Genres */}
                    <div className="flex flex-wrap gap-2 mb-8">
                        {anime.genres?.map(genre => (
                            <span key={genre.mal_id} className="px-3 py-1 rounded-lg bg-miru-surface-light border border-white/5 text-xs font-semibold text-gray-300 hover:text-white transition-colors cursor-default">
                                {genre.name}
                            </span>
                        ))}
                    </div>

                    {/* Synopsis */}
                    <div className="mb-10">
                        <h3 className="text-xl font-bold mb-3 text-white">Synopsis</h3>
                        <p className="text-gray-400 leading-relaxed text-lg">{anime.synopsis}</p>
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
                        <div className="mb-10 animate-fade-in-up">
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
                        <div className="mb-10 animate-fade-in-up delay-100">
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

                    {/* Related Anime */}
                    {relations.length > 0 && (
                        <div className="mb-10 animate-fade-in-up delay-200">
                            <h3 className="text-xl font-bold text-white mb-4">Related Anime</h3>
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
                    )}

                    {/* Recommendations */}
                    {recommendations.length > 0 && (
                        <div className="mb-10 animate-fade-in-up delay-300">
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
                        <div className="mb-10 animate-fade-in-up delay-400">
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-white/5 rounded-2xl border border-white/5">
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
                </div>
            </div>
        </div>
    );
};

export default AnimeDetailPage;
