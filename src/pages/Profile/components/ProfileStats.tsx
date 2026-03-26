import React from 'react';
import { MediaMode } from '../hooks/useProfileData';

interface ProfileStatsProps {
    mediaMode: MediaMode;
    currentStats: { label: string; value: string | number; icon: React.ReactNode }[];
}

const ProfileStats: React.FC<ProfileStatsProps> = ({ mediaMode, currentStats }) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {currentStats.map((stat, idx) => (
                <div key={idx} className={`rounded-xl p-4 text-center transition-colors group ${
                    mediaMode === 'anime' ? 'bg-purple-500/10 hover:bg-purple-500/20' :
                    mediaMode === 'manga' ? 'bg-emerald-500/10 hover:bg-emerald-500/20' :
                        'bg-blue-500/10 hover:bg-blue-500/20'
                    }`}>
                    <div className={`mb-2 flex justify-center transition-colors ${
                        mediaMode === 'anime' ? 'text-purple-400 group-hover:text-purple-300' :
                        mediaMode === 'manga' ? 'text-emerald-400 group-hover:text-emerald-300' :
                            'text-blue-400 group-hover:text-blue-300'
                        }`}>
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
