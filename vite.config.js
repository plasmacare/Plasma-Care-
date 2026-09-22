import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Only the portal (staff/admin/B2B) needs offline support — the
      // customer booking site is left alone so first-time visitors never
      // download a service worker for no benefit to them.
      includeAssets: ['favicon.png'],
      manifest: {
        name: 'Plasma Care Portal',
        short_name: 'Plasma Care',
        start_url: '/portal/staff',
        display: 'standalone',
        theme_color: '#0B2545',
        background_color: '#0B2545',
        icons: [
          { src: '/favicon.png', sizes: '192x192', type: 'image/png' },
          { src: '/favicon.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // App shell (JS/CSS/HTML) — lets the portal open at all when
        // offline, instead of the browser's own "no internet" page.
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        navigateFallback: '/index.html',
        // Supabase REST reads (GET) are served from cache first when
        // offline, and refreshed in the background when online, so
        // bookings/catalog/B2B-request lists still show the last-synced
        // data instead of a blank screen. Writes are handled separately
        // by src/lib/offlineFetch.js, not by the service worker.
        runtimeCaching: [
          {
            urlPattern: ({ url, request }) => url.pathname.includes('/rest/v1/') && request.method === 'GET',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'supabase-reads',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  base: '/Plasma-Care-/',
})
