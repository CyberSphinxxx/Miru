export type ViewMode = 'home' | 'anime' | 'manga' | 'movies' | 'detail' | 'watch' | 'profile' | 'settings';
export type SearchType = 'all' | 'anime' | 'manga' | 'movies';

export interface SearchResultItem {
    id: number | string;
    title: string;
    image: string;
    type: 'anime' | 'manga' | 'movie';
    year?: string | number;
    rating?: number;
}
