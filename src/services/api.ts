/**
 * AniList API Service (Yorumi Architecture)
 * 
 * This module provides functions to interact with the AniList GraphQL API
 * and AnimePahe scraper, matching Yorumi's implementation.
 * 
 * NOTE: This file serves as a barrel export for backward compatibility.
 * New code should import directly from './api/index' or specific modules.
 */

// Re-export everything from the modular API structure
export * from './api/index';

// Types that were previously exported from here
export type { Anime, Episode, StreamLink, Character, Recommendation, Genre } from '../types';
