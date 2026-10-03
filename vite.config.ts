import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';

// GitHub Pages sirve el repo en /cuadriga/. En local (dev) se usa la raíz.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/cuadriga/' : '/',
  plugins: [preact()],
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
}));
