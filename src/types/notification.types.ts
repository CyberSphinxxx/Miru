// Notification types for the Miru app

export type NotificationType =
    | 'episode_released'    // New episode in watching list
    | 'season_premiere'     // Show in plan-to-watch started airing
    | 'series_completed'    // Show finished airing (ready to binge)
    | 'chapter_released'    // New manga chapter
    | 'resume_nudge';       // Continue watching reminder

export interface AppNotification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    thumbnail?: string;
    animeId?: number;
    mangaId?: string;
    episodeNumber?: number;
    chapterNumber?: number;
    timestamp: number; // Unix timestamp
    read: boolean;
    actionUrl?: string;
}

// Helper to get notification icon/emoji by type
export const getNotificationIcon = (type: NotificationType): string => {
    switch (type) {
        case 'episode_released': return '🔥';
        case 'season_premiere': return '📅';
        case 'series_completed': return '✅';
        case 'chapter_released': return '📖';
        case 'resume_nudge': return '🍿';
        default: return '🔔';
    }
};

// Helper to format relative time
export const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
};
