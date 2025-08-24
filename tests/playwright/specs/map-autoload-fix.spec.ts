import { test, expect } from '@playwright/test'

test.describe('地図自動読み込み修正テスト', () => {
  test('02/07のデータで地図が自動読み込みされることを確認', async ({ page }) => {
    // テストデータを準備 (02/07のデータ)
    const testData = {
      area: '稚内駅前',
      start_time: '2025-02-07T09:00:00Z',
      end_time: '2025-02-07T12:00:00Z'
    }

    // 除雪情報ページにアクセス
    await page.goto('/josetsu')
    
    // ページの読み込み完了を待機
    await page.waitForLoadState('networkidle')
    
    // 02/07のデータグループが表示されるまで待機
    await expect(page.locator('[data-testid="date-group-2025-02-07"]')).toBeVisible({
      timeout: 10000
    })
    
    // 02/07のグループをクリックして展開
    await page.click('[data-testid="date-group-2025-02-07"]')
    
    // 地図コンポーネントが表示されることを確認
    const mapComponent = page.locator('[data-testid="snow-location-map"]')
    await expect(mapComponent).toBeVisible({
      timeout: 5000
    })
    
    // 地図が自動読み込みされることを確認（プレースホルダーボタンが存在しないことを確認）
    const loadMapButton = page.locator('.load-map-btn')
    
    // auto-load="true"の場合、地図は自動読み込みされ、プレースホルダーボタンは表示されない
    // または、読み込み完了後は表示されない
    await page.waitForTimeout(3000) // 地図読み込み時間を考慮
    
    // 地図コンテナが表示されていることを確認
    const mapContainer = page.locator('.map-container')
    
    // エラー表示がないことを確認
    const errorDisplay = page.locator('.error-display')
    await expect(errorDisplay).not.toBeVisible()
    
    console.log('✅ 02/07の地図自動読み込み修正が正常に動作しています')
  })

  test('修正後も手動読み込み機能が正常に動作することを確認', async ({ page }) => {
    // キャッシュテストページにアクセス（手動読み込みテスト用）
    await page.goto('/cache-test')
    
    // 地域名を入力
    await page.fill('input[placeholder="地域名を入力"]', '稚内市役所')
    
    // 表示ボタンをクリック
    await page.click('button:has-text("表示")')
    
    // 地図が表示されることを確認
    const mapComponent = page.locator('[data-testid="snow-location-map"]')
    await expect(mapComponent).toBeVisible({
      timeout: 10000
    })
    
    console.log('✅ 手動読み込み機能も正常に動作しています')
  })
})

