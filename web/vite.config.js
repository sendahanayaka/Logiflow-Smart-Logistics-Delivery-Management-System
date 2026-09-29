/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
            },
            '/agent-api': {
                target: 'http://localhost:8000',
                changeOrigin: true,
                rewrite: function (path) { return path.replace(/^\/agent-api/, ''); },
            },
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        environmentOptions: {
            jsdom: { url: 'http://localhost/' },
        },
        setupFiles: ['./tests/setup.ts', './src/test/setup.ts'],
    },
});
