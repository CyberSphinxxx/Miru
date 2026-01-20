import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
    src: string;
    isHls?: boolean;
    poster?: string;
    initialTime?: number;
    onTimeUpdate?: (currentTime: number) => void;
    onEnded?: () => void;
    autoPlay?: boolean;
    className?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
    src,
    isHls,
    poster,
    initialTime = 0,
    onTimeUpdate,
    onEnded,
    autoPlay = true,
    className = '',
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const [hasSeeked, setHasSeeked] = useState(false);

    // Initialize Player
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Reset seek state when src changes
        setHasSeeked(false);

        const isHlsStream = isHls || src.includes('.m3u8');

        if (Hls.isSupported() && isHlsStream) {
            if (hlsRef.current) {
                hlsRef.current.destroy();
            }

            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
            });

            hls.loadSource(src);
            hls.attachMedia(video);
            hlsRef.current = hls;

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                if (autoPlay) {
                    video.play().catch(e => console.warn("Auto-play blocked", e));
                }
                if (initialTime > 0 && !hasSeeked) {
                    video.currentTime = initialTime;
                    setHasSeeked(true);
                }
            });

            hls.on(Hls.Events.ERROR, (_, data) => {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            hls.recoverMediaError();
                            break;
                        default:
                            hls.destroy();
                            break;
                    }
                }
            });

        } else if (video.canPlayType('application/vnd.apple.mpegurl') && isHlsStream) {
            // Native HLS support (Safari)
            video.src = src;
            video.addEventListener('loadedmetadata', () => {
                if (autoPlay) {
                    video.play().catch(e => console.warn("Auto-play blocked", e));
                }
                if (initialTime > 0 && !hasSeeked) {
                    video.currentTime = initialTime;
                    setHasSeeked(true);
                }
            });
        } else {
            // Standard Video (MP4/WebM)
            video.src = src;
            if (autoPlay) {
                video.play().catch(e => console.warn("Auto-play blocked", e));
            }
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
            }
        };
    }, [src, isHls, autoPlay]);

    // Handle Time Update and Seek
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => {
            if (onTimeUpdate) {
                onTimeUpdate(video.currentTime);
            }
        };

        const checkAndSeek = () => {
            if (initialTime > 0 && !hasSeeked) {
                // Ensure we don't seek if we are already close (e.g. due to user interaction)
                // But generally for initial load, strict seek is fine
                video.currentTime = initialTime;
                setHasSeeked(true);
            }
        };

        const handleLoadedMetadata = () => {
            checkAndSeek();
        };

        const handleEnded = () => {
            if (onEnded) onEnded();
        }

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('ended', handleEnded);

        // Check immediately in case metadata is already loaded (e.g. late initialTime prop)
        if (video.readyState >= 1) { // HAVE_METADATA
            checkAndSeek();
        }

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('ended', handleEnded);
        };
    }, [onTimeUpdate, initialTime, hasSeeked, onEnded]);

    return (
        <div className={`relative w-full h-full bg-black ${className}`}>
            <video
                ref={videoRef}
                className="w-full h-full object-contain"
                controls
                playsInline
                poster={poster}
            />
        </div>
    );
};

export default VideoPlayer;
