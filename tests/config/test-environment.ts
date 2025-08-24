export interface TestConfig {
  baseUrl: string
  databaseUrl: string
  testDataPrefix: string
  screenshotPath: string
  reportPath: string
  timeout: {
    page: number
    api: number
    database: number
  }
}

export interface BrowserConfig {
  headless: boolean
  viewport: {
    width: number
    height: number
  }
  userAgent?: string
  permissions: string[]
  locale: string
}

export interface ScreenshotConfig {
  enabled: boolean
  path: string
  onFailure: boolean
}

export class TestEnvironment {
  private initialized = false
  private config: TestConfig
  private browserConfig: BrowserConfig
  private screenshotConfig: ScreenshotConfig

  constructor() {
    this.config = {
      baseUrl: 'http://localhost:3000',
      databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/test',
      testDataPrefix: 'test_',
      screenshotPath: './tests/screenshots',
      reportPath: './tests/reports',
      timeout: {
        page: 30000,
        api: 10000,
        database: 5000
      }
    }

    this.browserConfig = {
      headless: false,
      viewport: {
        width: 1280,
        height: 720
      },
      permissions: ['notifications'],
      locale: 'ja-JP'
    }

    this.screenshotConfig = {
      enabled: true,
      path: './tests/screenshots',
      onFailure: true
    }
  }

  async initialize(): Promise<void> {
    // 初期化処理
    this.initialized = true
  }

  async cleanup(): Promise<void> {
    // クリーンアップ処理
    this.initialized = false
  }

  isInitialized(): boolean {
    return this.initialized
  }

  getConfig(): TestConfig {
    return this.config
  }

  getBrowserConfig(): BrowserConfig {
    return this.browserConfig
  }

  getTimeouts() {
    return this.config.timeout
  }

  getScreenshotConfig(): ScreenshotConfig {
    return this.screenshotConfig
  }
}