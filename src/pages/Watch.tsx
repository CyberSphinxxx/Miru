import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import WatchPage from '../components/WatchPage';
import LoadingSpinner from '../components/LoadingSpinner';
import { Anime, Episode, StreamLink } from '../types';
import { saveWatchProgress } from '../services/watchHistoryService';

const API_BASE = 'http://localhost:3001/api';

function Watch() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // State
    const [anime, setAnime] = useState<Anime | null>(null);
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [scraperSession, setScraperSession] = useState<string | null>(null);
    const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
    const [streams, setStreams] = useState<StreamLink[]>([]);

    // UI State
    const [loading, setLoading] = useState(true); // Initial page load
    const [epLoading, setEpLoading] = useState(true); // Fetching episodes
    const [streamLoading, setStreamLoading] = useState(false); // Fetching streams
    const [error, setError] = useState<string | null>(null);

    // Player State
    const [selectedStreamIndex, setSelectedStreamIndex] = useState<number>(0);
    const [isAutoQuality, setIsAutoQuality] = useState(true);
    const [playerMode, setPlayerMode] = useState<'hls' | 'embed'>('embed');

    // 1. Fetch Anime Info (to get title -> search scraper)
    useEffect(() => {
        const initWatch = async () => {
            if (!id) return;
            try {
                setLoading(true);
                // Fetch basic anime info first
                const res = await fetch(`${API_BASE}/jikan/anime/${id}`);
                const data = await res.json();

                if (data?.data) {
                    setAnime(data.data);
                    // Start scraping process
                    fetchScraperData(data.data);
                } else {
                    setError('Anime not found');
                    setLoading(false);
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load anime');
                setLoading(false);
            }
        };
        initWatch();
    }, [id]);

    // 2. Search Scraper & Get Episodes (with pagination support)
    const fetchScraperData = async (animeData: Anime) => {
        setEpLoading(true);
        try {
            // Try searching with full title
            let searchRes = await fetch(`${API_BASE}/scraper/search?q=${encodeURIComponent(animeData.title)}`);
            let searchData = await searchRes.json();

            // Fallback: Try simpler title if needed
            if ((!searchData || searchData.length === 0) && animeData.title.includes(':')) {
                const simpleTitle = animeData.title.split(':')[0].trim();
                searchRes = await fetch(`${API_BASE}/scraper/search?q=${encodeURIComponent(simpleTitle)}`);
                searchData = await searchRes.json();
            }

            if (searchData?.length > 0) {
                const session = searchData[0].session || searchData[0].id;
                setScraperSession(session);

                // Fetch Page 1
                const epRes = await fetch(`${API_BASE}/scraper/episodes?session=${session}&page=1`);
                const epData = await epRes.json();

                if (epData?.episodes) {
                    const allEpisodes = [...epData.episodes];
                    // Immediately show first page
                    setEpisodes(allEpisodes);
                    if (allEpisodes.length > 0) {
                        loadStream(allEpisodes[0], session);
                    }

                    // Background fetch for remaining pages
                    if (epData.lastPage > 1) {
                        // We do this in a non-blocking way
                        (async () => {
                            for (let p = 2; p <= epData.lastPage; p++) {
                                try {
                                    const nextRes = await fetch(`${API_BASE}/scraper/episodes?session=${session}&page=${p}`);
                                    const nextData = await nextRes.json();
                                    if (nextData?.episodes) {
                                        setEpisodes(prev => [...prev, ...nextData.episodes]);
                                    }
                                } catch (err) {
                                    console.error(`Failed to fetch page ${p}`, err);
                                }
                            }
                        })();
                    }
                }
            } else {
                console.warn('No scraper results found');
            }
        } catch (e) {
            console.error('Failed to load episodes', e);
        } finally {
            setEpLoading(false);
            setLoading(false);
        }
    };

    const getMappedQuality = (q: string): string => {
        const res = parseInt(q);
        if (res >= 1000) return '1080P';
        if (res >= 600) return '720P';
        return '360P';
    };

    const loadStream = async (episode: Episode, sessionOverride?: string) => {
        const session = sessionOverride || scraperSession;
        if (!session) return;

        setCurrentEpisode(episode);
        setStreamLoading(true);
        setStreams([]);
        setSelectedStreamIndex(0);
        setIsAutoQuality(true);

        // Save to watch history
        if (anime) {
            const epNum = typeof episode.episodeNumber === 'string'
                ? parseInt(episode.episodeNumber)
                : episode.episodeNumber;
            saveWatchProgress(anime, epNum, 0);
        }

        try {
            const res = await fetch(`${API_BASE}/scraper/streams?anime_session=${session}&ep_session=${episode.session}`);
            const data = await res.json();

            if (data?.length > 0) {
                const qualityMap = new Map<string, StreamLink>();
                const sortedData = [...data].sort((a: StreamLink, b: StreamLink) =>
                    (parseInt(b.quality) || 0) - (parseInt(a.quality) || 0)
                );

                sortedData.forEach((s: StreamLink) => {
                    const mapped = getMappedQuality(s.quality);
                    if (!qualityMap.has(mapped)) {
                        qualityMap.set(mapped, s);
                    }
                });

                const standardizedStreams = Array.from(qualityMap.values());
                setStreams(standardizedStreams);

                if (!standardizedStreams[0].directUrl) setPlayerMode('embed');
            }
        } catch (e) {
            console.error('Failed to load stream', e);
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
        />
    );
}

export default Watch;
