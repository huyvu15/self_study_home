import {
    defineConfig,
    loadEnv
} from 'vite';
import react from '@vitejs/plugin-react';
import {
    viteSingleFile
} from 'vite-plugin-singlefile';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const apiUrl = env.VITE_API_URL || '';
    let proxy = {};
    if (apiUrl) {
        try {
            const u = new URL(apiUrl);
            proxy = {
                '/api': {
                    target: u.origin,
                    changeOrigin: true,
                    secure: true,
                    rewrite: (path) => path.replace(/^\/api/, u.pathname),
                },
            };
        } catch (_) {}
    }

    return {
        plugins: [react(), viteSingleFile()],
        build: {
            outDir: 'dist',
            emptyOutDir: true,
            assetsInlineLimit: 100000000,
        },
        server: {
            proxy,
        },
    };
});