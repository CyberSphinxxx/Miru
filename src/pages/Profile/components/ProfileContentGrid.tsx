import React from 'react';
import { useNavigate } from 'react-router-dom';
import AnimeCard from '../../../components/AnimeCard';
import MangaCard from '../../../components/MangaCard';
import MovieCard from '../../../components/MovieCard';
import { Anime } from '../../../types';
import { Manga } from '../../../types/manga';
import { Movie } from '../../../types/tmdb';
import { MediaMode, AnimeTab, MangaTab } from '../hooks/useProfileData';

interface ProfileContentGridProps {
    mediaMode: MediaMode;
    animeTab: AnimeTab;
    mangaTab: MangaTab;
    currentAnimeList: Anime[];
    currentMangaList: Manga[];
    currentMovieList: Movie[];
    handleRemoveFromWatchHistory: (id: number) => void;
    handleRemoveFromReadHistory: (id: number) => void;
}

const ProfileContentGrid: React.FC<ProfileContentGridProps> = ({
    mediaMode,
    animeTab,
    mangaTab,
    currentAnimeList,
    currentMangaList,
    currentMovieList,
    handleRemoveFromWatchHistory,
    handleRemoveFromReadHistory
}) => {
    const navigate = useNavigate();

    const handleAnimeCardClick = (anime: Anime) => {
        navigate(`/anime/${anime.id}`);
    };

    const handleMangaCardClick = (manga: Manga) => {
        navigate(`/manga/${manga.id}`);
    };

    const handleMovieCardClick = (movie: Movie) => {
        navigate(`/movies/${movie.id}`);
    };

    return (
        <div className="min-h-[400px] pb-16">
            {mediaMode === 'anime' ? (
                currentAnimeList.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                        {currentAnimeList.map(anime => (
                            <AnimeCard
                                key={anime.id}
                                anime={anime}
                                onClick={() => handleAnimeCardClick(anime)}
                                onDelete={animeTab === 'History' ? () => handleRemoveFromWatchHistory(anime.id) : undefined}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="h-80 flex flex-col items-center justify-center text-center px-4">
                        <div className="w-24 h-24 mb-6 text-gray-600/50">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={0.75} stroke="currentColor" className="w-full h-full">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-400 mb-2">
                            {animeTab === 'History' ? 'No watch history yet' : 'Your anime list is empty'}
                        </h3>
                        <p className="text-gray-500 mb-6 max-w-xs">
                            {animeTab === 'History'
                                ? 'Start watching anime to build your history.'
                                : 'Time to start an adventure! Add some anime to your watchlist.'}
                        </p>
                        <button
                            onClick={() => navigate('/trending')}
                            className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-colors shadow-lg shadow-purple-500/25 flex items-center gap-2"
                        >
                            Browse Trending Anime
                        </button>
                    </div>
                )
            ) : mediaMode === 'manga' ? (
                currentMangaList.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                        {currentMangaList.map(manga => (
                            <MangaCard
                                key={manga.id}
                                manga={manga}
                                onClick={() => handleMangaCardClick(manga)}
                                onDelete={mangaTab === 'History' ? () => handleRemoveFromReadHistory(manga.id) : undefined}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="h-80 flex flex-col items-center justify-center text-center px-4">
                        <div className="w-24 h-24 mb-6 text-gray-600/50">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={0.75} stroke="currentColor" className="w-full h-full">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-400 mb-2">
                            {mangaTab === 'History' ? 'No reading history yet' : 'Your manga list is empty'}
                        </h3>
                        <p className="text-gray-500 mb-6 max-w-xs">
                            {mangaTab === 'History'
                                ? 'Start reading manga to build your history.'
                                : 'Time to dive into some manga!'}
                        </p>
                        <button
                            onClick={() => navigate('/manga')}
                            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-colors shadow-lg shadow-emerald-500/25 flex items-center gap-2"
                        >
                            Browse Trending Manga
                        </button>
                    </div>
                )
            ) : (
                currentMovieList.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                        {currentMovieList.map(movie => (
                            <MovieCard
                                key={movie.id}
                                movie={movie}
                                onClick={() => handleMovieCardClick(movie)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="h-80 flex flex-col items-center justify-center text-center px-4">
                        <div className="w-24 h-24 mb-6 text-gray-600/50">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={0.75} stroke="currentColor" className="w-full h-full">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-400 mb-2">
                            Your movie list is empty
                        </h3>
                        <p className="text-gray-500 mb-6 max-w-xs">
                            Grab some popcorn! Add some movies to your watchlist.
                        </p>
                        <button
                            onClick={() => navigate('/movies')}
                            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors shadow-lg shadow-blue-500/25 flex items-center gap-2"
                        >
                            Browse Movies
                        </button>
                    </div>
                )
            )}
        </div>
    );
};

export default ProfileContentGrid;
