import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';

export type ViewMode = 'home' | 'trending' | 'genres' | 'detail' | 'watch' | 'profile';

interface NavbarProps {
    onSearch: (query: string) => void;
    viewMode: ViewMode;
    onViewChange: (view: ViewMode) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onSearch, viewMode, onViewChange }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const { currentUser } = useAuth();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            onSearch(searchQuery.trim());
        }
    };

    // Keyboard shortcut handler for search (Ctrl/Cmd + K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.querySelector('input[placeholder="Search anime..."]') as HTMLInputElement;
                if (searchInput) {
                    searchInput.focus();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const navItems = [
        {
            id: 'home' as ViewMode, label: 'Home', icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                    <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
                </svg>
            )
        },
        {
            id: 'trending' as ViewMode, label: 'Trending', icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z" clipRule="evenodd" />
                </svg>
            )
        },
        {
            id: 'genres' as ViewMode, label: 'Genres', icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M3 6a3 3 0 013-3h2.25a3 3 0 013 3v2.25a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm9.75 0a3 3 0 013-3H18a3 3 0 013 3v2.25a3 3 0 01-3 3h-2.25a3 3 0 01-3-3V6zM3 15.75a3 3 0 013-3h2.25a3 3 0 013 3V18a3 3 0 01-3 3H6a3 3 0 01-3-3v-2.25zm9.75 0a3 3 0 013-3H18a3 3 0 013 3V18a3 3 0 01-3 3h-2.25a3 3 0 01-3-3v-2.25z" clipRule="evenodd" />
                </svg>
            )
        },
    ];

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
                <div className="max-w-7xl mx-auto">
                    {/* Floating Glass Header */}
                    <div
                        className="rounded-2xl px-6 py-3 flex items-center justify-between gap-6 border border-white/10"
                        style={{
                            background: 'rgba(10, 10, 10, 0.7)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                        }}
                    >
                        {/* Logo */}
                        <button
                            onClick={() => onViewChange('home')}
                            className="flex items-center gap-3 group flex-shrink-0"
                        >
                            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-miru-primary to-miru-accent flex items-center justify-center shadow-lg group-hover:shadow-miru-primary/30 transition-shadow duration-300">
                                <img src="/miru-icon.svg" alt="Miru Logo" className="w-full h-full object-contain" />
                            </div>
                            <span className="text-2xl font-black tracking-tight text-gradient">MIRU</span>
                        </button>

                        {/* Navigation - No background container, increased spacing */}
                        <div className="hidden md:flex items-center gap-8">
                            {navItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => onViewChange(item.id)}
                                    className={`flex items-center gap-2 px-2 py-2 text-sm font-medium transition-all duration-300 ${viewMode === item.id
                                        ? 'nav-active-glow text-white'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    {item.icon}
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        {/* Search + User Actions */}
                        <div className="flex items-center gap-4">
                            {/* Search */}
                            <form onSubmit={handleSubmit} className="flex-1 max-w-sm">
                                <div className={`relative transition-all duration-300 ${isSearchFocused ? 'scale-[1.02]' : ''}`}>
                                    <input
                                        type="text"
                                        placeholder="Search anime..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onFocus={() => setIsSearchFocused(true)}
                                        onBlur={() => setIsSearchFocused(false)}
                                        className={`w-full rounded-xl px-4 py-2.5 pl-11 pr-16 text-sm text-white placeholder-gray-500 outline-none transition-all duration-300 ${isSearchFocused
                                            ? 'bg-white/15 border border-purple-500 ring-1 ring-purple-500 shadow-lg shadow-purple-500/20'
                                            : 'bg-white/10 border border-white/10 hover:border-white/20'
                                            }`}
                                    />
                                    {/* Search Icon */}
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={2}
                                        stroke="currentColor"
                                        className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${isSearchFocused ? 'text-purple-400' : 'text-gray-500'
                                            }`}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                    </svg>
                                    {/* Keyboard Shortcut Hint */}
                                    <div className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 transition-opacity duration-300 ${isSearchFocused ? 'opacity-0' : 'opacity-100'}`}>
                                        <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-white/10 rounded border border-white/10">
                                            ⌘K
                                        </kbd>
                                    </div>
                                </div>
                            </form>

                            {/* User Actions */}
                            <div className="flex items-center gap-3">
                                {/* Notification Bell */}
                                <button className="relative p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 group">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                                    </svg>
                                    {/* Notification Dot */}
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                                </button>

                                {/* Avatar / Sign In */}
                                {currentUser ? (
                                    <button
                                        onClick={() => onViewChange('profile')}
                                        className={`relative w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center border-2 transition-all duration-300 group ${viewMode === 'profile'
                                            ? 'border-purple-500 shadow-lg shadow-purple-500/30'
                                            : 'border-white/10 hover:border-purple-500/50'
                                            }`}
                                        title={currentUser.displayName || 'Profile'}
                                    >
                                        {currentUser.photoURL ? (
                                            <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 opacity-80 group-hover:opacity-100 transition-opacity"></div>
                                                <span className="relative z-10 text-white font-bold text-sm">
                                                    {currentUser.displayName?.charAt(0) || 'U'}
                                                </span>
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setShowLoginModal(true)}
                                        className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-purple-500/25"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                                        </svg>
                                        Sign In
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Login Modal */}
            <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
        </>
    );
};

export default Navbar;
