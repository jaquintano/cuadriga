import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages sirve el repo en /cuadriga/. En `vite dev` se usa la raíz; `vite preview`
// sirve el build, así que necesita el mismo base que producción.
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/cuadriga/' : '/',
  plugins: [
    preact(),
    VitePWA({
      // El SW nuevo se activa solo; el estado vive en IndexedDB, así que recargar no pierde nada.
      registerType: 'autoUpdate',
      injectRegister: false, // lo registramos en main.tsx para saber cuándo está listo offline
      manifest: {
        name: 'El Secreto de la Cuádriga',
        short_name: 'Cuádriga',
        description: 'Búsqueda del tesoro por Berlín y Potsdam.',
        lang: 'es',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#2B2118',
        background_color: '#F3E9D2',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache de TODO el app shell: JS, CSS, HTML, fuentes, iconos. El contenido (JSON) va dentro del JS.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,webmanifest}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
}));
