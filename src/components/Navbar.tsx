import React from 'react';

interface NavbarProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    onSearch: (e?: React.FormEvent) => void;
    onLogoClick: () => void;
    isSearching: boolean;
}

const Navbar: React.FC<NavbarProps> = ({
    searchQuery,
    setSearchQuery,
    onSearch,
    onLogoClick,
    isSearching
}) => {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
            <div className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-8">
                        <h1
                            onClick={onLogoClick}
                            className="text-2xl font-extrabold tracking-tight cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2"
                        >
                            <span className="gradient-text">MIRU</span>
                            <span className="text-xs text-gray-500 font-normal hidden sm:inline">見る</span>
                        </h1>

                        {/* Navigation Links */}
                        <div className="hidden md:flex items-center gap-1">
                            <button
                                onClick={onLogoClick}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${!isSearching
                                        ? 'text-white bg-white/10'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                Home
                            </button>
                            <button className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                                Trending
                            </button>
                            <button className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                                Genres
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <form onSubmit={onSearch} className="relative flex items-center">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search anime..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-48 sm:w-64 md:w-80 bg-white/5 border border-white/10 rounded-full py-2.5 px-5 pr-12 text-sm 
                  focus:outline-none focus:border-miru-accent/50 focus:bg-white/10 focus:ring-2 focus:ring-miru-accent/20
                  transition-all placeholder:text-gray-500"
                            />
                            <button
                                type="submit"
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-miru-accent transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
