import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/earthpulse/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Heavy 3D engine — largest dependency (~1MB)
          'vendor-three': ['three'],
          // Globe wrapper
          'vendor-globe': ['react-globe.gl'],
          // Icons
          'vendor-icons': ['lucide-react'],
          // Date utilities
          'vendor-date': ['date-fns'],
        },
      },
    },
  },
})
