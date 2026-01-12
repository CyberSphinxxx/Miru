import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Detail from './pages/Detail';
import Watch from './pages/Watch';
import Profile from './pages/Profile';

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
        if (mode === 'profile') navigate('/profile');
    };

    // Determine current view mode for Navbar highlighting
    const getViewMode = () => {
        const path = location.pathname;
        if (path === '/trending') return 'trending';
        if (path.startsWith('/genres')) return 'genres';
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
            <Routes>
                <Route path="/" element={<Home viewMode="home" />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/trending" element={<Home viewMode="trending" />} />
                <Route path="/genres" element={<Home viewMode="genres" />} />
                <Route path="/genres/:genreId" element={<WrapperGenreHome />} />
                <Route path="/anime/:id" element={<Detail />} />
                <Route path="/watch/:id" element={<Watch />} />
            </Routes>
        </div>
    );
}

// Small wrapper to extract params since Home expects props
import { useParams } from 'react-router-dom';
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
