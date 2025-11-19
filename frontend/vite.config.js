import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
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
