import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { TestEnvironment } from './test-environment'

describe('TestEnvironment', () => {
  let testEnv: TestEnvironment

  beforeEach(() => {
    testEnv = new TestEnvironment()
  })

  afterEach(async () => {
    await testEnv.cleanup()
  })

  describe('初期化', () => {
    it('テスト環境が正常に初期化される', async () => {
      await testEnv.initialize()
      
      expect(testEnv.isInitialized()).toBe(true)
      expect(testEnv.getConfig()).toBeDefined()
      expect(testEnv.getConfig().baseUrl).toBe('http://localhost:3000')
    })

    it('ブラウザ設定が正しく設定される', async () => {
      await testEnv.initialize()
      
      const browserConfig = testEnv.getBrowserConfig()
      expect(browserConfig.headless).toBe(false)
      expect(browserConfig.viewport.width).toBe(1280)
      expect(browserConfig.viewport.height).toBe(720)
    })

    it('タイムアウト設定が正しく設定される', async () => {
      await testEnv.initialize()
      
      const timeouts = testEnv.getTimeouts()
      expect(timeouts.page).toBe(30000)
      expect(timeouts.api).toBe(10000)
      expect(timeouts.database).toBe(5000)
    })
  })

  describe('スクリーンショット設定', () => {
    it('スクリーンショット設定が正しく設定される', async () => {
      await testEnv.initialize()
      
      const screenshotConfig = testEnv.getScreenshotConfig()
      expect(screenshotConfig.enabled).toBe(true)
      expect(screenshotConfig.path).toContain('screenshots')
      expect(screenshotConfig.onFailure).toBe(true)
    })
  })

  describe('クリーンアップ', () => {
    it('テスト環境が正常にクリーンアップされる', async () => {
      await testEnv.initialize()
      await testEnv.cleanup()
      
      expect(testEnv.isInitialized()).toBe(false)
    })
  })
})