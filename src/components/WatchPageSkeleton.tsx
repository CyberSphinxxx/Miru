import React from 'react';

/**
 * Skeleton loading state for the Watch page.
 * Shows the layout structure while data is loading.
 */
const WatchPageSkeleton: React.FC = () => {
    return (
        <div className="min-h-screen bg-miru-bg pt-20 pb-0 flex flex-col h-screen overflow-hidden animate-fade-in">
            {/* Header / Nav Skeleton */}
            <div className="px-6 pb-4 flex-shrink-0">
                <nav className="flex items-center gap-2 text-sm text-gray-400">
                    <div className="flex items-center gap-1 group cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                        </svg>
                        Back to Details
                    </div>
                </nav>
            </div>

            {/* Main Content - Flex Row */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Player Area Skeleton */}
                <div className="flex-1 flex flex-col relative">
                    {/* Video Player Skeleton */}
                    <div className="flex-1 bg-black relative">
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            {/* Pulsing play button skeleton */}
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center animate-pulse">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-white/20">
                                    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <p className="mt-4 text-gray-500 text-sm animate-pulse">Loading stream...</p>
                        </div>
                    </div>

                    {/* Control Bar Skeleton */}
                    <div className="bg-miru-surface/95 backdrop-blur-md border-t border-white/5 px-4 py-3 flex-shrink-0">
                        <div className="flex items-center justify-between gap-4">
                            {/* Quality Pills Skeleton */}
                            <div className="flex items-center gap-2">
                                <div className="w-12 h-6 rounded-full bg-white/5 animate-pulse" />
                                <div className="w-14 h-6 rounded-full bg-white/5 animate-pulse" />
                                <div className="w-14 h-6 rounded-full bg-white/5 animate-pulse" />
                            </div>

                            {/* Utility Buttons Skeleton */}
                            <div className="flex items-center gap-2 ml-auto">
                                <div className="w-20 h-8 rounded-lg bg-white/5 animate-pulse" />
                                <div className="w-20 h-8 rounded-lg bg-white/5 animate-pulse" />
                            </div>
                        </div>
                    </div>

                    {/* Title & Navigation Skeleton */}
                    <div className="bg-miru-surface/80 backdrop-blur-sm border-t border-white/5 px-6 py-4 flex-shrink-0">
                        <div className="mb-4">
                            {/* Title Skeleton */}
                            <div className="h-8 w-64 bg-white/10 rounded-lg animate-pulse mb-2" />
                            {/* Episode info Skeleton */}
                            <div className="h-4 w-40 bg-white/5 rounded animate-pulse" />
                        </div>

                        {/* Navigation Buttons Skeleton */}
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-24 h-10 rounded-lg bg-white/5 animate-pulse" />
                                <div className="w-24 h-10 rounded-lg bg-miru-primary/20 animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Episodes Sidebar Skeleton */}
                <div className="w-[350px] bg-miru-surface/50 border-l border-white/5 flex flex-col flex-shrink-0 h-full">
                    {/* Header */}
                    <div className="p-4 border-b border-white/5 flex-shrink-0">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="h-5 w-24 bg-white/10 rounded animate-pulse" />
                                <div className="h-5 w-12 bg-white/5 rounded-full animate-pulse" />
                            </div>
                            {/* View Toggle Skeleton */}
                            <div className="flex items-center gap-1">
                                <div className="w-8 h-8 rounded bg-white/5 animate-pulse" />
                                <div className="w-8 h-8 rounded bg-white/5 animate-pulse" />
                            </div>
                        </div>

                        {/* Search Input Skeleton */}
                        <div className="w-full h-10 bg-white/5 rounded-lg animate-pulse" />
                    </div>

                    {/* Episode List Skeleton */}
                    <div className="flex-1 overflow-hidden p-2 space-y-2">
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                className="w-full p-3 rounded-lg bg-white/[0.03] flex items-center gap-3"
                                style={{ animationDelay: `${i * 100}ms` }}
                            >
                                <div className="w-10 h-10 rounded-lg bg-white/5 animate-pulse flex-shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
                                    <div className="h-3 w-16 bg-white/5 rounded animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WatchPageSkeleton;
