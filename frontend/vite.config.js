import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
const backendTarget = process.env.VITE_API_URL || process.env.BACKEND_URL
if (!backendTarget) {
  console.warn('VITE_API_URL or BACKEND_URL is not set. Vite proxy will not function without a backend target.')
}

export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
