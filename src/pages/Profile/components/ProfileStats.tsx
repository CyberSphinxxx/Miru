import React from 'react';
import { MediaMode } from '../hooks/useProfileData';
import { getMediaColors } from '../utils/mediaColors';

interface ProfileStatsProps {
    mediaMode: MediaMode;
    currentStats: { label: string; value: string | number; icon: React.ReactNode }[];
}

const ProfileStats: React.FC<ProfileStatsProps> = ({ mediaMode, currentStats }) => {
    const colors = getMediaColors(mediaMode);

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {currentStats.map((stat, idx) => (
                <div key={idx} className={`rounded-xl p-4 text-center transition-colors group ${colors.statBg} ${colors.statBgHover}`}>
                    <div className={`mb-2 flex justify-center transition-colors ${colors.iconColor} ${colors.iconColorHover}`}>
                        {stat.icon}
                    </div>
                    <div className="text-2xl font-black text-white">{stat.value}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</div>
                </div>
            ))}
        </div>
    );
};

export default ProfileStats;
