import axios from 'axios';

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';

const apiClient = axios.create({
    baseURL: JIKAN_BASE_URL,
    timeout: 10000
});

export const searchAnime = async (query: string, page: number = 1, limit: number = 24) => {
    try {
        const response = await apiClient.get('/anime', {
            params: { q: query, page, limit }
        });
        return response.data;
    } catch (error) {
        console.error('Error searching anime:', error);
        throw error;
    }
};

export const getAnimeById = async (id: number) => {
    try {
        const response = await apiClient.get(`/anime/${id}/full`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching anime with ID ${id}:`, error);
        throw error;
    }
};

export const getTopAnime = async (page: number = 1, limit: number = 24) => {
    try {
        const response = await apiClient.get('/top/anime', {
            params: { page, limit }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching top anime:', error);
        throw error;
    }
};
