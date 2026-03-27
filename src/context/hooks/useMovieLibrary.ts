import { useCallback } from 'react';
import { Movie } from '../../types/tmdb';
import { UserData, MovieLibraryStatus } from '../../types/user';
import { INITIAL_DATA } from '../userUtils';

export const useMovieLibrary = (
    userData: UserData,
    updateUserData: (newData: UserData) => void
) => {
    /**
     * Adds or moves a movie to a specific list.
     */
    const updateMovieStatus = useCallback((movie: Movie, newStatus: MovieLibraryStatus) => {
        const newMovieLibrary = { ...(userData.movieLibrary || INITIAL_DATA.movieLibrary) };
        const movieId = movie.id;

        // Remove from ALL lists
        (Object.keys(newMovieLibrary) as MovieLibraryStatus[]).forEach(status => {
            newMovieLibrary[status] = (newMovieLibrary[status] || []).filter(entry => entry.movie.id !== movieId);
        });

        // Add to the new list
        newMovieLibrary[newStatus].push({
            movie,
            addedAt: new Date().toISOString()
        });

        const newData = {
            ...userData,
            movieLibrary: newMovieLibrary
        };

        updateUserData(newData);
    }, [userData, updateUserData]);

    /**
     * Removes a movie from the library entirely.
     */
    const removeFromMovieLibrary = useCallback((movieId: number) => {
        const newMovieLibrary = { ...(userData.movieLibrary || INITIAL_DATA.movieLibrary) };

        (Object.keys(newMovieLibrary) as MovieLibraryStatus[]).forEach(status => {
            newMovieLibrary[status] = (newMovieLibrary[status] || []).filter(entry => entry.movie.id !== movieId);
        });

        const newData = {
            ...userData,
            movieLibrary: newMovieLibrary
        };

        updateUserData(newData);
    }, [userData, updateUserData]);

    /**
     * Returns the current status of a movie.
     */
    const getMovieStatus = useCallback((movieId: number): MovieLibraryStatus | null => {
        const movieLibrary = userData.movieLibrary || INITIAL_DATA.movieLibrary;
        const statuses = Object.keys(movieLibrary) as MovieLibraryStatus[];

        for (const status of statuses) {
            if ((movieLibrary[status] || []).some(entry => entry.movie.id === movieId)) {
                return status;
            }
        }

        return null;
    }, [userData.movieLibrary]);

    return {
        updateMovieStatus,
        removeFromMovieLibrary,
        getMovieStatus
    };
};
