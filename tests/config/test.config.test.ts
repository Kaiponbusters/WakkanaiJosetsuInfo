import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { TestConfig } from './test.config'

describe('TestConfig', () => {
  let testConfig: TestConfig

  beforeEach(() => {
    testConfig = new TestConfig()
  })

  afterEach(async () => {
    await testConfig.cleanup()
  })

  describe('初期化', () => {
    it('テスト設定が正常に初期化される', async () => {
      await testConfig.initialize()
      
      expect(testConfig.getEnvironment()).toBeDefined()
      expect(testConfig.getPlaywrightBase()).toBeDefined()
      expect(testConfig.getEnvironment().isInitialized()).toBe(true)
      expect(testConfig.getPlaywrightBase().isReady()).toBe(true)
    })

    it('デフォルトスイート設定が正しく設定される', () => {
      const suiteConfig = testConfig.getDefaultSuiteConfig()
      
      expect(suiteConfig.name).toBe('User Workflow Test Suite')
      expect(suiteConfig.description).toBe('稚内除排雪システムのユーザーワークフローテスト')
      expect(suiteConfig.timeout).toBe(30000)
      expect(suiteConfig.retries).toBe(2)
      expect(suiteConfig.parallel).toBe(false)
    })
  })

  describe('クリーンアップ', () => {
    it('すべてのリソースが正常にクリーンアップされる', async () => {
      await testConfig.initialize()
      await testConfig.cleanup()
      
      expect(testConfig.getEnvironment().isInitialized()).toBe(false)
      expect(testConfig.getPlaywrightBase().isReady()).toBe(false)
    })
  })
})