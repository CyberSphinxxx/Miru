import MangaCard from '../../../components/MangaCard';
import { Manga } from '../../../types/manga';

interface Props {
    trendingManga: Manga[];
    trendingMangaError: boolean;
    navigate: (path: string) => void;
    onRetry: () => void;
}

export default function TrendingMangaRow({ trendingManga, trendingMangaError, navigate, onRetry }: Props) {
    if (trendingManga.length === 0 && !trendingMangaError) return null;

    return (
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
                    className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
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
                        onClick={onRetry}
                        className="px-4 py-2 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors text-sm font-medium"
                    >
                        Retry
                    </button>
                </div>
            ) : (
                <div className="horizontal-scroll gap-4 py-4">
                    {trendingManga.slice(0, 10).map(manga => (
                        <div key={manga.id} className="flex-shrink-0 w-56 md:w-64">
                            <MangaCard
                                manga={manga}
                                onClick={() => navigate(`/manga/${manga.id}`)}
                                onReadClick={() => navigate(`/read/${encodeURIComponent(manga.title)}`)}
                            />
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
