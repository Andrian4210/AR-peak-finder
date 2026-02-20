import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import basicSsl from '@vitejs/plugin-basic-ssl';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),

    // ── HTTPS for secure-context APIs (Geolocation, DeviceOrientation, Service Workers) ──
    basicSsl(),

    // ── PWA configuration ──
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'AR Peak Finder',
        short_name: 'PeakFinder',
        description: 'Identify mountain peaks in augmented reality',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'landscape',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],

  // ── Web Worker support (Vite handles this natively via `?worker` imports) ──
  worker: {
    format: 'es',
  },

  server: {
    // basicSsl plugin handles HTTPS certificates automatically
    host: true, // expose on LAN for mobile testing
  },
});
