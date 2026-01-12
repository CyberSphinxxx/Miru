/**
 * Genre Data
 * 
 * Comprehensive list of anime genres.
 * Covers all standard anime categories from MAL/Anilist (Jikan v4 IDs).
 */

import { Genre } from '../../types';

/**
 * Complete list of anime genres
 * Includes all standard genres supported by anime databases
 */
const GENRES: Genre[] = [
    { mal_id: 1, name: 'Action', count: 4800 },
    { mal_id: 2, name: 'Adventure', count: 4500 },
    { mal_id: 5, name: 'Avant Garde', count: 1000 },
    { mal_id: 46, name: 'Award Winning', count: 250 },
    { mal_id: 28, name: 'Boys Love', count: 200 },
    { mal_id: 4, name: 'Comedy', count: 7900 },
    { mal_id: 8, name: 'Drama', count: 3100 },
    { mal_id: 10, name: 'Fantasy', count: 6000 },
    { mal_id: 26, name: 'Girls Love', count: 120 },
    { mal_id: 47, name: 'Gourmet', count: 240 },
    { mal_id: 14, name: 'Horror', count: 600 },
    { mal_id: 7, name: 'Mystery', count: 1000 },
    { mal_id: 22, name: 'Romance', count: 2200 },
    { mal_id: 24, name: 'Sci-Fi', count: 3500 },
    { mal_id: 36, name: 'Slice of Life', count: 1250 },
    { mal_id: 30, name: 'Sports', count: 800 },
    { mal_id: 37, name: 'Supernatural', count: 1500 },
    { mal_id: 41, name: 'Suspense', count: 460 },
    { mal_id: 9, name: 'Ecchi', count: 800 },
    { mal_id: 49, name: 'Erotica', count: 80 },
    { mal_id: 12, name: 'Hentai', count: 1600 },
    { mal_id: 50, name: 'Adult Cast', count: 760 },
    { mal_id: 51, name: 'Anthropomorphic', count: 1300 },
    { mal_id: 52, name: 'CGDCT', count: 260 },
    { mal_id: 53, name: 'Childcare', count: 70 },
    { mal_id: 54, name: 'Combat Sports', count: 100 },
    { mal_id: 81, name: 'Crossdressing', count: 60 },
    { mal_id: 55, name: 'Delinquents', count: 80 },
    { mal_id: 39, name: 'Detective', count: 250 },
    { mal_id: 56, name: 'Educational', count: 340 },
    { mal_id: 57, name: 'Gag Humor', count: 310 },
    { mal_id: 58, name: 'Gore', count: 270 },
    { mal_id: 35, name: 'Harem', count: 490 },
    { mal_id: 59, name: 'High Stakes Game', count: 60 },
    { mal_id: 13, name: 'Historical', count: 1800 },
    { mal_id: 60, name: 'Idols (Female)', count: 390 },
    { mal_id: 61, name: 'Idols (Male)', count: 170 },
    { mal_id: 62, name: 'Isekai', count: 470 },
    { mal_id: 63, name: 'Iyashikei', count: 180 },
    { mal_id: 64, name: 'Love Polygon', count: 110 },
    { mal_id: 65, name: 'Magical Sex Shift', count: 30 },
    { mal_id: 66, name: 'Mahou Shoujo', count: 360 },
    { mal_id: 17, name: 'Martial Arts', count: 750 },
    { mal_id: 18, name: 'Mecha', count: 1350 },
    { mal_id: 67, name: 'Medical', count: 50 },
    { mal_id: 38, name: 'Military', count: 740 },
    { mal_id: 19, name: 'Music', count: 5300 }, // Note: This includes general music entries
    { mal_id: 6, name: 'Mythology', count: 550 },
    { mal_id: 68, name: 'Organized Crime', count: 110 },
    { mal_id: 69, name: 'Otaku Culture', count: 110 },
    { mal_id: 20, name: 'Parody', count: 810 },
    { mal_id: 70, name: 'Performing Arts', count: 150 },
    { mal_id: 71, name: 'Pets', count: 140 },
    { mal_id: 40, name: 'Psychological', count: 460 },
    { mal_id: 3, name: 'Racing', count: 230 },
    { mal_id: 72, name: 'Reincarnation', count: 160 },
    { mal_id: 73, name: 'Reverse Harem', count: 80 },
    { mal_id: 74, name: 'Love Status Quo', count: 40 },
    { mal_id: 21, name: 'Samurai', count: 250 },
    { mal_id: 23, name: 'School', count: 2200 },
    { mal_id: 75, name: 'Showbiz', count: 50 },
    { mal_id: 29, name: 'Space', count: 680 },
    { mal_id: 11, name: 'Strategy Game', count: 340 },
    { mal_id: 31, name: 'Super Power', count: 740 },
    { mal_id: 76, name: 'Survival', count: 80 },
    { mal_id: 77, name: 'Team Sports', count: 330 },
    { mal_id: 78, name: 'Time Travel', count: 170 },
    { mal_id: 32, name: 'Vampire', count: 180 },
    { mal_id: 79, name: 'Video Game', count: 170 },
    { mal_id: 80, name: 'Visual Arts', count: 100 },
    { mal_id: 48, name: 'Workplace', count: 230 },
    { mal_id: 82, name: 'Urban Fantasy', count: 230 },
    { mal_id: 83, name: 'Villainess', count: 30 },
    // Demographics
    { mal_id: 43, name: 'Josei', count: 160 },
    { mal_id: 15, name: 'Kids', count: 2400 }, // Approximate adjusted
    { mal_id: 42, name: 'Seinen', count: 1150 },
    { mal_id: 25, name: 'Shoujo', count: 520 },
    { mal_id: 27, name: 'Shounen', count: 2200 },
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
