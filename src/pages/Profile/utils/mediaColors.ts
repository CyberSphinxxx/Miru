import { MediaMode } from '../hooks/useProfileData';

interface MediaColorClasses {
    statBg: string;
    statBgHover: string;
    iconColor: string;
    iconColorHover: string;
    tabBadgeActive: string;
    tabUnderline: string;
    toggleActive: string;
}

const colorMap: Record<MediaMode, MediaColorClasses> = {
    anime: {
        statBg: 'bg-purple-500/10',
        statBgHover: 'hover:bg-purple-500/20',
        iconColor: 'text-purple-400',
        iconColorHover: 'group-hover:text-purple-300',
        tabBadgeActive: 'bg-purple-500/20 text-purple-400',
        tabUnderline: 'bg-purple-500',
        toggleActive: 'bg-purple-600 text-white shadow-lg shadow-purple-500/30',
    },
    manga: {
        statBg: 'bg-emerald-500/10',
        statBgHover: 'hover:bg-emerald-500/20',
        iconColor: 'text-emerald-400',
        iconColorHover: 'group-hover:text-emerald-300',
        tabBadgeActive: 'bg-emerald-500/20 text-emerald-400',
        tabUnderline: 'bg-emerald-500',
        toggleActive: 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30',
    },
    movies: {
        statBg: 'bg-blue-500/10',
        statBgHover: 'hover:bg-blue-500/20',
        iconColor: 'text-blue-400',
        iconColorHover: 'group-hover:text-blue-300',
        tabBadgeActive: 'bg-blue-500/20 text-blue-400',
        tabUnderline: 'bg-blue-500',
        toggleActive: 'bg-blue-600 text-white shadow-lg shadow-blue-500/30',
    },
};

export function getMediaColors(mode: MediaMode): MediaColorClasses {
    return colorMap[mode];
}
