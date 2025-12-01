import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // allow hostnames used when accessing the dev server from other machines or DNS
    // Add reactjs.duongle.io.vn to permit that host (prevents "Blocked request" errors)
    allowedHosts: ['reactjs.duongle.io.vn'],
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true
      },
      // Non /api endpoints needed by checkout (qr confirm, paypal capture)
      '/order': {
        target: 'http://localhost:3002',
        changeOrigin: true
      },
      // Serve uploaded images from backend during dev
      '/uploads': {
        target: 'http://localhost:3002',
        changeOrigin: true
      },
      // Admin stats JSON/CSV endpoints only (keep /admin route in SPA)
      '/admin/stats.json': {
        target: 'http://localhost:3002',
        changeOrigin: true
      },
      '/admin/stats.csv': {
        target: 'http://localhost:3002',
        changeOrigin: true
      }
    }
  }
})
