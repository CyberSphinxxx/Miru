/**
 * Consumet API Service
 * 
 * This module provides functions to interact with the Consumet API
 * and transforms responses to match the existing Miru type definitions.
 * 
 * NOTE: This file now serves as a barrel export for backward compatibility.
 * New code should import directly from './api/index' or specific modules.
 */

// Re-export everything from the modular API structure
export * from './api/index';

// Types that were previously exported from here
export type { Anime, Episode, StreamLink, Character, Recommendation, Genre } from '../types';

