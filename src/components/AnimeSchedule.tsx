import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { animeService } from '../services/api';

interface ScheduleItem {
    id: number;
    airingAt: number;
    episode: number;
    media: {
        id: number;
        idMal: number;
        title: string;
        coverImage: string;
        format: string;
        status: string;
    };
}

interface DayTab {
    date: Date;
    dayName: string;
    dateStr: string;
    startTime: number;
    endTime: number;
}

function AnimeSchedule() {
    const navigate = useNavigate();
    const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [selectedDayIndex, setSelectedDayIndex] = useState(0);
    const [visibleCount, setVisibleCount] = useState(10);
    const [currentTime, setCurrentTime] = useState(new Date());
    const tabsRef = useRef<HTMLDivElement>(null);

    // Generate 7 day tabs starting from today
    const generateDayTabs = (): DayTab[] => {
        const tabs: DayTab[] = [];
        const now = new Date();

        for (let i = 0; i < 7; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() + i);

            // Start of day in local timezone
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);

            // End of day in local timezone
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            tabs.push({
                date,
                dayName,
                dateStr: monthDay,
                startTime: Math.floor(startOfDay.getTime() / 1000),
                endTime: Math.floor(endOfDay.getTime() / 1000)
            });
        }

        return tabs;
    };

    const [dayTabs] = useState<DayTab[]>(generateDayTabs);

    // Update current time every second
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Fetch schedule for selected day
    useEffect(() => {
        const fetchSchedule = async () => {
            const selectedDay = dayTabs[selectedDayIndex];
            if (!selectedDay) return;

            setLoading(true);
            setError(false);
            setVisibleCount(10); // Reset visible count when changing days

            try {
                const result = await animeService.getAiringSchedule(
                    selectedDay.startTime,
                    selectedDay.endTime,
                    1,
                    50
                );
                setSchedules(result.schedules || []);
            } catch (err) {
                console.error('Failed to fetch schedule:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchSchedule();
    }, [selectedDayIndex, dayTabs]);

    const formatTime = (timestamp: number): string => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    const getTimezoneString = (): string => {
        const offset = -currentTime.getTimezoneOffset();
        const hours = Math.floor(Math.abs(offset) / 60);
        const minutes = Math.abs(offset) % 60;
        const sign = offset >= 0 ? '+' : '-';
        return `GMT${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const formatCurrentDateTime = (): string => {
        return currentTime.toLocaleString('en-US', {
            month: 'numeric',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    const handleAnimeClick = (id: number) => {
        navigate(`/anime/${id}`);
    };

    const scrollTabs = (direction: 'left' | 'right') => {
        if (tabsRef.current) {
            const scrollAmount = 150;
            tabsRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const visibleSchedules = schedules.slice(0, visibleCount);
    const hasMore = schedules.length > visibleCount;

    return (
        <section className="mb-12 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-gradient">
                    Estimated Schedule
                </h2>
                <div className="text-sm text-gray-400 font-mono bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                    ({getTimezoneString()}) {formatCurrentDateTime()}
                </div>
            </div>

            {/* Day Tabs */}
            <div className="relative mb-6">
                {/* Left Arrow */}
                <button
                    onClick={() => scrollTabs('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-miru-bg/90 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all shadow-lg"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                </button>

                {/* Tabs Container */}
                <div
                    ref={tabsRef}
                    className="flex gap-2 overflow-x-auto scrollbar-hide px-10 py-2"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {dayTabs.map((tab, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedDayIndex(index)}
                            className={`flex-shrink-0 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${index === selectedDayIndex
                                    ? 'bg-miru-accent text-white shadow-lg shadow-miru-accent/30'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                                }`}
                        >
                            <div className="text-sm font-bold">{tab.dayName}</div>
                            <div className="text-xs opacity-80">{tab.dateStr}</div>
                        </button>
                    ))}
                </div>

                {/* Right Arrow */}
                <button
                    onClick={() => scrollTabs('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-miru-bg/90 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all shadow-lg"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                </button>
            </div>

            {/* Schedule List */}
            <div className="rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="flex items-center gap-3 text-gray-400">
                            <div className="w-5 h-5 border-2 border-miru-accent border-t-transparent rounded-full animate-spin" />
                            <span>Loading schedule...</span>
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                            </svg>
                        </div>
                        <p className="text-gray-400 mb-2">Failed to load schedule</p>
                        <button
                            onClick={() => setSelectedDayIndex(selectedDayIndex)}
                            className="text-miru-accent hover:underline text-sm"
                        >
                            Try again
                        </button>
                    </div>
                ) : schedules.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                            </svg>
                        </div>
                        <p className="text-gray-400">No anime scheduled for this day</p>
                    </div>
                ) : (
                    <>
                        {/* Schedule Items */}
                        <div className="divide-y divide-white/5">
                            {visibleSchedules.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between px-4 md:px-6 py-4 hover:bg-white/[0.03] transition-colors group"
                                >
                                    {/* Time */}
                                    <div className="flex-shrink-0 w-16 text-miru-accent font-mono font-bold">
                                        {formatTime(item.airingAt)}
                                    </div>

                                    {/* Title */}
                                    <div
                                        className="flex-1 min-w-0 px-4 cursor-pointer"
                                        onClick={() => handleAnimeClick(item.media.id)}
                                    >
                                        <h3 className="text-gray-200 font-medium truncate group-hover:text-white transition-colors">
                                            {item.media.title}
                                        </h3>
                                    </div>

                                    {/* Episode Badge */}
                                    <div className="flex-shrink-0">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-sm text-gray-300 border border-white/10 group-hover:border-miru-accent/50 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-miru-accent">
                                                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                                            </svg>
                                            Episode {item.episode}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Show More */}
                        {hasMore && (
                            <div className="border-t border-white/5">
                                <button
                                    onClick={() => setVisibleCount(prev => prev + 10)}
                                    className="w-full py-4 text-center text-miru-accent hover:text-white hover:bg-white/[0.03] transition-colors font-medium"
                                >
                                    Show more
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}

export default AnimeSchedule;
