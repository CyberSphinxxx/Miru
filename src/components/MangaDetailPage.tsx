import React, { useState, useEffect } from 'react';
import { Manga, MangaChapter } from '../types/manga';
import { mangaService } from '../services/api';

interface MangaDetailPageProps {
    manga: Manga;
    recommendations: Manga[];
    loading?: boolean;
    onBack: () => void;
    onReadClick: () => void;
    onRelatedClick: (manga: Manga) => void;
}

// Chapter Grid Component (similar to anime EpisodeList)
const ChapterList = ({
    chapters,
    onChapterClick,
    loading
}: {
    chapters: MangaChapter[],
    onChapterClick: (chapter: MangaChapter) => void,
    loading?: boolean
}) => {
    const ITEMS_PER_PAGE = 30;
    const [page, setPage] = useState(1);
    const totalPages = Math.ceil(chapters.length / ITEMS_PER_PAGE);

    const currentChapters = chapters.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    if (loading) {
        return (
            <div className="py-8 flex justify-center">
                <div className="w-8 h-8 border-4 border-miru-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (chapters.length === 0) {
        return (
            <div className="text-gray-500 text-center py-4">No chapters found.</div>
        );
    }

    return (
        <div className="mt-4">
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {currentChapters.map((chapter) => (
                    <button
                        key={chapter.id}
                        onClick={() => onChapterClick(chapter)}
                        className="aspect-square flex items-center justify-center rounded-lg transition-all duration-200 relative group bg-miru-surface hover:bg-miru-primary hover:text-black hover:scale-105 hover:shadow-lg hover:shadow-miru-primary/20 text-gray-300 cursor-pointer border border-white/5 hover:border-miru-primary font-bold text-sm"
                        title={chapter.title}
                    >
                        <span>{chapter.chapterNumber}</span>
                    </button>
                ))}
            </div>

            {totalPages > 1 && (
                <div className="flex flex-col items-center gap-4 mt-6">
                    <div className="flex flex-wrap justify-center gap-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors flex-shrink-0
                                    ${page === p ? 'bg-miru-primary text-black font-bold' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const MangaDetailPage: React.FC<MangaDetailPageProps> = ({
    manga,
    recommendations,
    onBack,
    onReadClick,
    onRelatedClick,
    loading,
}) => {
    const [activeTab, setActiveTab] = useState<'summary' | 'relations'>('summary');
    const [chapters, setChapters] = useState<MangaChapter[]>([]);
    const [chaptersLoading, setChaptersLoading] = useState(true);

    // Fetch chapters when manga changes
    useEffect(() => {
        const fetchChapters = async () => {
            if (!manga) return;

            setChaptersLoading(true);
            try {
                // Check if we have prefetched data
                const prefetchKey = `manga_prefetch_${manga.id || manga.mal_id}`;
                const cached = sessionStorage.getItem(prefetchKey);

                if (cached) {
                    const data = JSON.parse(cached);
                    setChapters(data.chapters || []);
                    setChaptersLoading(false);
                    return;
                }

                // Search for manga on scraper
                const searchTitle = manga.title_english || manga.title_romaji || manga.title;
                const searchRes = await mangaService.searchMangaScraper(searchTitle);

                if (searchRes && searchRes.length > 0) {
                    const chapterList = await mangaService.getChapters(searchRes[0].id);
                    const mappedChapters: MangaChapter[] = chapterList.map((ch: any, index: number) => ({
                        id: ch.id || `ch-${index}`,
                        title: ch.title || `Chapter ${index + 1}`,
                        url: ch.url,
                        chapterNumber: ch.chapterNumber || ch.number || index + 1,
                        uploadDate: ch.uploadDate
                    }));
                    setChapters(mappedChapters);

                    // Cache for later
                    sessionStorage.setItem(prefetchKey, JSON.stringify({
                        mangaId: searchRes[0].id,
                        chapters: mappedChapters,
                        timestamp: Date.now()
                    }));
                }
            } catch (e) {
                console.error('Failed to fetch chapters:', e);
            } finally {
                setChaptersLoading(false);
            }
        };

        fetchChapters();
    }, [manga?.id, manga?.mal_id]);

    const handleCardClick = (id: number) => {
        const minimalManga = {
            mal_id: id,
            title: 'Loading...',
            images: { jpg: { image_url: '', large_image_url: '' } },
            score: 0,
            status: '',
            type: '',
            chapters: null,
            volumes: null
        } as Manga;

        onRelatedClick(minimalManga);
    };

    const handleChapterClick = (chapter: MangaChapter) => {
        // Navigate to manga reader with chapter
        window.location.href = `/read/${encodeURIComponent(manga.title)}?ch=${chapter.chapterNumber}`;
    };

    // Get banner image - fallback to cover if no banner
    const bannerImage = manga.images.jpg.banner_image || manga.images.jpg.large_image_url;
    const hasTrueBanner = !!manga.images.jpg.banner_image;

    return (
        <div className="min-h-screen bg-miru-bg animate-fade-in pb-20">
            {/* Banner Section */}
            <div className="relative h-[50vh] w-full">
                <div className="absolute inset-0">
                    <img
                        src={bannerImage}
                        alt={manga.title}
                        className={`w-full h-full object-cover ${!hasTrueBanner ? 'blur-xl opacity-50 scale-110' : ''}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-miru-bg via-miru-bg/60 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-miru-bg to-transparent" />
                </div>

                <button
                    onClick={onBack}
                    className="absolute top-24 left-6 z-50 p-3 bg-black/50 hover:bg-white/20 rounded-full backdrop-blur-sm transition-colors text-white group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 group-hover:-translate-x-1 transition-transform">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                </button>
            </div>

            {/* Content Section */}
            <div className="container mx-auto px-6 -mt-32 relative z-10">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Portrait Cover */}
                    <div className="flex-shrink-0 mx-auto md:mx-0 w-64 md:w-72">
                        <div className="rounded-xl overflow-hidden shadow-2xl shadow-miru-primary/20">
                            <img
                                src={manga.images.jpg.large_image_url}
                                alt={manga.title}
                                className="w-full h-full object-cover aspect-[2/3]"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3 mt-6">
                            <button
                                onClick={onReadClick}
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-miru-primary to-miru-accent text-white font-bold shadow-lg shadow-miru-primary/25 hover:shadow-miru-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
                                </svg>
                                Read Now
                            </button>
                        </div>
                    </div>

                    {/* Details Column */}
                    <div className="flex-1 pt-4 md:pt-8 text-center md:text-left space-y-4">
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight">{manga.title}</h1>

                        {/* Badges */}
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-sm">
                            <span className="bg-miru-primary text-black px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                </svg>
                                {manga.score || 'N/A'}
                            </span>
                            {(chapters.length > 0 || manga.chapters) && (
                                <span className="bg-green-500 text-white px-2.5 py-1 rounded text-xs font-bold">
                                    {chapters.length > 0 ? chapters.length : manga.chapters} chapters
                                </span>
                            )}
                            {manga.volumes && (
                                <span className="bg-blue-500 text-white px-2.5 py-1 rounded text-xs font-bold">
                                    {manga.volumes} volumes
                                </span>
                            )}
                            <span className="px-2.5 py-1 bg-white/10 rounded text-gray-300 text-xs">
                                {manga.type}
                            </span>
                            {manga.status && (
                                <span className="px-2.5 py-1 bg-white/10 rounded text-gray-300 text-xs">
                                    {manga.status}
                                </span>
                            )}
                        </div>

                        {/* Genres */}
                        <div className="flex flex-wrap justify-center md:justify-start gap-2">
                            {manga.genres?.map(genre => (
                                <span key={genre.mal_id || genre.name} className="px-3 py-1 rounded-lg bg-miru-surface-light border border-white/5 text-xs font-semibold text-gray-300 hover:text-white transition-colors cursor-default">
                                    {genre.name}
                                </span>
                            ))}
                        </div>

                        {/* Tabs */}
                        <div className="flex items-center gap-8 border-b border-white/10 mb-6">
                            <button
                                onClick={() => setActiveTab('summary')}
                                className={`pb-3 text-lg font-bold transition-colors relative ${activeTab === 'summary' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
                            >
                                Summary
                                {activeTab === 'summary' && <div className="absolute bottom-0 inset-x-0 h-0.5 bg-miru-primary" />}
                            </button>
                            <button
                                onClick={() => setActiveTab('relations')}
                                className={`pb-3 text-lg font-bold transition-colors relative ${activeTab === 'relations' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
                            >
                                Relations
                                {activeTab === 'relations' && <div className="absolute bottom-0 inset-x-0 h-0.5 bg-miru-primary" />}
                            </button>
                        </div>

                        {activeTab === 'summary' && (
                            <>
                                {/* Synopsis */}
                                <div className="mb-8">
                                    <p className="text-gray-400 leading-relaxed text-base md:text-lg text-left">{manga.synopsis}</p>
                                </div>

                                {/* Chapters Section */}
                                <div className="py-6 border-t border-white/10">
                                    <h3 className="text-xl font-bold text-white mb-4">Chapters</h3>
                                    <ChapterList
                                        chapters={chapters}
                                        onChapterClick={handleChapterClick}
                                        loading={chaptersLoading}
                                    />
                                </div>

                                {/* Loading Indicator for Extra Details */}
                                {loading && (
                                    <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
                                        <div className="w-8 h-8 border-4 border-miru-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                                        <p className="text-gray-400 text-sm font-medium">Loading more details...</p>
                                    </div>
                                )}

                                {/* Recommendations */}
                                {recommendations.length > 0 && (
                                    <div className="py-6 border-t border-white/10 animate-fade-in-up delay-300">
                                        <h3 className="text-xl font-bold text-white mb-4">Recommended For You</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                            {recommendations.slice(0, 5).map(rec => (
                                                <button
                                                    key={rec.mal_id}
                                                    onClick={() => handleCardClick(rec.mal_id)}
                                                    className="group text-left"
                                                >
                                                    <div className="aspect-[2/3] rounded-xl overflow-hidden mb-2 relative bg-gray-800">
                                                        <img
                                                            src={rec.images?.jpg?.large_image_url || rec.images?.jpg?.image_url || ''}
                                                            alt={rec.title}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.display = 'none';
                                                            }}
                                                        />
                                                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-xs font-bold flex items-center gap-1">
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-yellow-500">
                                                                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                                            </svg>
                                                            {rec.score || 'N/A'}
                                                        </div>
                                                    </div>
                                                    <h4 className="font-bold text-sm line-clamp-2 group-hover:text-miru-primary transition-colors">{rec.title}</h4>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Info Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-white/5 rounded-2xl border border-white/5 mt-6">
                                    <div>
                                        <h4 className="text-gray-500 text-xs font-bold uppercase mb-1">Authors</h4>
                                        <p className="font-medium">{manga.authors?.map(a => a.name).join(', ') || 'Unknown'}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-gray-500 text-xs font-bold uppercase mb-1">Type</h4>
                                        <p className="font-medium">{manga.type || '-'}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-gray-500 text-xs font-bold uppercase mb-1">Published</h4>
                                        <p className="font-medium">{manga.published?.string || '-'}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-gray-500 text-xs font-bold uppercase mb-1">Status</h4>
                                        <p className="font-medium capitalize">{manga.status || 'Unknown'}</p>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'relations' && (
                            <>
                                <div className="text-gray-500 text-center py-8">No relations available.</div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MangaDetailPage;
