import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PlaywrightTestBase } from './playwright-base'

describe('PlaywrightTestBase', () => {
  let testBase: PlaywrightTestBase

  beforeEach(() => {
    testBase = new PlaywrightTestBase()
  })

  afterEach(async () => {
    await testBase.cleanup()
  })

  describe('初期化', () => {
    it('Playwrightテストベースが正常に初期化される', async () => {
      await testBase.setup()
      
      expect(testBase.isReady()).toBe(true)
      expect(testBase.getBrowser()).toBeDefined()
      expect(testBase.getPage()).toBeDefined()
    })

    it('ページが正しく設定される', async () => {
      await testBase.setup()

      const page = testBase.getPage()
      expect(page).toBeDefined()
      const viewport = await page?.viewportSize()
      expect(viewport).toEqual({ width: 1280, height: 720 })
    })
  })

  describe('ナビゲーション', () => {
    it('指定されたURLにナビゲートできる', async () => {
      await testBase.setup()

      await testBase.navigateTo('/josetsu')
      const page = testBase.getPage()
      expect(page).toBeDefined()
      const url = page!.url()
      expect(url).toContain('/josetsu')
    })

    it('ページロード完了を待機できる', async () => {
      await testBase.setup()
      
      const startTime = Date.now()
      await testBase.waitForPageLoad()
      const endTime = Date.now()
      
      expect(endTime - startTime).toBeGreaterThan(0)
    })
  })

  describe('要素操作', () => {
    it('要素の存在を確認できる', async () => {
      await testBase.setup()
      await testBase.navigateTo('/')
      
      const exists = await testBase.elementExists('body')
      expect(exists).toBe(true)
    })

    it('要素のクリックができる', async () => {
      await testBase.setup()
      await testBase.navigateTo('/')
      
      // ボタンが存在する場合のテスト
      const buttonExists = await testBase.elementExists('button')
      if (buttonExists) {
        await expect(testBase.clickElement('button')).resolves.not.toThrow()
      }
    })
  })

  describe('スクリーンショット', () => {
    it('スクリーンショットを取得できる', async () => {
      await testBase.setup()
      await testBase.navigateTo('/')
      
      const screenshot = await testBase.takeScreenshot('test-screenshot')
      expect(screenshot).toBeDefined()
      expect(typeof screenshot).toBe('string')
    })
  })

  describe('クリーンアップ', () => {
    it('リソースが正常にクリーンアップされる', async () => {
      await testBase.setup()
      await testBase.cleanup()
      
      expect(testBase.isReady()).toBe(false)
    })
  })
})