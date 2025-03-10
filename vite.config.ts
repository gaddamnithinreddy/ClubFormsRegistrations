import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
      external: ['react', 'react-dom', 'react/jsx-runtime'],
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
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],
          'router-vendor': ['react-router-dom'],
          'ui-vendor': ['framer-motion'],
          'icons-vendor': ['lucide-react'],
          'tiptap-vendor': ['@tiptap/react', '@tiptap/starter-kit', '@tiptap/extension-placeholder'],
          'utils-vendor': ['dompurify', 'qrcode.react', 'date-fns']
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
