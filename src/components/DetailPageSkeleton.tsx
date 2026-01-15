import React from 'react';

/**
 * Skeleton loading state for the Detail page.
 * Shows the layout structure while anime data is loading.
 */
const DetailPageSkeleton: React.FC = () => {
    return (
        <div className="min-h-screen bg-miru-bg animate-fade-in">
            {/* Background Blur Effect Skeleton */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-miru-primary/5 to-transparent" />
            </div>

            <div className="container mx-auto px-6 py-8 animate-fade-in relative z-10 pt-24">
                {/* Back Button Skeleton */}
                <div className="mb-6 flex items-center gap-2">
                    <div className="w-4 h-4 bg-white/10 rounded animate-pulse" />
                    <div className="w-24 h-4 bg-white/10 rounded animate-pulse" />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left Column: Poster & Actions */}
                    <div className="lg:col-span-3">
                        <div className="sticky top-24">
                            {/* Poster Skeleton */}
                            <div className="aspect-[2/3] rounded-2xl bg-white/5 animate-pulse mb-6" />

                            {/* Action Buttons Skeleton */}
                            <div className="space-y-3">
                                <div className="w-full h-12 rounded-xl bg-miru-primary/20 animate-pulse" />
                                <div className="w-full h-10 rounded-xl bg-white/5 animate-pulse" />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Info */}
                    <div className="lg:col-span-9">
                        {/* Title Skeleton */}
                        <div className="mb-8">
                            <div className="h-12 w-3/4 bg-white/10 rounded-lg animate-pulse mb-4" />
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="h-6 w-16 bg-white/5 rounded-full animate-pulse" />
                                <div className="h-4 w-12 bg-white/5 rounded animate-pulse" />
                                <div className="h-4 w-24 bg-white/5 rounded animate-pulse" />
                                <div className="h-4 w-20 bg-white/5 rounded animate-pulse" />
                            </div>
                        </div>

                        {/* Genres Skeleton */}
                        <div className="flex flex-wrap gap-2 mb-8">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-7 w-20 bg-white/5 rounded-lg animate-pulse" />
                            ))}
                        </div>

                        {/* Synopsis Skeleton */}
                        <div className="mb-10">
                            <div className="h-5 w-24 bg-white/10 rounded animate-pulse mb-3" />
                            <div className="space-y-2">
                                <div className="h-4 w-full bg-white/5 rounded animate-pulse" />
                                <div className="h-4 w-full bg-white/5 rounded animate-pulse" />
                                <div className="h-4 w-full bg-white/5 rounded animate-pulse" />
                                <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse" />
                            </div>
                        </div>

                        {/* Characters Skeleton */}
                        <div className="mb-10">
                            <div className="h-5 w-40 bg-white/10 rounded animate-pulse mb-4" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="flex bg-miru-surface rounded-xl overflow-hidden border border-white/5 animate-pulse">
                                        <div className="w-16 h-24 bg-white/5" />
                                        <div className="flex-1 p-3 flex flex-col justify-center gap-2">
                                            <div className="h-4 w-24 bg-white/10 rounded" />
                                            <div className="h-3 w-16 bg-white/5 rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Info Grid Skeleton */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-white/5 rounded-2xl border border-white/5">
                            {[...Array(4)].map((_, i) => (
                                <div key={i}>
                                    <div className="h-3 w-16 bg-white/5 rounded animate-pulse mb-2" />
                                    <div className="h-5 w-24 bg-white/10 rounded animate-pulse" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetailPageSkeleton;
