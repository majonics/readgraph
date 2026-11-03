/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { libraryApi } from './src/api/plugin.ts';

export default defineConfig({
  plugins: [react(), tailwindcss(), libraryApi()],
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
