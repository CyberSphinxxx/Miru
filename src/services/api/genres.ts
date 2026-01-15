/**
 * Genre Data
 * 
 * Comprehensive list of anime genres.
 * Covers all standard anime categories from AniList.
 */

import { Genre } from '../../types';

/**
 * Complete list of anime genres
 * Includes all standard genres supported by anime databases
 */
const GENRES: Genre[] = [
    { mal_id: 1, name: 'Action', count: 0 },
    { mal_id: 2, name: 'Adventure', count: 0 },
    { mal_id: 4, name: 'Comedy', count: 0 },
    { mal_id: 8, name: 'Drama', count: 0 },
    { mal_id: 9, name: 'Ecchi', count: 0 },
    { mal_id: 10, name: 'Fantasy', count: 0 },
    { mal_id: 14, name: 'Horror', count: 0 },
    { mal_id: 66, name: 'Mahou Shoujo', count: 0 },
    { mal_id: 18, name: 'Mecha', count: 0 },
    { mal_id: 19, name: 'Music', count: 0 },
    { mal_id: 7, name: 'Mystery', count: 0 },
    { mal_id: 40, name: 'Psychological', count: 0 },
    { mal_id: 22, name: 'Romance', count: 0 },
    { mal_id: 24, name: 'Sci-Fi', count: 0 },
    { mal_id: 36, name: 'Slice of Life', count: 0 },
    { mal_id: 30, name: 'Sports', count: 0 },
    { mal_id: 37, name: 'Supernatural', count: 0 },
    { mal_id: 41, name: 'Thriller', count: 0 },
    { mal_id: 62, name: 'Isekai', count: 0 },
    { mal_id: 63, name: 'Iyashikei', count: 0 }
];

/**
 * Get all available genres
 */
export function getGenres(): Genre[] {
    // Sort alphabetically for better display
    return [...GENRES].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get a genre by ID
 */
export function getGenreById(id: number): Genre | undefined {
    return GENRES.find((g) => g.mal_id === id);
}

/**
 * Get a genre by name
 */
export function getGenreByName(name: string): Genre | undefined {
    return GENRES.find((g) => g.name.toLowerCase() === name.toLowerCase());
}
