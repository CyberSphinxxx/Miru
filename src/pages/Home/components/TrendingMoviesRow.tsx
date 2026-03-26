import MovieCard from '../../../components/MovieCard';
import { Movie } from '../../../types/tmdb';

interface Props {
    trendingMovies: Movie[];
    navigate: (path: string) => void;
}

export default function TrendingMoviesRow({ trendingMovies, navigate }: Props) {
    if (trendingMovies.length === 0) return null;

    return (
        <section className="mb-12 animate-fade-in">
            <div className="content-row-header">
                <h2 className="content-row-title flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-400">
                        <path d="M19.5 6h-15v12h15V6zm-15-2h15a2 2 0 012 2v12a2 2 0 01-2 2h-15a2 2 0 01-2-2V6a2 2 0 012-2z" />
                        <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                    Trending Movies
                </h2>
                <button
                    onClick={() => navigate('/movies')}
                    className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                >
                    View All
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                </button>
            </div>
            <div className="horizontal-scroll gap-4 py-4">
                {trendingMovies.slice(0, 10).map(movie => (
                    <div key={movie.id} className="flex-shrink-0 w-56 md:w-64">
                        <MovieCard
                            movie={movie}
                            onClick={() => navigate(`/movies/${movie.id}`)}
                            onPlayClick={() => navigate(`/watch/movie/${movie.id}`)}
                        />
                    </div>
                ))}
            </div>
        </section>
    );
}
