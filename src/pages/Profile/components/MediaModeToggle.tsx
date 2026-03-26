import React from 'react';
import { MediaMode } from '../hooks/useProfileData';

interface MediaModeToggleProps {
    mediaMode: MediaMode;
    setMediaMode: (mode: MediaMode) => void;
}

const MediaModeToggle: React.FC<MediaModeToggleProps> = ({ mediaMode, setMediaMode }) => {
    return (
        <div className="flex justify-center mt-6 pt-6 border-t border-white/5">
            <div className="inline-flex rounded-xl bg-white/5 p-1">
                <button
                    onClick={() => setMediaMode('anime')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        mediaMode === 'anime'
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                            : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm14.024-.983a1.125 1.125 0 0 1 0 1.966l-5.603 3.113A1.125 1.125 0 0 1 9 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113Z" clipRule="evenodd" />
                    </svg>
                    Anime
                </button>
                <button
                    onClick={() => setMediaMode('manga')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        mediaMode === 'manga'
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                            : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
                    </svg>
                    Manga
                </button>
                <button
                    onClick={() => setMediaMode('movies')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        mediaMode === 'movies'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                            : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path d="M19.5 6h-15v12h15V6zm-15-2h15a2 2 0 012 2v12a2 2 0 01-2 2h-15a2 2 0 01-2-2V6a2 2 0 012-2z" />
                        <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                    Movies
                </button>
            </div>
        </div>
    );
};

export default MediaModeToggle;
