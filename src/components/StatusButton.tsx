import React, { useState, useRef, useEffect } from 'react';
import { useLocalUser, LibraryStatus } from '../context/UserContext';
import { Anime } from '../types';

interface StatusButtonProps {
    anime: Anime;
    className?: string; // Allow custom styling positioning
}

const StatusButton: React.FC<StatusButtonProps> = ({ anime, className = '' }) => {
    const { updateStatus, getAnimeStatus, removeFromLibrary } = useLocalUser();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentStatus = getAnimeStatus(anime.mal_id);

    // Format status for display (e.g., 'plan_to_watch' -> 'Plan to Watch')
    const formatStatus = (status: LibraryStatus) => {
        return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    // Toggle dropdown
    const toggleDropdown = () => setIsOpen(!isOpen);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleStatusChange = (status: LibraryStatus) => {
        updateStatus(anime, status);
        setIsOpen(false);
    };

    const handleRemove = () => {
        removeFromLibrary(anime.mal_id);
        setIsOpen(false);
    };

    const statuses: LibraryStatus[] = ['watching', 'completed', 'plan_to_watch', 'on_hold', 'dropped'];

    // If not in library, show simple "Add to List" button
    if (!currentStatus) {
        return (
            <div className={`relative ${className}`} ref={dropdownRef}>
                <button
                    onClick={toggleDropdown}
                    className="w-full py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/30 text-white font-bold transition-all flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add to List
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-miru-surface/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-2 z-50 animate-fade-in-up origin-top">
                        {statuses.map(status => (
                            <button
                                key={status}
                                onClick={() => handleStatusChange(status)}
                                className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                            >
                                {status === 'watching' && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                                {status === 'completed' && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                                {status === 'plan_to_watch' && <span className="w-2 h-2 rounded-full bg-gray-500"></span>}
                                {status === 'on_hold' && <span className="w-2 h-2 rounded-full bg-yellow-500"></span>}
                                {status === 'dropped' && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                                {formatStatus(status)}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // If in library, show current status with dropdown
    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                onClick={toggleDropdown}
                className="w-full py-3.5 rounded-xl bg-miru-surface border border-miru-primary/50 text-miru-primary font-bold hover:bg-miru-primary/10 transition-all flex items-center justify-center gap-2"
            >
                {currentStatus === 'watching' && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                        <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clipRule="evenodd" />
                    </svg>
                )}
                {currentStatus === 'completed' && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                    </svg>
                )}
                {formatStatus(currentStatus)}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-miru-surface/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-2 z-50 animate-fade-in-up origin-top">
                    {statuses.map(status => (
                        <button
                            key={status}
                            onClick={() => handleStatusChange(status)}
                            className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-2 ${currentStatus === status ? 'text-miru-primary bg-miru-primary/10 font-bold' : 'text-gray-300 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            {status === 'watching' && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                            {status === 'completed' && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                            {status === 'plan_to_watch' && <span className="w-2 h-2 rounded-full bg-gray-500"></span>}
                            {status === 'on_hold' && <span className="w-2 h-2 rounded-full bg-yellow-500"></span>}
                            {status === 'dropped' && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                            {formatStatus(status)}
                            {currentStatus === status && (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 ml-auto">
                                    <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                                </svg>
                            )}
                        </button>
                    ))}

                    <div className="h-px bg-white/10 my-1 mx-2"></div>

                    <button
                        onClick={handleRemove}
                        className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                        Remove from Library
                    </button>
                </div>
            )}
        </div>
    );
};

export default StatusButton;
