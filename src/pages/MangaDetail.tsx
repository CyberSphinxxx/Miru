import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MangaDetailPage from '../components/MangaDetailPage';
import DetailPageSkeleton from '../components/DetailPageSkeleton';
import { mangaService } from '../services/api';
import { Manga } from '../types/manga';

function MangaDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // State
    const [manga, setManga] = useState<Manga | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Extra details state
    const [recommendations, setRecommendations] = useState<Manga[]>([]);
    const [extrasLoading, setExtrasLoading] = useState(true);

    // Track if we've started scraper fetch
    const scraperFetchStarted = useRef(false);

    // Fetch manga basic info from AniList
    useEffect(() => {
        const fetchMangaBasicInfo = async () => {
            if (!id) return;

            try {
                setLoading(true);
                setExtrasLoading(true);
                setError(null);
                scraperFetchStarted.current = false;

                // Get manga details from AniList
                const result = await mangaService.getMangaById(Number(id));

                if (result.data) {
                    const mangaData = result.data;
                    setManga(mangaData);

                    // For now, we don't have recommendations from AniList manga endpoint
                    // This could be extended later if needed
                    setRecommendations([]);

                    // IMMEDIATELY show content, mark initial load done
                    setLoading(false);

                    // Background prefetch for reader page
                    if (!scraperFetchStarted.current) {
                        scraperFetchStarted.current = true;
                        prefetchReaderData(mangaData.title, Number(id));
                    }

                } else {
                    setError('Manga not found');
                    setLoading(false);
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load manga details');
                setLoading(false);
            } finally {
                setExtrasLoading(false);
            }
        };

        fetchMangaBasicInfo();
    }, [id]);

    // Background prefetch function - stores data in sessionStorage for Reader page
    const prefetchReaderData = async (title: string, mangaId: number) => {
        try {
            console.log('[Prefetch] Starting background prefetch for manga:', title);

            // Search for manga on scraper
            const searchRes = await mangaService.searchMangaScraper(title);
            if (searchRes && searchRes.length > 0) {
                const scraperId = searchRes[0].id;

                // Get chapters
                const chapterList = await mangaService.getChapters(scraperId);
                const chapters = (chapterList || []).map((ch: any, index: number) => ({
                    id: ch.id || `ch-${index}`,
                    title: ch.title || `Chapter ${index + 1}`,
                    url: ch.url,
                    chapterNumber: ch.chapterNumber || ch.number || index + 1,
                    uploadDate: ch.uploadDate
                }));

                // Cache data for Reader page
                const cacheData = {
                    mangaId: scraperId,
                    chapters,
                    timestamp: Date.now()
                };
                sessionStorage.setItem(`manga_prefetch_${mangaId}`, JSON.stringify(cacheData));
                console.log('[Prefetch] Cached', chapters.length, 'chapters for manga', mangaId);
            }
        } catch (e) {
            // Prefetch failed silently - Reader page will fetch normally
            console.warn('[Prefetch] Background prefetch failed:', e);
        }
    };

    const handleBack = () => {
        navigate('/manga');
    };

    const handleReadClick = () => {
        if (manga) {
            navigate(`/read/${encodeURIComponent(manga.title)}`);
        }
    };

    const handleRelatedClick = (relatedManga: Manga) => {
        navigate(`/manga/${relatedManga.mal_id}`);
        window.scrollTo(0, 0);
    };

    if (loading) {
        return <DetailPageSkeleton />;
    }

    if (error || !manga) {
        return (
            <div className="min-h-screen bg-miru-bg flex flex-col justify-center items-center text-white">
                <h2 className="text-2xl font-bold text-red-500 mb-4">{error || 'Manga not found'}</h2>
                <button
                    onClick={() => navigate('/manga')}
                    className="px-6 py-2 bg-miru-surface rounded-lg hover:bg-white/10"
                >
                    Go to Manga
                </button>
            </div>
        );
    }

    return (
        <MangaDetailPage
            manga={manga}
            recommendations={recommendations}
            loading={extrasLoading}
            onBack={handleBack}
            onReadClick={handleReadClick}
            onRelatedClick={handleRelatedClick}
        />
    );
}

export default MangaDetail;
