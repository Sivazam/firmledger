import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*'],
      manifestFilename: 'manifest.json',
      manifest: {
        name: 'Viswa Ledger',
        short_name: 'Viswa Ledger',
        description: 'Professional Client & Ledger Management',
        theme_color: '#FFFFFF',
        background_color: '#F5F5F5',
        display: 'standalone',
        scope: '/',
        start_url: '/?source=pwa',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  define: {
    global: 'window',
  },
})
