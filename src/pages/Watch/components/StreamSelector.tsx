import React from 'react';
import { StreamLink } from '../../../types';

interface StreamSelectorProps {
    streams: StreamLink[];
    selectedStreamIndex: number;
    isAutoQuality: boolean;
    onAutoQuality: () => void;
    onQualityChange: (idx: number) => void;
    handleReload: () => void;
    isAutoNextEnabled: boolean;
    toggleAutoNext: () => void;
    cinemaMode: boolean;
    setCinemaMode: (b: boolean) => void;
    setIsMobileEpisodeOpen: (b: boolean) => void;
}

const StreamSelector: React.FC<StreamSelectorProps> = ({
    streams,
    selectedStreamIndex,
    isAutoQuality,
    onAutoQuality,
    onQualityChange,
    handleReload,
    isAutoNextEnabled,
    toggleAutoNext,
    cinemaMode,
    setCinemaMode,
    setIsMobileEpisodeOpen
}) => {
    return (
        <div className="bg-miru-surface/95 backdrop-blur-md border-t border-white/5 px-2 sm:px-4 py-2 sm:py-3 flex-shrink-0">
            <div className="flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
                {/* Quality Pills */}
                {streams.length > 0 && (
                    <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        <span className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mr-1 hidden sm:block">Quality</span>
                        <button
                            onClick={onAutoQuality}
                            className={`pill-btn text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 ${isAutoQuality ? 'active' : ''}`}
                        >
                            AUTO
                        </button>
                        {streams.map((stream, idx) => (
                            <button
                                key={idx}
                                onClick={() => onQualityChange(idx)}
                                className={`pill-btn text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 ${selectedStreamIndex === idx && !isAutoQuality ? 'active' : ''}`}
                            >
                                {stream.quality}p
                            </button>
                        ))}
                    </div>
                )}

                {/* Utility Buttons */}
                <div className="flex items-center gap-1 sm:gap-2 ml-auto">
                    {/* Reload Button */}
                    <button
                        onClick={handleReload}
                        className="pill-btn text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5"
                        title="Reload stream"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 sm:w-3.5 sm:h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                        <span className="hidden sm:inline">Reload</span>
                    </button>

                    {/* Auto Play Toggle */}
                    <button
                        onClick={toggleAutoNext}
                        className={`pill-btn text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 ${isAutoNextEnabled ? 'accent' : ''}`}
                        title={isAutoNextEnabled ? 'Auto-play is ON' : 'Auto-play is OFF'}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 sm:w-3.5 sm:h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                        </svg>
                        <span className="hidden sm:inline">Auto Play</span>
                    </button>

                    {/* Cinema Mode Toggle */}
                    <button
                        onClick={() => setCinemaMode(!cinemaMode)}
                        className={`pill-btn text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 ${cinemaMode ? 'accent' : ''}`}
                        title={cinemaMode ? 'Turn lights on' : 'Turn lights off'}
                    >
                        {cinemaMode ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 sm:w-3.5 sm:h-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 sm:w-3.5 sm:h-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                            </svg>
                        )}
                        <span className="hidden sm:inline">{cinemaMode ? 'Lights On' : 'Cinema'}</span>
                    </button>

                    {/* Mobile Episodes Toggle Button */}
                    <button
                        onClick={() => setIsMobileEpisodeOpen(true)}
                        className="pill-btn text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 lg:hidden"
                        title="Show episodes"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 sm:w-3.5 sm:h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
                        </svg>
                        <span>Episodes</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StreamSelector;
