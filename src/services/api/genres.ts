/**
 * Genre Data
 * 
 * Static genre list based on Anilist genres.
 * Consumet doesn't have a direct genres endpoint, so we provide a static list.
 */

import { Genre } from '../../types';

/**
 * Available anime genres
 * These match the genres supported by Anilist/Consumet API
 */
const GENRES: Genre[] = [
    { mal_id: 1, name: 'Action', count: 5000 },
    { mal_id: 2, name: 'Adventure', count: 4000 },
    { mal_id: 3, name: 'Comedy', count: 6000 },
    { mal_id: 4, name: 'Drama', count: 5500 },
    { mal_id: 5, name: 'Ecchi', count: 1500 },
    { mal_id: 6, name: 'Fantasy', count: 4500 },
    { mal_id: 7, name: 'Horror', count: 800 },
    { mal_id: 8, name: 'Mahou Shoujo', count: 600 },
    { mal_id: 9, name: 'Mecha', count: 1200 },
    { mal_id: 10, name: 'Music', count: 700 },
    { mal_id: 11, name: 'Mystery', count: 1800 },
    { mal_id: 12, name: 'Psychological', count: 1400 },
    { mal_id: 13, name: 'Romance', count: 5000 },
    { mal_id: 14, name: 'Sci-Fi', count: 2500 },
    { mal_id: 15, name: 'Slice of Life', count: 3500 },
    { mal_id: 16, name: 'Sports', count: 1000 },
    { mal_id: 17, name: 'Supernatural', count: 2800 },
    { mal_id: 18, name: 'Thriller', count: 900 },
];

/**
 * Get all available genres
 */
export function getGenres(): Genre[] {
    return [...GENRES]; // Return a copy to prevent mutation
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
