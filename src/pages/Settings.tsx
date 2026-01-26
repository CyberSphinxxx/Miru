import { useState, useEffect, useRef } from 'react';
import { useLocalUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
    const {
        userData,
        updateSettings,
        getStorageUsage,
        clearAppCache,
        exportData,
        importData
    } = useLocalUser();
    const { settings } = userData;
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [storageSize, setStorageSize] = useState('0 KB');
    const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

    useEffect(() => {
        const bytes = getStorageUsage();
        if (bytes > 1024 * 1024) {
            setStorageSize(`${(bytes / (1024 * 1024)).toFixed(2)} MB`);
        } else {
            setStorageSize(`${(bytes / 1024).toFixed(2)} KB`);
        }
    }, [userData, getStorageUsage]);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const content = event.target?.result as string;
            if (content) {
                const success = await importData(content);
                setImportStatus(success ? 'success' : 'error');

                // Reset status after 3 seconds
                setTimeout(() => setImportStatus('idle'), 3000);
            }
        };
        reader.readAsText(file);

        // Reset input
        e.target.value = '';
    };

    const handleClearCache = () => {
        if (window.confirm('Are you sure you want to clear the cache? This will reload the app.')) {
            clearAppCache();
        }
    };

    return (
        <div className="min-h-screen bg-miru-bg pt-32 pb-12">
            <div className="container mx-auto px-6 max-w-4xl">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 group-hover:-translate-x-1 transition-transform">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    Back
                </button>

                <h1 className="text-4xl font-bold mb-2 text-white bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                    Settings
                </h1>
                <p className="text-gray-400 mb-8">Customize your viewing experience</p>

                <div className="space-y-6">
                    {/* Player & Playback Section */}
                    <div className="bg-miru-surface/50 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden transition-all duration-300 hover:border-white/10 hover:shadow-2xl hover:shadow-purple-500/10">
                        {/* Section Header */}
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
                            {/* Auto-Play Toggle */}
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

                            {/* Divider */}
                            <div className="h-px bg-white/5" />

                            {/* Default Quality */}
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

                    {/* Application & Appearance Section */}
                    <div className="bg-miru-surface/50 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden transition-all duration-300 hover:border-white/10 hover:shadow-2xl hover:shadow-pink-500/10">
                        {/* Section Header */}
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
                            {/* Theme Accent */}
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

                            {/* Divider */}
                            <div className="h-px bg-white/5" />

                            {/* Background Customization */}
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <h3 className="text-base font-medium text-white">Background Style</h3>
                                    <p className="text-sm text-gray-400">Customize your viewing environment</p>
                                </div>

                                {/* Background Mode */}
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

                                {/* Base Color */}
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

                            {/* Divider */}
                            <div className="h-px bg-white/5" />

                            {/* NSFW Toggle */}
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

                    {/* Notifications Section */}
                    <div className="bg-miru-surface/50 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden transition-all duration-300 hover:border-white/10 hover:shadow-2xl hover:shadow-blue-500/10">
                        {/* Section Header */}
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
                                    {/* Add divider except for last item */}
                                    {index < 2 && <div className="h-px bg-white/5 mt-6" />}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Advanced / Data Section */}
                    <div className="bg-miru-surface/50 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden transition-all duration-300 hover:border-white/10 hover:shadow-2xl hover:shadow-orange-500/10">
                        {/* Section Header */}
                        <div className="p-6 border-b border-white/5 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">Advanced / Data</h2>
                                <p className="text-sm text-gray-400">Cache, storage, and data management</p>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Storage Info */}
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-base font-medium text-white">Local Storage Usage</h3>
                                    <p className="text-sm text-gray-400">Approximate size of stored data</p>
                                </div>
                                <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/5 text-sm font-mono text-gray-300">
                                    {storageSize}
                                </div>
                            </div>

                            <div className="h-px bg-white/5" />

                            {/* Clear Cache */}
                            <div className="flex items-center justify-between group">
                                <div className="space-y-1">
                                    <h3 className="text-base font-medium text-white group-hover:text-orange-300 transition-colors">Clear App Cache</h3>
                                    <p className="text-sm text-gray-400">Clear temporary files and reloading the app</p>
                                </div>
                                <button
                                    onClick={handleClearCache}
                                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/5 text-sm font-medium hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/50 transition-all text-gray-300"
                                >
                                    Clear Cache
                                </button>
                            </div>

                            <div className="h-px bg-white/5" />

                            {/* Export/Import */}
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <h3 className="text-base font-medium text-white">Data Management</h3>
                                    <p className="text-sm text-gray-400">Backup or restore your settings and library</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={exportData}
                                        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                        </svg>
                                        <span className="text-sm font-medium">Export Data</span>
                                    </button>
                                    <button
                                        onClick={handleImportClick}
                                        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                        </svg>
                                        <div className="flex flex-col items-start leading-none gap-1">
                                            <span className="text-sm font-medium">Import Data</span>
                                            {importStatus === 'success' && <span className="text-xs text-green-400">Success!</span>}
                                            {importStatus === 'error' && <span className="text-xs text-red-400">Failed</span>}
                                        </div>
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept=".json"
                                        onChange={handleFileChange}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Keyboard Shortcuts Section */}
                    <div className="bg-miru-surface/50 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden transition-all duration-300 hover:border-white/10 hover:shadow-2xl hover:shadow-cyan-500/10">
                        {/* Section Header */}
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
                </div>
            </div>
        </div>
    );
};

export default Settings;
