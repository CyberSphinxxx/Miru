import { useState, useRef, useEffect } from 'react';
import { animeService, mangaService, movieService } from '../../../services/api';
import { Anime } from '../../../types';
import { Manga } from '../../../types/manga';
import { Movie } from '../../../types/tmdb';
import { SearchType, SearchResultItem } from '../types';

export function useSearch() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [searchType, setSearchType] = useState<SearchType>('all');
    const [showSearchTypeDropdown, setShowSearchTypeDropdown] = useState(false);
    
    // Live Search State
    const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResultsDropdown, setShowResultsDropdown] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

    const getSearchPlaceholder = () => {
        switch (searchType) {
            case 'anime': return 'Search anime...';
            case 'manga': return 'Search manga...';
            case 'movies': return 'Search movies...';
            default: return 'Search anime, manga & movies...';
        }
    };

    return {
        searchQuery, setSearchQuery,
        isSearchFocused, setIsSearchFocused,
        searchType, setSearchType,
        showSearchTypeDropdown, setShowSearchTypeDropdown,
        searchResults,
        isSearching, setIsSearching,
        showResultsDropdown, setShowResultsDropdown,
        getSearchPlaceholder
    };
}
