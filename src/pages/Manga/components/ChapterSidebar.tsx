import { Chapter } from '../../../types/scraper';

interface Props {
    sidebarOpen: boolean;
    chapterViewMode: 'list' | 'grid';
    setChapterViewMode: (m: 'list' | 'grid') => void;
    chaptersLength: number;
    chapterSearchQuery: string;
    setChapterSearchQuery: (s: string) => void;
    chaptersLoading: boolean;
    filteredChapters: Chapter[];
    chapterPage: number;
    setChapterPage: React.Dispatch<React.SetStateAction<number>>;
    currentChapter: Chapter | null;
    loadChapter: (c: Chapter) => void;
}

export default function ChapterSidebar({
    sidebarOpen,
    chapterViewMode,
    setChapterViewMode,
    chaptersLength,
    chapterSearchQuery,
    setChapterSearchQuery,
    chaptersLoading,
    filteredChapters,
    chapterPage,
    setChapterPage,
    currentChapter,
    loadChapter
}: Props) {
    return (
        <aside
            className={`bg-[#111] border-r border-white/5 flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-0'
                } overflow-hidden`}
        >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-white/5 bg-[#0a0a0a]">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-miru-primary">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                        </svg>
                        <h3 className="font-bold text-white">Chapters</h3>
                    </div>
                    <div className="flex items-center gap-1">
                        {/* List/Grid Toggle */}
                        <button
                            onClick={() => setChapterViewMode('list')}
                            className={`p-1.5 rounded transition-colors ${chapterViewMode === 'list' ? 'bg-miru-primary text-black' : 'bg-white/5 hover:bg-white/10 text-gray-400'}`}
                            title="List View"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setChapterViewMode('grid')}
                            className={`p-1.5 rounded transition-colors ${chapterViewMode === 'grid' ? 'bg-miru-primary text-black' : 'bg-white/5 hover:bg-white/10 text-gray-400'}`}
                            title="Grid View"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                            </svg>
                        </button>
                        <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-md ml-1">
                            {chaptersLength}
                        </span>
                    </div>
                </div>
                <input
                    type="text"
                    placeholder="Search chapters..."
                    value={chapterSearchQuery}
                    onChange={(e) => setChapterSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-miru-primary/50 focus:ring-1 focus:ring-miru-primary/25 transition-all"
                />
            </div>

            {/* Chapter List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col pb-20">
                {chaptersLoading ? (
                    <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-miru-primary"></div>
                    </div>
                ) : filteredChapters.length > 0 ? (
                    (() => {
                        const ITEMS_PER_PAGE = chapterViewMode === 'grid' ? 100 : 50;
                        const totalPages = Math.ceil(filteredChapters.length / ITEMS_PER_PAGE);
                        const startIdx = (chapterPage - 1) * ITEMS_PER_PAGE;
                        const paginatedChapters = filteredChapters.slice(startIdx, startIdx + ITEMS_PER_PAGE);

                        return (
                            <>
                                {/* Paginated Chapter List */}
                                <div className="flex-1">
                                    {chapterViewMode === 'grid' ? (
                                        /* Grid View - Compact numbered buttons */
                                        <div className="p-3 grid grid-cols-5 gap-2">
                                            {paginatedChapters.map((chapter) => {
                                                const isActive = currentChapter?.id === chapter.id;
                                                const chapterNum = chapter.title.match(/\d+/)?.[0] || '?';
                                                return (
                                                    <button
                                                        key={chapter.id}
                                                        onClick={() => loadChapter(chapter)}
                                                        className={`aspect-square flex items-center justify-center rounded-lg transition-all duration-200 text-sm font-bold border ${isActive
                                                            ? 'bg-miru-primary text-black border-miru-primary shadow-lg shadow-miru-primary/20'
                                                            : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border-white/5 hover:border-miru-primary/50'
                                                            }`}
                                                        title={chapter.title}
                                                    >
                                                        {chapterNum}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        /* List View - Detailed with titles */
                                        <div>
                                            {paginatedChapters.map((chapter) => {
                                                const isActive = currentChapter?.id === chapter.id;
                                                return (
                                                    <button
                                                        key={chapter.id}
                                                        onClick={() => loadChapter(chapter)}
                                                        className={`w-full text-left px-4 py-3 transition-all border-l-2 hover:bg-white/5 ${isActive
                                                            ? 'bg-miru-primary/10 border-miru-primary text-white'
                                                            : 'border-transparent text-gray-400 hover:text-white'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {isActive && (
                                                                <div className="w-2 h-2 rounded-full bg-miru-primary animate-pulse"></div>
                                                            )}
                                                            <span className="text-sm font-medium truncate flex-1">{chapter.title}</span>
                                                        </div>
                                                        {chapter.uploadDate && (
                                                            <div className="text-xs text-gray-500 mt-1 ml-4">{chapter.uploadDate}</div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="p-3 border-t border-white/5 bg-[#0a0a0a]">
                                        <div className="flex items-center justify-between gap-2">
                                            <button
                                                onClick={() => setChapterPage(p => Math.max(1, p - 1))}
                                                disabled={chapterPage <= 1}
                                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                                </svg>
                                            </button>
                                            <span className="text-xs text-gray-400">
                                                Page <span className="text-white font-bold">{chapterPage}</span> of <span className="text-white font-bold">{totalPages}</span>
                                            </span>
                                            <button
                                                onClick={() => setChapterPage(p => Math.min(totalPages, p + 1))}
                                                disabled={chapterPage >= totalPages}
                                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        );
                    })()
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        {chaptersLength === 0 ? 'No chapters found' : 'No matching chapters'}
                    </div>
                )}
            </div>
        </aside>
    );
}
