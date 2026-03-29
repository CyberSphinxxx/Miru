import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AnimeDetailPage from './AnimeDetailPage';
import DetailPageSkeleton from '../../components/DetailPageSkeleton';
import { animeService, findBestScraperMatch, groupRelations } from '../../services/api';
import { Anime, Character, RelatedAnime, PromoVideo, Recommendation } from '../../types';

function Detail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // State
    const [anime, setAnime] = useState<Anime | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Extra details state
    const [characters, setCharacters] = useState<Character[]>([]);
    const [relations, setRelations] = useState<RelatedAnime[]>([]);
    const [videos, setVideos] = useState<PromoVideo[]>([]);
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [similar, setSimilar] = useState<Anime[]>([]);
    const [extrasLoading, setExtrasLoading] = useState(true);

    // Episode state (lifted from AnimeDetailPage)
    const [episodes, setEpisodes] = useState<any[]>([]);
    const [episodesLoading, setEpisodesLoading] = useState(true);

    // Track if we've started scraper fetch
    const scraperFetchStarted = useRef(false);

    // PHASE 1: Fast initial load (AniList only - ~1-2 sec)
    useEffect(() => {
        const fetchAnimeBasicInfo = async () => {
            if (!id) return;

            try {
                setLoading(true);
                setExtrasLoading(true);
                setEpisodesLoading(true); // Reset episode loading
                setEpisodes([]); // Clear old episodes
                setError(null);
                scraperFetchStarted.current = false;

                // FAST: Get anime details from AniList only
                const result = await animeService.getAnimeDetails(Number(id));

                if (result.data) {
                    const animeData = result.data;
                    setAnime(animeData);

                    // Extract characters from AniList response
                    setCharacters(animeData.characters?.edges?.map((c: any) => ({
                        character: {
                            id: c.node.id,
                            name: c.node.name.full,
                            images: { jpg: { image_url: c.node.image?.large || '' } },
                            url: ''
                        },
                        role: c.role,
                        voice_actors: c.voiceActors?.map((va: any) => ({
                            person: {
                                id: va.id,
                                name: va.name.full,
                                images: { jpg: { image_url: va.image?.large || '' } },
                                url: ''
                            },
                            language: va.languageV2
                        })) || []
                    })) || []);

                    // Extract recommendations - filter out entries with missing data
                    setRecommendations(animeData.recommendations?.nodes
                        ?.filter((r: any) => r.mediaRecommendation?.id && r.mediaRecommendation?.coverImage?.large)
                        ?.map((r: any) => ({
                            entry: {
                                id: r.mediaRecommendation?.id,
                                title: r.mediaRecommendation?.title?.english || r.mediaRecommendation?.title?.romaji,
                                images: {
                                    jpg: {
                                        image_url: r.mediaRecommendation?.coverImage?.large || '',
                                        large_image_url: r.mediaRecommendation?.coverImage?.extraLarge || r.mediaRecommendation?.coverImage?.large || ''
                                    }
                                },
                                url: ''
                            },
                            votes: 0,
                            url: ''
                        })) || []);

                    // Create video entry from trailer if available
                    if (animeData.trailer?.youtube_id) {
                        setVideos([{
                            title: 'Trailer',
                            trailer: {
                                youtube_id: animeData.trailer.youtube_id,
                                url: animeData.trailer.url || `https://www.youtube.com/watch?v=${animeData.trailer.youtube_id}`,
                                embed_url: animeData.trailer.embed_url || `https://www.youtube.com/embed/${animeData.trailer.youtube_id}`,
                                images: {
                                    image_url: `https://img.youtube.com/vi/${animeData.trailer.youtube_id}/default.jpg`,
                                    small_image_url: `https://img.youtube.com/vi/${animeData.trailer.youtube_id}/default.jpg`,
                                    medium_image_url: `https://img.youtube.com/vi/${animeData.trailer.youtube_id}/mqdefault.jpg`,
                                    large_image_url: `https://img.youtube.com/vi/${animeData.trailer.youtube_id}/hqdefault.jpg`,
                                    maximum_image_url: `https://img.youtube.com/vi/${animeData.trailer.youtube_id}/maxresdefault.jpg`,
                                }
                            }
                        }]);
                    } else {
                        setVideos([]);
                    }

                    setSimilar([]);
                    
                    // Process and group relations
                    const groupedRelations = groupRelations(animeData.relations);
                    setRelations(groupedRelations);

                    // IMMEDIATELY show content, mark initial load done
                    setLoading(false);

                    // PHASE 2: Background prefetch for Watch page
                    // Start loading scraper data so it's ready when user clicks Watch
                    if (!scraperFetchStarted.current) {
                        scraperFetchStarted.current = true;
                        prefetchWatchData(animeData);
                    }

                } else {
                    setError('Anime not found');
                    setLoading(false);
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load anime details');
                setLoading(false);
            } finally {
                setExtrasLoading(false);
            }
        };

        fetchAnimeBasicInfo();
    }, [id]);

    // Background prefetch function - stores data in sessionStorage for Watch page
    const prefetchWatchData = async (anime: Anime) => {
        try {
            setEpisodesLoading(true);
            const title = anime.title_english || anime.title_romaji || anime.title;
            console.log('[Prefetch] Starting background prefetch for:', title);

            // Check if we have cached data already (with TTL - 30 minutes)
            const prefetchKey = `watch_prefetch_${anime.id}`;
            const PREFETCH_TTL = 30 * 60 * 1000;
            const cached = sessionStorage.getItem(prefetchKey);

            if (cached) {
                const data = JSON.parse(cached);
                const isFresh = Date.now() - (data.timestamp || 0) < PREFETCH_TTL;
                const hasEpisodes = data.episodes?.length > 0;

                if (isFresh && hasEpisodes) {
                    setEpisodes(data.episodes);
                    setEpisodesLoading(false);
                    console.log('[Prefetch] Loaded from session cache:', data.episodes.length, 'episodes');
                    return;
                } else {
                    // Stale or empty cache — remove it and re-fetch
                    sessionStorage.removeItem(prefetchKey);
                }
            }

            // Search for anime on scraper
            const searchRes = await animeService.searchScraper(title);
            const bestMatch = findBestScraperMatch(anime, searchRes || []);

            if (bestMatch) {
                const session = bestMatch.session;

                // Get episodes
                const epsData = await animeService.getEpisodes(session);
                const mappedEpisodes = (epsData.episodes || epsData.ep_details || epsData || []).map((ep: any) => ({
                    id: ep.session,
                    session: ep.session,
                    episodeNumber: ep.episodeNumber || ep.episode || ep.number,
                    title: ep.title || `Episode ${ep.episodeNumber || ep.episode || ep.number}`,
                    snapshot: ep.snapshot
                }));

                setEpisodes(mappedEpisodes);

                // Cache data for Watch page
                const cacheData = {
                    session,
                    episodes: mappedEpisodes,
                    timestamp: Date.now()
                };
                sessionStorage.setItem(prefetchKey, JSON.stringify(cacheData));
                console.log('[Prefetch] Cached', mappedEpisodes.length, 'episodes for anime', anime.id);
            } else {
                setEpisodes([]);
            }
        } catch (e) {
            // Prefetch failed silently - Watch page will fetch normally
            console.warn('[Prefetch] Background prefetch failed:', e);
            setEpisodes([]);
        } finally {
            setEpisodesLoading(false);
        }
    };

    const handleBack = () => {
        navigate('/');
    };

    const handleWatchClick = () => {
        if (anime) {
            navigate(`/watch/${anime.id}`, { state: { anime } });
        }
    };

    const handleRelatedClick = (relatedAnime: Anime) => {
        navigate(`/anime/${relatedAnime.id}`);
        window.scrollTo(0, 0);
    };

    if (loading) {
        return <DetailPageSkeleton />;
    }

    if (error || !anime) {
        return (
            <div className="min-h-screen bg-miru-bg flex flex-col justify-center items-center text-white">
                <h2 className="text-2xl font-bold text-red-500 mb-4">{error || 'Anime not found'}</h2>
                <button
                    onClick={() => navigate('/')}
                    className="px-6 py-2 bg-miru-surface rounded-lg hover:bg-white/10"
                >
                    Go Home
                </button>
            </div>
        );
    }

    return (
        <AnimeDetailPage
            anime={anime}
            characters={characters}
            relations={relations}
            videos={videos}
            recommendations={recommendations}
            similar={similar}
            loading={extrasLoading}
            episodes={episodes}
            episodesLoading={episodesLoading}
            onBack={handleBack}
            onWatchClick={handleWatchClick}
            onRelatedClick={handleRelatedClick}
        />
    );
}

export default Detail;



