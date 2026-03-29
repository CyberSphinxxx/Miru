import axios from 'axios';

const ANILIST_API_URL = 'https://graphql.anilist.co';

// Central AniList API Client with required headers
const anilistClient = axios.create({
    baseURL: ANILIST_API_URL,
    timeout: 30000, 
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Miru/2.0.0 (https://github.com/CyberSphinxxx/Miru)'
    }
});


// Common media fields fragment
const MEDIA_FIELDS = `
    id
    idMal
    title {
        romaji
        english
        native
    }
    description
    bannerImage
    coverImage {
        extraLarge
        large
    }
    format
    episodes
    chapters
    volumes
    duration
    status
    season
    seasonYear
    startDate {
        year
        month
        day
    }
    endDate {
        year
        month
        day
    }
    averageScore
    meanScore
    popularity
    genres
    studios(isMain: true) {
        nodes {
            name
        }
    }
    isAdult
    nextAiringEpisode {
        episode
        airingAt
    }
    streamingEpisodes {
        title
        thumbnail
        url
        site
    }
`;

export const anilistService = {
    async getCoverImages(malIds: number[]) {
        const query = `
            query ($idMal: [Int]) {
                Page {
                    media(idMal_in: $idMal, type: ANIME) {
                        idMal
                        bannerImage
                        coverImage {
                            extraLarge
                            large
                        }
                    }
                }
            }
        `;

        try {
            const response = await anilistClient.post('', {
                query,
                variables: { idMal: malIds }
            });

            return response.data.data.Page.media;
        } catch (error) {
            console.error('Error fetching AniList images:', error);
            return [];
        }
    },

    async getTrendingAnime(page: number = 1, perPage: number = 10) {
        const query = `
            query ($page: Int, $perPage: Int) {
                Page(page: $page, perPage: $perPage) {
                    pageInfo {
                        total
                        currentPage
                        lastPage
                        hasNextPage
                    }
                    media(type: ANIME, sort: TRENDING_DESC) {
                        ${MEDIA_FIELDS}
                    }
                }
            }
        `;

        try {
            const response = await anilistClient.post('', {
                query,
                variables: { page, perPage }
            });
            return response.data.data.Page;
        } catch (error) {
            console.error('Error fetching trending anime:', error);
            return { media: [], pageInfo: {} };
        }
    },

    async getPopularThisSeason(page: number = 1, perPage: number = 10) {
        // Get current season and year
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        let season: string;
        if (month >= 1 && month <= 3) season = 'WINTER';
        else if (month >= 4 && month <= 6) season = 'SPRING';
        else if (month >= 7 && month <= 9) season = 'SUMMER';
        else season = 'FALL';

        const query = `
            query ($page: Int, $perPage: Int, $season: MediaSeason, $seasonYear: Int) {
                Page(page: $page, perPage: $perPage) {
                    pageInfo {
                        total
                        currentPage
                        lastPage
                        hasNextPage
                    }
                    media(type: ANIME, season: $season, seasonYear: $seasonYear, sort: POPULARITY_DESC) {
                        ${MEDIA_FIELDS}
                    }
                }
            }
        `;

        try {
            const response = await anilistClient.post('', {
                query,
                variables: { page, perPage, season, seasonYear: year }
            });
            return response.data.data.Page;
        } catch (error) {
            console.error('Error fetching popular this season:', error);
            return { media: [], pageInfo: {} };
        }
    },

    async getTopAnime(page: number = 1, perPage: number = 24) {
        const query = `
            query ($page: Int, $perPage: Int) {
                Page(page: $page, perPage: $perPage) {
                    pageInfo {
                        total
                        currentPage
                        lastPage
                        hasNextPage
                    }
                    media(type: ANIME, sort: POPULARITY_DESC) {
                        ${MEDIA_FIELDS}
                    }
                }
            }
        `;

        try {
            const response = await anilistClient.post('', {
                query,
                variables: { page, perPage }
            });
            return response.data.data.Page;
        } catch (error) {
            console.error('Error fetching top anime:', error);
            throw error; // Propagate error to route handler
        }
    },

    async getTopManga(page: number = 1, perPage: number = 24) {
        const query = `
            query ($page: Int, $perPage: Int) {
                Page(page: $page, perPage: $perPage) {
                    pageInfo {
                        total
                        currentPage
                        lastPage
                        hasNextPage
                    }
                    media(type: MANGA, sort: POPULARITY_DESC) {
                        ${MEDIA_FIELDS}
                    }
                }
            }
        `;

        try {
            const response = await anilistClient.post('', {
                query,
                variables: { page, perPage }
            });
            return response.data.data.Page;
        } catch (error) {
            console.error('Error fetching top manga:', error);
            return { media: [], pageInfo: {} };
        }
    },

    async searchAnime(search: string, page: number = 1, perPage: number = 24) {
        const query = `
            query ($search: String, $page: Int, $perPage: Int) {
                Page(page: $page, perPage: $perPage) {
                    pageInfo {
                        total
                        currentPage
                        lastPage
                        hasNextPage
                    }
                    media(search: $search, type: ANIME, sort: SEARCH_MATCH, isAdult: false) {
                        ${MEDIA_FIELDS}
                    }
                }
            }
        `;

        try {
            const response = await anilistClient.post('', {
                query,
                variables: { search, page, perPage }
            });

            const pageData = response.data.data.Page;
            // Recalculate lastPage to ensure it matches the actual perPage limit
            if (pageData.pageInfo && pageData.pageInfo.total) {
                pageData.pageInfo.lastPage = Math.ceil(pageData.pageInfo.total / perPage);
                // Also ensure hasNextPage is accurate
                pageData.pageInfo.hasNextPage = page < pageData.pageInfo.lastPage;
            }

            return pageData;
        } catch (error) {
            console.error('Error searching AniList:', error);
            return { media: [], pageInfo: {} };
        }
    },

    async searchManga(search: string, page: number = 1, perPage: number = 24) {
        const query = `
            query ($search: String, $page: Int, $perPage: Int) {
                Page(page: $page, perPage: $perPage) {
                    pageInfo {
                        total
                        currentPage
                        lastPage
                        hasNextPage
                    }
                    media(search: $search, type: MANGA, sort: SEARCH_MATCH) {
                        ${MEDIA_FIELDS}
                    }
                }
            }
        `;

        try {
            const response = await anilistClient.post('', {
                query,
                variables: { search, page, perPage }
            });

            return response.data.data.Page;
        } catch (error) {
            console.error('Error searching manga:', error);
            return { media: [], pageInfo: {} };
        }
    },

    async getImmediateRelations(id: number) {
        const query = `
            query ($id: Int) {
                Media(id: $id, type: ANIME) {
                    relations {
                        edges {
                            relationType
                            node {
                                id
                                title { romaji english native }
                                description
                                coverImage { large }
                                bannerImage
                                format
                                episodes
                                status
                                averageScore
                                genres
                                season
                                seasonYear
                                startDate { year month day }
                            }
                        }
                    }
                }
            }
        `;
        try {
            const response = await anilistClient.post('', {
                query,
                variables: { id }
            });
            return response.data.data.Media.relations.edges;
        } catch (error) {
            console.error(`Error fetching relations for ID ${id}:`, error);
            return [];
        }
    },

    async getAnimeById(id: number) {
        const query = `
            query ($id: Int) {
                Media(id: $id, type: ANIME) {
                    ${MEDIA_FIELDS}
                    relations {
                        edges {
                            relationType
                            node {
                                id
                                title { romaji english native }
                                description
                                coverImage { large }
                                bannerImage
                                format
                                episodes
                                status
                                averageScore
                                genres
                                season
                                seasonYear
                                startDate { year month day }
                            }
                        }
                    }
                    recommendations(perPage: 6) {
                        nodes {
                            mediaRecommendation {
                                id
                                title { romaji english }
                                coverImage { large extraLarge }
                            }
                        }
                    }
                    trailer {
                        id
                        site
                        thumbnail
                    }
                    characters(sort: [ROLE, RELEVANCE, ID], perPage: 12) {
                        edges {
                            role
                            node {
                                id
                                name { full }
                                image { large }
                            }
                            voiceActors(language: JAPANESE, sort: [RELEVANCE, ID]) {
                                id
                                name { full }
                                image { large }
                                languageV2
                            }
                        }
                    }
                }
            }
        `;

        // Retry logic with exponential backoff
        const maxRetries = 3;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await anilistClient.post('', {
                    query,
                    variables: { id }
                });

                const media = response.data.data.Media;

                // Recursive relation discovery for seasons/sequels
                if (media.relations?.edges) {
                    const visited = new Set<number>();
                    visited.add(id);
                    const allRelations = [...media.relations.edges];

                    // Add initial relations to visited
                    media.relations.edges.forEach((edge: any) => {
                        visited.add(edge.node.id);
                    });

                    // Level-based discovery
                    let currentLevel = media.relations.edges
                        .filter((edge: any) => edge.relationType === 'PREQUEL' || edge.relationType === 'SEQUEL')
                        .map((edge: any) => edge.node.id);

                    const MAX_DEPTH = 3;
                    const MAX_NODES = 20;
                    let depth = 1;

                    while (currentLevel.length > 0 && depth < MAX_DEPTH && visited.size < MAX_NODES) {
                        // Parallel fetch for current level
                        const results = await Promise.all(
                            currentLevel.map((nodeId: number) => this.getImmediateRelations(nodeId))
                        );

                        const nextLevel: number[] = [];
                        for (const nextRelations of results) {
                            for (const edge of nextRelations) {
                                if (!visited.has(edge.node.id)) {
                                    visited.add(edge.node.id);
                                    allRelations.push(edge);
                                    if (edge.relationType === 'PREQUEL' || edge.relationType === 'SEQUEL') {
                                        nextLevel.push(edge.node.id);
                                    }
                                    if (visited.size >= MAX_NODES) break;
                                }
                            }
                            if (visited.size >= MAX_NODES) break;
                        }
                        currentLevel = nextLevel;
                        depth++;
                    }
                    media.relations.edges = allRelations;
                }

                return media;
            } catch (error: any) {
                console.error(`Attempt ${attempt} failed for anime ID ${id}:`, error.message);

                // If it's the last attempt or not a retryable error, give up
                if (attempt === maxRetries || (error.response && error.response.status < 500)) {
                    console.error('Error fetching anime by ID:', error);
                    return null;
                }

                // Wait before retrying (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
        return null;
    },

    async getMangaById(id: number) {
        const query = `
            query ($id: Int) {
                Media(id: $id, type: MANGA) {
                    ${MEDIA_FIELDS}
                }
            }
        `;

        try {
            const response = await anilistClient.post('', {
                query,
                variables: { id }
            });

            return response.data.data.Media;
        } catch (error) {
            console.error('Error fetching manga by ID:', error);
            return null;
        }
    }
    ,
    async getAnimeByGenre(genre: string, page: number = 1, perPage: number = 24) {
        const STANDARD_GENRES = [
            'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy', 'Horror',
            'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 'Psychological', 'Romance',
            'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller'
        ];

        const isGenre = STANDARD_GENRES.includes(genre);
        const variableName = isGenre ? 'genre' : 'tag';

        const query = `
            query ($${variableName}: String, $page: Int, $perPage: Int) {
                Page(page: $page, perPage: $perPage) {
                    pageInfo {
                        total
                        currentPage
                        lastPage
                        hasNextPage
                    }
                    media(${variableName}: $${variableName}, type: ANIME, sort: POPULARITY_DESC) {
                        ${MEDIA_FIELDS}
                    }
                }
            }
        `;

        try {
            const variables: any = { page, perPage };
            variables[variableName] = genre;

            const response = await anilistClient.post('', {
                query,
                variables
            });
            return response.data.data.Page;
        } catch (error) {
            console.error('Error fetching anime by genre/tag:', error);
            return { media: [], pageInfo: {} };
        }
    },

    async getAiringSchedule(startTime: number, endTime: number, page: number = 1, perPage: number = 50) {
        const query = `
            query ($airingAt_greater: Int, $airingAt_lesser: Int, $page: Int, $perPage: Int) {
                Page(page: $page, perPage: $perPage) {
                    pageInfo {
                        total
                        currentPage
                        lastPage
                        hasNextPage
                    }
                    airingSchedules(airingAt_greater: $airingAt_greater, airingAt_lesser: $airingAt_lesser, sort: TIME) {
                        id
                        airingAt
                        episode
                        media {
                            id
                            idMal
                            title {
                                romaji
                                english
                                native
                            }
                            coverImage {
                                large
                            }
                            format
                            status
                            isAdult
                        }
                    }
                }
            }
        `;

        try {
            const response = await anilistClient.post('', {
                query,
                variables: {
                    airingAt_greater: startTime,
                    airingAt_lesser: endTime,
                    page,
                    perPage
                }
            });
            return response.data.data.Page;
        } catch (error) {
            console.error('Error fetching airing schedule:', error);
            return { airingSchedules: [], pageInfo: {} };
        }
    }
};
