import React, { useState, useRef, useEffect } from 'react';
import { useLocalUser, LibraryStatus } from '../context/UserContext';
import { Anime } from '../types';

interface QuickAddDropdownProps {
    anime: Anime;
    className?: string;
}

const QuickAddDropdown: React.FC<QuickAddDropdownProps> = ({ anime, className = '' }) => {
    const { updateStatus, getAnimeStatus, removeFromLibrary } = useLocalUser();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentStatus = getAnimeStatus(anime.mal_id);

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

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    const handleStatusChange = (e: React.MouseEvent, status: LibraryStatus) => {
        e.stopPropagation();
        updateStatus(anime, status);
        setIsOpen(false);
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        removeFromLibrary(anime.mal_id);
        setIsOpen(false);
    };

    const statuses: { key: LibraryStatus; label: string; color: string }[] = [
        { key: 'watching', label: 'Watching', color: 'bg-green-500' },
        { key: 'completed', label: 'Completed', color: 'bg-blue-500' },
        { key: 'plan_to_watch', label: 'Plan to Watch', color: 'bg-gray-500' },
        { key: 'on_hold', label: 'On Hold', color: 'bg-yellow-500' },
        { key: 'dropped', label: 'Dropped', color: 'bg-red-500' },
    ];

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                onClick={handleToggle}
                className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all shadow-lg shrink-0 ${currentStatus
                        ? 'bg-miru-primary/30 border-miru-primary text-miru-primary'
                        : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
                    }`}
                title={currentStatus ? statuses.find(s => s.key === currentStatus)?.label : 'Add to list'}
            >
                {currentStatus ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 0 1 1.04-.208Z" clipRule="evenodd" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                )}
            </button>

            {isOpen && (
                <div
                    className="absolute bottom-full right-0 mb-2 w-40 bg-miru-surface/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1.5 z-50 animate-fade-in-up origin-bottom-right"
                    onClick={(e) => e.stopPropagation()}
                >
                    {statuses.map(status => (
                        <button
                            key={status.key}
                            onClick={(e) => handleStatusChange(e, status.key)}
                            className={`w-full px-3 py-2 text-left text-xs transition-colors flex items-center gap-2 ${currentStatus === status.key
                                    ? 'text-miru-primary bg-miru-primary/10 font-bold'
                                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${status.color}`}></span>
                            {status.label}
                            {currentStatus === status.key && (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 ml-auto">
                                    <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                                </svg>
                            )}
                        </button>
                    ))}

                    {currentStatus && (
                        <>
                            <div className="h-px bg-white/10 my-1 mx-2"></div>
                            <button
                                onClick={handleRemove}
                                className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Remove
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default QuickAddDropdown;
