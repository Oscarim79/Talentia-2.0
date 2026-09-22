import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages sirve el sitio bajo /<repo>/ (https://oscarim79.github.io/Talentia-2.0/).
// El workflow de despliegue define GITHUB_PAGES=true; en local la base sigue siendo "/".
const base = process.env.GITHUB_PAGES ? '/Talentia-2.0/' : '/';

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
});
