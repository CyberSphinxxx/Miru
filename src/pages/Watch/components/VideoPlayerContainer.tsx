import React from 'react';
import { Episode, StreamLink } from '../../../types';
import LoadingSpinner from '../../../components/LoadingSpinner';
import VideoPlayer from '../../../components/VideoPlayer';

interface VideoPlayerContainerProps {
    streamLoading: boolean;
    streams: StreamLink[];
    currentStream: StreamLink | undefined;
    hasNext: boolean;
    showAutoNext: boolean;
    setShowAutoNext: (s: boolean) => void;
    episodes: Episode[];
    currentEpisodeIndex: number;
    isAutoNextEnabled: boolean;
    countdown: number;
    initialTime?: number;
    onTimeUpdate?: (time: number) => void;
    handleNextEpisode: () => void;
    cancelAutoNext: () => void;
    toggleAutoNext: () => void;
    externalUrl?: string | null;
    currentEpisode: Episode | null;
}

const VideoPlayerContainer: React.FC<VideoPlayerContainerProps> = ({
    streamLoading,
    streams,
    currentStream,
    hasNext,
    showAutoNext,
    setShowAutoNext,
    episodes,
    currentEpisodeIndex,
    isAutoNextEnabled,
    countdown,
    initialTime,
    onTimeUpdate,
    handleNextEpisode,
    cancelAutoNext,
    toggleAutoNext,
    externalUrl,
    currentEpisode
}) => {
    return (
        <div className="w-full bg-black relative flex-shrink-0 flex justify-center">
            <div className="w-full max-w-[1400px] aspect-video relative">
                {streamLoading ? (
                    <div className="w-full h-full flex items-center justify-center">
                        <LoadingSpinner size="lg" text="Loading stream..." />
                    </div>
                ) : streams.length > 0 && currentStream ? (
                    <div className="absolute inset-0">
                        {/* Check if direct stream (HLS/MP4) or Embed */}
                        {currentStream.url.includes('.m3u8') || currentStream.url.includes('.mp4') || currentStream.isHls ? (
                            <VideoPlayer
                                key={currentStream.url} // Re-mount on url change
                                src={currentStream.url}
                                isHls={currentStream.isHls || currentStream.url.includes('.m3u8')}
                                initialTime={initialTime}
                                onTimeUpdate={onTimeUpdate}
                                onEnded={() => {
                                    // Trigger auto-next overlay instead of immediate play
                                    if (hasNext) {
                                        setShowAutoNext(true);
                                    }
                                }}
                                autoPlay={true}
                            />
                        ) : (
                            <iframe
                                key={currentStream.url}
                                src={currentStream.url}
                                className="w-full h-full border-0"
                                allowFullScreen
                                allow="autoplay; fullscreen"
                            />
                        )}

                        {/* Auto Next Overlay */}
                        {showAutoNext && hasNext && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden">
                                {/* Background Image (Next Episode) */}
                                {episodes[currentEpisodeIndex + 1]?.snapshot || episodes[currentEpisodeIndex + 1]?.image ? (
                                    <div
                                        className="absolute inset-0 bg-cover bg-center opacity-40 blur-xl scale-110"
                                        style={{ backgroundImage: `url(${episodes[currentEpisodeIndex + 1]?.snapshot || episodes[currentEpisodeIndex + 1]?.image})` }}
                                    />
                                ) : (
                                    // Fallback gradient if no image
                                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black opacity-90" />
                                )}

                                {/* Dark overlay for readability */}
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

                                {/* Content */}
                                <div className="relative z-10 w-full max-w-2xl px-8 flex flex-col md:flex-row items-center gap-8 md:gap-12 animate-in fade-in zoom-in-95 duration-500">

                                    {/* Left: Thumbnail & Countdown */}
                                    <div className="relative group shrink-0 w-full md:w-auto flex justify-center">
                                        <div className="relative w-64 aspect-video rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-black/50">
                                            {episodes[currentEpisodeIndex + 1]?.snapshot || episodes[currentEpisodeIndex + 1]?.image ? (
                                                <img
                                                    src={episodes[currentEpisodeIndex + 1]?.snapshot || episodes[currentEpisodeIndex + 1]?.image}
                                                    alt="Next Episode"
                                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-white/5">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-white/20">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                                    </svg>
                                                </div>
                                            )}

                                            {/* Countdown Overlay on Thumbnail */}
                                            {isAutoNextEnabled && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                                                    <div className="relative w-16 h-16 flex items-center justify-center">
                                                        <svg className="w-full h-full -rotate-90 transform drop-shadow-lg" viewBox="0 0 36 36">
                                                            <path
                                                                className="text-white/20"
                                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="3"
                                                            />
                                                            <path
                                                                className="text-miru-primary transition-all duration-1000 ease-linear"
                                                                strokeDasharray={`${(countdown / 5) * 100}, 100`}
                                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="3"
                                                            />
                                                        </svg>
                                                        <span className="absolute text-2xl font-bold text-white drop-shadow-md">{countdown}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Info & Actions */}
                                    <div className="flex flex-col items-center md:items-start text-center md:text-left flex-1 min-w-0">
                                        <h3 className="text-gray-400 text-xs sm:text-sm uppercase font-bold tracking-[0.2em] mb-3">Up Next</h3>

                                        <h2 className="text-white font-bold text-2xl sm:text-3xl leading-tight mb-2 line-clamp-2 drop-shadow-lg">
                                            {episodes[currentEpisodeIndex + 1]?.title || `Episode ${episodes[currentEpisodeIndex + 1]?.episodeNumber}`}
                                        </h2>

                                        <p className="text-miru-primary font-medium text-lg mb-8">
                                            Episode {episodes[currentEpisodeIndex + 1]?.episodeNumber}
                                        </p>

                                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                                            <button
                                                onClick={handleNextEpisode}
                                                className="px-8 py-3 rounded-xl bg-white text-black font-bold hover:bg-white/90 transform hover:scale-105 transition-all shadow-xl shadow-white/10 flex items-center justify-center gap-2 group"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 group-hover:translate-x-0.5 transition-transform">
                                                    <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                                                </svg>
                                                Play Now
                                            </button>
                                            <button
                                                onClick={cancelAutoNext}
                                                className="px-8 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 backdrop-blur-sm transition-colors ring-1 ring-white/10"
                                            >
                                                Cancel
                                            </button>
                                        </div>

                                        {/* Auto Play Toggle */}
                                        <div className="mt-8 flex items-center gap-3 group cursor-pointer" onClick={toggleAutoNext}>
                                            <div className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${isAutoNextEnabled ? 'bg-miru-primary' : 'bg-white/20'}`}>
                                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${isAutoNextEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </div>
                                            <span className="text-sm text-gray-400 font-medium group-hover:text-white transition-colors select-none">Auto-play next episode</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : externalUrl ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gray-900 p-4">
                        <p className="mb-4 text-base sm:text-lg text-center">Stream not directly available.</p>
                        <a
                            href={externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 sm:px-6 py-2 sm:py-3 bg-miru-primary text-white rounded-lg hover:bg-miru-primary/80 transition-colors flex items-center gap-2 text-sm sm:text-base"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                            </svg>
                            Watch on Info Source
                        </a>
                        <p className="mt-4 text-xs text-gray-600 text-center">Clicking will open the source in a new tab.</p>
                    </div>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm sm:text-base text-center px-4">
                        {currentEpisode ? 'No stream available' : 'Select an episode to start watching'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoPlayerContainer;
