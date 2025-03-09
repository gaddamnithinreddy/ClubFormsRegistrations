import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: [
      '@tiptap/react',
      '@tiptap/starter-kit',
      '@tiptap/extension-placeholder'
    ]
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react/') || id.includes('react-dom/')) {
              return 'react-vendor';
            }
            if (id.includes('react-router-dom')) {
              return 'router-vendor';
            }
            if (id.includes('framer-motion')) {
              return 'ui-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }
            if (id.includes('@tiptap')) {
              return 'tiptap-vendor';
            }
            if (id.includes('dompurify') || id.includes('qrcode') || id.includes('date-fns')) {
              return 'utils-vendor';
            }
            return 'vendor';
          }
        }
      }
    },
    cssMinify: 'lightningcss',
  },
  server: {
    port: 3000,
    host: true,
  },
});
