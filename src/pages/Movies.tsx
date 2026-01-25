import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import LoadingSpinner from '../components/LoadingSpinner';
import HeroCarousel, { SpotlightItem } from '../components/HeroCarousel';
import { movieService } from '../services/api/movies.api';
import { Movie } from '../types/tmdb';

function Movies() {
    const navigate = useNavigate();
    const [trending, setTrending] = useState<Movie[]>([]);
    const [popular, setPopular] = useState<Movie[]>([]);
    const [topRated, setTopRated] = useState<Movie[]>([]);
    const [nowPlaying, setNowPlaying] = useState<Movie[]>([]);
    const [spotlightItems, setSpotlightItems] = useState<SpotlightItem[]>([]);
    const [loading, setLoading] = useState(true);

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

    const renderSection = (title: string, movies: Movie[]) => (
        <section className="mb-12 animate-fade-in">
            <div className="content-row-header mb-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span className="w-1 h-6 rounded-full bg-miru-accent"></span>
                    {title}
                </h2>
            </div>
            <div className="horizontal-scroll pb-4 -mx-4 px-4">
                <div className="flex gap-4">
                    {movies.map(movie => (
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

    if (loading) return <div className="min-h-screen pt-24 flex justify-center"><LoadingSpinner /></div>;

    return (
        <div className="min-h-screen pb-12">
            <HeroCarousel items={spotlightItems} />

            <div className="container mx-auto px-6 pt-12">
                <h1 className="text-4xl font-black mb-8 text-white drop-shadow-lg">Movies</h1>

                {renderSection("Trending Now", trending)}
                {renderSection("Now Playing in Theaters", nowPlaying)}
                {renderSection("Popular", popular)}
                {renderSection("Top Rated", topRated)}
            </div>
        </div>
    );
}

export default Movies;
