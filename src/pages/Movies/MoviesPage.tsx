import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MovieCard from '../../components/MovieCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import HeroCarousel, { SpotlightItem } from '../../components/HeroCarousel';
import GenreFilter, { MOVIE_GENRES } from '../../components/GenreFilter';
import { movieService } from '../../services/api/movies.api';
import { getWatchHistory, WatchHistoryItem } from '../../services/watchHistoryService';
import { Movie } from '../../types/tmdb';
import { useLocalUser } from '../../context/UserContext';

function Movies() {
    const navigate = useNavigate();
    const { userData } = useLocalUser();
    const { showNSFW } = userData.settings;

    const [trending, setTrending] = useState<Movie[]>([]);
    const [popular, setPopular] = useState<Movie[]>([]);
    const [topRated, setTopRated] = useState<Movie[]>([]);
    const [nowPlaying, setNowPlaying] = useState<Movie[]>([]);
    const [spotlightItems, setSpotlightItems] = useState<SpotlightItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Genre Filter State
    const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
    const [genreMovies, setGenreMovies] = useState<Movie[]>([]);
    const [continueWatching, setContinueWatching] = useState<WatchHistoryItem[]>([]);
    const [isGenreLoading, setIsGenreLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isMoreLoading, setIsMoreLoading] = useState(false);

    // Helper to filter movies based on settings
    const filterMovies = (movies: Movie[]) => {
        if (showNSFW) return movies;
        return movies.filter(m => !m.adult);
    };

    // Load History on Mount
    useEffect(() => {
        const history = getWatchHistory().filter(item => item.type === 'movie');
        setContinueWatching(history);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [trend, pop, top, now] = await Promise.all([
                    movieService.getTrending(),
                    movieService.getPopular(),
                    movieService.getTopRated(),
                    movieService.getNowPlaying(),
                ]);
                setTrending(trend);
                setPopular(pop.results);
                setTopRated(top.results);
                setNowPlaying(now.results);

                // Prepare spotlight items from trending movies
                const spotlights: SpotlightItem[] = trend.slice(0, 5).map(movie => ({
                    type: 'movie',
                    data: movie
                }));
                setSpotlightItems(spotlights);

            } catch (error) {
                console.error("Failed to fetch movies", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleMovieClick = (movie: Movie) => {
        navigate(`/movies/${movie.id}`);
    };

    const handleGenreSelect = async (genreId: number) => {
        if (selectedGenre === genreId) {
            setSelectedGenre(null);
            setGenreMovies([]);
            setCurrentPage(1);
            return;
        }

        setSelectedGenre(genreId);
        setCurrentPage(1);
        setIsGenreLoading(true);
        setGenreMovies([]); // Clear previous results immediately

        try {
            const response = await movieService.getByGenre(genreId, 1);
            setGenreMovies(response.results);
            setTotalPages(response.total_pages);
        } catch (error) {
            console.error("Failed to fetch genre movies", error);
        } finally {
            setIsGenreLoading(false);
        }
    };

    const handleLoadMore = async () => {
        if (!selectedGenre || currentPage >= totalPages || isMoreLoading) return;

        setIsMoreLoading(true);
        const nextPage = currentPage + 1;
        try {
            const response = await movieService.getByGenre(selectedGenre, nextPage);
            setGenreMovies(prev => [...prev, ...response.results]);
            setCurrentPage(nextPage);
        } catch (error) {
            console.error("Failed to fetch more movies", error);
        } finally {
            setIsMoreLoading(false);
        }
    };

    const renderSection = (title: string, movies: Movie[]) => {
        const filtered = filterMovies(movies);
        if (filtered.length === 0) return null;

        return (
            <section className="mb-12 animate-fade-in">
                <div className="content-row-header mb-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <span className="w-1 h-6 rounded-full bg-miru-accent"></span>
                        {title}
                    </h2>
                </div>
                <div className="horizontal-scroll pb-4 -mx-4 px-4">
                    <div className="flex gap-4">
                        {filtered.map(movie => (
                            <div key={movie.id} className="flex-shrink-0 w-40 md:w-48 lg:w-56">
                                <MovieCard
                                    movie={movie}
                                    onClick={() => handleMovieClick(movie)}
                                    onPlayClick={() => handleMovieClick(movie)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    };

    if (loading) return <div className="min-h-screen pt-24 flex justify-center"><LoadingSpinner /></div>;

    const filteredSpotlights = showNSFW
        ? spotlightItems
        : spotlightItems.filter(item => {
            if (item.type === 'movie') {
                return !(item.data as Movie).adult;
            }
            return true;
        });

    return (
        <div className="min-h-screen pb-12">
            <HeroCarousel items={filteredSpotlights} />

            <div className="container mx-auto px-6 pt-12">
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-8">
                    <h1 className="text-4xl font-black text-white drop-shadow-lg leading-none">Movies</h1>
                </div>

                <GenreFilter selectedGenre={selectedGenre} onSelect={handleGenreSelect} />

                {selectedGenre ? (
                    <div className="animate-fade-in">
                        <div className="flex items-center gap-3 mb-6">
                            <h2 className="text-2xl font-bold text-white">
                                {MOVIE_GENRES.find(g => g.id === selectedGenre)?.name} Movies
                            </h2>
                            <span className="text-sm text-gray-400 bg-white/5 px-3 py-1 rounded-full">
                                {filterMovies(genreMovies).length} Results
                            </span>
                        </div>

                        {isGenreLoading ? (
                            <div className="h-64 flex justify-center items-center">
                                <LoadingSpinner />
                            </div>
                        ) : filterMovies(genreMovies).length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                {filterMovies(genreMovies).map(movie => (
                                    <div key={movie.id} className="animate-fade-in-up">
                                        <MovieCard
                                            movie={movie}
                                            onClick={() => handleMovieClick(movie)}
                                            onPlayClick={() => handleMovieClick(movie)}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-400 py-12 bg-white/5 rounded-xl">
                                <p className="text-lg">No movies found this genre.</p>
                            </div>
                        )}

                        {/* Load More Button */}
                        {filterMovies(genreMovies).length > 0 && currentPage < totalPages && (
                            <div className="flex justify-center mt-12 pb-8">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={isMoreLoading}
                                    className="px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isMoreLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        "Load More"
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Continue Watching Section */}
                        {continueWatching.length > 0 && (
                            <section className="mb-12 animate-fade-in">
                                <div className="content-row-header mb-4">
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                        <span className="w-1 h-6 rounded-full bg-miru-accent"></span>
                                        Continue Watching
                                    </h2>
                                </div>
                                <div className="horizontal-scroll pb-4 -mx-4 px-4">
                                    <div className="flex gap-4">
                                        {continueWatching.map(item => (
                                            <div key={item.id} className="flex-shrink-0 w-40 md:w-48 lg:w-56">
                                                <MovieCard
                                                    movie={{
                                                        id: item.id,
                                                        title: item.title,
                                                        poster_path: item.image_url.replace('https://image.tmdb.org/t/p/w500', ''), // Hack to reuse card logic or just pass full url if updated
                                                        backdrop_path: null,
                                                        overview: item.synopsis || '',
                                                        release_date: item.release_date || '',
                                                        vote_average: item.score || 0,
                                                        vote_count: 0,
                                                        popularity: 0,
                                                        adult: false,
                                                        original_title: item.title,
                                                        genre_ids: item.genres?.map(g => g.id) || []
                                                    }}
                                                    onClick={() => navigate(`/movies/${item.id}`)}
                                                    progress={item.progress}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}

                        {renderSection("Trending Now", trending)}
                        {renderSection("Now Playing in Theaters", nowPlaying)}
                        {renderSection("Popular", popular)}
                        {renderSection("Top Rated", topRated)}
                    </>
                )}
            </div>
        </div>
    );
}

export default Movies;
