/**
 * Genre Data
 * 
 * Comprehensive list of anime genres.
 * Covers all standard anime categories from MAL/Anilist.
 */

import { Genre } from '../../types';

/**
 * Complete list of anime genres
 * Includes all standard genres supported by anime databases
 */
const GENRES: Genre[] = [
    { mal_id: 1, name: 'Action', count: 5000 },
    { mal_id: 2, name: 'Adventure', count: 4000 },
    { mal_id: 3, name: 'Cars', count: 150 },
    { mal_id: 4, name: 'Comedy', count: 6000 },
    { mal_id: 5, name: 'Dementia', count: 80 },
    { mal_id: 6, name: 'Demons', count: 650 },
    { mal_id: 7, name: 'Drama', count: 5500 },
    { mal_id: 8, name: 'Ecchi', count: 1500 },
    { mal_id: 9, name: 'Fantasy', count: 4500 },
    { mal_id: 10, name: 'Game', count: 400 },
    { mal_id: 11, name: 'Harem', count: 600 },
    { mal_id: 12, name: 'Historical', count: 1200 },
    { mal_id: 13, name: 'Horror', count: 800 },
    { mal_id: 62, name: 'Isekai', count: 900 },
    { mal_id: 15, name: 'Josei', count: 350 },
    { mal_id: 16, name: 'Kids', count: 1800 },
    { mal_id: 17, name: 'Magic', count: 1500 },
    { mal_id: 18, name: 'Martial Arts', count: 700 },
    { mal_id: 19, name: 'Mecha', count: 1200 },
    { mal_id: 20, name: 'Military', count: 500 },
    { mal_id: 21, name: 'Music', count: 700 },
    { mal_id: 22, name: 'Mystery', count: 1800 },
    { mal_id: 23, name: 'Parody', count: 550 },
    { mal_id: 24, name: 'Police', count: 300 },
    { mal_id: 25, name: 'Psychological', count: 1400 },
    { mal_id: 26, name: 'Romance', count: 5000 },
    { mal_id: 27, name: 'Samurai', count: 250 },
    { mal_id: 28, name: 'School', count: 2800 },
    { mal_id: 29, name: 'Sci-Fi', count: 2500 },
    { mal_id: 30, name: 'Seinen', count: 1200 },
    { mal_id: 31, name: 'Shoujo', count: 1800 },
    { mal_id: 32, name: 'Shoujo Ai', count: 180 },
    { mal_id: 33, name: 'Shounen', count: 2500 },
    { mal_id: 34, name: 'Shounen Ai', count: 150 },
    { mal_id: 35, name: 'Slice of Life', count: 3500 },
    { mal_id: 36, name: 'Space', count: 450 },
    { mal_id: 37, name: 'Sports', count: 1000 },
    { mal_id: 38, name: 'Super Power', count: 800 },
    { mal_id: 39, name: 'Supernatural', count: 2800 },
    { mal_id: 40, name: 'Thriller', count: 900 },
    { mal_id: 41, name: 'Vampire', count: 200 },
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
