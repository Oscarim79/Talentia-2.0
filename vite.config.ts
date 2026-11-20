import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Carpeta desde la que se sirve el sitio. El workflow de Pages la toma de GitHub
// (actions/configure-pages): "/" con el dominio propio (https://talentialabs.app/) y
// "/Talentia-2.0/" si se vuelve a la dirección de github.io. En local siempre es "/".
const base = process.env.PAGES_BASE || '/';

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
});
