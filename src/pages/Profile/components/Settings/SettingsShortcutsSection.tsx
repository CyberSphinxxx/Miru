import React from 'react';

const SettingsShortcutsSection: React.FC = () => {
    return (
        <div className="bg-miru-surface/50 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden transition-all duration-300 hover:border-white/10 hover:shadow-2xl hover:shadow-cyan-500/10">
            <div className="p-6 border-b border-white/5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M15.75 1.5a6.75 6.75 0 00-6.651 7.906c.067.39-.032.717-.221.906l-6.5 6.499a3 3 0 00-.878 2.121v2.818c0 .414.336.75.75.75H6a.75.75 0 00.75-.75v-1.5h1.5A.75.75 0 009 19.5V18h1.5a.75.75 0 00.53-.22l2.658-2.658c.19-.189.517-.288.906-.22A6.75 6.75 0 1015.75 1.5zm0 3a.75.75 0 000 1.5A2.25 2.25 0 0118 8.25a.75.75 0 001.5 0 3.75 3.75 0 00-3.75-3.75z" clipRule="evenodd" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
                    <p className="text-sm text-gray-400">Master the controls</p>
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                    { key: 'Space', action: 'Play / Pause', icon: '⏯' },
                    { key: 'F', action: 'Fullscreen', icon: '⛶' },
                    { key: 'M', action: 'Mute / Unmute', icon: '🔇' },
                    { key: 'N', action: 'Next Episode', icon: '⏭' },
                    { key: '← / →', action: 'Seek 10s', icon: '↔' },
                    { key: 'Cmd/Ctrl + K', action: 'Search', icon: '🔍' },
                ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm">
                                {item.icon}
                            </div>
                            <span className="text-sm font-medium text-gray-300">{item.action}</span>
                        </div>
                        <kbd className="px-2 py-1 rounded-md bg-white/10 border border-white/10 text-xs font-mono text-cyan-300 min-w-[24px] text-center">
                            {item.key}
                        </kbd>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SettingsShortcutsSection;
