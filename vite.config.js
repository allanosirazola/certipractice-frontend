import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // ─── PWA configuration ───────────────────────────────────────────
    // Cache the app shell aggressively (landing works offline) and use
    // NetworkFirst for /api/* (always show fresh data online, fall
    // back to stale-but-usable when the network drops). Static cert
    // logos and the i18n JSON are cached aggressively too — they
    // rarely change.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'robots.txt', 'og-image.svg', 'images/**/*'],
      manifest: {
        name: 'CertiPractice — Practica certificaciones técnicas',
        short_name: 'CertiPractice',
        description: 'Prepara tus certificaciones AWS, Azure, GCP, Databricks, Salesforce y más con simulacros realistas, repaso espaciado y plan de estudio.',
        theme_color: '#2563eb',
        background_color: '#1e3a8a',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        lang: 'es',
        categories: ['education', 'productivity'],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // Bigger cap because the PDF generator chunk is ~390KB
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        // SPA fallback for client-side routes (including /verify-email).
        // The URL with ?token=... reaches the page intact because the
        // service worker only serves the shell — query string is
        // preserved by the browser.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // NetworkFirst for the JSON API — SAME-ORIGIN ONLY.
            // The cross-origin backend on Railway must never be cached
            // by the SW: opaque (status 0) responses end up poisoning
            // the cache after CORS preflight failures, and a single
            // bad response keeps serving "no-response" forever even
            // after the server is fixed. Pattern previously was just
            // `url.pathname.startsWith('/api/')`, which incorrectly
            // intercepted both same-origin and cross-origin requests.
            urlPattern: ({ url }) =>
              url.origin === self.location.origin && url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [200] }, // only real successes
            },
          },
          {
            // Long-lived static images
            urlPattern: /\/images\/.*\.(png|jpg|jpeg|svg|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            // i18n bundles
            urlPattern: /\/locales\/.*\.json$/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'i18n-cache' },
          },
        ],
      },
      // No SW in dev — would interfere with HMR
      devOptions: { enabled: false },
    }),
  ],
  server: { port: 5173, open: true },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          'pdf': ['jspdf'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setupTests.js',
    exclude: ['**/node_modules/**', '**/dist/**', '**/dist-admin/**', 'admin/**'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'src/tests/**', '**/*.config.js', 'src/main.jsx',
        'src/i18n/**', 'scripts/**', 'admin/**',
      ],
    },
  },
})
