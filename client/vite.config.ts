import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5174,
        strictPort: true,
        // The api-joao-caetano host serves this project's API at /pulse.
        proxy: {
            '/api': {
                target: 'http://localhost:4400',
                rewrite: (path) => `/pulse${path}`,
            },
        },
    },
})
