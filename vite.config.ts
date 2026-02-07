import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const base = '/alphabet-magic-adventure/';

  return {
    base,
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'assets/**/*'],
        manifest: {
          name: 'Alphabet Magic Adventure',
          short_name: 'Alphabet',
          description: 'A magical alphabet learning adventure for kids.',
          theme_color: '#f97316',
          background_color: '#fdfcf0',
          display: 'standalone',
          start_url: base,
          icons: [
            {
              src: 'assets/common/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: 'assets/common/icon-512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'assets/common/apple-touch-icon.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,pcm,mp3}'],
          // Increase limit to 10MB since our audio/images are large-ish
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
