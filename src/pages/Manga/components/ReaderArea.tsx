import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { Chapter, Page } from '../../../types/scraper';

interface Props {
    pagesLoading: boolean;
    pages: Page[];
    readingMode: string;
    zoomLevel: number;
    currentChapter: Chapter | null;
    currentChapterIndex: number;
    chaptersLength: number;
    goToPrevChapter: () => void;
    goToNextChapter: () => void;
    currentPage: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
    readingAreaRef: React.RefObject<HTMLDivElement>;
    virtuosoRef: React.RefObject<VirtuosoHandle>;
}

export default function ReaderArea({
    pagesLoading,
    pages,
    readingMode,
    zoomLevel,
    currentChapter,
    currentChapterIndex,
    chaptersLength,
    goToPrevChapter,
    goToNextChapter,
    currentPage,
    setCurrentPage,
    readingAreaRef,
    virtuosoRef
}: Props) {
    return (
        <main
            className={`flex-1 bg-[#0a0a0a] custom-scrollbar ${readingMode.includes('paged') ? 'overflow-y-auto' : 'overflow-hidden'}`}
            ref={readingMode.includes('paged') ? readingAreaRef : undefined}
        >
            {pagesLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-miru-primary"></div>
                    <p className="text-gray-400 animate-pulse">Loading pages...</p>
                </div>
            ) : pages.length > 0 ? (
                <>
                    {/* Long Strip Modes (virtualized) */}
                    {(readingMode === 'long-strip' || readingMode === 'long-strip-gaps') && (
                        <Virtuoso
                            ref={virtuosoRef}
                            style={{ height: '100%', width: '100%' }}
                            data={pages}
                            scrollerRef={(ref) => {
                                if (ref instanceof HTMLElement && readingAreaRef) {
                                    // @ts-ignore - assigning to current is normally protected, but valid here
                                    readingAreaRef.current = ref as HTMLDivElement;
                                }
                            }}
                            itemContent={(_, page) => (
                                <div className={`flex justify-center w-full ${readingMode === 'long-strip-gaps' ? 'pb-4' : ''}`}>
                                    <img
                                        src={page.imageUrl}
                                        alt={`Page ${page.pageNumber}`}
                                        className="block transition-all duration-200 max-w-full"
                                        style={{ width: `${zoomLevel}%` }}
                                        loading="eager"
                                    />
                                </div>
                            )}
                            components={{
                                Footer: () => (
                                    <div className="flex flex-col items-center gap-4 py-12 border-t border-white/5 mt-8 pb-32">
                                        <p className="text-gray-400 text-sm">End of {currentChapter?.title}</p>
                                        <div className="flex gap-4">
                                            <button
                                                onClick={goToPrevChapter}
                                                disabled={currentChapterIndex >= chaptersLength - 1}
                                                className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                                </svg>
                                                Previous Chapter
                                            </button>
                                            <button
                                                onClick={goToNextChapter}
                                                disabled={currentChapterIndex <= 0}
                                                className="px-6 py-3 rounded-xl bg-miru-primary hover:bg-miru-primary/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium text-black cursor-pointer"
                                            >
                                                Next Chapter
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                )
                            }}
                        />
                    )}

                    {/* Paged Modes (single page view) */}
                    {(readingMode === 'paged-ltr' || readingMode === 'paged-rtl' || readingMode === 'paged-vertical') && (
                        <div className="flex flex-col items-center justify-center min-h-full py-4 px-4">
                            {/* Page navigation for paged modes */}
                            <div className="flex items-center gap-4 w-full max-w-4xl">
                                {/* Previous page button (left side for LTR, right side for RTL) */}
                                {readingMode !== 'paged-rtl' && (
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage <= 1}
                                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                        </svg>
                                    </button>
                                )}
                                {readingMode === 'paged-rtl' && (
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(pages.length, p + 1))}
                                        disabled={currentPage >= pages.length}
                                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                        </svg>
                                    </button>
                                )}

                                {/* Current page image */}
                                <div className="flex-1 flex justify-center">
                                    <img
                                        src={pages[currentPage - 1]?.imageUrl}
                                        alt={`Page ${currentPage}`}
                                        className="block transition-all duration-200 max-h-[80vh]"
                                        style={{ width: `${zoomLevel}%`, maxWidth: '100%' }}
                                        loading="eager"
                                        decoding="async"
                                    />
                                </div>

                                {/* Next page button (right side for LTR, left side for RTL) */}
                                {readingMode !== 'paged-rtl' && (
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(pages.length, p + 1))}
                                        disabled={currentPage >= pages.length}
                                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                        </svg>
                                    </button>
                                )}
                                {readingMode === 'paged-rtl' && (
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage <= 1}
                                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            {/* Page indicator */}
                            <div className="mt-4 text-sm text-gray-400">
                                Page {currentPage} / {pages.length}
                            </div>

                            {/* Preload adjacent pages for smooth navigation */}
                            <div className="hidden">
                                {currentPage > 1 && <img src={pages[currentPage - 2]?.imageUrl} alt="" />}
                                {currentPage < pages.length && <img src={pages[currentPage]?.imageUrl} alt="" />}
                            </div>

                            {/* End of Chapter Navigation (Paged) */}
                            <div className="flex flex-col items-center gap-4 py-12 border-t border-white/5 mt-8 pb-32">
                                <p className="text-gray-400 text-sm">End of {currentChapter?.title}</p>
                                <div className="flex gap-4">
                                    <button
                                        onClick={goToPrevChapter}
                                        disabled={currentChapterIndex >= chaptersLength - 1}
                                        className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                        </svg>
                                        Previous Chapter
                                    </button>
                                    <button
                                        onClick={goToNextChapter}
                                        disabled={currentChapterIndex <= 0}
                                        className="px-6 py-3 rounded-xl bg-miru-primary hover:bg-miru-primary/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium text-black cursor-pointer"
                                    >
                                        Next Chapter
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-6">
                    <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                        </svg>
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-bold text-white mb-2">Select a chapter to start reading</h3>
                        <p className="text-sm text-gray-500">Choose from the sidebar on the left</p>
                    </div>

                    {/* Keyboard Shortcuts Help */}
                    <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/5">
                        <h4 className="text-sm font-bold text-white mb-3">Keyboard Shortcuts</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-2">
                                <kbd className="px-2 py-1 bg-white/10 rounded text-gray-300">←</kbd>
                                <span>Prev Chapter</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <kbd className="px-2 py-1 bg-white/10 rounded text-gray-300">→</kbd>
                                <span>Next Chapter</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <kbd className="px-2 py-1 bg-white/10 rounded text-gray-300">S</kbd>
                                <span>Toggle Sidebar</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <kbd className="px-2 py-1 bg-white/10 rounded text-gray-300">F</kbd>
                                <span>Fullscreen</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <kbd className="px-2 py-1 bg-white/10 rounded text-gray-300">+/-</kbd>
                                <span>Zoom In/Out</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <kbd className="px-2 py-1 bg-white/10 rounded text-gray-300">0</kbd>
                                <span>Reset Zoom</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
