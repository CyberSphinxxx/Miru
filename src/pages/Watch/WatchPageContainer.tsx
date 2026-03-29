import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import WatchPage from './WatchPage';
import WatchPageSkeleton from '../../components/WatchPageSkeleton';
import { Anime, Episode, StreamLink } from '../../types';
import { saveWatchProgress } from '../../services/watchHistoryService';
import { animeService, findBestScraperMatch, groupRelations } from '../../services/api';
import { useLocalUser } from '../../context/UserContext';

function Watch() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { updateStatus, getAnimeStatus, userData, updateHistory, addWatchTime, loading: userLoading } = useLocalUser();

    // State
    const [anime, setAnime] = useState<Anime | null>(location.state?.anime || null);
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [seasons, setSeasons] = useState<any[]>([]);
    const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
    const [streams, setStreams] = useState<StreamLink[]>([]);
    const [scraperSession, setScraperSession] = useState<string | null>(null);
    const [externalUrl, setExternalUrl] = useState<string | null>(null);
    const [addedToWatching, setAddedToWatching] = useState(false);

    // UI State
    const [loading, setLoading] = useState(!location.state?.anime);
    const [epLoading, setEpLoading] = useState(true);
    const [streamLoading, setStreamLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Player State
    const [selectedStreamIndex, setSelectedStreamIndex] = useState<number>(0);
    const [isAutoQuality, setIsAutoQuality] = useState(false); // Default to Manual (Highest)

    // Timer for throttling history updates
    const lastSaveTimeRef = useRef<number>(0);

    // Real watch time tracking
    const isPlayingRef = useRef<boolean>(false);
    const playStartTimeRef = useRef<number>(0);
    const accumulatedPlayTimeRef = useRef<number>(0); // seconds accumulated since last flush
    const watchTimeFlushIntervalRef = useRef<NodeJS.Timeout | null>(null);
    // Cumulative play-seconds for 5-min auto-add (resets per watch page mount)
    const cumulativePlaySecondsRef = useRef<number>(0);

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

    // Derived State
    const initialTime = useMemo(() => {
        if (!anime || !currentEpisode) return 0;
        const item = userData.history.find(h => h.animeId === anime.id && h.episodeId === currentEpisode.session);
        return item ? item.timestamp : 0;
    }, [anime, currentEpisode, userData.history]);

    const watchedEpisodes = useMemo(() => {
        if (!anime) return new Set<string>();
        return new Set(
            userData.history
                .filter(h => h.animeId === anime.id)
                .map(h => h.episodeId)
        );
    }, [anime, userData.history]);

    // Handle Time Update (Throttled) — Bug 3: only called when playing (guard in VideoPlayer)
    const handleTimeUpdate = useCallback((time: number) => {
        if (!anime || !currentEpisode) return;

        const now = Date.now();
        // Save every 5 seconds
        if (now - lastSaveTimeRef.current > 5000) {
            updateHistory(anime.id, currentEpisode.session, time);
            lastSaveTimeRef.current = now;
        }
    }, [anime, currentEpisode, updateHistory]);

    // --- Real watch time tracking ---
    // Flush accumulated play time to UserContext
    const flushPlayTime = useCallback(() => {
        if (isPlayingRef.current) {
            const elapsed = (Date.now() - playStartTimeRef.current) / 1000;
            accumulatedPlayTimeRef.current += elapsed;
            cumulativePlaySecondsRef.current += elapsed;
            playStartTimeRef.current = Date.now(); // reset for next interval
        }

        const toFlush = accumulatedPlayTimeRef.current;
        if (toFlush > 0) {
            addWatchTime(Math.round(toFlush));
            accumulatedPlayTimeRef.current = 0;
        }
    }, [addWatchTime]);

    // Periodic flush every 10 seconds while on the page
    useEffect(() => {
        watchTimeFlushIntervalRef.current = setInterval(() => {
            flushPlayTime();
        }, 10_000);

        return () => {
            // Flush remaining time on unmount
            flushPlayTime();
            if (watchTimeFlushIntervalRef.current) {
                clearInterval(watchTimeFlushIntervalRef.current);
            }
        };
    }, [flushPlayTime]);

    // Play state change handler — starts/stops the play-time clock
    const handlePlayStateChange = useCallback((isPlaying: boolean) => {
        if (isPlaying && !isPlayingRef.current) {
            // Started playing
            isPlayingRef.current = true;
            playStartTimeRef.current = Date.now();
        } else if (!isPlaying && isPlayingRef.current) {
            // Paused/buffering — accumulate time since last play start
            const elapsed = (Date.now() - playStartTimeRef.current) / 1000;
            accumulatedPlayTimeRef.current += elapsed;
            cumulativePlaySecondsRef.current += elapsed;
            isPlayingRef.current = false;
        }
    }, []);

    // 1. Fetch Anime Info and Episodes
    useEffect(() => {
        const initWatch = async () => {
            if (!id) return;
            try {
                if (!anime) {
                    setLoading(true);
                }
                setEpLoading(true);

                let currentAnime = anime;

                // If we don't have anime data from state, fetch it
                if (!currentAnime) {
                    const animeResult = await animeService.getAnimeDetails(Number(id));
                    if (!animeResult.data) {
                        setError('Anime not found');
                        setLoading(false);
                        return;
                    }
                    currentAnime = animeResult.data;
                    setAnime(currentAnime);
                }

                // Process relations for seasons
                if (currentAnime && currentAnime.relations) {
                    const grouped = groupRelations(currentAnime.relations);
                    const seasonRels = grouped.filter((r: any) => r.relation === 'PREQUEL' || r.relation === 'SEQUEL');
                    setSeasons(seasonRels);
                }

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
                            // Cleanup cache
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
                if (!currentAnime) return;
                const searchResults = await animeService.searchScraper(currentAnime.title);
                const bestMatch = findBestScraperMatch(currentAnime, searchResults || []);

                if (bestMatch) {
                    const session = bestMatch.session;
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

    // Auto-select episode based on history
    useEffect(() => {
        if (episodes.length > 0 && !currentEpisode && !streamLoading && !userLoading && anime) {
            const historyItem = userData.history.find(h => h.animeId === anime.id);
            if (historyItem) {
                const ep = episodes.find(e => e.session === historyItem.episodeId);
                if (ep) {
                    console.log('[Watch] Resuming from history:', ep.episodeNumber);
                    loadStream(ep);
                    return;
                }
            }
            // Fallback to first episode
            console.log('[Watch] No history, playing first episode');
            loadStream(episodes[0]);
        }
    }, [episodes, currentEpisode, streamLoading, userLoading, userData.history, anime]);

    // Bug 2 fix: 5-minute auto-add to "Watching" — only counts REAL play time
    useEffect(() => {
        // Only check if we have anime data and haven't added yet
        if (!anime) return;

        // Check if anime is already in any library list
        const status = getAnimeStatus(anime.id || 0);
        if (status) {
            setAddedToWatching(true);
            return;
        }

        // Poll cumulative real play-seconds every 10s
        const checkInterval = setInterval(() => {
            if (cumulativePlaySecondsRef.current >= 300 && anime && !addedToWatching) {
                console.log('[Watch] Auto-adding to Watching after 5 minutes of real playback:', anime.title);
                updateStatus(anime, 'watching');
                setAddedToWatching(true);
                clearInterval(checkInterval);
            }
        }, 10_000);

        return () => clearInterval(checkInterval);
    }, [anime, addedToWatching, getAnimeStatus, updateStatus]);

    const getMappedQuality = (q: string): string => {
        const res = parseInt(q);
        if (res >= 1000) return '1080';
        if (res >= 600) return '720';
        return '360';
    };

    const loadStream = async (episode: Episode, session?: string, animeOverride?: Anime) => {
        const activeAnime = animeOverride || anime;
        const activeSession = session || scraperSession;

        setCurrentEpisode(episode);
        setStreamLoading(true);
        setStreams([]);
        setExternalUrl(null);
        setSelectedStreamIndex(0);
        setIsAutoQuality(false); // Reset to manual/highest
        // Reset save time and play tracking when loading new episode
        lastSaveTimeRef.current = 0;
        isPlayingRef.current = false;
        accumulatedPlayTimeRef.current = 0;

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
    const prefetchNextEpisode = useCallback(async () => {
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
    }, [episodes, currentEpisode, scraperSession]);

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
    }, [currentEpisode, streams, episodes, prefetchNextEpisode]);

    const handleEpisodeClick = (ep: Episode) => {
        loadStream(ep);
    };

    // Handle auto-play next episode
    const handleNextEpisode = useCallback(() => {
        const currentIndex = episodes.findIndex(ep => ep.id === currentEpisode?.id);
        const hasNext = currentIndex < episodes.length - 1 && currentIndex !== -1;

        if (hasNext) {
            const nextEp = episodes[currentIndex + 1];
            console.log('[Watch] Auto-playing next episode:', nextEp.episodeNumber);
            loadStream(nextEp);
        }
    }, [episodes, currentEpisode]);

    const handleBack = () => {
        if (id) {
            navigate(`/anime/${id}`);
        } else {
            navigate('/');
        }
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            if (e.key.toLowerCase() === 'n') {
                e.preventDefault();
                handleNextEpisode();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleNextEpisode]);

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
            seasons={seasons}
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
            onNextEpisode={handleNextEpisode}
            externalUrl={externalUrl}
            initialTime={initialTime}
            onTimeUpdate={handleTimeUpdate}
            onPlayStateChange={handlePlayStateChange}
            watchedEpisodes={watchedEpisodes}
        />
    );

}

export default Watch;


