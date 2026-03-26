import GenreCard from '../../../components/GenreCard';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { Genre } from '../../../types';

interface Props {
    genres: Genre[];
    genresLoading: boolean;
    genreFilter: string;
    setGenreFilter: (f: string) => void;
    showAllGenres: boolean;
    setShowAllGenres: (b: boolean) => void;
    onGenreClick: (id: number) => void;
}

export default function GenreSelectorView({
    genres,
    genresLoading,
    genreFilter,
    setGenreFilter,
    showAllGenres,
    setShowAllGenres,
    onGenreClick
}: Props) {
    return (
        <div className="mb-8 animate-fade-in">
            <h2 className="text-3xl font-black mb-2 text-gradient">Browse by Genre</h2>
            <p className="text-gray-500 text-sm mb-6">Select a genre to explore</p>

            {/* Genre Search Filter */}
            <div className="relative max-w-md mx-auto mb-8">
                <input
                    type="text"
                    value={genreFilter}
                    onChange={(e) => setGenreFilter(e.target.value)}
                    placeholder="Filter genres... (e.g., 'Horror', 'Slice of Life')"
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-miru-accent focus:ring-2 focus:ring-miru-accent/20 transition-all"
                />
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
                    </svg>
                </div>
                {genreFilter && (
                    <button
                        onClick={() => setGenreFilter('')}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {genresLoading ? (
                <div className="flex justify-center py-12">
                    <LoadingSpinner size="lg" text="Loading genres..." />
                </div>
            ) : (() => {
                const filteredGenres = genres.filter(g =>
                    g.name.toLowerCase().includes(genreFilter.toLowerCase())
                );

                if (filteredGenres.length === 0) {
                    return (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-500">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                                </svg>
                            </div>
                            <p className="text-gray-400 mb-2">No genres found matching "{genreFilter}"</p>
                            <button
                                onClick={() => setGenreFilter('')}
                                className="text-miru-accent hover:underline text-sm"
                            >
                                Clear filter
                            </button>
                        </div>
                    );
                }

                const displayedGenres = showAllGenres ? filteredGenres : filteredGenres.slice(0, 20);
                const hasMore = filteredGenres.length > 20;

                return (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {displayedGenres.map((genre, index) => (
                                <GenreCard
                                    key={genre.id}
                                    genre={genre}
                                    onClick={() => onGenreClick(genre.id)}
                                    index={index}
                                />
                            ))}
                        </div>

                        {!showAllGenres && hasMore && (
                            <div className="flex justify-center mt-8">
                                <button
                                    onClick={() => setShowAllGenres(true)}
                                    className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium transition-all flex items-center gap-2"
                                >
                                    <span>Show All Genres ({filteredGenres.length})</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </>
                );
            })()}
        </div>
    );
}
