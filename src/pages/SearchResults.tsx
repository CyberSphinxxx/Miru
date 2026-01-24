import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AnimeCard from '../components/AnimeCard';
import MangaCard from '../components/MangaCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { Anime } from '../types';
import { Manga } from '../types/manga';
import { animeService, mangaService } from '../services/api';

type SearchType = 'all' | 'anime' | 'manga';

/**
 * SearchResults Page
 * 
 * Displays unified search results for anime and manga.
 * Supports filtering by type: all, anime, or manga.
 */
function SearchResults() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const query = searchParams.get('q') || '';
    const type = (searchParams.get('type') as SearchType) || 'all';

    // Results state
    const [animeResults, setAnimeResults] = useState<Anime[]>([]);
    const [mangaResults, setMangaResults] = useState<Manga[]>([]);
    const [animeLoading, setAnimeLoading] = useState(false);
    const [mangaLoading, setMangaLoading] = useState(false);
    const [animeError, setAnimeError] = useState<string | null>(null);
    const [mangaError, setMangaError] = useState<string | null>(null);

    // Active filter tab
    const [activeFilter, setActiveFilter] = useState<SearchType>(type);

    // Fetch anime results
    useEffect(() => {
        if (!query || (type !== 'all' && type !== 'anime')) {
            setAnimeResults([]);
            return;
        }

        const fetchAnime = async () => {
            setAnimeLoading(true);
            setAnimeError(null);
            try {
                const result = await animeService.searchAnime(query, 1);
                setAnimeResults(result.data);
            } catch (err) {
                console.error('Failed to search anime:', err);
                setAnimeError('Failed to search anime');
                setAnimeResults([]);
            } finally {
                setAnimeLoading(false);
            }
        };

        fetchAnime();
    }, [query, type]);

    // Fetch manga results
    useEffect(() => {
        if (!query || (type !== 'all' && type !== 'manga')) {
            setMangaResults([]);
            return;
        }

        const fetchManga = async () => {
            setMangaLoading(true);
            setMangaError(null);
            try {
                const result = await mangaService.searchManga(query, 1, 24);
                setMangaResults(result.data);
            } catch (err) {
                console.error('Failed to search manga:', err);
                setMangaError('Failed to search manga');
                setMangaResults([]);
            } finally {
                setMangaLoading(false);
            }
        };

        fetchManga();
    }, [query, type]);

    // Update URL when filter changes
    const handleFilterChange = (newFilter: SearchType) => {
        setActiveFilter(newFilter);
        setSearchParams({ q: query, type: newFilter });
    };

    const handleAnimeClick = (anime: Anime) => {
        navigate(`/anime/${anime.id}`);
    };

    const handleMangaClick = (manga: Manga) => {
        navigate(`/manga/${manga.id}`);
    };

    const totalResults = animeResults.length + mangaResults.length;
    const isLoading = animeLoading || mangaLoading;

    // Filter tabs
    const filterTabs = [
        { value: 'all' as SearchType, label: 'All', count: totalResults },
        { value: 'anime' as SearchType, label: 'Anime', count: animeResults.length },
        { value: 'manga' as SearchType, label: 'Manga', count: mangaResults.length },
    ];

    if (!query) {
        return (
            <div className="min-h-screen pt-28 pb-12">
                <div className="container mx-auto px-6 text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gray-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Search for something</h2>
                    <p className="text-gray-400">Enter a query in the search bar above</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-28 pb-12">
            <div className="container mx-auto px-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-black mb-2">
                        Results for "<span className="text-gradient">{query}</span>"
                    </h1>
                    <p className="text-gray-500">
                        {isLoading ? 'Searching...' : `Found ${totalResults} results`}
                    </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 mb-8">
                    {filterTabs.map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => handleFilterChange(tab.value)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeFilter === tab.value
                                ? 'bg-miru-primary text-white shadow-lg shadow-miru-primary/30'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                                }`}
                        >
                            {tab.label}
                            {!isLoading && (
                                <span className={`px-1.5 py-0.5 rounded-md text-xs ${activeFilter === tab.value
                                    ? 'bg-white/20'
                                    : 'bg-white/10'
                                    }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Anime Results Section */}
                {(activeFilter === 'all' || activeFilter === 'anime') && (
                    <section className="mb-12 animate-fade-in">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-miru-primary">
                                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm14.024-.983a1.125 1.125 0 0 1 0 1.966l-5.603 3.113A1.125 1.125 0 0 1 9 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113Z" clipRule="evenodd" />
                                </svg>
                                Anime Results
                            </h2>
                            {animeResults.length > 0 && (
                                <span className="text-sm text-gray-500">{animeResults.length} found</span>
                            )}
                        </div>

                        {animeLoading ? (
                            <div className="flex justify-center py-12">
                                <LoadingSpinner size="lg" text="Searching anime..." />
                            </div>
                        ) : animeError ? (
                            <div className="text-center py-8 px-4 rounded-xl bg-red-500/10 border border-red-500/20">
                                <p className="text-red-400">{animeError}</p>
                            </div>
                        ) : animeResults.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                {animeResults.map(anime => (
                                    <AnimeCard
                                        key={anime.id}
                                        anime={anime}
                                        onClick={() => handleAnimeClick(anime)}
                                        onPlayClick={() => navigate(`/watch/${anime.id}`)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 px-4 rounded-xl bg-white/5 border border-white/10">
                                <p className="text-gray-400">No anime found for "{query}"</p>
                            </div>
                        )}
                    </section>
                )}

                {/* Manga Results Section */}
                {(activeFilter === 'all' || activeFilter === 'manga') && (
                    <section className="animate-fade-in">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-miru-accent">
                                    <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
                                </svg>
                                Manga Results
                            </h2>
                            {mangaResults.length > 0 && (
                                <span className="text-sm text-gray-500">{mangaResults.length} found</span>
                            )}
                        </div>

                        {mangaLoading ? (
                            <div className="flex justify-center py-12">
                                <LoadingSpinner size="lg" text="Searching manga..." />
                            </div>
                        ) : mangaError ? (
                            <div className="text-center py-8 px-4 rounded-xl bg-red-500/10 border border-red-500/20">
                                <p className="text-red-400">{mangaError}</p>
                            </div>
                        ) : mangaResults.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                {mangaResults.map(manga => (
                                    <MangaCard
                                        key={manga.id}
                                        manga={manga}
                                        onClick={() => handleMangaClick(manga)}
                                        onReadClick={() => navigate(`/read/${encodeURIComponent(manga.title)}`)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 px-4 rounded-xl bg-white/5 border border-white/10">
                                <p className="text-gray-400">No manga found for "{query}"</p>
                            </div>
                        )}
                    </section>
                )}

                {/* No Results */}
                {!isLoading && totalResults === 0 && (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gray-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0 0 12.016 15a4.486 4.486 0 0 0-3.198 1.318M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">No results found</h2>
                        <p className="text-gray-400 mb-6">Try searching for something else</p>
                        <button
                            onClick={() => navigate('/')}
                            className="px-6 py-3 rounded-xl bg-miru-primary hover:bg-miru-primary/80 text-white font-medium transition-all"
                        >
                            Go Home
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SearchResults;


