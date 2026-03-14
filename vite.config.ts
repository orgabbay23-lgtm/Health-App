import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          motion: ["framer-motion"],
          ai: ["@google/generative-ai", "zod"],
          forms: ["react-hook-form", "@hookform/resolvers"],
          radix: ["@radix-ui/react-accordion", "@radix-ui/react-tabs"],
        },
      },
    },
  },
});
