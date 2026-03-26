import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../hooks/useSearch';
import { SearchType, SearchResultItem } from '../types';
import { searchTypeOptions } from '../constants';

interface SearchBarProps {
    onSearch: (query: string, type?: SearchType) => void;
    setIsMobileMenuOpen: (isOpen: boolean) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, setIsMobileMenuOpen }) => {
    const navigate = useNavigate();
    const {
        searchQuery, setSearchQuery,
        isSearchFocused, setIsSearchFocused,
        searchType, setSearchType,
        showSearchTypeDropdown, setShowSearchTypeDropdown,
        searchResults,
        isSearching,
        showResultsDropdown, setShowResultsDropdown,
        getSearchPlaceholder
    } = useSearch();

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

    return (
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
                            setTimeout(() => {
                                setIsSearchFocused(false);
                                setShowResultsDropdown(false);
                            }, 200);
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
    );
};

export default SearchBar;
