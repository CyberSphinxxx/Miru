import React from 'react';
import { useLocalUser } from '../../../../context/UserContext';

const SettingsPlayerSection: React.FC = () => {
    const { userData, updateSettings } = useLocalUser();
    const { settings } = userData;

    return (
        <div className="bg-miru-surface/50 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden transition-all duration-300 hover:border-white/10 hover:shadow-2xl hover:shadow-purple-500/10">
            <div className="p-6 border-b border-white/5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-white">Player & Playback</h2>
                    <p className="text-sm text-gray-400">Manage playback preferences and quality</p>
                </div>
            </div>

            <div className="p-6 space-y-8">
                <div className="flex items-center justify-between group">
                    <div className="space-y-1">
                        <h3 className="text-base font-medium text-white group-hover:text-purple-300 transition-colors">Auto-Play Next Episode</h3>
                        <p className="text-sm text-gray-400">Automatically play the next episode when the current one ends</p>
                    </div>
                    <button
                        onClick={() => updateSettings({ autoPlayNext: !settings.autoPlayNext })}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-miru-surface ${settings.autoPlayNext
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg shadow-purple-500/30'
                            : 'bg-white/10'
                            }`}
                    >
                        <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${settings.autoPlayNext ? 'translate-x-[22px]' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>

                <div className="h-px bg-white/5" />

                <div className="space-y-4">
                    <div className="space-y-1">
                        <h3 className="text-base font-medium text-white">Default Quality</h3>
                        <p className="text-sm text-gray-400">Choose your preferred streaming quality</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { value: 'auto', label: 'Auto', desc: 'Recommended' },
                            { value: '1080p', label: '1080p', desc: 'Full HD' },
                            { value: '720p', label: '720p', desc: 'HD' },
                            { value: '480p', label: '480p', desc: 'SD' },
                        ].map((option) => (
                            <button
                                key={option.value}
                                onClick={() => updateSettings({ defaultQuality: option.value as any })}
                                className={`relative p-3 rounded-xl border text-left transition-all duration-300 ${settings.defaultQuality === option.value
                                    ? 'bg-purple-500/10 border-purple-500/50 shadow-lg shadow-purple-500/10'
                                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                                    }`}
                            >
                                <div className="flex flex-col gap-1">
                                    <span className={`text-sm font-medium ${settings.defaultQuality === option.value ? 'text-white' : 'text-gray-300'
                                        }`}>
                                        {option.label}
                                    </span>
                                    <span className={`text-xs ${settings.defaultQuality === option.value ? 'text-purple-300' : 'text-gray-500'
                                        }`}>
                                        {option.desc}
                                    </span>
                                </div>
                                {settings.defaultQuality === option.value && (
                                    <div className="absolute top-2 right-2 text-purple-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPlayerSection;
