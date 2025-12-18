import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 5174,
    strictPort: true,
    host: true,
  },
  preview: {
    port: 5174,
    host: true,
  },
  plugins: [
    react(),
    VitePWA({
      injectRegister: null, // Disable auto injection
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg'],
      devOptions: {
        enabled: false // Disable in dev
      },
      manifest: {
        name: 'Crypto Investment Tracker',
        short_name: 'CryptoTracker',
        description: 'Track your crypto investments and portfolio',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'vite.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ],
        background_color: '#ffffff',
        display: 'standalone'
      }
    })
  ],
})
