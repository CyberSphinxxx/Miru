export interface ScraperManga {
    id: string;
    title: string;
    url: string;
    thumbnail: string;
    source: string;
}

export interface Chapter {
    id: string;
    title: string;
    url: string;
    uploadDate?: string;
}

export interface Page {
    pageNumber: number;
    imageUrl: string;
}
