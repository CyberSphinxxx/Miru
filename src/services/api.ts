import { Character, RelatedAnime, PromoVideo, Recommendation } from '../types';

const API_BASE = 'http://localhost:3001/api';

export const getAnimeExtraDetails = async (id: number) => {
    try {
        const [charactersRes, relationsRes, videosRes, recommendationsRes] = await Promise.all([
            fetch(`${API_BASE}/jikan/anime/${id}/characters`),
            fetch(`${API_BASE}/jikan/anime/${id}/relations`),
            fetch(`${API_BASE}/jikan/anime/${id}/videos`),
            fetch(`${API_BASE}/jikan/anime/${id}/recommendations`)
        ]);

        const charactersData = await charactersRes.json();
        const relationsData = await relationsRes.json();
        const videosData = await videosRes.json();
        const recommendationsData = await recommendationsRes.json();

        return {
            characters: (charactersData.data || []) as Character[],
            relations: (relationsData.data || []) as RelatedAnime[],
            videos: (videosData.data?.promo || []) as PromoVideo[], // Jikan returns { promo: [], episodes: [], ... }
            recommendations: (recommendationsData.data || []) as Recommendation[],
            similar: [] as any[] // Placeholder, will be populated if genres are passed
        };
    } catch (error) {
        console.error('Error fetching extra details:', error);
        return {
            characters: [],
            relations: [],
            videos: [],
            recommendations: [],
            similar: []
        };
    }
};

export const getSimilarAnime = async (genres: { mal_id: number }[]) => {
    if (!genres || genres.length === 0) return [];
    try {
        // Use the first genre to find similar anime
        const genreId = genres[0].mal_id;
        const res = await fetch(`${API_BASE}/jikan/genres/${genreId}?page=1&limit=12`);
        const data = await res.json();
        return (data.data || []);
    } catch (error) {
        console.error('Error fetching similar anime:', error);
        return [];
    }
};

export const clearSearchCache = () => {
    // Placeholder if needed, or remove if truly unused
};
