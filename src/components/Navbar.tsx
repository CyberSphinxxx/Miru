import React, { useState } from 'react';

export type ViewMode = 'home' | 'trending' | 'genres' | 'detail' | 'watch';

interface NavbarProps {
    onSearch: (query: string) => void;
    viewMode: ViewMode;
    onViewChange: (view: ViewMode) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onSearch, viewMode, onViewChange }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            onSearch(searchQuery.trim());
        }
    };

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
        <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
            <div className="max-w-7xl mx-auto">
                <div className="glass rounded-2xl px-6 py-3 flex items-center justify-between gap-8">
                    {/* Logo */}
                    <button
                        onClick={() => onViewChange('home')}
                        className="flex items-center gap-3 group"
                    >
                        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-miru-primary to-miru-accent flex items-center justify-center shadow-lg group-hover:shadow-miru-primary/30 transition-shadow duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <span className="text-2xl font-black tracking-tight text-gradient">MIRU</span>
                    </button>

                    {/* Navigation */}
                    <div className="hidden md:flex items-center gap-1 bg-white/5 rounded-xl p-1">
                        {navItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => onViewChange(item.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${viewMode === item.id
                                    ? 'bg-gradient-to-r from-miru-primary to-miru-accent text-white shadow-lg'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <form onSubmit={handleSubmit} className="flex-1 max-w-md">
                        <div className={`relative transition-all duration-300 ${isSearchFocused ? 'scale-105' : ''}`}>
                            <input
                                type="text"
                                placeholder="Search anime..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setIsSearchFocused(false)}
                                className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 pl-11 text-sm text-white placeholder-gray-500 outline-none transition-all duration-300 ${isSearchFocused
                                    ? 'border-miru-primary/50 bg-white/10 shadow-lg shadow-miru-primary/10'
                                    : 'border-white/10 hover:border-white/20'
                                    }`}
                            />
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${isSearchFocused ? 'text-miru-primary' : 'text-gray-500'
                                    }`}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                        </div>
                    </form>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
