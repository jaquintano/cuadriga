import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Genera los PNG del manifest (64, 192, 512, maskable 512), apple-touch-icon y favicon.ico
// a partir de public/icon.svg. Uso: npx pwa-assets-generator
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, padding: 0, resizeOptions: { background: '#2B2118' } },
    apple: { ...minimal2023Preset.apple, padding: 0.1, resizeOptions: { background: '#2B2118' } },
  },
  images: ['public/icon.svg'],
});
