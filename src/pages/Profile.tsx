import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalUser, LibraryStatus, LibraryEntry, MangaLibraryStatus, MangaLibraryEntry, MovieLibraryStatus, MovieLibraryEntry } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import AnimeCard from '../components/AnimeCard';
import MangaCard from '../components/MangaCard';
import MovieCard from '../components/MovieCard';
import { Anime } from '../types';
import { Manga } from '../types/manga';
import { Movie } from '../types/tmdb';
import { getWatchHistory, clearWatchHistory, removeFromHistory } from '../services/watchHistoryService';
import { getReadHistory, clearReadHistory, removeFromReadHistory } from '../services/readHistoryService';
import { toast } from 'react-hot-toast';

type MediaMode = 'anime' | 'manga' | 'movies';
type AnimeTab = 'All' | 'Watching' | 'Completed' | 'Plan to Watch' | 'On Hold' | 'Dropped' | 'History';
type MangaTab = 'All' | 'Reading' | 'Completed' | 'Plan to Read' | 'On Hold' | 'Dropped' | 'History';
type MovieTab = 'All' | 'Watched' | 'Plan to Watch' | 'On Hold' | 'Dropped';

function Profile() {
    const { userData } = useLocalUser();
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [mediaMode, setMediaMode] = useState<MediaMode>('anime');
    const [animeTab, setAnimeTab] = useState<AnimeTab>('All');
    const [mangaTab, setMangaTab] = useState<MangaTab>('All');
    const [movieTab, setMovieTab] = useState<MovieTab>('All');
    const [historyUpdate, setHistoryUpdate] = useState(0);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const watchHistory = useMemo(() => getWatchHistory(), [historyUpdate]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const readHistory = useMemo(() => getReadHistory(), [historyUpdate]);

    // ============= ANIME HANDLERS =============
    const handleClearWatchHistory = () => {
        if (window.confirm('Are you sure you want to clear your entire watch history?')) {
            clearWatchHistory();
            setHistoryUpdate(prev => prev + 1);
            toast.success('Watch history cleared');
        }
    };

    const handleRemoveFromWatchHistory = (animeId: number) => {
        removeFromHistory(animeId);
        setHistoryUpdate(prev => prev + 1);
        toast.success('Removed from history');
    };

    // ============= MANGA HANDLERS =============
    const handleClearReadHistory = () => {
        if (window.confirm('Are you sure you want to clear your entire reading history?')) {
            clearReadHistory();
            setHistoryUpdate(prev => prev + 1);
            toast.success('Reading history cleared');
        }
    };

    const handleRemoveFromReadHistory = (mangaId: number) => {
        removeFromReadHistory(mangaId);
        setHistoryUpdate(prev => prev + 1);
        toast.success('Removed from history');
    };

    // ============= HELPERS =============
    const getFavoriteGenre = (items: any[], type: 'anime' | 'manga' | 'movie'): string => {
        const genreCounts: Record<string, number> = {};

        items.forEach(item => {
            if (type === 'movie') {
                // Handle TMDB genre IDs
                const TMDB_GENRES: Record<number, string> = {
                    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
                    99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
                    27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
                    10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
                };
                item.genre_ids?.forEach((id: number) => {
                    const name = TMDB_GENRES[id];
                    if (name) genreCounts[name] = (genreCounts[name] || 0) + 1;
                });
            } else {
                // Handle properties with { name: string }[] structure
                item.genres?.forEach((g: any) => {
                    const name = g.name || g; // Handle both object and string if data varies
                    if (name) genreCounts[name] = (genreCounts[name] || 0) + 1;
                });
            }
        });

        let maxCount = 0;
        let favorite = '—';

        Object.entries(genreCounts).forEach(([genre, count]) => {
            if (count > maxCount) {
                maxCount = count;
                favorite = genre;
            }
        });

        return favorite;
    };

    // ============= ANIME STATS ============= (memoized to ensure updates when library changes)
    const animeStatsData = useMemo(() => {
        const totalAnime = Object.values(userData.library).reduce((acc, list) => acc + list.length, 0);
        const watchingCount = userData.library.watching.length;
        const completedCount = userData.library.completed.length;
        const planToWatchCount = userData.library.plan_to_watch.length;
        const onHoldCount = userData.library.on_hold.length;
        const droppedCount = userData.library.dropped.length;

        const totalEpisodes = Object.values(userData.library).flat().reduce((acc, entry) => {
            return acc + (entry.anime.episodes || 0);
        }, 0);

        const daysWasted = ((totalEpisodes * 24) / 60 / 24).toFixed(1);

        const allAnime = Object.values(userData.library).flat().map(e => e.anime);
        const favoriteGenre = getFavoriteGenre(allAnime, 'anime');

        return {
            totalAnime,
            watchingCount,
            completedCount,
            planToWatchCount,
            onHoldCount,
            droppedCount,
            totalEpisodes,
            daysWasted,
            favoriteGenre
        };
    }, [userData.library]);

    const {
        totalAnime,
        watchingCount: animeWatchingCount,
        completedCount: animeCompletedCount,
        planToWatchCount: animePlanToWatchCount,
        onHoldCount: animeOnHoldCount,
        droppedCount: animeDroppedCount,
        totalEpisodes,
        daysWasted,
        favoriteGenre: animeFavoriteGenre
    } = animeStatsData;

    // ============= MANGA STATS (from library + read history) =============
    const mangaLibrary = userData.mangaLibrary || { reading: [], completed: [], plan_to_read: [], on_hold: [], dropped: [] };
    const mangaLibraryTotal = Object.values(mangaLibrary).reduce((acc, list) => acc + (list?.length || 0), 0);
    const mangaReadingCount = mangaLibrary.reading?.length || 0;
    const mangaCompletedCount = mangaLibrary.completed?.length || 0;
    const mangaPlanToReadCount = mangaLibrary.plan_to_read?.length || 0;
    const mangaOnHoldCount = mangaLibrary.on_hold?.length || 0;
    const mangaDroppedCount = mangaLibrary.dropped?.length || 0;

    const totalManga = mangaLibraryTotal + readHistory.length;
    const totalChaptersRead = readHistory.reduce((acc, item) => acc + (item.currentChapter || 0), 0);
    const totalVolumes = readHistory.reduce((acc, item) => acc + (item.volumes || 0), 0);

    const allManga = [
        ...readHistory, // History items should be compatible enough or we need to map? History items usually have genres.
        ...Object.values(mangaLibrary).flat().filter(Boolean).map((e: MangaLibraryEntry) => e.manga)
    ];
    // Need to ensure readHistory items have 'genres' property compatible with helper. 
    // They are of type ReadHistoryItem which likely has genres.

    const mangaFavoriteGenre = getFavoriteGenre(allManga.filter(Boolean), 'manga');


    // ============= MOVIE STATS =============
    const movieLibrary = userData.movieLibrary || { watched: [], plan_to_watch: [], on_hold: [], dropped: [] };
    const movieLibraryTotal = Object.values(movieLibrary).reduce((acc, list) => acc + (list?.length || 0), 0);
    const movieWatchedCount = movieLibrary.watched?.length || 0;
    const moviePlanToWatchCount = movieLibrary.plan_to_watch?.length || 0;
    const movieOnHoldCount = movieLibrary.on_hold?.length || 0;
    const movieDroppedCount = movieLibrary.dropped?.length || 0;

    const allMovies = Object.values(movieLibrary).flat().map(e => e.movie);
    const movieFavoriteGenre = getFavoriteGenre(allMovies, 'movie');


    // ============= GET CURRENT LIST =============
    const getCurrentAnimeList = (): Anime[] => {
        if (animeTab === 'History') {
            return watchHistory.map(item => ({
                id: item.id,
                title: item.title,
                images: { jpg: { image_url: item.image_url, large_image_url: item.image_url } },
                type: item.type,
                episodes: item.episodes,
                score: item.score || 0,
                genres: item.genres || [],
                synopsis: item.synopsis || '',
                status: item.status,
                rank: item.rank,
                title_japanese: item.title_japanese,
                historyData: {
                    currentEpisode: item.currentEpisode,
                    progress: item.progress,
                    lastWatched: item.lastWatched
                }
            } as any));
        }

        if (animeTab === 'All') {
            const allAnime: Anime[] = [];
            Object.values(userData.library).forEach((list: LibraryEntry[]) => {
                list.forEach((entry) => allAnime.push(entry.anime));
            });
            return allAnime;
        }

        const key = animeTab.toLowerCase().replace(/ /g, '_') as LibraryStatus;
        return userData.library[key]?.map(entry => entry.anime) || [];
    };

    const getCurrentMangaList = (): Manga[] => {
        if (mangaTab === 'History') {
            // Show read history
            return readHistory.map(item => ({
                id: item.id,
                title: item.title,
                images: { jpg: { image_url: item.image_url, large_image_url: item.image_url } },
                type: item.type,
                chapters: item.chapters,
                volumes: item.volumes,
                score: item.score || 0,
                genres: item.genres || [],
                synopsis: item.synopsis || '',
                status: item.status,
                rank: item.rank,
                title_japanese: item.title_japanese,
            } as Manga));
        }

        if (mangaTab === 'All') {
            const allManga: Manga[] = [];
            Object.values(mangaLibrary).forEach((list: MangaLibraryEntry[]) => {
                (list || []).forEach((entry) => allManga.push(entry.manga));
            });
            return allManga;
        }

        const tabToKey: Record<string, MangaLibraryStatus> = {
            'Reading': 'reading',
            'Completed': 'completed',
            'Plan to Read': 'plan_to_read',
            'On Hold': 'on_hold',
            'Dropped': 'dropped'
        };
        const key = tabToKey[mangaTab] as MangaLibraryStatus;
        return (mangaLibrary[key] || []).map(entry => entry.manga);
    };

    const getCurrentMovieList = (): Movie[] => {
        if (movieTab === 'All') {
            const allMovies: Movie[] = [];
            Object.values(movieLibrary).forEach((list: MovieLibraryEntry[]) => {
                (list || []).forEach((entry) => allMovies.push(entry.movie));
            });
            return allMovies;
        }

        const tabToKey: Record<string, MovieLibraryStatus> = {
            'Watched': 'watched',
            'Plan to Watch': 'plan_to_watch',
            'On Hold': 'on_hold',
            'Dropped': 'dropped'
        };
        const key = tabToKey[movieTab] as MovieLibraryStatus;
        return (movieLibrary[key] || []).map(entry => entry.movie);
    };

    const currentAnimeList = getCurrentAnimeList();
    const currentMangaList = getCurrentMangaList();
    const currentMovieList = getCurrentMovieList();

    const handleAnimeCardClick = (anime: Anime) => {
        navigate(`/anime/${anime.id}`);
    };

    const handleMangaCardClick = (manga: Manga) => {
        navigate(`/manga/${manga.id}`);
    };

    const handleMovieCardClick = (movie: Movie) => {
        navigate(`/movies/${movie.id}`);
    };

    // ============= TABS CONFIG =============
    const animeTabs: { label: AnimeTab; count: number }[] = [
        { label: 'All', count: totalAnime },
        { label: 'History', count: watchHistory.length },
        { label: 'Watching', count: animeWatchingCount },
        { label: 'Completed', count: animeCompletedCount },
        { label: 'Plan to Watch', count: animePlanToWatchCount },
        { label: 'On Hold', count: animeOnHoldCount },
        { label: 'Dropped', count: animeDroppedCount },
    ];

    const mangaTabs: { label: MangaTab; count: number }[] = [
        { label: 'All', count: mangaLibraryTotal },
        { label: 'History', count: readHistory.length },
        { label: 'Reading', count: mangaReadingCount },
        { label: 'Completed', count: mangaCompletedCount },
        { label: 'Plan to Read', count: mangaPlanToReadCount },
        { label: 'On Hold', count: mangaOnHoldCount },
        { label: 'Dropped', count: mangaDroppedCount },
    ];

    const movieTabs: { label: MovieTab; count: number }[] = [
        { label: 'All', count: movieLibraryTotal },
        { label: 'Watched', count: movieWatchedCount },
        { label: 'Plan to Watch', count: moviePlanToWatchCount },
        { label: 'On Hold', count: movieOnHoldCount },
        { label: 'Dropped', count: movieDroppedCount },
    ];

    // ============= STATS CONFIG =============
    const animeStats = [
        {
            label: 'Total Anime', value: totalAnime, icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm14.024-.983a1.125 1.125 0 0 1 0 1.966l-5.603 3.113A1.125 1.125 0 0 1 9 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113Z" clipRule="evenodd" />
                </svg>
            )
        },
        {
            label: 'Episodes', value: totalEpisodes, icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
            )
        },
        {
            label: 'Days Wasted', value: daysWasted, icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            label: 'Favorite Genre', value: animeFavoriteGenre, icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
            )
        },
    ];

    const mangaStats = [
        {
            label: 'Total Manga', value: totalManga, icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
                </svg>
            )
        },
        {
            label: 'Chapters Read', value: totalChaptersRead, icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
            )
        },
        {
            label: 'Volumes', value: totalVolumes, icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122" />
                </svg>
            )
        },
        {
            label: 'Favorite Genre', value: mangaFavoriteGenre, icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
            )
        },
    ];

    const movieStats = [
        {
            label: 'Total Movies', value: movieLibraryTotal, icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M19.5 6h-15v12h15V6zm-15-2h15a2 2 0 012 2v12a2 2 0 01-2 2h-15a2 2 0 01-2-2V6a2 2 0 012-2z" />
                    <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
            )
        },
        { // Placeholder
            label: 'Watched', value: movieWatchedCount, icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            )
        },
        { // Placeholder
            label: 'Favorite Genre', value: movieFavoriteGenre, icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
            )
        },
        { // Placeholder
            label: 'Plan to Watch', value: moviePlanToWatchCount, icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
            )
        }
    ];

    const currentStats = mediaMode === 'anime' ? animeStats : (mediaMode === 'manga' ? mangaStats : movieStats);
    const currentTabs = mediaMode === 'anime' ? animeTabs : (mediaMode === 'manga' ? mangaTabs : movieTabs);
    const activeTab = mediaMode === 'anime' ? animeTab : (mediaMode === 'manga' ? mangaTab : movieTab);

    return (
        <div className="min-h-screen bg-miru-bg">
            {/* Banner Header */}
            <div className="relative h-64 md:h-72 overflow-hidden">
                <div
                    className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-miru-bg to-pink-900/30"
                    style={{
                        backgroundImage: 'url(https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1920&q=80)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-900/60 via-miru-bg/50 to-pink-900/40"></div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-miru-bg to-transparent"></div>
            </div>

            {/* Profile Content */}
            <div className="container mx-auto px-6 -mt-24 relative z-10">

                {/* Profile Card */}
                <div className="bg-miru-surface/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8 shadow-2xl">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* Avatar */}
                        <div className="relative -mt-20 md:-mt-16">
                            <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden border-4 border-miru-bg shadow-2xl shadow-purple-500/20 bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                {currentUser?.photoURL ? (
                                    <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl font-black text-white/90">
                                        {currentUser?.displayName?.charAt(0) || 'U'}
                                    </span>
                                )}
                            </div>
                            <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-miru-bg"></div>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-2xl md:text-3xl font-black text-white mb-1">
                                {currentUser?.displayName || 'Guest User'}
                            </h1>
                            <p className="text-gray-400 text-sm">
                                {currentUser ? currentUser.email : 'Sign in to sync your progress across devices'}
                            </p>
                        </div>

                        {/* Logout Button */}
                        {currentUser && (
                            <button
                                onClick={() => logout()}
                                className="px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 text-red-400 hover:text-red-300 font-medium text-sm transition-all flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                                </svg>
                                Sign Out
                            </button>
                        )}
                        {/* Settings Button */}
                        <button
                            onClick={() => navigate('/settings')}
                            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white font-medium text-sm transition-all flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Settings
                        </button>
                    </div>

                    {/* Media Mode Toggle */}
                    <div className="flex justify-center mt-6 pt-6 border-t border-white/5">
                        <div className="inline-flex rounded-xl bg-white/5 p-1">
                            <button
                                onClick={() => setMediaMode('anime')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${mediaMode === 'anime'
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm14.024-.983a1.125 1.125 0 0 1 0 1.966l-5.603 3.113A1.125 1.125 0 0 1 9 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113Z" clipRule="evenodd" />
                                </svg>
                                Anime
                            </button>
                            <button
                                onClick={() => setMediaMode('manga')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${mediaMode === 'manga'
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                    <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
                                </svg>
                                Manga
                            </button>
                            <button
                                onClick={() => setMediaMode('movies')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${mediaMode === 'movies'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                    <path d="M19.5 6h-15v12h15V6zm-15-2h15a2 2 0 012 2v12a2 2 0 01-2 2h-15a2 2 0 01-2-2V6a2 2 0 012-2z" />
                                    <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                </svg>
                                Movies
                            </button>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        {currentStats.map((stat, idx) => (
                            <div key={idx} className={`rounded-xl p-4 text-center transition-colors group ${mediaMode === 'anime' ? 'bg-purple-500/10 hover:bg-purple-500/20' :
                                mediaMode === 'manga' ? 'bg-emerald-500/10 hover:bg-emerald-500/20' :
                                    'bg-blue-500/10 hover:bg-blue-500/20'
                                }`}>
                                <div className={`mb-2 flex justify-center transition-colors ${mediaMode === 'anime' ? 'text-purple-400 group-hover:text-purple-300' :
                                    mediaMode === 'manga' ? 'text-emerald-400 group-hover:text-emerald-300' :
                                        'text-blue-400 group-hover:text-blue-300'
                                    }`}>
                                    {stat.icon}
                                </div>
                                <div className="text-2xl font-black text-white">{stat.value}</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="sticky top-20 z-20 bg-miru-bg/80 backdrop-blur-lg border-b border-white/5 -mx-6 px-6 mb-8 flex items-center justify-between">
                    <div className="flex gap-6 overflow-x-auto pb-px">
                        {currentTabs.map(tab => (
                            <button
                                key={tab.label}
                                onClick={() => {
                                    if (mediaMode === 'anime') setAnimeTab(tab.label as AnimeTab);
                                    else if (mediaMode === 'manga') setMangaTab(tab.label as MangaTab);
                                    else setMovieTab(tab.label as MovieTab);
                                }}
                                className={`relative py-4 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === tab.label ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                {tab.label}
                                <span className={`text-xs px-1.5 py-0.5 rounded-md ${activeTab === tab.label
                                    ? mediaMode === 'anime' ? 'bg-purple-500/20 text-purple-400' :
                                        mediaMode === 'manga' ? 'bg-emerald-500/20 text-emerald-400' :
                                            'bg-blue-500/20 text-blue-400'
                                    : 'bg-white/5 text-gray-500'
                                    }`}>
                                    {tab.count}
                                </span>
                                {activeTab === tab.label && (
                                    <span className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${mediaMode === 'anime' ? 'bg-purple-500' :
                                        mediaMode === 'manga' ? 'bg-emerald-500' :
                                            'bg-blue-500'
                                        }`}></span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Clear History Button */}
                    {activeTab === 'History' && (
                        <>
                            {mediaMode === 'anime' && watchHistory.length > 0 && (
                                <button
                                    onClick={handleClearWatchHistory}
                                    className="text-red-400 hover:text-red-300 text-xs font-medium px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors whitespace-nowrap"
                                >
                                    Clear History
                                </button>
                            )}
                            {mediaMode === 'manga' && readHistory.length > 0 && (
                                <button
                                    onClick={handleClearReadHistory}
                                    className="text-red-400 hover:text-red-300 text-xs font-medium px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors whitespace-nowrap"
                                >
                                    Clear History
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* Content Grid */}
                <div className="min-h-[400px] pb-16">
                    {mediaMode === 'anime' ? (
                        currentAnimeList.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                                {currentAnimeList.map(anime => (
                                    <AnimeCard
                                        key={anime.id}
                                        anime={anime}
                                        onClick={() => handleAnimeCardClick(anime)}
                                        onDelete={animeTab === 'History' ? () => handleRemoveFromWatchHistory(anime.id) : undefined}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="h-80 flex flex-col items-center justify-center text-center px-4">
                                <div className="w-24 h-24 mb-6 text-gray-600/50">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={0.75} stroke="currentColor" className="w-full h-full">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-400 mb-2">
                                    {animeTab === 'History' ? 'No watch history yet' : 'Your anime list is empty'}
                                </h3>
                                <p className="text-gray-500 mb-6 max-w-xs">
                                    {animeTab === 'History'
                                        ? 'Start watching anime to build your history.'
                                        : 'Time to start an adventure! Add some anime to your watchlist.'}
                                </p>
                                <button
                                    onClick={() => navigate('/trending')}
                                    className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-colors shadow-lg shadow-purple-500/25 flex items-center gap-2"
                                >
                                    Browse Trending Anime
                                </button>
                            </div>
                        )
                    ) : mediaMode === 'manga' ? (
                        currentMangaList.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                                {currentMangaList.map(manga => (
                                    <MangaCard
                                        key={manga.id}
                                        manga={manga}
                                        onClick={() => handleMangaCardClick(manga)}
                                        onDelete={mangaTab === 'History' ? () => handleRemoveFromReadHistory(manga.id) : undefined}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="h-80 flex flex-col items-center justify-center text-center px-4">
                                <div className="w-24 h-24 mb-6 text-gray-600/50">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={0.75} stroke="currentColor" className="w-full h-full">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-400 mb-2">
                                    {mangaTab === 'History' ? 'No reading history yet' : 'Your manga list is empty'}
                                </h3>
                                <p className="text-gray-500 mb-6 max-w-xs">
                                    {mangaTab === 'History'
                                        ? 'Start reading manga to build your history.'
                                        : 'Time to dive into some manga!'}
                                </p>
                                <button
                                    onClick={() => navigate('/manga')}
                                    className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-colors shadow-lg shadow-emerald-500/25 flex items-center gap-2"
                                >
                                    Browse Trending Manga
                                </button>
                            </div>
                        )
                    ) : (
                        currentMovieList.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                                {currentMovieList.map(movie => (
                                    <MovieCard
                                        key={movie.id}
                                        movie={movie}
                                        onClick={() => handleMovieCardClick(movie)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="h-80 flex flex-col items-center justify-center text-center px-4">
                                <div className="w-24 h-24 mb-6 text-gray-600/50">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={0.75} stroke="currentColor" className="w-full h-full">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-400 mb-2">
                                    Your movie list is empty
                                </h3>
                                <p className="text-gray-500 mb-6 max-w-xs">
                                    Grab some popcorn! Add some movies to your watchlist.
                                </p>
                                <button
                                    onClick={() => navigate('/movies')}
                                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors shadow-lg shadow-blue-500/25 flex items-center gap-2"
                                >
                                    Browse Movies
                                </button>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}

export default Profile;
