import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        port: 5173,
        proxy: {
            '/user': 'http://localhost:3000',
            '/candidate': 'http://localhost:3000',
            '/election': 'http://localhost:3000',
            '/audit': 'http://localhost:3000',
        },
    },
});
