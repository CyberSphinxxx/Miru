import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron';
import * as path from 'path';
import { startServer, stopServer } from './server';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const BACKEND_PORT = 3001;

function createWindow(): void {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        frame: true,
        icon: path.join(__dirname, '../resources/icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
        },
        backgroundColor: '#0a0a0f',
        show: false,
    });

    // Show window when ready to avoid flash
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });

    // Load the app
    if (isDev) {
        // Development: load from Vite dev server
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        // Production: load from built files
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // Handle close to tray
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow?.hide();
            return false;
        }
        return true;
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function createTray(): void {
    const iconPath = path.join(__dirname, '../resources/icon.png');
    const icon = nativeImage.createFromPath(iconPath);
    tray = new Tray(icon);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show Miru',
            click: () => {
                mainWindow?.show();
            },
        },
        {
            label: 'Quit',
            click: () => {
                isQuitting = true;
                app.quit();
            },
        },
    ]);

    tray.setToolTip('Miru - Anime Streaming');
    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
        mainWindow?.show();
    });
}

// IPC Handlers
function setupIPC(): void {
    // Backend health check
    ipcMain.handle('backend:health', async () => {
        try {
            const response = await fetch(`http://localhost:${BACKEND_PORT}/`);
            return response.ok;
        } catch {
            return false;
        }
    });

    // Get backend URL
    ipcMain.handle('backend:url', () => {
        return `http://localhost:${BACKEND_PORT}`;
    });
}

// App lifecycle
app.whenReady().then(async () => {
    // Start embedded backend server
    console.log('🎬 Starting Miru Desktop...');

    try {
        await startServer(BACKEND_PORT);
        console.log(`✅ Backend running on port ${BACKEND_PORT}`);
    } catch (error) {
        console.error('❌ Failed to start backend:', error);
    }

    console.log('DEBUG: Setting up IPC');
    setupIPC();
    console.log('DEBUG: Creating window');
    createWindow();
    console.log('DEBUG: Creating tray');
    createTray();
    console.log('DEBUG: Init complete');

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    // On macOS keep running until explicit quit
    if (process.platform !== 'darwin') {
        isQuitting = true;
        app.quit();
    }
});

app.on('before-quit', async () => {
    isQuitting = true;
    await stopServer();
    console.log('👋 Miru Desktop closed');
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    console.log('DEBUG: Second instance, quitting');
    app.quit();
} else {
    app.on('second-instance', () => {
        // Focus existing window
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
        }
    });
}
