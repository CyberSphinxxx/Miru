import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    base: './', // Important for Electron - use relative paths
    server: {
        port: 5173,
        // Don't auto-open browser when running in Electron
        open: !process.env.ELECTRON
    },
    build: {
        outDir: 'dist',
        // Ensure assets use relative paths for Electron
        assetsDir: 'assets',
    }
});

