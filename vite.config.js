import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'lcov', 'html'],
      include: [
        'src/utils/**',
        'src/redux/**',
        'src/https/**',
        'src/hooks/**',
        'src/components/**',
        'src/pages/**',
      ],
      exclude: [
        'src/main.jsx',
        'src/pages/index.js',
        'src/constants/**',
        'src/context/**',
        'src/test/**',
        '**/*.test.{js,jsx}',
        '**/*.spec.{js,jsx}',
      ],
    },
  },
})