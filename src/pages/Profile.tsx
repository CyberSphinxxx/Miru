import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalUser, LibraryStatus, LibraryEntry, MangaLibraryStatus, MangaLibraryEntry } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import AnimeCard from '../components/AnimeCard';
import MangaCard from '../components/MangaCard';
import { Anime } from '../types';
import { Manga } from '../types/manga';
import { getWatchHistory, clearWatchHistory, removeFromHistory } from '../services/watchHistoryService';
import { getReadHistory, clearReadHistory, removeFromReadHistory } from '../services/readHistoryService';
import { toast } from 'react-hot-toast';

type MediaMode = 'anime' | 'manga';
type AnimeTab = 'All' | 'Watching' | 'Completed' | 'Plan to Watch' | 'On Hold' | 'Dropped' | 'History';
type MangaTab = 'All' | 'Reading' | 'Completed' | 'Plan to Read' | 'On Hold' | 'Dropped' | 'History';

function Profile() {
    const { userData } = useLocalUser();
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [mediaMode, setMediaMode] = useState<MediaMode>('anime');
    const [animeTab, setAnimeTab] = useState<AnimeTab>('All');
    const [mangaTab, setMangaTab] = useState<MangaTab>('All');
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

    // ============= ANIME STATS =============
    const totalAnime = Object.values(userData.library).reduce((acc, list) => acc + list.length, 0);
    const animeWatchingCount = userData.library.watching.length;
    const animeCompletedCount = userData.library.completed.length;
    const animePlanToWatchCount = userData.library.plan_to_watch.length;
    const animeOnHoldCount = userData.library.on_hold.length;
    const animeDroppedCount = userData.library.dropped.length;

    const totalEpisodes = Object.values(userData.library).flat().reduce((acc, entry) => {
        return acc + (entry.anime.episodes || 0);
    }, 0);

    const daysWasted = ((totalEpisodes * 24) / 60 / 24).toFixed(1);

    const allAnimeScores = Object.values(userData.library).flat().map(e => e.anime.score).filter(s => s > 0);
    const animeMeanScore = allAnimeScores.length > 0 ? (allAnimeScores.reduce((a, b) => a + b, 0) / allAnimeScores.length).toFixed(1) : '—';

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
    const allMangaScores = [
        ...readHistory.map(e => e.score || 0),
        ...Object.values(mangaLibrary).flat().filter(Boolean).map((e: MangaLibraryEntry) => e.manga?.score || 0)
    ].filter(s => s > 0);
    const mangaMeanScore = allMangaScores.length > 0 ? (allMangaScores.reduce((a, b) => a + b, 0) / allMangaScores.length).toFixed(1) : '—';

    // ============= GET CURRENT LIST =============
    const getCurrentAnimeList = (): Anime[] => {
        if (animeTab === 'History') {
            return watchHistory.map(item => ({
                mal_id: item.mal_id,
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
                mal_id: item.mal_id,
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
            // Show all manga from library
            const allManga: Manga[] = [];
            Object.values(mangaLibrary).forEach((list: MangaLibraryEntry[]) => {
                (list || []).forEach((entry) => allManga.push(entry.manga));
            });
            return allManga;
        }

        // Map tab names to library keys
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

    const currentAnimeList = getCurrentAnimeList();
    const currentMangaList = getCurrentMangaList();

    const handleAnimeCardClick = (anime: Anime) => {
        navigate(`/anime/${anime.mal_id || anime.id}`);
    };

    const handleMangaCardClick = (manga: Manga) => {
        navigate(`/manga/${manga.mal_id || manga.id}`);
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
            label: 'Mean Score', value: animeMeanScore, icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
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
            label: 'Mean Score', value: mangaMeanScore, icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
            )
        },
    ];

    const currentStats = mediaMode === 'anime' ? animeStats : mangaStats;
    const currentTabs = mediaMode === 'anime' ? animeTabs : mangaTabs;
    const activeTab = mediaMode === 'anime' ? animeTab : mangaTab;

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
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        {currentStats.map((stat, idx) => (
                            <div key={idx} className={`rounded-xl p-4 text-center transition-colors group ${mediaMode === 'anime' ? 'bg-purple-500/10 hover:bg-purple-500/20' : 'bg-emerald-500/10 hover:bg-emerald-500/20'
                                }`}>
                                <div className={`mb-2 flex justify-center transition-colors ${mediaMode === 'anime' ? 'text-purple-400 group-hover:text-purple-300' : 'text-emerald-400 group-hover:text-emerald-300'
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
                                onClick={() => mediaMode === 'anime' ? setAnimeTab(tab.label as AnimeTab) : setMangaTab(tab.label as MangaTab)}
                                className={`relative py-4 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === tab.label ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                {tab.label}
                                <span className={`text-xs px-1.5 py-0.5 rounded-md ${activeTab === tab.label
                                    ? mediaMode === 'anime' ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-white/5 text-gray-500'
                                    }`}>
                                    {tab.count}
                                </span>
                                {activeTab === tab.label && (
                                    <span className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${mediaMode === 'anime' ? 'bg-purple-500' : 'bg-emerald-500'
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
                                        key={anime.mal_id}
                                        anime={anime}
                                        onClick={() => handleAnimeCardClick(anime)}
                                        onDelete={animeTab === 'History' ? () => handleRemoveFromWatchHistory(anime.mal_id) : undefined}
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
                    ) : (
                        currentMangaList.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                                {currentMangaList.map(manga => (
                                    <MangaCard
                                        key={manga.mal_id}
                                        manga={manga}
                                        onClick={() => handleMangaCardClick(manga)}
                                        onDelete={mangaTab === 'History' ? () => handleRemoveFromReadHistory(manga.mal_id) : undefined}
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
                    )}
                </div>
            </div>
        </div>
    );
}

export default Profile;
