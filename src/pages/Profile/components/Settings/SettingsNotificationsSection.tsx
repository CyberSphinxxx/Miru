import React from 'react';
import { useLocalUser } from '../../../../context/UserContext';

const SettingsNotificationsSection: React.FC = () => {
    const { userData, updateSettings } = useLocalUser();
    const { settings } = userData;

    return (
        <div className="bg-miru-surface/50 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden transition-all duration-300 hover:border-white/10 hover:shadow-2xl hover:shadow-blue-500/10">
            <div className="p-6 border-b border-white/5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9zm4.502 8.9c.465 1.418 1.791 2.465 3.348 2.465 1.557 0 2.883-1.047 3.348-2.465A23.13 23.13 0 0112 18a23.13 23.13 0 01-2.248-.1z" clipRule="evenodd" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-white">Notifications</h2>
                    <p className="text-sm text-gray-400">Manage your alerts and updates</p>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {[
                    { id: 'airing', label: 'Airing Anime', desc: 'Get notified when new episodes air' },
                    { id: 'completed', label: 'Completed Anime', desc: 'Alerts when a series in your list finishes' },
                    { id: 'news', label: 'News & Updates', desc: 'Stay updated with Miru news' },
                ].map((item, index) => (
                    <div key={item.id}>
                        <div className="flex items-center justify-between group">
                            <div className="space-y-1">
                                <h3 className="text-base font-medium text-white group-hover:text-blue-300 transition-colors">{item.label}</h3>
                                <p className="text-sm text-gray-400">{item.desc}</p>
                            </div>
                            <button
                                onClick={() => updateSettings({
                                    notifications: {
                                        ...settings.notifications,
                                        [item.id]: !settings.notifications[item.id as keyof typeof settings.notifications]
                                    }
                                })}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-miru-surface ${settings.notifications[item.id as keyof typeof settings.notifications]
                                    ? 'bg-blue-600 shadow-lg shadow-blue-500/30'
                                    : 'bg-white/10'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${settings.notifications[item.id as keyof typeof settings.notifications] ? 'translate-x-[22px]' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                        {index < 2 && <div className="h-px bg-white/5 mt-6" />}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SettingsNotificationsSection;
