import { useState, useMemo, useCallback } from 'react';
import { useLocalUser, LibraryStatus, LibraryEntry, MangaLibraryStatus, MangaLibraryEntry, MovieLibraryStatus, MovieLibraryEntry } from '../../../context/UserContext';
import { Anime } from '../../../types';
import { Manga } from '../../../types/manga';
import { Movie } from '../../../types/tmdb';
import { getWatchHistory, clearWatchHistory, removeFromHistory } from '../../../services/watchHistoryService';
import { getReadHistory, clearReadHistory, removeFromReadHistory } from '../../../services/readHistoryService';
import { toast } from 'react-hot-toast';
import {
    PlayCircleIcon, PlayIcon, ClockIcon, HeartIcon,
    BookOpenFilledIcon, BookOpenOutlineIcon, StackIcon,
    FilmIcon, EyeIcon, CalendarIcon
} from '../utils/profileIcons';

export type MediaMode = 'anime' | 'manga' | 'movies';
export type AnimeTab = 'All' | 'Watching' | 'Completed' | 'Plan to Watch' | 'On Hold' | 'Dropped' | 'History';
export type MangaTab = 'All' | 'Reading' | 'Completed' | 'Plan to Read' | 'On Hold' | 'Dropped' | 'History';
export type MovieTab = 'All' | 'Watched' | 'Plan to Watch' | 'On Hold' | 'Dropped';

// Module-level constant — not recreated per render/call
const TMDB_GENRES: Record<number, string> = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
    99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
    27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
    10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
};

