import React, { useRef, useEffect } from 'react';
import Hls from 'hls.js';
import { StreamLink } from '../types';

interface VideoPlayerProps {
    stream: StreamLink | null;
    playerMode: 'hls' | 'embed';
    onModeChange: (mode: 'hls' | 'embed') => void;
    streams: StreamLink[];
    selectedStreamIndex: number;
    onQualityChange: (index: number) => void;
    isAutoQuality: boolean;
    onAutoQuality: () => void;
    loading: boolean;
}

const getMappedQuality = (q: string): string => {
    const res = parseInt(q);
    if (res >= 1000) return '1080P';
    if (res >= 600) return '720P';
    return '360P';
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({
    stream,
    playerMode,
    onModeChange,
    streams,
    selectedStreamIndex,
    onQualityChange,
    isAutoQuality,
    onAutoQuality,
    loading
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const [showQualityMenu, setShowQualityMenu] = React.useState(false);

    useEffect(() => {
        if (stream?.directUrl && playerMode === 'hls' && videoRef.current) {
            if (Hls.isSupported()) {
                if (hlsRef.current) hlsRef.current.destroy();
                const hls = new Hls({ capLevelToPlayerSize: true });
                hls.loadSource(stream.directUrl);
                hls.attachMedia(videoRef.current);
                hlsRef.current = hls;
            } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
                videoRef.current.src = stream.directUrl;
            }
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [stream, playerMode]);

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-2 border-miru-accent border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400 animate-pulse">Loading stream...</p>
            </div>
        );
    }

    if (!stream) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-4">
                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-miru-accent/50">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                    </svg>
                </div>
                <p className="text-lg">Select an episode to start watching</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col relative">
            {/* Controls Overlay */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                {/* Quality Selector */}
                <div className="relative">
                    <button
                        onClick={() => setShowQualityMenu(!showQualityMenu)}
                        className="px-3 py-1.5 flex items-center gap-1.5 rounded-lg text-xs font-bold bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 transition-colors border border-white/10"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0m-9.75 0h9.75" />
                        </svg>
                        {isAutoQuality ? 'AUTO' : getMappedQuality(stream.quality)}
                    </button>

                    {showQualityMenu && (
                        <div className="absolute right-0 mt-2 p-2 w-32 bg-miru-surface rounded-xl shadow-2xl border border-white/10 flex flex-col gap-1 z-20">
                            <h4 className="px-2 py-1 text-[10px] font-bold text-gray-500 uppercase">Quality</h4>
                            {streams.map((s, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => { onQualityChange(idx); setShowQualityMenu(false); }}
                                    className={`px-3 py-2 text-xs text-left rounded-lg transition-colors ${!isAutoQuality && selectedStreamIndex === idx
                                            ? 'bg-miru-accent text-white font-bold'
                                            : 'hover:bg-white/5 text-gray-300'
                                        }`}
                                >
                                    {getMappedQuality(s.quality)}
                                </button>
                            ))}
                            <button
                                onClick={() => { onAutoQuality(); setShowQualityMenu(false); }}
                                className={`px-3 py-2 text-xs text-left rounded-lg transition-colors ${isAutoQuality
                                        ? 'bg-miru-accent text-white font-bold'
                                        : 'hover:bg-white/5 text-gray-300'
                                    }`}
                            >
                                AUTO
                            </button>
                        </div>
                    )}
                </div>

                {/* Player Mode Toggle */}
                {stream.directUrl && (
                    <button
                        onClick={() => onModeChange('hls')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${playerMode === 'hls'
                                ? 'bg-miru-accent text-white border-miru-accent'
                                : 'bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 border-white/10'
                            }`}
                    >
                        Clean
                    </button>
                )}
                <button
                    onClick={() => onModeChange('embed')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${playerMode === 'embed'
                            ? 'bg-miru-accent text-white border-miru-accent'
                            : 'bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 border-white/10'
                        }`}
                >
                    Embed
                </button>
            </div>

            {/* Video Container */}
            <div className="flex-1 flex items-center justify-center bg-black">
                {playerMode === 'hls' && stream.directUrl ? (
                    <video
                        ref={videoRef}
                        controls
                        className="w-full h-full"
                        autoPlay
                    />
                ) : (
                    <iframe
                        src={stream.url}
                        className="w-full h-full"
                        allowFullScreen
                        allow="autoplay; encrypted-media"
                        style={{ border: 'none' }}
                    />
                )}
            </div>
        </div>
    );
};

export default VideoPlayer;
