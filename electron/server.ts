import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import { app } from 'electron';

let serverProcess: ChildProcess | null = null;
let serverInstance: ReturnType<typeof import('http').createServer> | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

/**
 * Starts the embedded Express backend server
 */
export async function startServer(port: number): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            // Get the backend path - use compiled JS in both dev and production
            const backendPath = isDev
                ? path.join(__dirname, '../backend/dist/index.js')
                : path.join(process.resourcesPath!, 'backend/dist/index.js');

            // Check if we should use spawn (child process) or direct import
            if (isDev) {
                // In development, spawn the backend as a child process
                console.log('DEBUG: Spawning backend at:', backendPath);
                serverProcess = spawn('node', [backendPath], {
                    env: { ...process.env, PORT: String(port) },
                    stdio: 'inherit',
                });

                serverProcess.on('error', (err) => {
                    console.error('Backend process error:', err);
                    reject(err);
                });

                // Give the server a moment to start
                setTimeout(() => {
                    checkServerHealth(port)
                        .then(() => resolve())
                        .catch(reject);
                }, 2000);
            } else {
                // In production, dynamically require the backend
                try {
                    // eslint-disable-next-line @typescript-eslint/no-require-imports
                    const backend = require(backendPath);
                    if (backend.createServer) {
                        serverInstance = backend.createServer(port);
                        resolve();
                    } else {
                        reject(new Error('Backend does not export createServer function'));
                    }
                } catch (err) {
                    reject(err);
                }
            }
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Checks if the server is responding
 */
async function checkServerHealth(port: number, retries = 5): Promise<boolean> {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(`http://localhost:${port}/`);
            if (response.ok) return true;
        } catch {
            // Server not ready yet
        }
        await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error('Backend server failed to start');
}

/**
 * Stops the backend server
 */
export async function stopServer(): Promise<void> {
    return new Promise((resolve) => {
        if (serverProcess) {
            serverProcess.kill();
            serverProcess = null;
        }

        if (serverInstance) {
            serverInstance.close(() => {
                serverInstance = null;
                resolve();
            });
        } else {
            resolve();
        }
    });
}
