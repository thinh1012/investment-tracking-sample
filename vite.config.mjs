import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  server: {
    port: 5174,
    strictPort: true,
    host: true,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surround-Control': 'max-age=0',
      // ✅ FIX: Configure CSP to allow Supabase and app resources in Electron
      'Content-Security-Policy': [
        "default-src 'self'",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.telegram.org https://cryptoprices.cc",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' data: https: blob:",
        "font-src 'self' data: https://fonts.gstatic.com",
        "worker-src 'self' blob:"
      ].join('; ')
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  preview: {
    port: 5176,
    host: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg', 'favicon.ico', 'icon-192.png', 'icon-512.png'],
      devOptions: {
        enabled: true
      },
      // Workbox configuration for offline caching
      workbox: {
        // Cache all static assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Runtime caching strategies
        runtimeCaching: [
          {
            // Cache CoinGecko API responses (prices)
            urlPattern: /^https:\/\/api\.coingecko\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'coingecko-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 4 // 4 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache DefiLlama API responses (TVL, DeFi metrics)
            urlPattern: /^https:\/\/api\.llama\.fi\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'defillama-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 6 // 6 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache Hyperliquid API (perp prices)
            urlPattern: /^https:\/\/api\.hyperliquid\.xyz\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'hyperliquid-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 30 // 30 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 5
            }
          },
          {
            // Cache Google Fonts
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      manifest: {
        name: 'Crypto Investment Tracker',
        short_name: 'Tracker',
        description: 'Premium Portfolio Performance Tracking',
        theme_color: '#6366f1',
        background_color: '#020617',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })

  ],
  build: {
    chunkSizeWarningLimit: 600, // kB - increase from default 500
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-charts': ['recharts'],
          'vendor-lucide': ['lucide-react'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-idb': ['idb'],
          'vendor-alasql': ['alasql'],
        }
      }
    }
  },
})
