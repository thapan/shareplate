import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: '/shareplate/',
  plugins: [react({ include: /\.(js|jsx|ts|tsx)$/ })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.js$|\.jsx$|\.js$/,
  },
});
