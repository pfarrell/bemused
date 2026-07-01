import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'P·Share',
        short_name: 'P·Share',
        description: 'Personal music streaming',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        start_url: '/bemused/app/',
        scope: '/bemused/app/',
        icons: [
          {
            src: '/bemused/app/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable any',
          },
          {
            src: '/bemused/app/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallback: '/bemused/app/index.html',
        runtimeCaching: [
          {
            urlPattern: /\/bemused\/stream\//,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /\/bemused\/api\//,
            handler: 'StaleWhileRevalidate',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      // jsmediatags package.json points browser field to dist/jsmediatags.js which doesn't
      // exist — only the .min.js is shipped. Point directly to the file that exists.
      'jsmediatags': 'jsmediatags/dist/jsmediatags.min.js',
    },
  },
  base: process.env.NODE_ENV === 'production' ? '/bemused/app/' : '/',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    },
    historyApiFallback: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
    globals: true,
  },
})
