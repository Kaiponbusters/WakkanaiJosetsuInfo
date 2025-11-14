import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'], // グローバルセットアップファイル
    include: ['**/*.{test,spec}.{js,ts}'],
    exclude: ['tests/playwright/**', 'node_modules/**'],
    coverage: { // オプション: カバレッジレポートを有効にする場合
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, '.'),
      '@': resolve(__dirname, '.'),
      '#imports': resolve(__dirname, '.nuxt/imports.d.ts'),
    },
  },
  define: {
    'process.env.NODE_ENV': '"test"',
  },
}) 