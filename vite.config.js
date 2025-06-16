import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@assets': path.resolve(__dirname, './public/assets')
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-spring'],
          // Add other libraries you use
        },
      },
    },
  },
  server: {
    headers: {
      'Cache-Control': 'no-store',
    },
  },
  preview: {
    headers: {
      // For preview server
      '/*.js': {
        'Cache-Control': 'public, max-age=86400',
      },
      '/*.css': {
        'Cache-Control': 'public, max-age=86400',
      },
      '/assets/sequences/*': {
        'Cache-Control': 'public, max-age=604800, immutable',
      },
    },
  },
})