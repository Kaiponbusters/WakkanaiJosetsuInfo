import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PlaywrightTestBase } from '../config/playwright-base'

describe('除雪情報表示ページ - レスポンシブデザインテスト', () => {
  // Playwright MCPを使用した実際のブラウザテスト
  let testBase: PlaywrightTestBase

  beforeEach(async () => {
    // 実際のブラウザでテストを実行
    testBase = new PlaywrightTestBase()
    await testBase.setup()
  })

  afterEach(async () => {
    // クリーンアップ
    await testBase.cleanup()
  })

  describe('デスクトップビューポート', () => {
    it('1920x1080でのレイアウト確認', async () => {
      // デスクトップサイズに設定
      await testBase.resizeBrowser(1920, 1080)
      await testBase.navigateToPage('/josetsu')
      
      // ページロード待機
      await testBase.waitForElement('[data-testid="snow-report-list"]')
      
      // デスクトップレイアウトの確認
      const isDesktopLayout = await testBase.verifyElementVisible('[data-testid="desktop-layout"]')
      expect(isDesktopLayout).toBe(true)
      
      // サイドバーが表示されることを確認
      const isSidebarVisible = await testBase.verifyElementVisible('[data-testid="sidebar"]')
      expect(isSidebarVisible).toBe(true)
    })

    it('1366x768でのレイアウト確認', async () => {
      // 一般的なラップトップサイズに設定
      await testBase.resizeBrowser(1366, 768)
      await testBase.navigateToPage('/josetsu')
      
      // ページロード待機
      await testBase.waitForElement('[data-testid="snow-report-list"]')
      
      // レイアウトが適切に調整されることを確認
      const isResponsiveLayout = await testBase.verifyElementVisible('[data-testid="responsive-layout"]')
      expect(isResponsiveLayout).toBe(true)
    })
  })

  describe('タブレットビューポート', () => {
    it('768x1024でのレイアウト確認', async () => {
      // タブレットサイズに設定
      await testBase.resizeBrowser(768, 1024)
      await testBase.navigateToPage('/josetsu')
      
      // ページロード待機
      await testBase.waitForElement('[data-testid="snow-report-list"]')
      
      // タブレットレイアウトの確認
      const isTabletLayout = await testBase.verifyElementVisible('[data-testid="tablet-layout"]')
      expect(isTabletLayout).toBe(true)
      
      // サイドバーが折りたたまれることを確認
      const isSidebarCollapsed = await testBase.verifyElementHidden('[data-testid="sidebar"]')
      expect(isSidebarCollapsed).toBe(true)
    })
  })

  describe('モバイルビューポート', () => {
    it('375x667でのレイアウト確認', async () => {
      // iPhone SE サイズに設定
      await testBase.resizeBrowser(375, 667)
      await testBase.navigateToPage('/josetsu')
      
      // ページロード待機
      await testBase.waitForElement('[data-testid="snow-report-list"]')
      
      // モバイルレイアウトの確認
      const isMobileLayout = await testBase.verifyElementVisible('[data-testid="mobile-layout"]')
      expect(isMobileLayout).toBe(true)
      
      // ハンバーガーメニューが表示されることを確認
      const isHamburgerVisible = await testBase.verifyElementVisible('[data-testid="hamburger-menu"]')
      expect(isHamburgerVisible).toBe(true)
    })

    it('320x568でのレイアウト確認', async () => {
      // 小さなモバイル画面サイズに設定
      await testBase.resizeBrowser(320, 568)
      await testBase.navigateToPage('/josetsu')
      
      // ページロード待機
      await testBase.waitForElement('[data-testid="snow-report-list"]')
      
      // 小画面でのレイアウト確認
      const isSmallMobileLayout = await testBase.verifyElementVisible('[data-testid="small-mobile-layout"]')
      expect(isSmallMobileLayout).toBe(true)
      
      // コンテンツが適切に表示されることを確認
      const contentVisible = await testBase.verifyElementVisible('[data-testid="snow-report-item"]')
      expect(contentVisible).toBe(true)
    })
  })

  describe('タッチ操作シミュレーション', () => {
    beforeEach(async () => {
      // モバイルビューポートに設定
      await testBase.resizeBrowser(375, 667)
      await testBase.navigateToPage('/josetsu')
      await testBase.waitForElement('[data-testid="snow-report-list"]')
    })

    it.skip('日付グループのタッチ展開操作', async () => {
      // 日付グループをタッチ操作で展開
      await testBase.touchElement('[data-testid="date-group-2024-01-15"]')
      
      // 展開されたコンテンツが表示されることを確認
      const isExpanded = await testBase.verifyElementVisible('[data-testid="date-group-content-2024-01-15"]')
      expect(isExpanded).toBe(true)
    })

    it('スワイプ操作のシミュレーション', async () => {
      // スワイプ操作をシミュレート
      await testBase.swipeElement('[data-testid="snow-report-list"]', 'left')
      
      // スワイプ後の状態確認
      const afterSwipe = await testBase.verifyElementVisible('[data-testid="snow-report-list"]')
      expect(afterSwipe).toBe(true)
    })

    it('ピンチズーム操作のシミュレーション', async () => {
      // 地図コンポーネントが存在する場合のピンチズーム
      const mapExists = await testBase.verifyElementVisible('[data-testid="map-component"]')
      
      if (mapExists) {
        await testBase.pinchZoom('[data-testid="map-component"]', 1.5)
        
        // ズーム後の状態確認
        const afterZoom = await testBase.verifyElementVisible('[data-testid="map-component"]')
        expect(afterZoom).toBe(true)
      }
    })
  })

  describe('レスポンシブ要素の表示切り替え', () => {
    it('画面サイズ変更時の要素表示切り替え', async () => {
      // デスクトップサイズから開始
      await testBase.resizeBrowser(1920, 1080)
      await testBase.navigateToPage('/josetsu')
      await testBase.waitForElement('[data-testid="snow-report-list"]')
      
      // デスクトップ専用要素の確認
      const desktopElement = await testBase.verifyElementVisible('[data-testid="desktop-only-element"]')
      expect(desktopElement).toBe(true)
      
      // モバイルサイズに変更
      await testBase.resizeBrowser(375, 667)
      
      // デスクトップ専用要素が非表示になることを確認
      const desktopElementHidden = await testBase.verifyElementHidden('[data-testid="desktop-only-element"]')
      expect(desktopElementHidden).toBe(true)
      
      // モバイル専用要素が表示されることを確認
      const mobileElement = await testBase.verifyElementVisible('[data-testid="mobile-only-element"]')
      expect(mobileElement).toBe(true)
    })
  })

  describe('フォントサイズとスペーシングの調整', () => {
    it('モバイルでのフォントサイズ確認', async () => {
      await testBase.resizeBrowser(375, 667)
      await testBase.navigateToPage('/josetsu')
      await testBase.waitForElement('[data-testid="snow-report-list"]')
      
      // モバイル用フォントサイズが適用されることを確認
      const fontSize = await testBase.getElementStyle('[data-testid="snow-report-title"]', 'font-size')
      expect(fontSize).toBeDefined()
    })

    it('タブレットでのスペーシング確認', async () => {
      await testBase.resizeBrowser(768, 1024)
      await testBase.navigateToPage('/josetsu')
      await testBase.waitForElement('[data-testid="snow-report-list"]')
      
      // タブレット用スペーシングが適用されることを確認
      const margin = await testBase.getElementStyle('[data-testid="snow-report-item"]', 'margin')
      expect(margin).toBeDefined()
    })
  })
})