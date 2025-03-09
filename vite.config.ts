import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'ui-vendor': ['framer-motion'],
          'icons-vendor': ['lucide-react'],
          'form-vendor': ['@tiptap/react', '@tiptap/starter-kit', '@tiptap/extension-placeholder'],
          'utils-vendor': ['dompurify', 'qrcode', 'date-fns']
        },
      },
    },
    cssMinify: 'lightningcss',
  },
  server: {
    port: 3000,
    host: true,
  },
});
