import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AnimeDetailPage from '../components/AnimeDetailPage';
import LoadingSpinner from '../components/LoadingSpinner';
import { getAnimeInfo } from '../services/api';
import { Anime, Character, RelatedAnime, PromoVideo, Recommendation } from '../types';

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

    // Fetch Anime Data (all in one call with Consumet)
    useEffect(() => {
        const fetchAnimeData = async () => {
            if (!id) return;

            try {
                setLoading(true);
                setExtrasLoading(true);
                setError(null);

                // Consumet returns everything in one call
                const result = await getAnimeInfo(id);

                if (result) {
                    setAnime(result.anime);
                    setCharacters(result.characters);
                    setRecommendations(result.recommendations);

                    // Consumet doesn't have separate relations in the same format
                    // We'll use recommendations as similar anime
                    setSimilar([]);
                    setRelations([]);

                    // Consumet doesn't provide promo videos directly
                    // If the anime has a trailer, we can create a single video entry
                    if (result.anime.trailer?.youtube_id) {
                        setVideos([{
                            title: 'Trailer',
                            trailer: {
                                youtube_id: result.anime.trailer.youtube_id,
                                url: result.anime.trailer.url,
                                embed_url: result.anime.trailer.embed_url,
                                images: {
                                    image_url: `https://img.youtube.com/vi/${result.anime.trailer.youtube_id}/default.jpg`,
                                    small_image_url: `https://img.youtube.com/vi/${result.anime.trailer.youtube_id}/default.jpg`,
                                    medium_image_url: `https://img.youtube.com/vi/${result.anime.trailer.youtube_id}/mqdefault.jpg`,
                                    large_image_url: `https://img.youtube.com/vi/${result.anime.trailer.youtube_id}/hqdefault.jpg`,
                                    maximum_image_url: `https://img.youtube.com/vi/${result.anime.trailer.youtube_id}/maxresdefault.jpg`,
                                }
                            }
                        }]);
                    } else {
                        setVideos([]);
                    }
                } else {
                    setError('Anime not found');
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load anime details');
            } finally {
                setLoading(false);
                setExtrasLoading(false);
            }
        };

        fetchAnimeData();
    }, [id]);

    const handleBack = () => {
        // Explicitly go to Home/Browse page instead of history back
        // to avoid loops if the user came from the Watch page
        navigate('/');
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
