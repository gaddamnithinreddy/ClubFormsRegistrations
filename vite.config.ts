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
    ],
    exclude: ['zustand']
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 600,
    cssMinify: false,
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        main: './index.html'
      },
      output: {
        manualChunks: {
          'vendor': [
            'react',
            'react-dom',
            'react/jsx-runtime',
            'react-router-dom',
            'framer-motion',
            'lucide-react',
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extension-placeholder',
            'dompurify',
            'qrcode.react',
            'date-fns',
            'zustand'
          ]
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
