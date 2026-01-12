import { StreamLink } from '../types';

const LOCAL_API_BASE = 'http://localhost:3001/api/scraper';

export interface LocalAnimeResult {
    id: string;
    session: string;
    title: string;
    url: string;
    poster?: string;
    status?: string;
    type?: string;
    episodes?: number;
    year?: string;
    score?: string;
}

export interface LocalEpisode {
    id: string;
    session: string;
    episodeNumber: number;
    url: string;
    title?: string;
    duration?: string;
    snapshot?: string;
}

export const searchLocalAnime = async (query: string): Promise<LocalAnimeResult[]> => {
    try {
        const response = await fetch(`${LOCAL_API_BASE}/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Local search failed');
        return await response.json();
    } catch (error) {
        console.error('Error searching local anime:', error);
        return [];
    }
};

export const getLocalEpisodes = async (session: string, page: number = 1): Promise<{ episodes: LocalEpisode[], lastPage: number }> => {
    try {
        const response = await fetch(`${LOCAL_API_BASE}/episodes?session=${session}&page=${page}`);
        if (!response.ok) throw new Error('Local episodes fetch failed');
        return await response.json();
    } catch (error) {
        console.error('Error fetching local episodes:', error);
        return { episodes: [], lastPage: 1 };
    }
};

export const getLocalStreams = async (animeSession: string, epSession: string): Promise<StreamLink[]> => {
    try {
        const response = await fetch(`${LOCAL_API_BASE}/streams?anime_session=${animeSession}&ep_session=${epSession}`);
        if (!response.ok) throw new Error('Local streams fetch failed');
        return await response.json();
    } catch (error) {
        console.error('Error fetching local streams:', error);
        return [];
    }
};
