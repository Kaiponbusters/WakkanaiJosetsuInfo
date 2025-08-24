import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PlaywrightTestBase } from '../config/playwright-base'
import { DatabaseTestUtil } from '../utils/database-test-util'

describe('/josetsuページ - インタラクティブ機能テスト', () => {
  let playwright: PlaywrightTestBase
  let dbUtil: DatabaseTestUtil
  const testId = 'josetsu-interactive-test'

  beforeEach(async () => {
    playwright = new PlaywrightTestBase()
    dbUtil = new DatabaseTestUtil()
    
    await playwright.setup()
    await dbUtil.setupTestData(testId)
  })

  afterEach(async () => {
    await dbUtil.cleanupTestData(testId)
    await playwright.cleanup()
  })

  /**
   * テストデータを準備するヘルパー関数
   * @param area 地域名
   * @param date 日付（YYYY-MM-DD形式）
   * @param startHour 開始時刻（時）
   * @param endHour 終了時刻（時）
   */
  const createTestSnowReport = (area: string, date: string, startHour: number, endHour: number) => ({
    table: 'snow_reports',
    data: {
      area,
      start_time: `${date}T${startHour.toString().padStart(2, '0')}:00:00Z`,
      end_time: `${date}T${endHour.toString().padStart(2, '0')}:00:00Z`,
      testId
    }
  })

  /**
   * ページにアクセスして基本的な待機を行うヘルパー関数
   */
  const navigateToJosetsuPage = async () => {
    await playwright.navigateTo('/josetsu')
    await playwright.waitForPageLoad()
  }

  describe('日付グループの展開・折りたたみ機能', () => {
    it('日付グループをクリックすると詳細が展開される', async () => {
      // テストデータを準備
      const testData = [createTestSnowReport('稚内駅前', '2024-01-15', 9, 12)]
      await dbUtil.insertTestData(testData)
      
      // ページにアクセス
      await navigateToJosetsuPage()
      
      const dateGroupSelector = '[data-testid="date-group-2024-01-15"]'
      const detailsSelector = '[data-testid="date-group-2024-01-15"] + div'
      
      // 日付グループが存在することを確認
      const hasDateGroup = await playwright.elementExists(dateGroupSelector)
      expect(hasDateGroup).toBe(true)
      
      // 初期状態では詳細が非表示であることを確認
      const detailsVisible = await playwright.elementExists(detailsSelector)
      expect(detailsVisible).toBe(false)
      
      // 日付グループをクリック
      await playwright.clickElement(`${dateGroupSelector} div`)
      
      // 詳細が表示されることを確認
      const detailsVisibleAfterClick = await playwright.elementExists(detailsSelector)
      expect(detailsVisibleAfterClick).toBe(true)
    })

    it('展開された日付グループを再度クリックすると折りたたまれる', async () => {
      // テストデータを準備
      const testData = [createTestSnowReport('稚内駅前', '2024-01-15', 9, 12)]
      await dbUtil.insertTestData(testData)
      
      // ページにアクセス
      await navigateToJosetsuPage()
      
      const dateGroupSelector = '[data-testid="date-group-2024-01-15"]'
      const detailsSelector = '[data-testid="date-group-2024-01-15"] + div'
      const clickSelector = `${dateGroupSelector} div`
      
      // 日付グループをクリックして展開
      await playwright.clickElement(clickSelector)
      
      // 詳細が表示されることを確認
      const detailsVisible = await playwright.elementExists(detailsSelector)
      expect(detailsVisible).toBe(true)
      
      // 再度クリックして折りたたみ
      await playwright.clickElement(clickSelector)
      
      // 詳細が非表示になることを確認
      const detailsHidden = await playwright.elementExists(detailsSelector)
      expect(detailsHidden).toBe(false)
    })
  })

  describe('地図コンポーネントの表示確認', () => {
    it('除雪情報の詳細に地図コンポーネントが表示される', async () => {
      // テストデータを準備
      const testData = [createTestSnowReport('稚内駅前', '2024-01-15', 9, 12)]
      await dbUtil.insertTestData(testData)
      
      // ページにアクセス
      await navigateToJosetsuPage()
      
      // 日付グループをクリックして展開
      await playwright.clickElement('[data-testid="date-group-2024-01-15"] div')
      
      // 地図コンポーネントが表示されることを確認
      const hasMapComponent = await playwright.elementExists('[data-testid="snow-location-map"]')
      expect(hasMapComponent).toBe(true)
    })
  })

  describe('データが存在しない場合のメッセージ表示', () => {
    /**
     * データが存在しない状態をセットアップするヘルパー関数
     */
    const setupEmptyDataState = async () => {
      await dbUtil.cleanupTestData(testId)
      ;(playwright as any).setDataCleanedUp(true)
    }

    it('除雪情報が存在しない場合に適切なメッセージが表示される', async () => {
      // データが存在しない状態をセットアップ
      await setupEmptyDataState()
      
      // ページにアクセス
      await navigateToJosetsuPage()
      
      // 「除雪情報がありません」メッセージが表示されることを確認
      const hasNoDataMessage = await playwright.elementExists('[data-testid="no-data-message"]')
      expect(hasNoDataMessage).toBe(true)
      
      // メッセージの内容を確認
      const messageText = await playwright.getElementText('[data-testid="no-data-message"]')
      expect(messageText).toContain('除雪情報がありません')
    })

    it('データが存在しない場合は日付グループが表示されない', async () => {
      // データが存在しない状態をセットアップ
      await setupEmptyDataState()
      
      // ページにアクセス
      await navigateToJosetsuPage()
      
      // 日付グループが表示されないことを確認
      const hasDateGroups = await playwright.elementExists('[data-testid="date-group"]')
      expect(hasDateGroups).toBe(false)
      
      // 除雪情報リストが表示されないことを確認
      const hasSnowReportList = await playwright.elementExists('[data-testid="snow-report-list"]')
      expect(hasSnowReportList).toBe(false)
    })
  })
})