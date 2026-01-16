import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy load heavy pages for better initial load time
const Detail = lazy(() => import('./pages/Detail'));
const Watch = lazy(() => import('./pages/Watch'));
const Profile = lazy(() => import('./pages/Profile'));
const MangaHome = lazy(() => import('./pages/MangaHome'));
const MangaReader = lazy(() => import('./pages/MangaReader'));

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

    const handleSearch = (query: string) => {
        if (query.trim()) {
            navigate(`/?q=${encodeURIComponent(query)}`);
        } else {
            navigate('/');
        }
    };

    const handleViewChange = (mode: string) => {
        if (mode === 'home') navigate('/');
        if (mode === 'trending') navigate('/trending');
        if (mode === 'genres') navigate('/genres');
        if (mode === 'manga') navigate('/manga');
        if (mode === 'profile') navigate('/profile');
    };

    // Determine current view mode for Navbar highlighting
    const getViewMode = () => {
        const path = location.pathname;
        if (path === '/trending') return 'trending';
        if (path.startsWith('/genres')) return 'genres';
        if (path.startsWith('/manga')) return 'manga';
        if (path.startsWith('/anime')) return 'detail';
        if (path.startsWith('/watch')) return 'watch';
        if (path === '/profile') return 'profile';
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
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/trending" element={<Home viewMode="trending" />} />
                    <Route path="/genres" element={<Home viewMode="genres" />} />
                    <Route path="/genres/:genreId" element={<WrapperGenreHome />} />
                    <Route path="/manga" element={<MangaHome viewMode="home" />} />
                    <Route path="/read/:id" element={<MangaReader />} />
                    <Route path="/anime/:id" element={<Detail />} />
                    <Route path="/watch/:id" element={<Watch />} />
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
