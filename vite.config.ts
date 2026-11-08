import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './', // 👈 મોબાઈલ એપમાં વાઈટ સ્ક્રીન પ્રૉબ્લેમ ફિક્સ કરવા માટે આ લાઈન ખાસ ઉમેરી છે
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'Gurukul',
        short_name: 'Gurukul',
        description: 'Gurukul management system',
        theme_color: '#9b001c',
        background_color: '#0f172a',
        display: 'fullscreen',
        display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        categories: ['education'],
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        screenshots: [
          { src: '/screenshots/mobile-login.png', sizes: '384x858', type: 'image/png', form_factor: 'narrow', label: 'Login' },
          { src: '/screenshots/mobile-dashboard.png', sizes: '412x915', type: 'image/png', form_factor: 'narrow', label: 'Dashboard' },
          { src: '/screenshots/mobile-progress.png', sizes: '412x915', type: 'image/png', form_factor: 'narrow', label: 'Progress' },
          { src: '/screenshots/desktop-dashboard.png', sizes: '1920x1080', type: 'image/png', form_factor: 'wide', label: 'Dashboard' },
        ],
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 5500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            if (id.includes('cloudinary')) {
              return 'cloudinary-vendor';
            }
            return 'vendor';
          }
        },
      },
    },
  },
})