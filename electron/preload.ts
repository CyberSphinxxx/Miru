import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // Backend communication
    getBackendHealth: (): Promise<boolean> => ipcRenderer.invoke('backend:health'),
    getBackendUrl: (): Promise<string> => ipcRenderer.invoke('backend:url'),

    // App info
    platform: process.platform,
    isElectron: true,

    // Window controls (optional, for custom titlebar)
    minimize: (): void => ipcRenderer.send('window:minimize'),
    maximize: (): void => ipcRenderer.send('window:maximize'),
    close: (): void => ipcRenderer.send('window:close'),
});

// Type declarations for TypeScript
declare global {
    interface Window {
        electronAPI: {
            getBackendHealth: () => Promise<boolean>;
            getBackendUrl: () => Promise<string>;
            platform: string;
            isElectron: boolean;
            minimize: () => void;
            maximize: () => void;
            close: () => void;
        };
    }
}
