import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

/**
 * Vite config for the admin panel.
 *
 * Built and served separately from the public frontend so we can:
 *  - Deploy under admin.certipractice.com
 *  - Restrict via IP allowlist / VPN at the edge
 *  - Keep public bundle small
 *
 * Run:  npm run dev:admin   (port 5174)
 * Build: npm run build:admin (output: dist-admin/)
 */
export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, 'admin'),
  publicDir: path.resolve(__dirname, 'public'),
  resolve: {
    alias: {
      '@admin': path.resolve(__dirname, 'admin/src'),
    },
  },
  server: {
    port: 5174,
    open: false,
    strictPort: true,
  },
  build: {
    outDir: path.resolve(__dirname, 'dist-admin'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'recharts': ['recharts'],
          'query': ['@tanstack/react-query'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [path.resolve(__dirname, 'admin/src/tests/setupTests.js')],
    include: ['src/**/*.test.{js,jsx}'],
    css: true,
    unstubGlobals: false,
    restoreMocks: false,
    clearMocks: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['src/tests/**', '**/*.config.js', 'src/main.jsx'],
    },
  },
})
