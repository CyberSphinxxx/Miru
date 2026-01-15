import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalUser, LibraryStatus, LibraryEntry } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import AnimeCard from '../components/AnimeCard';
import { Anime } from '../types';
import { getWatchHistory, clearWatchHistory, removeFromHistory } from '../services/watchHistoryService';
import { toast } from 'react-hot-toast';

type Tab = 'All' | 'Watching' | 'Completed' | 'Plan to Watch' | 'On Hold' | 'Dropped' | 'History';

function Profile() {
    const { userData } = useLocalUser();
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<Tab>('All');
    const [historyUpdate, setHistoryUpdate] = useState(0);

    // Get watch history, refreshing when historyUpdate changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const watchHistory = useMemo(() => getWatchHistory(), [historyUpdate]);

    const handleClearHistory = () => {
        if (window.confirm('Are you sure you want to clear your entire watch history?')) {
            clearWatchHistory();
            setHistoryUpdate(prev => prev + 1);
            toast.success('Watch history cleared');
        }
    };

    const handleRemoveFromHistory = (animeId: number) => {
        removeFromHistory(animeId);
        setHistoryUpdate(prev => prev + 1);
        toast.success('Removed from history');
    };

    // Calculate stats
    const totalAnime = Object.values(userData.library).reduce((acc, list) => acc + list.length, 0);
    const watchingCount = userData.library.watching.length;
    const completedCount = userData.library.completed.length;
    const planToWatchCount = userData.library.plan_to_watch.length;
    const onHoldCount = userData.library.on_hold.length;
    const droppedCount = userData.library.dropped.length;

    // Estimate total episodes (sum of all completed anime episodes)
    const totalEpisodes = Object.values(userData.library).flat().reduce((acc, entry) => {
        return acc + (entry.anime.episodes || 0);
    }, 0);

    // Estimate days wasted (assuming 24 min per episode)
    const daysWasted = ((totalEpisodes * 24) / 60 / 24).toFixed(1);

    // Mean score (average of all anime scores in library)
    const allScores = Object.values(userData.library).flat().map(e => e.anime.score).filter(s => s > 0);
    const meanScore = allScores.length > 0 ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1) : '—';

    // Get current list based on active tab
    const getCurrentList = (): Anime[] => {
        if (activeTab === 'History') {
            // Convert watch history items to Anime format
            return watchHistory.map(item => ({
                mal_id: item.mal_id,
                id: item.id,
                title: item.title,
                images: { jpg: { image_url: item.image_url, large_image_url: item.image_url } },
                type: item.type,
                episodes: item.episodes,
                // Use stored details if available
                score: item.score || 0,
                genres: item.genres || [],
                synopsis: item.synopsis || '',
                status: item.status,
                rank: item.rank,
                title_japanese: item.title_japanese,
                // Pass history specific data
                historyData: {
                    currentEpisode: item.currentEpisode,
                    progress: item.progress,
                    lastWatched: item.lastWatched
                }
            } as any));
        }

        if (activeTab === 'All') {
            const allAnime: Anime[] = [];
            Object.values(userData.library).forEach((list: LibraryEntry[]) => {
                list.forEach((entry) => allAnime.push(entry.anime));
            });
            return allAnime;
        }

        const key = activeTab.toLowerCase().replace(/ /g, '_') as LibraryStatus;
        return userData.library[key]?.map(entry => entry.anime) || [];
    };

    const currentList = getCurrentList();

    const handleCardClick = (anime: Anime) => {
        navigate(`/anime/${anime.mal_id || anime.id}`);
    };

    const tabs: { label: Tab; count: number }[] = [
        { label: 'All', count: totalAnime },
        { label: 'History', count: watchHistory.length },
        { label: 'Watching', count: watchingCount },
        { label: 'Completed', count: completedCount },
        { label: 'Plan to Watch', count: planToWatchCount },
        { label: 'On Hold', count: onHoldCount },
        { label: 'Dropped', count: droppedCount },
    ];

    const stats = [
        {
            label: 'Total Anime', value: totalAnime, icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504 1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5" />
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
            label: 'Mean Score', value: meanScore, icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
            )
        },
    ];

    return (
        <div className="min-h-screen bg-miru-bg">
            {/* Banner Header */}
            <div className="relative h-64 md:h-72 overflow-hidden">
                {/* Background Image/Gradient */}
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

                {/* Bottom Fade */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-miru-bg to-transparent"></div>
            </div>

            {/* Profile Content */}
            <div className="container mx-auto px-6 -mt-24 relative z-10">

                {/* Profile Card (Floating) */}
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
                            {/* Online indicator */}
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

                        {/* Settings / Sign Out Button */}
                        {currentUser ? (
                            <button
                                onClick={() => logout()}
                                className="px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 text-red-400 hover:text-red-300 font-medium text-sm transition-all flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                                </svg>
                                Sign Out
                            </button>
                        ) : (
                            <button className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white font-medium text-sm transition-all flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Settings
                            </button>
                        )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/5">
                        {stats.map((stat, idx) => (
                            <div key={idx} className="bg-white/5 rounded-xl p-4 text-center hover:bg-white/10 transition-colors group">
                                <div className="text-purple-400 group-hover:text-purple-300 transition-colors mb-2 flex justify-center">
                                    {stat.icon}
                                </div>
                                <div className="text-2xl font-black text-white">{stat.value}</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Navigation Tabs (Underline Style) */}
                <div className="sticky top-20 z-20 bg-miru-bg/80 backdrop-blur-lg border-b border-white/5 -mx-6 px-6 mb-8 flex items-center justify-between">
                    <div className="flex gap-6 overflow-x-auto pb-px">
                        {tabs.map(tab => (
                            <button
                                key={tab.label}
                                onClick={() => setActiveTab(tab.label)}
                                className={`relative py-4 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === tab.label
                                    ? 'text-white'
                                    : 'text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                {tab.label}
                                <span className={`text-xs px-1.5 py-0.5 rounded-md ${activeTab === tab.label
                                    ? 'bg-purple-500/20 text-purple-400'
                                    : 'bg-white/5 text-gray-500'
                                    }`}>
                                    {tab.count}
                                </span>

                                {/* Active Underline */}
                                {activeTab === tab.label && (
                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full"></span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Clear History Button */}
                    {activeTab === 'History' && watchHistory.length > 0 && (
                        <button
                            onClick={handleClearHistory}
                            className="text-red-400 hover:text-red-300 text-xs font-medium px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors whitespace-nowrap"
                        >
                            Clear History
                        </button>
                    )}
                </div>

                {/* Grid / Empty State */}
                <div className="min-h-[400px] pb-16">
                    {currentList.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                            {currentList.map(anime => (
                                <AnimeCard
                                    key={anime.mal_id}
                                    anime={anime}
                                    onClick={() => handleCardClick(anime)}
                                    onDelete={activeTab === 'History' ? () => handleRemoveFromHistory(anime.mal_id) : undefined}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="h-80 flex flex-col items-center justify-center text-center px-4">
                            {/* Ghost Icon */}
                            <div className="w-24 h-24 mb-6 text-gray-600/50">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={0.75} stroke="currentColor" className="w-full h-full">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-400 mb-2">
                                {activeTab === 'History' ? 'No history yet' : 'Your list is empty'}
                            </h3>
                            <p className="text-gray-500 mb-6 max-w-xs">
                                {activeTab === 'History'
                                    ? 'Start watching anime to build your history.'
                                    : 'Time to start an adventure! Add some anime to your watchlist.'}
                            </p>
                            <button
                                onClick={() => navigate('/trending')}
                                className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-colors shadow-lg shadow-purple-500/25 flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
                                </svg>
                                Browse Trending Anime
                            </button>
                        </div>
                    )}
                </div>
            </div >
        </div >
    );
}

export default Profile;
