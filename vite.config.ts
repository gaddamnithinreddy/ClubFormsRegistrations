import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({
    jsxRuntime: 'classic'
  })],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      '@tiptap/react',
      '@tiptap/starter-kit',
      '@tiptap/extension-placeholder',
      'qrcode.react'
    ]
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 600,
    cssMinify: false,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        assetFileNames: (info) => {
          const name = info.name || '';
          if (name.endsWith('.css')) {
            return 'assets/css/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react/') || id.includes('react-dom/') || id.includes('react/jsx-runtime')) {
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
            if (id.includes('dompurify') || id.includes('qrcode.react') || id.includes('date-fns')) {
              return 'utils-vendor';
            }
            return 'vendor';
          }
        }
      }
    }
  },
  css: {
    postcss: {
      plugins: [
        autoprefixer(),
        tailwindcss()
      ]
    },
    modules: {
      localsConvention: 'camelCase'
    }
  },
  server: {
    port: 3000,
    host: true,
  },
});
