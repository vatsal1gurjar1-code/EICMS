import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',   // Required so Docker can expose the port
    port: 5173,
    watch: {
      // Use polling in Docker on Windows to detect file changes
      usePolling: true,
    },
    proxy: {
      // Proxy /api requests to the FastAPI backend
      // This means in React you call /api/auth/login and it goes to localhost:8000
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
    },
  },
})
