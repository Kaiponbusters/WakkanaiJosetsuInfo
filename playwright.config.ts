import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E テスト設定
 * Playwright MCP使用時の設定
 */
export default defineConfig({
  // テストディレクトリ
  testDir: './tests/playwright/specs',
  
  // 並列実行の設定
  fullyParallel: true,
  
  // CI環境での設定
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // レポート設定
  reporter: [
    ['html', { outputFolder: 'tests/playwright/artifacts/html-report' }],
    ['json', { outputFile: 'tests/playwright/artifacts/test-results.json' }],
    ['junit', { outputFile: 'tests/playwright/artifacts/junit-results.xml' }],
    ['list']
  ],
  
  // グローバル設定
  use: {
    // ベースURL（開発サーバー）
    baseURL: 'http://localhost:3000',
    
    // ブラウザ設定
    viewport: { width: 1280, height: 720 },
    
    // スクリーンショット設定
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // トレース設定
    trace: 'on-first-retry',
    
    // アーティファクト保存場所
    contextOptions: {
      recordVideo: {
        dir: 'tests/playwright/artifacts/videos/'
      }
    }
  },

  // プロジェクト設定（複数ブラウザ対応）
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // モバイル環境テスト
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Webサーバー設定（開発サーバーを自動起動）
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2分
  },

  // テスト実行設定
  timeout: 30 * 1000, // 30秒
  expect: {
    timeout: 5 * 1000, // 5秒
  },

  // ファイル設定
  outputDir: 'tests/playwright/artifacts/test-results/',
  globalSetup: './tests/playwright/fixtures/cleanup.ts',
  globalTeardown: './tests/playwright/fixtures/teardown.ts',
}); 