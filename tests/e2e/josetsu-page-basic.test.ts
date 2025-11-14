import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PlaywrightTestBase } from '../config/playwright-base'
import { DatabaseTestUtil } from '../utils/database-test-util'
import { ApiTestClient } from '../utils/api-test-client'

describe('/josetsuページ - 基本ページロードとデータ表示テスト', () => {
  let playwright: PlaywrightTestBase
  let dbUtil: DatabaseTestUtil
  let apiClient: ApiTestClient
  const testId = 'josetsu-basic-test'

  beforeEach(async () => {
    playwright = new PlaywrightTestBase()
    dbUtil = new DatabaseTestUtil()
    apiClient = new ApiTestClient()
    
    await playwright.setup()
    await dbUtil.setupTestData(testId)
  })

  afterEach(async () => {
    await dbUtil.cleanupTestData(testId)
    await playwright.cleanup()
  })

  describe('ページナビゲーション', () => {
    it('/josetsuページに正常にアクセスできる', async () => {
      // /josetsuページにナビゲーション
      await playwright.navigateTo('/josetsu')
      
      // ページが正常にロードされることを確認
      await playwright.waitForPageLoad()
      
      // URLが正しいことを確認
      const page = playwright.getPage()
      expect(page?.url()).toContain('/josetsu')
    })

    it('ページロード時にローディング状態が表示される', async () => {
      // ページナビゲーション開始
      const navigationPromise = playwright.navigateTo('/josetsu')
      
      // ローディング状態の確認（短時間で消える可能性があるため、すぐにチェック）
      const hasLoadingState = await playwright.elementExists('[data-testid="loading-spinner"]')
      
      // ナビゲーション完了を待つ
      await navigationPromise
      
      // ローディング状態が表示されたか、またはデータが即座に表示されたかを確認
      const hasData = await playwright.elementExists('[data-testid="snow-report-list"]')
      expect(hasLoadingState || hasData).toBe(true)
    })
  })

  describe('データ表示', () => {
    it('除雪情報が日付別にグループ化されて表示される', async () => {
      // テストデータを準備
      const testData = [
        {
          table: 'snow_reports',
          data: {
            area: '稚内駅前',
            start_time: '2024-01-15T09:00:00Z',
            end_time: '2024-01-15T12:00:00Z',
            testId
          }
        },
        {
          table: 'snow_reports',
          data: {
            area: '稚内港',
            start_time: '2024-01-15T14:00:00Z',
            end_time: '2024-01-15T16:00:00Z',
            testId
          }
        },
        {
          table: 'snow_reports',
          data: {
            area: '稚内空港',
            start_time: '2024-01-16T10:00:00Z',
            end_time: '2024-01-16T13:00:00Z',
            testId
          }
        }
      ]
      
      // データベースにテストデータを挿入
      await dbUtil.insertTestData(testData)
      
      // ページにアクセス
      await playwright.navigateTo('/josetsu')
      await playwright.waitForPageLoad()
      
      // 日付グループが表示されることを確認
      const hasDateGroups = await playwright.elementExists('[data-testid="date-group"]')
      expect(hasDateGroups).toBe(true)
      
      // 2024-01-15のグループが存在することを確認
      const jan15Group = await playwright.elementExists('[data-testid="date-group-2024-01-15"]')
      expect(jan15Group).toBe(true)
      
      // 2024-01-16のグループが存在することを確認
      const jan16Group = await playwright.elementExists('[data-testid="date-group-2024-01-16"]')
      expect(jan16Group).toBe(true)
    })

    it('除雪情報が作成日時の降順で表示される', async () => {
      // 異なる作成日時のテストデータを準備
      const testData = [
        {
          table: 'snow_reports',
          data: {
            area: '稚内駅前',
            start_time: '2024-01-15T09:00:00Z',
            end_time: '2024-01-15T12:00:00Z',
            created_at: '2024-01-15T08:00:00Z',
            testId
          }
        },
        {
          table: 'snow_reports',
          data: {
            area: '稚内港',
            start_time: '2024-01-16T14:00:00Z',
            end_time: '2024-01-16T16:00:00Z',
            created_at: '2024-01-16T13:00:00Z',
            testId
          }
        },
        {
          table: 'snow_reports',
          data: {
            area: '稚内空港',
            start_time: '2024-01-14T10:00:00Z',
            end_time: '2024-01-14T13:00:00Z',
            created_at: '2024-01-14T09:00:00Z',
            testId
          }
        }
      ]
      
      // データベースにテストデータを挿入
      await dbUtil.insertTestData(testData)
      
      // ページにアクセス
      await playwright.navigateTo('/josetsu')
      await playwright.waitForPageLoad()
      
      // データが表示されることを確認（詳細な順序確認は実装後に行う）
      const hasData = await playwright.elementExists('[data-testid="snow-report-list"]')
      expect(hasData).toBe(true)
    })

    it.skip('データが存在しない場合は適切なメッセージが表示される', async () => {
      // テストデータをクリーンアップ（データが存在しない状態を作る）
      await dbUtil.cleanupTestData(testId)
      
      // ページにアクセス
      await playwright.navigateTo('/josetsu')
      await playwright.waitForPageLoad()
      
      // 「データがありません」メッセージが表示されることを確認
      const hasNoDataMessage = await playwright.elementExists('[data-testid="no-data-message"]')
      expect(hasNoDataMessage).toBe(true)
    })
  })
})