function getFavoriteGenre(items: any[], type: 'anime' | 'manga' | 'movie'): string {
    const genreCounts: Record<string, number> = {};

    items.forEach(item => {
        if (type === 'movie') {
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
}

export function useProfileData() {
    const { userData } = useLocalUser();
    const [mediaMode, setMediaMode] = useState<MediaMode>('anime');
    const [animeTab, setAnimeTab] = useState<AnimeTab>('All');
    const [mangaTab, setMangaTab] = useState<MangaTab>('All');
    const [movieTab, setMovieTab] = useState<MovieTab>('All');
    const [historyVersion, setHistoryVersion] = useState(0);

    // History data — properly keyed on version counter
    const watchHistory = useMemo(() => getWatchHistory(), [historyVersion]);
    const readHistory = useMemo(() => getReadHistory(), [historyVersion]);

    const bumpHistory = useCallback(() => setHistoryVersion(v => v + 1), []);

    // ============= HANDLERS =============
    const handleClearWatchHistory = useCallback(() => {
        if (window.confirm('Are you sure you want to clear your entire watch history?')) {
            clearWatchHistory();
            bumpHistory();
            toast.success('Watch history cleared');
        }
    }, [bumpHistory]);

    const handleRemoveFromWatchHistory = useCallback((animeId: number) => {
        removeFromHistory(animeId);
        bumpHistory();
        toast.success('Removed from history');
    }, [bumpHistory]);

    const handleClearReadHistory = useCallback(() => {
        if (window.confirm('Are you sure you want to clear your entire reading history?')) {
            clearReadHistory();
            bumpHistory();
            toast.success('Reading history cleared');
        }
    }, [bumpHistory]);

    const handleRemoveFromReadHistory = useCallback((mangaId: number) => {
        removeFromReadHistory(mangaId);
        bumpHistory();
        toast.success('Removed from history');
    }, [bumpHistory]);

    // ============= ANIME STATS (memoized) =============
    const animeStatsData = useMemo(() => {
        // Hide 'completed' from 'All' tab view, but keep 'grandTotal' for stats
        const grandTotalAnime = Object.values(userData.library).reduce((acc, list) => acc + list.length, 0);
        const activeTotalAnime = grandTotalAnime; // Include everything in 'All'
        
        const watchingCount = userData.library.watching.length;
        const completedCount = userData.library.completed.length;
        const planToWatchCount = userData.library.plan_to_watch.length;
        const onHoldCount = userData.library.on_hold.length;
        const droppedCount = userData.library.dropped.length;

        const totalEpisodes = Object.values(userData.library).flat().reduce((acc, entry) => {
            return acc + (entry.anime.episodes || 0);
        }, 0);

        // Bug 1 fix: Use real accumulated watch time
        const realSeconds = userData.totalWatchTimeSeconds || 0;
        
        // If there's no real watch time yet, fall back to the old estimate so users don't see "0"
        const isEstimate = realSeconds === 0;
        const totalHours = isEstimate ? (totalEpisodes / 60) : (realSeconds / 3600);
        
        const daysWasted = totalHours >= 24
            ? (totalHours / 24).toFixed(1)
            : totalHours.toFixed(1);
            
        const unit = totalHours >= 24 ? 'Days' : 'Hours';
        const daysWastedUnit = isEstimate ? `Est. ${unit}` : unit;

        const allAnime = Object.values(userData.library).flat().map(e => e.anime);
        const favoriteGenre = getFavoriteGenre(allAnime, 'anime');

        return {
            grandTotalAnime, activeTotalAnime, watchingCount, completedCount, planToWatchCount,
            onHoldCount, droppedCount, totalEpisodes, daysWasted, daysWastedUnit, favoriteGenre
        };
    }, [userData.library, userData.totalWatchTimeSeconds]);

    // ============= MANGA STATS (memoized) =============
    const mangaStatsData = useMemo(() => {
        const mangaLibrary = userData.mangaLibrary || { reading: [], completed: [], plan_to_read: [], on_hold: [], dropped: [] };
        const mangaLibraryTotal = Object.values(mangaLibrary).reduce((acc, list) => acc + (list?.length || 0), 0);
        const totalManga = mangaLibraryTotal + readHistory.length;
        const totalChaptersRead = readHistory.reduce((acc, item) => acc + (item.currentChapter || 0), 0);
        const totalVolumes = readHistory.reduce((acc, item) => acc + (item.volumes || 0), 0);
        const allManga = [
            ...readHistory,
            ...Object.values(mangaLibrary).flat().filter(Boolean).map((e: MangaLibraryEntry) => e.manga)
        ];
        const favoriteGenre = getFavoriteGenre(allManga.filter(Boolean), 'manga');

        return { mangaLibrary, mangaLibraryTotal, totalManga, totalChaptersRead, totalVolumes, favoriteGenre };
    }, [userData.mangaLibrary, readHistory]);

    // ============= MOVIE STATS (memoized) =============
    const movieStatsData = useMemo(() => {
        const movieLibrary = userData.movieLibrary || { watched: [], plan_to_watch: [], on_hold: [], dropped: [] };
        const movieLibraryTotal = Object.values(movieLibrary).reduce((acc, list) => acc + (list?.length || 0), 0);
        const allMovies = Object.values(movieLibrary).flat().map(e => e.movie);
        const favoriteGenre = getFavoriteGenre(allMovies, 'movie');

        return { movieLibrary, movieLibraryTotal, favoriteGenre };
    }, [userData.movieLibrary]);

    const { mangaLibrary, mangaLibraryTotal } = mangaStatsData;
    const { movieLibrary, movieLibraryTotal } = movieStatsData;

    // ============= LIST GETTERS (memoized) =============
    const currentAnimeList = useMemo((): Anime[] => {
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
            Object.entries(userData.library).forEach(([, list]) => {
                (list as LibraryEntry[]).forEach((entry) => allAnime.push(entry.anime));
            });
            return allAnime;
        }

        const key = animeTab.toLowerCase().replace(/ /g, '_') as LibraryStatus;
        return userData.library[key]?.map(entry => entry.anime) || [];
    }, [animeTab, watchHistory, userData.library]);

    const currentMangaList = useMemo((): Manga[] => {
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
    }, [mangaTab, readHistory, mangaLibrary]);

    const currentMovieList = useMemo((): Movie[] => {
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
    }, [movieTab, movieLibrary]);

    // ============= TAB CONFIGS (memoized) =============
    const animeTabs = useMemo((): { label: AnimeTab; count: number }[] => [
        { label: 'All', count: animeStatsData.activeTotalAnime },
        { label: 'History', count: watchHistory.length },
        { label: 'Watching', count: animeStatsData.watchingCount },
        { label: 'Completed', count: animeStatsData.completedCount },
        { label: 'Plan to Watch', count: animeStatsData.planToWatchCount },
        { label: 'On Hold', count: animeStatsData.onHoldCount },
        { label: 'Dropped', count: animeStatsData.droppedCount },
    ], [animeStatsData, watchHistory.length]);

    const mangaTabs = useMemo((): { label: MangaTab; count: number }[] => [
        { label: 'All', count: mangaLibraryTotal },
        { label: 'History', count: readHistory.length },
        { label: 'Reading', count: mangaLibrary.reading?.length || 0 },
        { label: 'Completed', count: mangaLibrary.completed?.length || 0 },
        { label: 'Plan to Read', count: mangaLibrary.plan_to_read?.length || 0 },
        { label: 'On Hold', count: mangaLibrary.on_hold?.length || 0 },
        { label: 'Dropped', count: mangaLibrary.dropped?.length || 0 },
    ], [mangaLibraryTotal, readHistory.length, mangaLibrary]);

    const movieTabs = useMemo((): { label: MovieTab; count: number }[] => [
        { label: 'All', count: movieLibraryTotal },
        { label: 'Watched', count: movieLibrary.watched?.length || 0 },
        { label: 'Plan to Watch', count: movieLibrary.plan_to_watch?.length || 0 },
        { label: 'On Hold', count: movieLibrary.on_hold?.length || 0 },
        { label: 'Dropped', count: movieLibrary.dropped?.length || 0 },
    ], [movieLibraryTotal, movieLibrary]);

    // ============= STATS DISPLAY (memoized, using extracted icons) =============
    const animeStats = useMemo(() => [
        { label: 'Total Anime', value: animeStatsData.grandTotalAnime, icon: PlayCircleIcon },
        { label: 'Episodes', value: animeStatsData.totalEpisodes, icon: PlayIcon },
        { label: `${animeStatsData.daysWastedUnit} Watched`, value: animeStatsData.daysWasted, icon: ClockIcon },
        { label: 'Favorite Genre', value: animeStatsData.favoriteGenre, icon: HeartIcon },
    ], [animeStatsData]);

    const mangaStats = useMemo(() => [
        { label: 'Total Manga', value: mangaStatsData.totalManga, icon: BookOpenFilledIcon },
        { label: 'Chapters Read', value: mangaStatsData.totalChaptersRead, icon: BookOpenOutlineIcon },
        { label: 'Volumes', value: mangaStatsData.totalVolumes, icon: StackIcon },
        { label: 'Favorite Genre', value: mangaStatsData.favoriteGenre, icon: HeartIcon },
    ], [mangaStatsData]);

    const movieStats = useMemo(() => [
        { label: 'Total Movies', value: movieLibraryTotal, icon: FilmIcon },
        { label: 'Watched', value: movieStatsData.movieLibrary.watched?.length || 0, icon: EyeIcon },
        { label: 'Favorite Genre', value: movieStatsData.favoriteGenre, icon: HeartIcon },
        { label: 'Plan to Watch', value: movieStatsData.movieLibrary.plan_to_watch?.length || 0, icon: CalendarIcon },
    ], [movieLibraryTotal, movieStatsData]);

    return {
        mediaMode, setMediaMode,
        animeTab, setAnimeTab,
        mangaTab, setMangaTab,
        movieTab, setMovieTab,
        watchHistory, readHistory,
        handleClearWatchHistory, handleRemoveFromWatchHistory,
        handleClearReadHistory, handleRemoveFromReadHistory,
        currentAnimeList,
        currentMangaList,
        currentMovieList,
        animeTabs, mangaTabs, movieTabs,
        animeStats, mangaStats, movieStats
    };
}
