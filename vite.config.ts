import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// BASE_URL lets the site live in a subfolder (GitHub Pages: /daymark/).
const raw = process.env.BASE_URL || '/';
const base = raw.endsWith('/') ? raw : raw + '/';

export default defineConfig({
  base,
  plugins: [react()],
  build: { target: 'es2020' },
});
