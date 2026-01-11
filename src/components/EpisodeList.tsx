import React from 'react';
import { Episode } from '../types';

interface EpisodeListProps {
    episodes: Episode[];
    currentEpisode: Episode | null;
    onEpisodeClick: (episode: Episode) => void;
    loading: boolean;
}

const EpisodeList: React.FC<EpisodeListProps> = ({
    episodes,
    currentEpisode,
    onEpisodeClick,
    loading
}) => {
    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-miru-accent border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (episodes.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <p className="text-gray-500 text-center text-sm">No episodes found for this anime.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto no-scrollbar">
            {episodes.map((ep) => {
                const isActive = currentEpisode?.session === ep.session;
                return (
                    <div
                        key={ep.session}
                        onClick={() => onEpisodeClick(ep)}
                        className={`p-4 cursor-pointer transition-all border-l-2 ${isActive
                                ? 'bg-miru-accent/10 border-miru-accent'
                                : 'border-transparent hover:bg-white/5'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className={`font-mono text-sm ${isActive ? 'text-miru-accent' : 'text-gray-400'}`}>
                                EP {ep.episodeNumber}
                            </span>
                            {ep.duration && (
                                <span className="text-xs text-gray-600">{ep.duration}</span>
                            )}
                        </div>
                        <div className={`text-sm font-medium mt-1 truncate ${isActive ? 'text-white' : 'text-gray-300'}`}>
                            {ep.title || `Episode ${ep.episodeNumber}`}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default EpisodeList;
