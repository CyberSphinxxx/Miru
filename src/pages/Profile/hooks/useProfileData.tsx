import { useState, useMemo } from 'react';
import { useLocalUser, LibraryStatus, LibraryEntry, MangaLibraryStatus, MangaLibraryEntry, MovieLibraryStatus, MovieLibraryEntry } from '../../../context/UserContext';
import { Anime } from '../../../types';
import { Manga } from '../../../types/manga';
import { Movie } from '../../../types/tmdb';
import { getWatchHistory, clearWatchHistory, removeFromHistory } from '../../../services/watchHistoryService';
import { getReadHistory, clearReadHistory, removeFromReadHistory } from '../../../services/readHistoryService';
import { toast } from 'react-hot-toast';

export type MediaMode = 'anime' | 'manga' | 'movies';
export type AnimeTab = 'All' | 'Watching' | 'Completed' | 'Plan to Watch' | 'On Hold' | 'Dropped' | 'History';
export type MangaTab = 'All' | 'Reading' | 'Completed' | 'Plan to Read' | 'On Hold' | 'Dropped' | 'History';
export type MovieTab = 'All' | 'Watched' | 'Plan to Watch' | 'On Hold' | 'Dropped';

export function useProfileData() {
    const { userData } = useLocalUser();
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
                item.genres?.forEach((g: any) => {
                    const name = g.name || g;
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

    // ============= STATS =============
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
            totalAnime, watchingCount, completedCount, planToWatchCount,
            onHoldCount, droppedCount, totalEpisodes, daysWasted, favoriteGenre
        };
    }, [userData.library]);

    const mangaLibrary = userData.mangaLibrary || { reading: [], completed: [], plan_to_read: [], on_hold: [], dropped: [] };
    const mangaLibraryTotal = Object.values(mangaLibrary).reduce((acc, list) => acc + (list?.length || 0), 0);
    const totalManga = mangaLibraryTotal + readHistory.length;
    const totalChaptersRead = readHistory.reduce((acc, item) => acc + (item.currentChapter || 0), 0);
    const totalVolumes = readHistory.reduce((acc, item) => acc + (item.volumes || 0), 0);
    const allManga = [
        ...readHistory,
        ...Object.values(mangaLibrary).flat().filter(Boolean).map((e: MangaLibraryEntry) => e.manga)
    ];
    const mangaFavoriteGenre = getFavoriteGenre(allManga.filter(Boolean), 'manga');

    const movieLibrary = userData.movieLibrary || { watched: [], plan_to_watch: [], on_hold: [], dropped: [] };
    const movieLibraryTotal = Object.values(movieLibrary).reduce((acc, list) => acc + (list?.length || 0), 0);
    const allMovies = Object.values(movieLibrary).flat().map(e => e.movie);
    const movieFavoriteGenre = getFavoriteGenre(allMovies, 'movie');

    // ============= LIST GETTERS =============
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
            'Reading': 'reading', 'Completed': 'completed',
            'Plan to Read': 'plan_to_read', 'On Hold': 'on_hold', 'Dropped': 'dropped'
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
            'Watched': 'watched', 'Plan to Watch': 'plan_to_watch',
            'On Hold': 'on_hold', 'Dropped': 'dropped'
        };
        const key = tabToKey[movieTab] as MovieLibraryStatus;
        return (movieLibrary[key] || []).map(entry => entry.movie);
    };

    // ============= CONFIG GENERATION =============
    const animeTabs: { label: AnimeTab; count: number }[] = [
        { label: 'All', count: animeStatsData.totalAnime },
        { label: 'History', count: watchHistory.length },
        { label: 'Watching', count: animeStatsData.watchingCount },
        { label: 'Completed', count: animeStatsData.completedCount },
        { label: 'Plan to Watch', count: animeStatsData.planToWatchCount },
        { label: 'On Hold', count: animeStatsData.onHoldCount },
        { label: 'Dropped', count: animeStatsData.droppedCount },
    ];

    const mangaTabs: { label: MangaTab; count: number }[] = [
        { label: 'All', count: mangaLibraryTotal },
        { label: 'History', count: readHistory.length },
        { label: 'Reading', count: mangaLibrary.reading?.length || 0 },
        { label: 'Completed', count: mangaLibrary.completed?.length || 0 },
        { label: 'Plan to Read', count: mangaLibrary.plan_to_read?.length || 0 },
        { label: 'On Hold', count: mangaLibrary.on_hold?.length || 0 },
        { label: 'Dropped', count: mangaLibrary.dropped?.length || 0 },
    ];

    const movieTabs: { label: MovieTab; count: number }[] = [
        { label: 'All', count: movieLibraryTotal },
        { label: 'Watched', count: movieLibrary.watched?.length || 0 },
        { label: 'Plan to Watch', count: movieLibrary.plan_to_watch?.length || 0 },
        { label: 'On Hold', count: movieLibrary.on_hold?.length || 0 },
        { label: 'Dropped', count: movieLibrary.dropped?.length || 0 },
    ];

    const animeStats = [
        { label: 'Total Anime', value: animeStatsData.totalAnime, icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm14.024-.983a1.125 1.125 0 0 1 0 1.966l-5.603 3.113A1.125 1.125 0 0 1 9 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113Z" clipRule="evenodd" /></svg> },
        { label: 'Episodes', value: animeStatsData.totalEpisodes, icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg> },
        { label: 'Days Wasted', value: animeStatsData.daysWasted, icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
        { label: 'Favorite Genre', value: animeStatsData.favoriteGenre, icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg> },
    ];

    const mangaStats = [
        { label: 'Total Manga', value: totalManga, icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" /></svg> },
        { label: 'Chapters Read', value: totalChaptersRead, icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg> },
        { label: 'Volumes', value: totalVolumes, icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122" /></svg> },
        { label: 'Favorite Genre', value: mangaFavoriteGenre, icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg> },
    ];

    const movieStats = [
        { label: 'Total Movies', value: movieLibraryTotal, icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M19.5 6h-15v12h15V6zm-15-2h15a2 2 0 012 2v12a2 2 0 01-2 2h-15a2 2 0 01-2-2V6a2 2 0 012-2z" /><path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg> },
        { label: 'Watched', value: movieLibrary.watched?.length || 0, icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
        { label: 'Favorite Genre', value: movieFavoriteGenre, icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg> },
        { label: 'Plan to Watch', value: movieLibrary.plan_to_watch?.length || 0, icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg> }
    ];

    return {
        mediaMode, setMediaMode,
        animeTab, setAnimeTab,
        mangaTab, setMangaTab,
        movieTab, setMovieTab,
        watchHistory, readHistory,
        handleClearWatchHistory, handleRemoveFromWatchHistory,
        handleClearReadHistory, handleRemoveFromReadHistory,
        currentAnimeList: getCurrentAnimeList(),
        currentMangaList: getCurrentMangaList(),
        currentMovieList: getCurrentMovieList(),
        animeTabs, mangaTabs, movieTabs,
        animeStats, mangaStats, movieStats
    };
}
