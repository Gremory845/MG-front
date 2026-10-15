import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// En desarrollo, todo lo que empiece con /api se reenvía al backend Go
// (quitando el prefijo /api). Así no necesitamos configurar CORS.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
