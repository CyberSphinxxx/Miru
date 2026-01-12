import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AnimeDetailPage from '../components/AnimeDetailPage';
import LoadingSpinner from '../components/LoadingSpinner';
import { getAnimeExtraDetails, getSimilarAnime } from '../services/api';
import { Anime, Character, RelatedAnime, PromoVideo, Recommendation } from '../types';

import { API_BASE } from '../services/api';

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

    // Fetch Anime Data
    useEffect(() => {
        const fetchAnimeData = async () => {
            if (!id) return;

            try {
                setLoading(true);
                setError(null);

                // Fetch main details
                const res = await fetch(`${API_BASE}/jikan/anime/${id}`);
                const data = await res.json();

                if (data?.data) {
                    setAnime(data.data);

                    // Once we have valid anime data, fetch extras
                    fetchExtras(data.data);
                } else {
                    setError('Anime not found');
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load anime details');
            } finally {
                setLoading(false);
            }
        };

        const fetchExtras = async (animeData: Anime) => {
            setExtrasLoading(true);
            try {
                const [extras, similarData] = await Promise.all([
                    getAnimeExtraDetails(animeData.mal_id),
                    animeData.genres ? getSimilarAnime(animeData.genres) : Promise.resolve([])
                ]);

                setCharacters(extras.characters);
                setRelations(extras.relations);
                setVideos(extras.videos);
                setRecommendations(extras.recommendations);
                setSimilar(similarData);
            } catch (err) {
                console.error('Failed to load extra details', err);
            } finally {
                setExtrasLoading(false);
            }
        };

        fetchAnimeData();
    }, [id]);

    const handleBack = () => {
        // Go back in history if possible, else go home
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate('/');
        }
    };

    const handleWatchClick = () => {
        if (anime) {
            navigate(`/watch/${anime.mal_id}`);
        }
    };

    const handleRelatedClick = (relatedAnime: Anime) => {
        navigate(`/anime/${relatedAnime.mal_id}`);
        // Scroll to top when navigating to related anime
        window.scrollTo(0, 0);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-miru-bg flex justify-center items-center">
                <LoadingSpinner size="lg" text="Loading details..." />
            </div>
        );
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
            onBack={handleBack}
            onWatchClick={handleWatchClick}
            onWatchlistChange={() => { }} // Can implement watchlist context later
            onRelatedClick={handleRelatedClick}
        />
    );
}

export default Detail;
