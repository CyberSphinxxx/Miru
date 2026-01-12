import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import WatchPage from '../components/WatchPage';
import LoadingSpinner from '../components/LoadingSpinner';
import { Anime, Episode, StreamLink } from '../types';
import { saveWatchProgress } from '../services/watchHistoryService';
import { getAnimeInfo, getEpisodeStreams } from '../services/api';
import { searchLocalAnime, getLocalEpisodes, getLocalStreams } from '../services/localApi';

function Watch() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // State
    const [anime, setAnime] = useState<Anime | null>(null);
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
    const [streams, setStreams] = useState<StreamLink[]>([]);
    const [externalUrl, setExternalUrl] = useState<string | null>(null);

    // UI State
    const [loading, setLoading] = useState(true); // Initial page load
    const [epLoading, setEpLoading] = useState(true); // Fetching episodes
    const [streamLoading, setStreamLoading] = useState(false); // Fetching streams
    const [error, setError] = useState<string | null>(null);

    // Player State
    const [selectedStreamIndex, setSelectedStreamIndex] = useState<number>(0);
    const [isAutoQuality, setIsAutoQuality] = useState(true);
    const [playerMode, setPlayerMode] = useState<'hls' | 'embed'>('hls');

    // 1. Fetch Anime Info and Episodes (both come from Consumet in one call)
    useEffect(() => {
        const initWatch = async () => {
            if (!id) return;
            try {
                setLoading(true);
                setEpLoading(true);

                // Consumet returns anime info + episodes in one call
                const result = await getAnimeInfo(id);

                if (result) {
                    setAnime(result.anime);
                    setEpisodes(result.episodes);

                    // Auto-load first episode streams
                    if (result.episodes.length > 0) {
                        loadStream(result.episodes[0], result.anime);
                    }
                } else {
                    setError('Anime not found');
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
        // Consumet returns quality like "1080p", "720p", "480p", "360p", "default", "backup"
        if (q.includes('1080')) return '1080P';
        if (q.includes('720')) return '720P';
        if (q.includes('480')) return '480P';
        if (q.includes('360')) return '360P';
        if (q === 'auto') return 'Auto';
        return q.toUpperCase();
    };

    const loadStream = async (episode: Episode, animeOverride?: Anime) => {
        const activeAnime = animeOverride || anime;
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
            // Attempt 1: Try Local Backend (Embed) first as requested for performance/default
            console.log('Attempting to load from Local Backend (Embed)...');
            const localSuccess = activeAnime ? await fetchLocalStream(episode, activeAnime) : false;

            if (localSuccess) {
                return;
            }

            // Attempt 2: Primary Consumet API
            console.log('Local backend failed, trying Primary API...');
            const streamData = await getEpisodeStreams(episode.id);

            if (streamData.length > 0) {
                // Deduplicate by quality
                const qualityMap = new Map<string, StreamLink>();

                streamData.forEach((s: StreamLink) => {
                    const mapped = getMappedQuality(s.quality);
                    if (!qualityMap.has(mapped)) {
                        qualityMap.set(mapped, { ...s, quality: mapped });
                    }
                });

                const standardizedStreams = Array.from(qualityMap.values());
                setStreams(standardizedStreams);

                if (standardizedStreams[0]?.isHls) {
                    setPlayerMode('hls');
                } else {
                    setPlayerMode('embed');
                }
            } else {
                // Final fallback to external URL
                if (episode.url) {
                    setExternalUrl(episode.url);
                }
            }
        } catch (e) {
            console.error('All stream fetch attempts failed', e);
            if (episode.url) {
                setExternalUrl(episode.url);
            }
        } finally {
            setStreamLoading(false);
        }
    };

    const fetchLocalStream = async (episode: Episode, activeAnime: Anime): Promise<boolean> => {
        try {
            // 1. Search for the anime locally
            const searchResults = await searchLocalAnime(activeAnime.title);
            if (searchResults.length === 0) return false;

            // Simple matching: take the first one or try to match title
            const localAnime = searchResults[0];

            // 2. Get episodes for the local anime
            const { episodes: localEpisodes } = await getLocalEpisodes(localAnime.session);

            // 3. Find the matching episode
            const targetEp = localEpisodes.find(ep => ep.episodeNumber === Number(episode.episodeNumber));
            if (!targetEp) return false;

            // 4. Get streams
            const localStreams = await getLocalStreams(localAnime.session, targetEp.session);

            if (localStreams.length > 0) {
                // Deduplicate local streams
                const qualityMap = new Map<string, StreamLink>();
                localStreams.forEach((s: StreamLink) => {
                    const mapped = getMappedQuality(s.quality);
                    if (!qualityMap.has(mapped)) {
                        qualityMap.set(mapped, { ...s, quality: mapped });
                    }
                });
                const uniqueStreams = Array.from(qualityMap.values());

                setStreams(uniqueStreams);
                // Force embed for local streams (usually Kwik)
                setPlayerMode('embed');
                return true;
            }
            return false;
        } catch (localError) {
            console.error('Local backend attempt failed:', localError);
            return false;
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
        return (
            <div className="min-h-screen bg-miru-bg flex justify-center items-center">
                <LoadingSpinner size="lg" text="Initializing player..." />
            </div>
        );
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
            playerMode={playerMode}
            isAutoQuality={isAutoQuality}
            epLoading={epLoading}
            streamLoading={streamLoading}
            onBack={handleBack}
            onEpisodeClick={handleEpisodeClick}
            onQualityChange={(idx) => { setSelectedStreamIndex(idx); setIsAutoQuality(false); }}
            onModeChange={setPlayerMode}
            onAutoQuality={() => { setIsAutoQuality(true); setSelectedStreamIndex(0); }}
            externalUrl={externalUrl}
        />
    );
}

export default Watch;
