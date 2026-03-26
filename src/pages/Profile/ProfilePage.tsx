import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProfileData } from './hooks/useProfileData';
import ProfileHeader from './components/ProfileHeader';
import MediaModeToggle from './components/MediaModeToggle';
import ProfileStats from './components/ProfileStats';
import ProfileTabs from './components/ProfileTabs';
import ProfileContentGrid from './components/ProfileContentGrid';

function Profile() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    const {
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
    } = useProfileData();

    const currentStats = mediaMode === 'anime' ? animeStats : (mediaMode === 'manga' ? mangaStats : movieStats);
    const currentTabs = mediaMode === 'anime' ? animeTabs : (mediaMode === 'manga' ? mangaTabs : movieTabs);
    const activeTab = mediaMode === 'anime' ? animeTab : (mediaMode === 'manga' ? mangaTab : movieTab);

    return (
        <div className="min-h-screen bg-miru-bg">
            <ProfileHeader 
                currentUser={currentUser} 
                logout={logout} 
                navigate={navigate} 
            />

            {/* Profile Content */}
            <div className="container mx-auto px-6 -mt-24 relative z-10">
                {/* Stats Container (Partially inside Header in original) */}
                <div className="bg-miru-surface/80 backdrop-blur-xl border border-white/10 rounded-b-2xl p-6 mb-8 shadow-2xl relative z-10 mx-6 -mt-6">
                    <MediaModeToggle 
                        mediaMode={mediaMode} 
                        setMediaMode={setMediaMode} 
                    />

                    <ProfileStats 
                        mediaMode={mediaMode} 
                        currentStats={currentStats} 
                    />
                </div>

                <ProfileTabs
                    mediaMode={mediaMode}
                    currentTabs={currentTabs}
                    activeTab={activeTab}
                    watchHistoryLength={watchHistory.length}
                    readHistoryLength={readHistory.length}
                    handleClearWatchHistory={handleClearWatchHistory}
                    handleClearReadHistory={handleClearReadHistory}
                    setAnimeTab={setAnimeTab}
                    setMangaTab={setMangaTab}
                    setMovieTab={setMovieTab}
                />

                <ProfileContentGrid
                    mediaMode={mediaMode}
                    animeTab={animeTab}
                    mangaTab={mangaTab}
                    currentAnimeList={currentAnimeList}
                    currentMangaList={currentMangaList}
                    currentMovieList={currentMovieList}
                    handleRemoveFromWatchHistory={handleRemoveFromWatchHistory}
                    handleRemoveFromReadHistory={handleRemoveFromReadHistory}
                />
            </div>
        </div>
    );
}

export default Profile;
