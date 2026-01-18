import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppNotification, NotificationType } from '../types/notification.types';
import { useLocalUser } from './UserContext';
import { animeService } from '../services/api';

interface NotificationContextType {
    notifications: AppNotification[];
    unreadCount: number;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearNotifications: () => void;
    refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

const STORAGE_KEY = 'miru_notifications';
const SEEN_EPISODES_KEY = 'miru_seen_episodes';

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const { userData } = useLocalUser();

    // Load notifications from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setNotifications(parsed);
            }
        } catch (e) {
            console.error('Failed to load notifications:', e);
        }
    }, []);

    // Save notifications to localStorage
    const saveNotifications = useCallback((notifs: AppNotification[]) => {
        try {
            // Keep only last 50 notifications
            const trimmed = notifs.slice(0, 50);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        } catch (e) {
            console.error('Failed to save notifications:', e);
        }
    }, []);

    // Generate episode notifications from airing schedule
    const generateAiringNotifications = useCallback(async () => {
        const watchingList = userData?.library?.watching || [];
        if (watchingList.length === 0) return [];

        try {
            // Get today's schedule
            const now = Math.floor(Date.now() / 1000);
            const oneDayAgo = now - 86400;
            const scheduleData = await animeService.getAiringSchedule(oneDayAgo, now, 1, 50);

            if (!scheduleData?.schedules) return [];

            // Get seen episodes to avoid duplicate notifications
            const seenEpisodesStr = localStorage.getItem(SEEN_EPISODES_KEY) || '{}';
            const seenEpisodes: Record<string, number[]> = JSON.parse(seenEpisodesStr);

            const newNotifications: AppNotification[] = [];

            for (const schedule of scheduleData.schedules) {
                // Check if this anime is in watching list
                const inWatching = watchingList.find((a: any) =>
                    a.mal_id === schedule.media?.idMal ||
                    a.id === schedule.media?.id
                );

                if (inWatching && schedule.episode) {
                    const animeId = schedule.media?.idMal || schedule.media?.id;
                    const seenForAnime = seenEpisodes[animeId] || [];

                    // Only notify if we haven't seen this episode yet
                    if (!seenForAnime.includes(schedule.episode)) {
                        newNotifications.push({
                            id: `ep-${animeId}-${schedule.episode}`,
                            type: 'episode_released' as NotificationType,
                            title: schedule.media?.title?.english || schedule.media?.title?.romaji || 'New Episode',
                            message: `Episode ${schedule.episode} is now available`,
                            thumbnail: schedule.media?.coverImage?.medium || (inWatching as any).images?.jpg?.image_url,
                            animeId: animeId,
                            episodeNumber: schedule.episode,
                            timestamp: schedule.airingAt * 1000,
                            read: false,
                            actionUrl: `/watch/${animeId}?ep=${schedule.episode}`
                        });

                        // Mark as seen
                        seenEpisodes[animeId] = [...seenForAnime, schedule.episode];
                    }
                }
            }

            // Save seen episodes
            localStorage.setItem(SEEN_EPISODES_KEY, JSON.stringify(seenEpisodes));

            return newNotifications;
        } catch (e) {
            console.error('Failed to generate airing notifications:', e);
            return [];
        }
    }, [userData]);

    // Generate resume nudges for stalled shows
    const generateResumeNudges = useCallback(() => {
        const history = userData?.history || [];
        const watchingList = userData?.library?.watching || [];
        const nudges: AppNotification[] = [];

        // Check for shows not watched in 7 days
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const existingNudgeIds = notifications
            .filter(n => n.type === 'resume_nudge')
            .map(n => n.animeId);

        for (const anime of watchingList as any[]) {
            // Skip if we already have a nudge for this
            if (existingNudgeIds.includes(anime.mal_id)) continue;

            // Find last watched info
            const lastWatched = history.find((h: any) => h.animeId === anime.mal_id);

            if (lastWatched) {
                const watchedAt = (lastWatched as any).timestamp || 0;
                const totalEps = anime.episodes || 12;
                const watchedEps = (lastWatched as any).episodeNumber || (lastWatched as any).episode || 1;

                // If not finished and not watched recently
                if (watchedAt < sevenDaysAgo && watchedEps < totalEps) {
                    nudges.push({
                        id: `nudge-${anime.mal_id}`,
                        type: 'resume_nudge' as NotificationType,
                        title: anime.title || 'Continue Watching',
                        message: `Pick up at Episode ${watchedEps + 1}`,
                        thumbnail: anime.images?.jpg?.image_url,
                        animeId: anime.mal_id,
                        episodeNumber: watchedEps + 1,
                        timestamp: Date.now(),
                        read: false,
                        actionUrl: `/watch/${anime.mal_id}?ep=${watchedEps + 1}`
                    });
                }
            }
        }

        return nudges;
    }, [userData, notifications]);

    // Refresh all notifications
    const refreshNotifications = useCallback(async () => {
        const airingNotifs = await generateAiringNotifications();
        const nudges = generateResumeNudges();

        if (airingNotifs.length > 0 || nudges.length > 0) {
            setNotifications(prev => {
                // Merge new notifications, avoiding duplicates
                const existingIds = new Set(prev.map(n => n.id));
                const newNotifs = [...airingNotifs, ...nudges].filter(n => !existingIds.has(n.id));
                const combined = [...newNotifs, ...prev].sort((a, b) => b.timestamp - a.timestamp);
                saveNotifications(combined);
                return combined;
            });
        }
    }, [generateAiringNotifications, generateResumeNudges, saveNotifications]);

    // Refresh on mount and when userData changes
    useEffect(() => {
        if (userData?.library?.watching?.length > 0) {
            refreshNotifications();
        }
    }, [userData?.library?.watching?.length]);

    // Mark single notification as read
    const markAsRead = useCallback((id: string) => {
        setNotifications(prev => {
            const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
            saveNotifications(updated);
            return updated;
        });
    }, [saveNotifications]);

    // Mark all as read
    const markAllAsRead = useCallback(() => {
        setNotifications(prev => {
            const updated = prev.map(n => ({ ...n, read: true }));
            saveNotifications(updated);
            return updated;
        });
    }, [saveNotifications]);

    // Clear all notifications
    const clearNotifications = useCallback(() => {
        setNotifications([]);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            markAsRead,
            markAllAsRead,
            clearNotifications,
            refreshNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
