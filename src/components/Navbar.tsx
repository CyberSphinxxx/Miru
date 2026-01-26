import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import LoginModal from './LoginModal';
import NotificationDropdown from './NotificationDropdown';
import { animeService, mangaService, movieService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Anime } from '../types';
import { Manga } from '../types/manga';
import { Movie } from '../types/tmdb';

export type ViewMode = 'home' | 'anime' | 'manga' | 'movies' | 'detail' | 'watch' | 'profile' | 'settings';

export type SearchType = 'all' | 'anime' | 'manga' | 'movies';

interface NavbarProps {
    onSearch: (query: string, type?: SearchType) => void;
    viewMode: ViewMode;
    onViewChange: (view: ViewMode) => void;
}

interface SearchResultItem {
    id: number | string;
    title: string;
    image: string;
    type: 'anime' | 'manga' | 'movie';
    year?: string | number;
    rating?: number;
}

const Navbar: React.FC<NavbarProps> = ({ onSearch, viewMode, onViewChange }) => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchType, setSearchType] = useState<SearchType>('all');
    const [showSearchTypeDropdown, setShowSearchTypeDropdown] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    // Live Search State
    const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResultsDropdown, setShowResultsDropdown] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const { currentUser } = useAuth();
    const { unreadCount } = useNotifications();

    const searchTypeOptions: { value: SearchType; label: string; icon: React.ReactNode }[] = [
        {
            value: 'all', label: 'All', icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                    <path fillRule="evenodd" d="M3 6a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3v2.25a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Zm9.75 0a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3v2.25a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3V6ZM3 15.75a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-2.25Zm9.75 0a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3v-2.25Z" clipRule="evenodd" />
                </svg>
            )
        },
        {
            value: 'anime', label: 'Anime', icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm14.024-.983a1.125 1.125 0 0 1 0 1.966l-5.603 3.113A1.125 1.125 0 0 1 9 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113Z" clipRule="evenodd" />
                </svg>
            )
        },
        {
            value: 'manga', label: 'Manga', icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
                </svg>
            )
        },
        {
            value: 'movies', label: 'Movies', icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M19.5 6h-15v12h15V6zm-15-2h15a2 2 0 012 2v12a2 2 0 01-2 2h-15a2 2 0 01-2-2V6a2 2 0 012-2z" />
                    <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
            )
        },
    ];

    const getSearchPlaceholder = () => {
        switch (searchType) {
            case 'anime': return 'Search anime...';
            case 'manga': return 'Search manga...';
            case 'movies': return 'Search movies...';
            default: return 'Search anime, manga & movies...';
        }
    };

    // Live Search Logic
    useEffect(() => {
        let isMounted = true;

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (searchQuery.length < 2) {
            setSearchResults([]);
            setShowResultsDropdown(false);
            return;
        }

        setIsSearching(true);
        setShowResultsDropdown(true);

        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const promises = [];

                if (searchType === 'all' || searchType === 'anime') {
                    promises.push(animeService.searchAnime(searchQuery, 1).then(res =>
                        res.data.slice(0, 3).map((item: Anime) => ({
                            id: item.id,
                            title: item.title,
                            image: item.images.jpg.image_url,
                            type: 'anime' as const,
                            year: item.year,
                            rating: item.score
                        }))
                    ));
                }

                if (searchType === 'all' || searchType === 'manga') {
                    promises.push(mangaService.searchManga(searchQuery, 1, 3).then(res =>
                        res.data.slice(0, 3).map((item: Manga) => ({
                            id: item.id,
                            title: item.title,
                            image: item.images.jpg.image_url,
                            type: 'manga' as const,
                            year: item.published?.string,
                            rating: item.score
                        }))
                    ));
                }

                if (searchType === 'all' || searchType === 'movies') {
                    promises.push(movieService.search(searchQuery, 1).then(res =>
                        res.results.slice(0, 3).map((item: Movie) => ({
                            id: item.id,
                            title: item.title,
                            image: item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : 'https://placehold.co/200x300/1a1a1a/ffffff?text=No+Cover',
                            type: 'movie' as const,
                            year: item.release_date?.split('-')[0],
                            rating: item.vote_average
                        }))
                    ));
                }

                const results = await Promise.all(promises);

                if (isMounted) {
                    const flatResults = results.flat().sort((a, b) => (b.rating || 0) - (a.rating || 0));
                    setSearchResults(flatResults);
                }
            } catch (error) {
                if (isMounted) {
                    console.error("Search failed", error);
                }
            } finally {
                if (isMounted) {
                    setIsSearching(false);
                }
            }
        }, 500);

        return () => {
            isMounted = false;
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [searchQuery, searchType]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            onSearch(searchQuery.trim(), searchType);
            setIsMobileMenuOpen(false);
            setShowResultsDropdown(false);
        }
    };

    const handleResultClick = (item: SearchResultItem) => {
        setSearchQuery('');
        setShowResultsDropdown(false);
        setIsMobileMenuOpen(false);

        switch (item.type) {
            case 'anime':
                navigate(`/anime/${item.id}`);
                break;
            case 'manga':
                navigate(`/manga/${item.id}`);
                break;
            case 'movie':
                navigate(`/movies/${item.id}`);
                break;
        }
    };

    // Close mobile menu when view changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
        setShowResultsDropdown(false);
    }, [viewMode]);

    // Keyboard shortcut handler for search (Ctrl/Cmd + K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
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
            id: 'anime' as ViewMode, label: 'Anime', icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm14.024-.983a1.125 1.125 0 0 1 0 1.966l-5.603 3.113A1.125 1.125 0 0 1 9 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113Z" clipRule="evenodd" />
                </svg>
            )
        },
        {
            id: 'manga' as ViewMode, label: 'Manga', icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
                </svg>
            )
        },
        {
            id: 'movies' as ViewMode, label: 'Movies', icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M19.5 6h-15v12h15V6zm-15-2h15a2 2 0 012 2v12a2 2 0 01-2 2h-15a2 2 0 01-2-2V6a2 2 0 012-2z" />
                    <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
            )
        },
    ];

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 py-3 sm:py-4">
                <div className="max-w-7xl mx-auto">
                    {/* Floating Glass Header */}
                    <div
                        className="rounded-2xl px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-6 border border-white/10"
                        style={{
                            background: 'rgba(10, 10, 10, 0.7)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                        }}
                    >
                        <div className="flex items-center gap-6">
                            {/* Logo */}
                            <button
                                onClick={() => onViewChange('home')}
                                className="flex items-center gap-2 sm:gap-3 group flex-shrink-0"
                            >
                                <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-miru-primary to-miru-accent flex items-center justify-center shadow-lg group-hover:shadow-miru-primary/30 transition-shadow duration-300">
                                    <img src="/miru-icon.svg" alt="Miru Logo" className="w-full h-full object-contain" />
                                </div>
                                <span className="text-xl sm:text-2xl font-black tracking-tight text-gradient hidden xs:block">MIRU</span>
                            </button>

                            {/* Desktop Navigation - Hidden on mobile */}
                            <div className="hidden md:flex items-center gap-6">
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
                        </div>

                        {/* Search + User Actions */}
                        <div className="flex items-center gap-2 sm:gap-4 flex-1 md:flex-none justify-end">
                            {/* Search - Compact on mobile */}
                            <form onSubmit={handleSubmit} className="flex-1 w-full sm:max-w-md relative">
                                <div className={`flex items-center transition-all duration-300 ${isSearchFocused ? 'scale-[1.02]' : ''}`}>
                                    {/* Search Type Selector */}
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setShowSearchTypeDropdown(!showSearchTypeDropdown)}
                                            className={`flex items-center gap-1.5 px-3 sm:px-3 py-2 sm:py-2.5 rounded-l-full text-xs sm:text-sm font-medium transition-all duration-300 border-r-0 ${isSearchFocused
                                                ? 'bg-white/15 border border-purple-500 text-white'
                                                : 'bg-white/10 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white'
                                                }`}
                                        >
                                            {searchTypeOptions.find(o => o.value === searchType)?.icon}
                                            <span className="hidden sm:inline">{searchTypeOptions.find(o => o.value === searchType)?.label}</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 opacity-60">
                                                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                                            </svg>
                                        </button>

                                        {/* Dropdown */}
                                        {showSearchTypeDropdown && (
                                            <div
                                                className="absolute top-full left-0 mt-1 w-32 rounded-xl bg-[#111] border border-white/10 shadow-xl z-50 overflow-hidden animate-fade-in"
                                                onMouseLeave={() => setShowSearchTypeDropdown(false)}
                                            >
                                                {searchTypeOptions.map(option => (
                                                    <button
                                                        key={option.value}
                                                        type="button"
                                                        onClick={() => {
                                                            setSearchType(option.value);
                                                            setShowSearchTypeDropdown(false);
                                                        }}
                                                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors ${searchType === option.value
                                                            ? 'bg-purple-500/20 text-purple-400'
                                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                                            }`}
                                                    >
                                                        {option.icon}
                                                        {option.label}
                                                        {searchType === option.value && (
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 ml-auto">
                                                                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Search Input */}
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            placeholder={getSearchPlaceholder()}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onFocus={() => setIsSearchFocused(true)}
                                            onBlur={() => {
                                                // Minor delay to allow clicks on dropdown items
                                                setTimeout(() => {
                                                    setIsSearchFocused(false);
                                                    setShowResultsDropdown(false);
                                                }, 200);
                                                // Delay closing dropdown to allow clicks
                                                setTimeout(() => setShowSearchTypeDropdown(false), 200);
                                            }}
                                            className={`w-full rounded-r-full px-3 sm:px-4 py-2 sm:py-2.5 pl-8 sm:pl-10 pr-3 sm:pr-14 text-xs sm:text-sm text-white placeholder-transparent sm:placeholder-gray-500 outline-none transition-all duration-300 ${isSearchFocused
                                                ? 'bg-white/15 border border-purple-500 ring-1 ring-purple-500 shadow-lg shadow-purple-500/20 border-l-0'
                                                : 'bg-white/10 border border-white/10 hover:border-white/20 border-l-0'
                                                }`}
                                        />
                                        {/* Search Icon */}
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={2}
                                            stroke="currentColor"
                                            className={`absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors duration-300 ${isSearchFocused ? 'text-purple-400' : 'text-gray-500'
                                                }`}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                        </svg>
                                        {/* Keyboard Shortcut Hint - Hidden on mobile */}
                                        <div className={`absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 transition-opacity duration-300 ${isSearchFocused ? 'opacity-0' : 'opacity-100'}`}>
                                            <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-white/10 rounded border border-white/10">
                                                ⌘K
                                            </kbd>
                                        </div>
                                    </div>
                                </div>

                                {/* Live Search Results Dropdown */}
                                {showResultsDropdown && (searchQuery.length >= 2) && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#111] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in max-h-[80vh] overflow-y-auto">
                                        {isSearching ? (
                                            <div className="p-4 text-center text-gray-400 text-sm">
                                                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                                Searching...
                                            </div>
                                        ) : searchResults.length > 0 ? (
                                            <div>
                                                {searchResults.map((item, index) => (
                                                    <div
                                                        key={`${item.type}-${item.id}-${index}`}
                                                        onClick={() => handleResultClick(item)}
                                                        className="flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 transition-colors"
                                                    >
                                                        <div className="w-10 h-14 bg-gray-800 rounded overflow-hidden flex-shrink-0">
                                                            <img
                                                                src={item.image}
                                                                alt={item.title}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    const target = e.target as HTMLImageElement;
                                                                    target.src = 'https://placehold.co/200x300/1a1a1a/ffffff?text=No+Cover';
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-sm font-medium text-white truncate">{item.title}</h4>
                                                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${item.type === 'anime' ? 'bg-purple-500/20 text-purple-400' :
                                                                    item.type === 'manga' ? 'bg-emerald-500/20 text-emerald-400' :
                                                                        'bg-blue-500/20 text-blue-400'
                                                                    }`}>
                                                                    {item.type.toUpperCase()}
                                                                </span>
                                                                {item.year && <span>{item.year}</span>}
                                                                {item.rating && item.rating > 0 && (
                                                                    <span className="flex items-center gap-1 text-yellow-500">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                                                                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                                                        </svg>
                                                                        {item.rating.toFixed(1)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() => {
                                                        onSearch(searchQuery, searchType);
                                                        setShowResultsDropdown(false);
                                                    }}
                                                    className="w-full p-3 text-center text-sm text-purple-400 hover:text-purple-300 hover:bg-white/5 transition-colors font-medium border-t border-white/10"
                                                >
                                                    View all results for "{searchQuery}"
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="p-4 text-center text-gray-400 text-sm">
                                                No results found
                                            </div>
                                        )}
                                    </div>
                                )}
                            </form>

                            {/* User Actions - Hidden on mobile, shown on md+ */}

                            <div className="hidden md:flex items-center gap-3">
                                {/* Notification Bell */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowNotifications(!showNotifications)}
                                        className="relative p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 group"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                                        </svg>
                                        {/* Notification Badge */}
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-xs font-bold bg-purple-500 text-white rounded-full">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </button>
                                    <NotificationDropdown
                                        isOpen={showNotifications}
                                        onClose={() => setShowNotifications(false)}
                                        onNavigate={(url) => {
                                            if (url.startsWith('/watch/')) {
                                                window.location.href = url;
                                            }
                                        }}
                                    />
                                </div>

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

                            {/* Mobile Menu Toggle - Visible only on mobile */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="md:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                                aria-label="Toggle menu"
                            >
                                {isMobileMenuOpen ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-400">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-400">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation Dropdown */}
                {isMobileMenuOpen && (
                    <div
                        className="md:hidden mt-2 rounded-xl border border-white/10 overflow-hidden animate-fade-in"
                        style={{
                            background: 'rgba(10, 10, 10, 0.95)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                        }}
                    >
                        {navItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onViewChange(item.id);
                                    setIsMobileMenuOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all border-b border-white/5 ${viewMode === item.id
                                    ? 'bg-miru-primary/20 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {item.icon}
                                {item.label}
                                {viewMode === item.id && (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 ml-auto text-miru-primary">
                                        <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                        ))}

                        {/* Divider */}
                        <div className="border-t border-white/10 my-1" />

                        {/* Notifications */}
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all border-b border-white/5"
                        >
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                                </svg>
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full"></span>
                            </div>
                            Notifications
                        </button>

                        {/* Profile / Sign In */}
                        {currentUser ? (
                            <button
                                onClick={() => {
                                    onViewChange('profile');
                                    setIsMobileMenuOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all ${viewMode === 'profile'
                                    ? 'bg-miru-primary/20 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <div className="w-6 h-6 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                    {currentUser.photoURL ? (
                                        <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-white font-bold text-xs">
                                            {currentUser.displayName?.charAt(0) || 'U'}
                                        </span>
                                    )}
                                </div>
                                {currentUser.displayName || 'Profile'}
                                {viewMode === 'profile' && (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 ml-auto text-miru-primary">
                                        <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    setShowLoginModal(true);
                                    setIsMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-all"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                                </svg>
                                Sign In
                            </button>
                        )}
                    </div>
                )}
            </nav>

            {/* Login Modal */}
            <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
        </>
    );
};

export default Navbar;
