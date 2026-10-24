import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'],
        manifest: {
          id: '/',
          name: 'Superação',
          short_name: 'Superação',
          description: 'Progresso sustentável, hábitos e recordes pessoais com suporte offline.',
          theme_color: '#125F55',
          background_color: '#F5F8F5',
          display: 'standalone',
          orientation: 'portrait',
          lang: 'pt-BR',
          dir: 'ltr',
          categories: ['fitness', 'health', 'lifestyle'],
          start_url: '/',
          scope: '/',
          launch_handler: {
            client_mode: 'navigate-existing',
          },
          shortcuts: [
            {
              name: 'Treino de Hoje',
              short_name: 'Treino',
              description: 'Acessar diretamente o treino planejado para hoje',
              url: '/?shortcut=today',
              icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
            },
            {
              name: 'Treino Express (10 min)',
              short_name: 'Express',
              description: 'Versão curta para dias corridos sem perder o hábito',
              url: '/?shortcut=express',
              icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
            },
            {
              name: 'Meu Progresso & Recordes',
              short_name: 'Progresso',
              description: 'Ver evolução, histórico e recordes conquistados',
              url: '/?shortcut=progress',
              icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
            },
          ],
          screenshots: [
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Superação Mobile',
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              form_factor: 'wide',
              label: 'Superação Desktop',
            },
          ],
          icons: [
            {
              src: '/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        },
        workbox: {
          skipWaiting: true,
          clientsClaim: true,
          // Exclui o chunk do catálogo completo do precache inicial pesado, deixando-o para runtime sob demanda
          globIgnores: ['**/*catalog_full_pt*.js'],
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: /.*catalog_full_pt.*\.js$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'full-catalog-chunk-cache',
                expiration: {
                  maxEntries: 5,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 dias
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^\/exercises\/.*\.(?:jpg|jpeg|png|webp)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'exercises-images-cache',
                expiration: {
                  maxEntries: 1800,
                  maxAgeSeconds: 60 * 60 * 24 * 60, // 60 dias
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module'
        }
      })
    ],
    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/firebase/')) {
              return 'vendor-firebase';
            }
            if (id.includes('node_modules/@google/genai/')) {
              return 'vendor-genai';
            }
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
              return 'vendor-react';
            }
            if (id.includes('node_modules/lucide-react/') || id.includes('node_modules/canvas-confetti/')) {
              return 'vendor-ui';
            }
          },
        },
      },
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
