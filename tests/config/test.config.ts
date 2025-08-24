import { TestEnvironment } from './test-environment'
import { PlaywrightTestBase } from './playwright-base'

export interface TestSuiteConfig {
  name: string
  description: string
  timeout: number
  retries: number
  parallel: boolean
}

export class TestConfig {
  private environment: TestEnvironment
  private playwrightBase: PlaywrightTestBase

  constructor() {
    this.environment = new TestEnvironment()
    this.playwrightBase = new PlaywrightTestBase()
  }

  async initialize(): Promise<void> {
    await this.environment.initialize()
    await this.playwrightBase.setup()
  }

  async cleanup(): Promise<void> {
    await this.playwrightBase.cleanup()
    await this.environment.cleanup()
  }

  getEnvironment(): TestEnvironment {
    return this.environment
  }

  getPlaywrightBase(): PlaywrightTestBase {
    return this.playwrightBase
  }

  getDefaultSuiteConfig(): TestSuiteConfig {
    return {
      name: 'User Workflow Test Suite',
      description: '稚内除排雪システムのユーザーワークフローテスト',
      timeout: 30000,
      retries: 2,
      parallel: false
    }
  }
}

// グローバル設定のエクスポート
export const globalTestConfig = new TestConfig()