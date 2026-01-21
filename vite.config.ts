import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    base: '/', // Use absolute paths for Vercel SPA routing
    server: {
        port: 5173,
        // Don't auto-open browser when running in Electron
        open: !process.env.ELECTRON
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
    }
});

