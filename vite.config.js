import { defineConfig, loadEnv } from 'vite'
import { createHash } from 'node:crypto'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'


/**
 * Adds a Content-Security-Policy to the PRODUCTION build only (dev keeps
 * working with Vite's hot reload). It tells the browser exactly which
 * outside services this site may talk to or load code from, so injected
 * scripts (XSS) can't send customer data to a stranger's server or pull
 * in their code. The inline script hashes are computed automatically from
 * whatever inline <script> blocks the final HTML contains.
 *
 * If you add a NEW outside service (another API, CDN, analytics...), add
 * its address below — otherwise the browser will block it.
 */
function contentSecurityPolicy(env) {
  const hostOf = (value) => {
    try { return new URL(value.startsWith('http') ? value : `https://${value}`).host } catch { return '' }
  }
  const supabaseHost = hostOf(env.VITE_SUPABASE_URL || '')
  const firebaseAuthHost = hostOf(env.VITE_FIREBASE_AUTH_DOMAIN || '')
  return {
    name: 'plasma-care-csp',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const hashes = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)]
          .map((m) => `'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`)
        const connect = [
          "'self'", 'blob:', 'data:',
          supabaseHost && `https://${supabaseHost}`, supabaseHost && `wss://${supabaseHost}`,
          'https://*.supabase.co', 'wss://*.supabase.co',
          'https://api.cloudinary.com', 'https://res.cloudinary.com',
          'https://nominatim.openstreetmap.org',
          'https://ipapi.co', 'https://api.ipify.org', 'https://api64.ipify.org', 'https://www.cloudflare.com',
          'https://challenges.cloudflare.com',
          // Firebase (customer accounts): Auth, Firestore, App Check, Storage
          'https://*.googleapis.com', 'https://*.firebaseio.com', 'wss://*.firebaseio.com',
          'https://*.firebaseapp.com', 'https://*.web.app',
          firebaseAuthHost && `https://${firebaseAuthHost}`,
          'https://www.google.com', 'https://www.gstatic.com', 'https://www.recaptcha.net',
        ].filter(Boolean)
        const frames = [
          'https://challenges.cloudflare.com',
          'https://*.firebaseapp.com', 'https://*.web.app', firebaseAuthHost && `https://${firebaseAuthHost}`,
          'https://accounts.google.com', 'https://apis.google.com',
          'https://www.google.com', 'https://www.recaptcha.net',
        ].filter(Boolean)
        const policy = [
          "default-src 'self'",
          `script-src 'self' ${hashes.join(' ')} https://challenges.cloudflare.com https://apis.google.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://www.recaptcha.net`,
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' data: https://fonts.gstatic.com",
          "img-src 'self' data: blob: https:",
          "media-src 'self' blob: https:",
          `connect-src ${connect.join(' ')}`,
          `frame-src ${frames.join(' ')}`,
          "worker-src 'self' blob:",
          "manifest-src 'self'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; ')
        return [{
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: policy },
          injectTo: 'head-prepend',
        }]
      },
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
  plugins: [
    react(),
    contentSecurityPolicy(env),
    VitePWA({
      registerType: 'autoUpdate',
      // Originally portal-only; now also used for the customer site's
      // "Add to home screen" prompt for the Senior Citizen Assistant
      // feature (see InstallAppPrompt.jsx) — same service worker, same
      // build, so one manifest covers both.
      includeAssets: ['favicon.png'],
      manifest: {
        name: 'Plasma Care',
        short_name: 'Plasma Care',
        start_url: '/',
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
  // GitHub Pages serves this site from /Plasma-Care-/, Vercel from the root.
  // Vercel sets VERCEL=1 while building, so each host gets the right paths.
  base: process.env.VERCEL ? '/' : '/Plasma-Care-/',
  build: {
    // Explicit on purpose: a source map would let anyone reconstruct
    // readable source from the minified production bundle. This is
    // still not real protection (see src/lib/siteSecurity.js) — it just
    // avoids handing out the readable version for free.
    sourcemap: false,
  },
}
})
