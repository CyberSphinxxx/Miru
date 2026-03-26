import React, { useState, useEffect, useRef } from 'react';
import { useLocalUser } from '../../../../context/UserContext';

const SettingsAdvancedSection: React.FC = () => {
    const { getStorageUsage, clearAppCache, exportData, importData } = useLocalUser();
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
    }, [getStorageUsage]);

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
                setTimeout(() => setImportStatus('idle'), 3000);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleClearCache = () => {
        if (window.confirm('Are you sure you want to clear the cache? This will reload the app.')) {
            clearAppCache();
        }
    };

    return (
        <div className="bg-miru-surface/50 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden transition-all duration-300 hover:border-white/10 hover:shadow-2xl hover:shadow-orange-500/10">
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
    );
};

export default SettingsAdvancedSection;
