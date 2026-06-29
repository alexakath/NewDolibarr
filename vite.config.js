import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost/dolibarr/htdocs/api/index.php',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/custom-api': {
        target: 'http://localhost/dolibarr/htdocs/api/custom_reset.php',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/custom-api/, ''),
      },
      '/backend/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/backend\/api/, '/api'),
      },
    },
  },
})
