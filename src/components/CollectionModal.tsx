import React, { useEffect, useState } from 'react';
import { movieService } from '../services/api/movies.api';
import { CollectionDetail, Movie } from '../types/tmdb';
import MovieCard from './MovieCard';
import { useNavigate } from 'react-router-dom';

interface CollectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    collectionId: number | null;
}

const CollectionModal: React.FC<CollectionModalProps> = ({ isOpen, onClose, collectionId }) => {
    const [collection, setCollection] = useState<CollectionDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen && collectionId) {
            const fetchCollection = async () => {
                setLoading(true);
                try {
                    const data = await movieService.getCollection(collectionId);
                    // Sort parts by release date
                    if (data.parts) {
                        data.parts.sort((a, b) => {
                            if (!a.release_date) return 1;
                            if (!b.release_date) return -1;
                            return new Date(a.release_date).getTime() - new Date(b.release_date).getTime();
                        });
                    }
                    setCollection(data);
                } catch (error) {
                    console.error("Failed to load collection", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchCollection();
        } else {
            setCollection(null);
        }
    }, [isOpen, collectionId]);

    const handleMovieClick = (movie: Movie) => {
        onClose();
        navigate(`/movies/${movie.id}`);
        window.scrollTo(0, 0);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-5xl bg-miru-surface rounded-2xl overflow-hidden shadow-2xl border border-white/10 max-h-[90vh] flex flex-col animate-fade-in-up">

                {/* Header with Close Button */}
                <div className="absolute top-4 right-4 z-10">
                    <button
                        onClick={onClose}
                        className="p-2 bg-black/50 hover:bg-white/20 rounded-full text-white transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {loading ? (
                    <div className="p-20 flex justify-center">
                        <div className="w-10 h-10 border-4 border-miru-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : collection ? (
                    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
                        {/* Banner for Collection */}
                        {collection.backdrop_path && (
                            <div className="relative h-48 md:h-64 flex-shrink-0">
                                <img
                                    src={`https://image.tmdb.org/t/p/original${collection.backdrop_path}`}
                                    alt={collection.name}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-miru-surface via-miru-surface/60 to-transparent" />
                                <div className="absolute bottom-0 left-0 p-6 md:p-8">
                                    <h2 className="text-3xl md:text-4xl font-black text-white">{collection.name}</h2>
                                    {collection.parts && (
                                        <p className="text-gray-300 mt-2 font-medium">{collection.parts.length} Movies</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {!collection.backdrop_path && (
                            <div className="p-6 md:p-8 border-b border-white/10 bg-miru-surface-light">
                                <h2 className="text-3xl font-black text-white">{collection.name}</h2>
                            </div>
                        )}

                        <div className="p-6 md:p-8 space-y-8">
                            {/* Overview */}
                            {collection.overview && (
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Overview</h3>
                                    <p className="text-gray-400 leading-relaxed">{collection.overview}</p>
                                </div>
                            )}

                            {/* Movies Grid */}
                            <div>
                                <h3 className="text-xl font-bold text-white mb-4">Movies in Collection</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {collection.parts?.map(movie => (
                                        <div key={movie.id}>
                                            <MovieCard
                                                movie={movie}
                                                onClick={() => handleMovieClick(movie)}
                                            />
                                            <p className="mt-2 text-center text-xs text-gray-500">
                                                {movie.release_date ? new Date(movie.release_date).getFullYear() : 'TBA'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-10 text-center text-red-500">Failed to load collection details.</div>
                )}
            </div>
        </div>
    );
};

export default CollectionModal;
