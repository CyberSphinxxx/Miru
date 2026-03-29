import React, { useState, useEffect } from 'react';

// ============================================================================
// Message Configurations
// ============================================================================

const EPISODE_MESSAGES = [
    { text: 'Searching for episodes...', icon: 'search' },
    { text: 'Fetching episode data...', icon: 'download' },
    { text: 'Loading anime info...', icon: 'film' },
    { text: 'Preparing episode list...', icon: 'list' },
    { text: 'Almost there...', icon: 'check' },
] as const;

const STREAM_MESSAGES = [
    { text: 'Finding stream sources...', icon: 'search' },
    { text: 'Connecting to server...', icon: 'download' },
    { text: 'Loading video player...', icon: 'film' },
    { text: 'Preparing your stream...', icon: 'list' },
    { text: 'Almost ready...', icon: 'check' },
] as const;

const MESSAGES = {
    episodes: EPISODE_MESSAGES,
    stream: STREAM_MESSAGES,
};

// ============================================================================
// Icons
// ============================================================================

const icons: Record<string, React.ReactNode> = {
    search: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
    ),
    download: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
    ),
    film: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
    ),
    list: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
        </svg>
    ),
    check: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
    ),
};

// ============================================================================
// Component
// ============================================================================

interface AnimatedLoaderProps {
    /** Which set of messages to display */
    variant: 'episodes' | 'stream';
    /** Compact mode for sidebars */
    size?: 'sm' | 'md';
}

const AnimatedLoader: React.FC<AnimatedLoaderProps> = ({ variant, size = 'md' }) => {
    const messages = MESSAGES[variant];
    const [index, setIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>;
        const interval = setInterval(() => {
            setIsTransitioning(true);
            // After fade-out, switch message and fade-in
            timeoutId = setTimeout(() => {
                setIndex(prev => (prev + 1) % messages.length);
                setIsTransitioning(false);
            }, 300);
        }, 2000);

        return () => {
            clearInterval(interval);
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [messages.length]);

    const current = messages[index];
    const isSmall = size === 'sm';

    return (
        <div className={`flex flex-col items-center justify-center gap-3 ${isSmall ? 'py-6' : 'py-8'}`}>
            {/* Icon + Text */}
            <div
                aria-live="polite"
                className={`flex items-center gap-2.5 transition-all duration-300 ease-in-out ${
                    isTransitioning
                        ? 'opacity-0 translate-y-2'
                        : 'opacity-100 translate-y-0'
                }`}
            >
                <span className="text-miru-primary">{icons[current.icon]}</span>
                <span className={`font-medium text-gray-400 ${isSmall ? 'text-xs' : 'text-sm'}`}>
                    {current.text}
                </span>
            </div>

            {/* Shimmer Progress Bar */}
            <div className={`rounded-full overflow-hidden bg-white/5 ${isSmall ? 'w-32 h-0.5' : 'w-48 h-1'}`}>
                <div
                    className="h-full w-full rounded-full bg-gradient-to-r from-transparent via-miru-primary to-transparent animate-shimmer"
                    style={{ backgroundSize: '200% 100%' }}
                />
            </div>
        </div>
    );
};

export default AnimatedLoader;
