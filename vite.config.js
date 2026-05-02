import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  },
  build: {
    // Larger limit because of jsPDF; chunks below are explicit and bounded.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor split: keep React core in its own cacheable chunk
          'react-vendor': ['react', 'react-dom'],
          // i18n bundle
          'i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          // PDF generator is heavy and only used when downloading reports
          'pdf': ['jspdf'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setupTests.js',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'src/tests/**',
        '**/*.config.js',
        'src/main.jsx',
        'src/i18n/**',
        'scripts/**',
      ],
    },
  },
})
