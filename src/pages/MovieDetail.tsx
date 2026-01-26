import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { movieService } from '../services/api/movies.api';
import { MovieDetail as MovieDetailType } from '../types/tmdb';
import MovieCard from '../components/MovieCard';
import MovieStatusButton from '../components/MovieStatusButton';
import LoadingSpinner from '../components/LoadingSpinner';

import { saveMovieProgress } from '../services/watchHistoryService';

function MovieDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [movie, setMovie] = useState<MovieDetailType | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);

    // Derived state for easy access
    const recommendations = movie?.recommendations?.results || [];
    const cast = movie?.credits?.cast || [];

    useEffect(() => {
        const fetchDetail = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const data = await movieService.getDetail(Number(id));
                setMovie(data);
                // Scroll to top on new movie load
                window.scrollTo(0, 0);
            } catch (error) {
                console.error("Failed to load movie details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    const handlePlayClick = () => {
        setIsPlaying(true);
        if (movie) {
            // Save initial progress of 5% to mark as started/continue watching
            saveMovieProgress(movie, 5);
        }

        // Scroll to player immediately after render
        requestAnimationFrame(() => {
            const playerElement = document.getElementById('movie-player-container');
            if (playerElement) {
                playerElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    };

    const handleBack = () => {
        navigate('/movies');
    };

    if (loading) return <div className="min-h-screen pt-24 flex justify-center"><LoadingSpinner /></div>;
    if (!movie) return <div className="min-h-screen pt-24 text-center text-white">Movie not found</div>;

    const bannerImage = movie.backdrop_path
        ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
        : movie.poster_path
            ? `https://image.tmdb.org/t/p/original${movie.poster_path}`
            : '';

    const posterImage = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : 'https://via.placeholder.com/300x450';

    return (
        <div className="min-h-screen bg-miru-bg animate-fade-in pb-20">
            {/* Banner Section */}
            <div className={`relative w-full transition-all duration-700 ${isPlaying ? 'h-[0vh] opacity-0 overflow-hidden' : 'h-[60vh]'}`}>
                <div className="absolute inset-0">
                    <img
                        src={bannerImage}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-miru-bg via-miru-bg/60 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-miru-bg to-transparent" />
                </div>

                <button
                    onClick={handleBack}
                    className="absolute top-24 left-6 z-50 p-3 bg-black/50 hover:bg-white/20 rounded-full backdrop-blur-sm transition-colors text-white group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 group-hover:-translate-x-1 transition-transform">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                </button>
            </div>

            {/* Player Section */}
            {isPlaying && (
                <div id="movie-player-container" className="w-full h-[85vh] bg-black relative animate-fade-in pt-20">
                    <button
                        onClick={() => setIsPlaying(false)}
                        className="absolute top-24 left-6 z-50 p-2 bg-white/10 hover:bg-white/20 rounded text-white text-sm font-medium flex items-center gap-2 backdrop-blur-md"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Close Player
                    </button>
                    <iframe
                        src={`https://player.videasy.net/movie/${movie.id}?color=8B5CF6`}
                        className="w-full h-full border-0"
                        allowFullScreen
                        allow="autoplay; encrypted-media; picture-in-picture"
                        loading="eager"
                        referrerPolicy="origin"
                        title={movie.title}
                    />
                </div>
            )}


            {/* Content Section */}
            <div className={`container mx-auto px-6 relative z-10 transition-all duration-500 ${isPlaying ? 'mt-8' : '-mt-32'}`}>
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Portrait Cover */}
                    {!isPlaying && (
                        <div className="flex-shrink-0 mx-auto md:mx-0 w-64 md:w-72">
                            <div className="rounded-xl overflow-hidden shadow-2xl shadow-miru-primary/20">
                                <img
                                    src={posterImage}
                                    alt={movie.title}
                                    className="w-full h-full object-cover aspect-[2/3]"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3 mt-6">
                                <button
                                    onClick={handlePlayClick}
                                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-miru-primary to-miru-accent text-white font-bold shadow-lg shadow-miru-primary/25 hover:shadow-miru-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                        <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                                    </svg>
                                    Play Movie
                                </button>
                                <MovieStatusButton movie={movie} />
                            </div>
                        </div>
                    )}

                    {/* Details Column */}
                    <div className="flex-1 pt-4 md:pt-8 text-center md:text-left space-y-4">
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight">
                            {movie.title}
                        </h1>
                        {movie.tagline && <p className="text-xl text-gray-400 italic font-light">"{movie.tagline}"</p>}

                        {/* Badges */}
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-sm">
                            <span className="bg-miru-primary text-black px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                </svg>
                                {movie.vote_average.toFixed(1)}
                            </span>
                            <span className="px-2.5 py-1 bg-white/10 rounded text-gray-300 text-xs">
                                {new Date(movie.release_date).getFullYear()}
                            </span>
                            <span className="px-2.5 py-1 bg-white/10 rounded text-gray-300 text-xs">
                                {movie.runtime} min
                            </span>
                            <span className="px-2.5 py-1 bg-white/10 rounded text-gray-300 text-xs">
                                {movie.status}
                            </span>
                        </div>

                        {/* Genres */}
                        <div className="flex flex-wrap justify-center md:justify-start gap-2">
                            {movie.genres?.map(genre => (
                                <span key={genre.id} className="px-3 py-1 rounded-lg bg-miru-surface-light border border-white/5 text-xs font-semibold text-gray-300 hover:text-white transition-colors cursor-default">
                                    {genre.name}
                                </span>
                            ))}
                        </div>

                        {/* Overview */}
                        <div className="mb-8 mt-6">
                            <h3 className="text-xl font-bold text-white mb-2">Synopsis</h3>
                            <p className="text-gray-400 leading-relaxed text-base md:text-lg text-left">
                                {movie.overview}
                            </p>
                        </div>

                        {/* Cast */}
                        {cast.length > 0 && (
                            <div className="py-6 border-t border-white/10">
                                <h3 className="text-xl font-bold text-white mb-4">Cast</h3>
                                <div className="flex gap-4 overflow-x-auto pb-4 snap-x custom-scrollbar">
                                    {cast.slice(0, 10).map((person) => (
                                        <div key={person.id} className="flex-shrink-0 w-32 snap-start">
                                            <div className="rounded-lg overflow-hidden bg-miru-surface border border-white/5 aspect-[2/3] mb-2">
                                                {person.profile_path ? (
                                                    <img
                                                        src={`https://image.tmdb.org/t/p/w200${person.profile_path}`}
                                                        alt={person.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500 text-xs text-center p-2">No Image</div>
                                                )}
                                            </div>
                                            <p className="font-bold text-sm text-white line-clamp-1">{person.name}</p>
                                            <p className="text-xs text-gray-400 line-clamp-1">{person.character}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recommendations */}
                        {recommendations.length > 0 && (
                            <div className="py-6 border-t border-white/10">
                                <h3 className="text-xl font-bold text-white mb-4">You might also like</h3>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {recommendations.slice(0, 4).map(rec => (
                                        <div key={rec.id} className="w-full">
                                            <MovieCard
                                                movie={rec}
                                                onClick={() => {
                                                    navigate(`/movies/${rec.id}`);
                                                    window.scrollTo(0, 0);
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MovieDetail;
