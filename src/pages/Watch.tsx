import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import WatchPage from '../components/WatchPage';
import WatchPageSkeleton from '../components/WatchPageSkeleton';
import { Anime, Episode, StreamLink } from '../types';
import { saveWatchProgress } from '../services/watchHistoryService';
import { animeService } from '../services/api';

function Watch() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // State
    const [anime, setAnime] = useState<Anime | null>(null);
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
    const [streams, setStreams] = useState<StreamLink[]>([]);
    const [scraperSession, setScraperSession] = useState<string | null>(null);
    const [externalUrl, setExternalUrl] = useState<string | null>(null);

    // UI State
    const [loading, setLoading] = useState(true);
    const [epLoading, setEpLoading] = useState(true);
    const [streamLoading, setStreamLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Player State
    const [selectedStreamIndex, setSelectedStreamIndex] = useState<number>(0);
    const [isAutoQuality, setIsAutoQuality] = useState(true);

    // Cache refs
    const sessionCache = useRef(new Map<number, string>());

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

                // Then search for the anime on the scraper
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
