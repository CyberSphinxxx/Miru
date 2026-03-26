import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom';
import Navbar, { SearchType } from './components/Navbar';
import Home from './pages/Home/HomePage';
import LoadingSpinner from './components/LoadingSpinner';
import { animeService } from './services/api';
import { useLocalUser } from './context/UserContext';

// Theme configuration
const THEMES = {
    purple: { primary: '#6366f1', accent: '#f472b6', primaryRgb: '99, 102, 241', accentRgb: '244, 114, 182' },
    blue: { primary: '#3b82f6', accent: '#60a5fa', primaryRgb: '59, 130, 246', accentRgb: '96, 165, 250' },
    green: { primary: '#10b981', accent: '#34d399', primaryRgb: '16, 185, 129', accentRgb: '52, 211, 153' },
    orange: { primary: '#f97316', accent: '#fbbf24', primaryRgb: '249, 115, 22', accentRgb: '251, 191, 36' },
};
// Lazy load heavy pages for better initial load time
const Detail = lazy(() => import('./pages/Details/AnimeDetailPageContainer'));
const Watch = lazy(() => import('./pages/Watch/WatchPageContainer'));
const Profile = lazy(() => import('./pages/Profile/ProfilePage'));
const MangaHome = lazy(() => import('./pages/Manga/MangaHomePage'));
const MangaDetail = lazy(() => import('./pages/Details/MangaDetailPageContainer'));
const MangaReader = lazy(() => import('./pages/Manga/MangaReaderPage'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const Movies = lazy(() => import('./pages/Movies/MoviesPage'));
const MovieDetail = lazy(() => import('./pages/Details/MovieDetailPage'));
const Settings = lazy(() => import('./pages/Profile/SettingsPage'));

// Loading fallback component
const PageLoader = () => (
    <div className="min-h-screen bg-miru-bg flex items-center justify-center">
        <LoadingSpinner size="lg" />
    </div>
);

// Wrapper to provide navigation props to Navbar
function AppContent() {
    const location = useLocation();
    const navigate = useNavigate();
    const { userData } = useLocalUser();

    // Theme & Background Logic
    useEffect(() => {
        const theme = THEMES[userData.settings.themeAccent || 'purple'];
        const root = document.documentElement;
        const body = document.body;

        // Apply Theme Colors
        root.style.setProperty('--miru-primary', theme.primary);
        root.style.setProperty('--miru-accent', theme.accent);
        root.style.setProperty('--miru-primary-rgb', theme.primaryRgb);
        root.style.setProperty('--miru-accent-rgb', theme.accentRgb);

        // Apply Base Color
        const baseColors = {
            black: '#0a0a0a',
            midnight: '#0f1014',
            slate: '#0f172a'
        };
        root.style.setProperty('--miru-bg', baseColors[userData.settings.baseColor || 'black']);

        // Apply Background Mode
        body.classList.remove('bg-mode-simple', 'bg-mode-glow', 'bg-mode-mesh');
        body.classList.add(`bg-mode-${userData.settings.backgroundMode || 'glow'}`);

    }, [
        userData.settings.themeAccent,
        userData.settings.backgroundMode,
        userData.settings.baseColor
    ]);

    // Cache prewarming: prefetch trending data during idle time
    useEffect(() => {
        const prewarm = () => {
            // Silently prefetch trending anime to warm the cache
            animeService.getTrendingAnime(1, 10).catch(() => {
                // Ignore errors - this is just prewarming
            });
        };

        // Use requestIdleCallback if available (non-blocking)
        if ('requestIdleCallback' in window) {
            (window as any).requestIdleCallback(prewarm);
        } else {
            // Fallback: use setTimeout with a delay
            setTimeout(prewarm, 1000);
        }
    }, []);

    const handleSearch = (query: string, type: SearchType = 'all') => {
        if (query.trim()) {
            navigate(`/search?q=${encodeURIComponent(query)}&type=${type}`);
        } else {
            navigate('/');
        }
    };

    const handleViewChange = (mode: string) => {
        if (mode === 'home') navigate('/');
        if (mode === 'anime') navigate('/anime');
        if (mode === 'manga') navigate('/manga');
        if (mode === 'movies') navigate('/movies');
        if (mode === 'movies') navigate('/movies');
        if (mode === 'profile') navigate('/profile');
        if (mode === 'settings') navigate('/settings');
    };

    // Determine current view mode for Navbar highlighting
    const getViewMode = () => {
        const path = location.pathname;
        // All anime-related paths highlight 'Anime' in nav
        if (path === '/anime' || path === '/trending' || path.startsWith('/genres') || path.startsWith('/anime/')) return 'anime';
        if (path.startsWith('/manga') || path.startsWith('/read')) return 'manga';
        if (path.startsWith('/movies')) return 'movies';
        if (path.startsWith('/watch')) return 'anime'; // Watch pages are anime-related
        if (path === '/profile') return 'profile';
        if (path === '/settings') return 'settings';
        return 'home';
    };

    return (
        <div className="min-h-screen bg-miru-bg text-white">
            <Navbar
                onSearch={handleSearch}
                viewMode={getViewMode()}
                onViewChange={handleViewChange}
            />
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    <Route path="/" element={<Home viewMode="home" />} />
                    <Route path="/search" element={<SearchResults />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/anime" element={<Home viewMode="anime" />} />
                    <Route path="/trending" element={<Home viewMode="trending" />} />
                    <Route path="/genres" element={<Home viewMode="genres" />} />
                    <Route path="/genres/:genreId" element={<WrapperGenreHome />} />
                    <Route path="/manga" element={<MangaHome viewMode="home" />} />
                    <Route path="/manga/:id" element={<MangaDetail />} />
                    <Route path="/read/:id" element={<MangaReader />} />
                    <Route path="/anime/:id" element={<Detail />} />
                    <Route path="/watch/:id" element={<Watch />} />
                    <Route path="/movies" element={<Movies />} />
                    <Route path="/movies" element={<Movies />} />
                    <Route path="/movies/:id" element={<MovieDetail />} />
                    <Route path="/settings" element={<Settings />} />
                </Routes>
            </Suspense>
        </div>
    );
}

// Small wrapper to extract params since Home expects props
function WrapperGenreHome() {
    const { genreId } = useParams<{ genreId: string }>();
    return <Home viewMode="genres" selectedGenreId={genreId} />;
}

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;
