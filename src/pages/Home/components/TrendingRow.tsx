import AnimeCard from '../../../components/AnimeCard';
import { Anime } from '../../../types';

interface Props {
    trendingAnime: Anime[];
    trendingError: boolean;
    navigate: (path: string) => void;
    onRetry: () => void;
    onAnimeClick: (anime: Anime) => void;
}

export default function TrendingRow({ trendingAnime, trendingError, navigate, onRetry, onAnimeClick }: Props) {
    if (trendingAnime.length === 0 && !trendingError) return null;

    return (
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
                        onClick={onRetry}
                        className="px-4 py-2 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors text-sm font-medium"
                    >
                        Retry
                    </button>
                </div>
            ) : (
                <div className="horizontal-scroll gap-4 py-4">
                    {trendingAnime.slice(0, 10).map(anime => (
                        <div key={anime.id} className="flex-shrink-0 w-56 md:w-64">
                            <AnimeCard
                                anime={anime}
                                onClick={() => onAnimeClick(anime)}
                                onPlayClick={() => navigate(`/watch/${anime.id}`)}
                            />
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
