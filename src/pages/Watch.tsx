import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import WatchPage from '../components/WatchPage';
import WatchPageSkeleton from '../components/WatchPageSkeleton';
import { Anime, Episode, StreamLink } from '../types';
import { saveWatchProgress } from '../services/watchHistoryService';
import { animeService } from '../services/api';
import { useLocalUser } from '../context/UserContext';

function Watch() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { updateStatus, getAnimeStatus } = useLocalUser();

    // State
    const [anime, setAnime] = useState<Anime | null>(null);
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
    const [streams, setStreams] = useState<StreamLink[]>([]);
    const [scraperSession, setScraperSession] = useState<string | null>(null);
    const [externalUrl, setExternalUrl] = useState<string | null>(null);
    const [addedToWatching, setAddedToWatching] = useState(false);

    // UI State
    const [loading, setLoading] = useState(true);
    const [epLoading, setEpLoading] = useState(true);
    const [streamLoading, setStreamLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Player State
    const [selectedStreamIndex, setSelectedStreamIndex] = useState<number>(0);
    const [isAutoQuality, setIsAutoQuality] = useState(true);

    // 5-minute timer ref for auto-adding to Watching
    const watchTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Cache refs
    const sessionCache = useRef(new Map<number, string>());

    // Next Episode Prefetch State
    const prefetchedEpisodeRef = useRef<{
        episodeSession: string;
        streams: StreamLink[];
    } | null>(null);
    const prefetchTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Prefetch delay: 80% of typical anime episode (~24 min) = ~19 minutes
    const PREFETCH_DELAY_MS = 19 * 60 * 1000;

    // 1. Fetch Anime Info and Episodes
    useEffect(() => {
        const initWatch = async () => {
            if (!id) return;
            try {
                setLoading(true);
                setEpLoading(true);

                // First try to get anime details
                const animeResult = await animeService.getAnimeDetails(Number(id));

                if (!animeResult.data) {
                    setError('Anime not found');
                    setLoading(false);
                    return;
                }

                setAnime(animeResult.data);

                // Check for prefetched data from Detail page (background prefetch)
                const prefetchKey = `watch_prefetch_${id}`;
                const prefetchedData = sessionStorage.getItem(prefetchKey);

                if (prefetchedData) {
                    try {
                        const cached = JSON.parse(prefetchedData);
                        // Use cached data if it's less than 10 minutes old
                        if (cached.timestamp && Date.now() - cached.timestamp < 10 * 60 * 1000) {
                            console.log('[Watch] Using prefetched data from Detail page');
                            const { session, episodes } = cached;

                            setScraperSession(session);
                            sessionCache.current.set(Number(id), session);
                            setEpisodes(episodes);

                            // Auto-load first episode
                            if (episodes.length > 0) {
                                loadStream(episodes[0], session, animeResult.data);
                            }

                            // Clean up cache
                            sessionStorage.removeItem(prefetchKey);

                            setLoading(false);
                            setEpLoading(false);
                            return;
                        }
                    } catch (e) {
                        console.warn('[Watch] Invalid prefetch cache, fetching normally');
                    }
                }

                // No valid cache - fetch normally from scraper
                console.log('[Watch] No prefetch cache, fetching from scraper');
                const searchResults = await animeService.searchScraper(animeResult.data.title);

                if (searchResults && searchResults.length > 0) {
                    const session = searchResults[0].session;
                    setScraperSession(session);
                    sessionCache.current.set(Number(id), session);

                    // Get episodes
                    const epsData = await animeService.getEpisodes(session);
                    const eps = (epsData.episodes || epsData.ep_details || epsData || []).map((ep: any) => ({
                        id: ep.session,
                        session: ep.session,
                        episodeNumber: ep.episodeNumber || ep.episode || ep.number,
                        title: ep.title || `Episode ${ep.episodeNumber || ep.episode || ep.number}`,
                        snapshot: ep.snapshot
                    }));

                    setEpisodes(eps);

                    // Auto-load first episode
                    if (eps.length > 0) {
                        loadStream(eps[0], session, animeResult.data);
                    }
                } else {
                    setError('No episodes found');
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load anime');
            } finally {
                setLoading(false);
                setEpLoading(false);
            }
        };
        initWatch();
    }, [id]);

    // 5-minute timer to auto-add to "Watching" list
    useEffect(() => {
        // Clear any existing timer
        if (watchTimerRef.current) {
            clearTimeout(watchTimerRef.current);
        }

        // Only start timer if we have anime data
        if (!anime) return;

        // Check if anime is already in any library list
        const status = getAnimeStatus(anime.mal_id || anime.id || 0);
        if (status) {
            // Already in library, don't auto-add
            setAddedToWatching(true);
            return;
        }

        // Start 5-minute timer
        watchTimerRef.current = setTimeout(() => {
            if (anime && !addedToWatching) {
                console.log('[Watch] Auto-adding to Watching after 5 minutes:', anime.title);
                updateStatus(anime, 'watching');
                setAddedToWatching(true);
            }
        }, 5 * 60 * 1000); // 5 minutes

        // Cleanup on unmount or when anime changes
        return () => {
            if (watchTimerRef.current) {
                clearTimeout(watchTimerRef.current);
            }
        };
    }, [anime, addedToWatching, getAnimeStatus, updateStatus]);

    const getMappedQuality = (q: string): string => {
        const res = parseInt(q);
        if (res >= 1000) return '1080P';
        if (res >= 600) return '720P';
        return '360P';
    };

    const loadStream = async (episode: Episode, session?: string, animeOverride?: Anime) => {
        const activeAnime = animeOverride || anime;
        const activeSession = session || scraperSession;

        setCurrentEpisode(episode);
        setStreamLoading(true);
        setStreams([]);
        setExternalUrl(null);
        setSelectedStreamIndex(0);
        setIsAutoQuality(true);

        // Clear any pending prefetch timer
        if (prefetchTimerRef.current) {
            clearTimeout(prefetchTimerRef.current);
            prefetchTimerRef.current = null;
        }

        // Save to watch history
        if (activeAnime) {
            const epNum = typeof episode.episodeNumber === 'string'
                ? parseInt(episode.episodeNumber)
                : episode.episodeNumber;
            saveWatchProgress(activeAnime, epNum, 0);
        }

        try {
            if (!activeSession || !episode.session) {
                console.error('No session available');
                setStreamLoading(false);
                return;
            }

            // Check if we have prefetched data for this episode
            const prefetchedData = prefetchedEpisodeRef.current;
            if (prefetchedData && prefetchedData.episodeSession === episode.session) {
                console.log('[Prefetch] Using cached stream data for Episode', episode.episodeNumber);
                setStreams(prefetchedData.streams);
                prefetchedEpisodeRef.current = null; // Clear cache after use
                setStreamLoading(false);
                return;
            }

            const streamData = await animeService.getStreams(activeSession, episode.session);

            if (streamData && streamData.length > 0) {
                // Deduplicate and map qualities
                const qualityMap = new Map<string, StreamLink>();
                const sortedData = [...streamData].sort(
                    (a: StreamLink, b: StreamLink) => (parseInt(b.quality) || 0) - (parseInt(a.quality) || 0)
                );

                sortedData.forEach((s: StreamLink) => {
                    const mapped = getMappedQuality(s.quality);
                    if (!qualityMap.has(mapped)) {
                        qualityMap.set(mapped, { ...s, quality: mapped });
                    }
                });

                const uniqueStreams = Array.from(qualityMap.values());
                setStreams(uniqueStreams);
            } else {
                console.log('No streams available');
            }
        } catch (e) {
            console.error('Stream fetch failed', e);
        } finally {
            setStreamLoading(false);
        }
    };

    // Prefetch next episode streams in background
    const prefetchNextEpisode = async () => {
        const currentIndex = episodes.findIndex(ep => ep.id === currentEpisode?.id);
        const hasNext = currentIndex < episodes.length - 1 && currentIndex !== -1;

        if (!hasNext || !scraperSession) {
            return;
        }

        const nextEpisode = episodes[currentIndex + 1];

        // Don't prefetch if already cached
        if (prefetchedEpisodeRef.current?.episodeSession === nextEpisode.session) {
            return;
        }

        console.log('[Prefetch] Starting prefetch for Episode', nextEpisode.episodeNumber);

        try {
            const streamData = await animeService.getStreams(scraperSession, nextEpisode.session);

            if (streamData && streamData.length > 0) {
                // Deduplicate and map qualities (same logic as loadStream)
                const qualityMap = new Map<string, StreamLink>();
                const sortedData = [...streamData].sort(
                    (a: StreamLink, b: StreamLink) => (parseInt(b.quality) || 0) - (parseInt(a.quality) || 0)
                );

                sortedData.forEach((s: StreamLink) => {
                    const mapped = getMappedQuality(s.quality);
                    if (!qualityMap.has(mapped)) {
                        qualityMap.set(mapped, { ...s, quality: mapped });
                    }
                });

                const uniqueStreams = Array.from(qualityMap.values());

                // Cache the prefetched data
                prefetchedEpisodeRef.current = {
                    episodeSession: nextEpisode.session,
                    streams: uniqueStreams,
                };

                console.log('[Prefetch] Successfully cached streams for Episode', nextEpisode.episodeNumber);
            }
        } catch (e) {
            console.warn('[Prefetch] Failed to prefetch next episode:', e);
            // Silent failure - prefetch is a nice-to-have, not critical
        }
    };

    // Start prefetch timer when streams load (trigger at ~80% of episode)
    useEffect(() => {
        // Only start timer if we have streams loaded and there's a next episode
        if (!currentEpisode || streams.length === 0) {
            return;
        }

        const currentIndex = episodes.findIndex(ep => ep.id === currentEpisode.id);
        const hasNext = currentIndex < episodes.length - 1 && currentIndex !== -1;

        if (!hasNext) {
            return;
        }

        console.log('[Prefetch] Timer started - will prefetch next episode in ~19 minutes');

        prefetchTimerRef.current = setTimeout(() => {
            prefetchNextEpisode();
        }, PREFETCH_DELAY_MS);

        return () => {
            if (prefetchTimerRef.current) {
                clearTimeout(prefetchTimerRef.current);
                prefetchTimerRef.current = null;
            }
        };
    }, [currentEpisode, streams, episodes]);

    const handleEpisodeClick = (ep: Episode) => {
        loadStream(ep);
    };

    const handleBack = () => {
        if (id) {
            navigate(`/anime/${id}`);
        } else {
            navigate('/');
        }
    };

    if (loading) {
        return <WatchPageSkeleton />;
    }

    if (error || !anime) {
        return (
            <div className="min-h-screen bg-miru-bg flex flex-col justify-center items-center text-white">
                <h2 className="text-2xl font-bold text-red-500 mb-4">{error || 'Anime not found'}</h2>
                <button onClick={() => navigate('/')} className="px-6 py-2 bg-miru-surface rounded-lg">Go Home</button>
            </div>
        );
    }

    return (
        <WatchPage
            anime={anime}
            episodes={episodes}
            currentEpisode={currentEpisode}
            streams={streams}
            selectedStreamIndex={selectedStreamIndex}
            isAutoQuality={isAutoQuality}
            epLoading={epLoading}
            streamLoading={streamLoading}
            onBack={handleBack}
            onEpisodeClick={handleEpisodeClick}
            onQualityChange={(idx) => { setSelectedStreamIndex(idx); setIsAutoQuality(false); }}
            onAutoQuality={() => { setIsAutoQuality(true); setSelectedStreamIndex(0); }}
            externalUrl={externalUrl}
        />
    );
}

export default Watch;
