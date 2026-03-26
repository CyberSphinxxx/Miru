import React from 'react';
import { useLocalUser } from '../../../../context/UserContext';

const SettingsAppearanceSection: React.FC = () => {
    const { userData, updateSettings } = useLocalUser();
    const { settings } = userData;

    return (
        <div className="bg-miru-surface/50 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden transition-all duration-300 hover:border-white/10 hover:shadow-2xl hover:shadow-pink-500/10">
            <div className="p-6 border-b border-white/5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-white">Application & Appearance</h2>
                    <p className="text-sm text-gray-400">Customize look and feel</p>
                </div>
            </div>

            <div className="p-6 space-y-8">
                <div className="space-y-4">
                    <div className="space-y-1">
                        <h3 className="text-base font-medium text-white">Theme Accent</h3>
                        <p className="text-sm text-gray-400">Choose your primary color theme</p>
                    </div>
                    <div className="flex gap-4">
                        {[
                            { value: 'purple', bg: 'bg-purple-500', ring: 'ring-purple-500' },
                            { value: 'blue', bg: 'bg-blue-500', ring: 'ring-blue-500' },
                            { value: 'green', bg: 'bg-green-500', ring: 'ring-green-500' },
                            { value: 'orange', bg: 'bg-orange-500', ring: 'ring-orange-500' },
                        ].map((color) => (
                            <button
                                key={color.value}
                                onClick={() => updateSettings({ themeAccent: color.value as any })}
                                className={`w-10 h-10 rounded-full ${color.bg} transition-all duration-300 ${settings.themeAccent === color.value
                                    ? `ring-4 ring-offset-2 ring-offset-miru-surface ${color.ring}`
                                    : 'opacity-50 hover:opacity-100'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                <div className="h-px bg-white/5" />

                <div className="space-y-4">
                    <div className="space-y-1">
                        <h3 className="text-base font-medium text-white">Background Style</h3>
                        <p className="text-sm text-gray-400">Customize your viewing environment</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { value: 'simple', label: 'Simple', desc: 'Solid Color' },
                            { value: 'glow', label: 'Glow', desc: 'Radial Gradient' },
                            { value: 'mesh', label: 'Mesh', desc: 'Cinematic' },
                        ].map((mode) => (
                            <button
                                key={mode.value}
                                onClick={() => updateSettings({ backgroundMode: mode.value as any })}
                                className={`relative p-3 rounded-xl border text-left transition-all duration-300 ${settings.backgroundMode === mode.value
                                    ? 'bg-purple-500/10 border-purple-500/50 shadow-lg shadow-purple-500/10'
                                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                                    }`}
                            >
                                <div className="flex flex-col gap-1">
                                    <span className={`text-sm font-medium ${settings.backgroundMode === mode.value ? 'text-white' : 'text-gray-300'}`}>
                                        {mode.label}
                                    </span>
                                    <span className={`text-xs ${settings.backgroundMode === mode.value ? 'text-purple-300' : 'text-gray-500'}`}>
                                        {mode.desc}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="space-y-2 pt-2">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Base Theme</h4>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { value: 'black', label: 'OLED Black', bg: '#0a0a0a' },
                                { value: 'midnight', label: 'Midnight', bg: '#0f1014' },
                                { value: 'slate', label: 'Slate', bg: '#0f172a' },
                            ].map((color) => (
                                <button
                                    key={color.value}
                                    onClick={() => updateSettings({ baseColor: color.value as any })}
                                    className={`flex items-center gap-3 p-2 rounded-lg border transition-all duration-300 ${settings.baseColor === color.value
                                        ? 'bg-white/10 border-purple-500/50 text-white'
                                        : 'border-transparent hover:bg-white/5 text-gray-400'
                                        }`}
                                >
                                    <div
                                        className="w-4 h-4 rounded-full border border-white/10"
                                        style={{ backgroundColor: color.bg }}
                                    />
                                    <span className="text-sm">{color.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="h-px bg-white/5" />

                <div className="flex items-center justify-between group">
                    <div className="space-y-1">
                        <h3 className="text-base font-medium text-white group-hover:text-pink-300 transition-colors">Show 18+ Content</h3>
                        <p className="text-sm text-gray-400">Unhide sensitive / 18+ content in library</p>
                    </div>
                    <button
                        onClick={() => updateSettings({ showNSFW: !settings.showNSFW })}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-miru-surface ${settings.showNSFW
                            ? 'bg-pink-600 shadow-lg shadow-pink-500/30'
                            : 'bg-white/10'
                            }`}
                    >
                        <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${settings.showNSFW ? 'translate-x-[22px]' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsAppearanceSection;
