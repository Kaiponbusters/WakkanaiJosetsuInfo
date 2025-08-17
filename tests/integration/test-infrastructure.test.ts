import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { TestConfig } from '../config/test.config'
import { DatabaseTestUtil } from '../utils/database-test-util'
import { ApiTestClient } from '../utils/api-test-client'

describe('テストインフラストラクチャ統合テスト', () => {
  let testConfig: TestConfig
  let dbUtil: DatabaseTestUtil
  let apiClient: ApiTestClient

  beforeEach(async () => {
    testConfig = new TestConfig()
    await testConfig.initialize()
    
    dbUtil = new DatabaseTestUtil()
    await dbUtil.initialize()
    
    apiClient = new ApiTestClient('http://localhost:3000')
  })

  afterEach(async () => {
    apiClient.cleanup()
    await dbUtil.cleanup()
    await testConfig.cleanup()
  })

  describe('統合初期化', () => {
    it('すべてのテストコンポーネントが正常に初期化される', () => {
      expect(testConfig.getEnvironment().isInitialized()).toBe(true)
      expect(testConfig.getPlaywrightBase().isReady()).toBe(true)
      expect(dbUtil.isConnected()).toBe(true)
      expect(apiClient.isInitialized()).toBe(true)
    })

    it('設定値が一貫している', () => {
      const envConfig = testConfig.getEnvironment().getConfig()
      const apiBaseUrl = apiClient.getBaseUrl()
      
      expect(envConfig.baseUrl).toBe('http://localhost:3000')
      expect(apiBaseUrl).toBe('http://localhost:3000')
    })
  })

  describe('エンドツーエンドワークフロー', () => {
    it('データベース→API→ブラウザの連携が正常に動作する', async () => {
      // 1. データベースにテストデータを準備
      const testData = [{
        table: 'snow_reports',
        data: {
          area: 'test_integration',
          start_time: '2024-01-01T09:00:00Z',
          end_time: '2024-01-01T12:00:00Z'
        }
      }]
      
      const insertResult = await dbUtil.insertTestData(testData)
      expect(insertResult).toBe(true)

      // 2. APIでデータを取得
      const reports = await apiClient.getSnowReports()
      expect(Array.isArray(reports)).toBe(true)

      // 3. ブラウザでページにアクセス
      const playwrightBase = testConfig.getPlaywrightBase()
      await playwrightBase.navigateTo('/josetsu')
      
      const pageExists = await playwrightBase.elementExists('body')
      expect(pageExists).toBe(true)

      // 4. データベースからテストデータをクリーンアップ
      await dbUtil.cleanupTestData('test_integration')
    })

    it('エラー状況での統合動作を確認する', async () => {
      // データベース接続エラーのシミュレート
      const invalidDbUtil = new DatabaseTestUtil('invalid://connection')
      await expect(invalidDbUtil.initialize()).rejects.toThrow()

      // API エラーのシミュレート
      const invalidApiClient = new ApiTestClient('http://invalid-url')
      await expect(invalidApiClient.createSnowReport({
        area: 'test',
        start_time: '2024-01-01T09:00:00Z',
        end_time: '2024-01-01T12:00:00Z'
      })).rejects.toThrow('Network error')
    })
  })

  describe('パフォーマンス統合テスト', () => {
    it('全コンポーネントの初期化時間が許容範囲内である', async () => {
      const startTime = Date.now()
      
      const newTestConfig = new TestConfig()
      await newTestConfig.initialize()
      
      const endTime = Date.now()
      const initTime = endTime - startTime
      
      expect(initTime).toBeLessThan(5000) // 5秒以内
      
      await newTestConfig.cleanup()
    })

    it('APIレスポンス時間とデータベースクエリ時間の相関を確認する', async () => {
      // API呼び出し時間を測定
      const apiStartTime = Date.now()
      await apiClient.getSnowReports()
      const apiTime = Date.now() - apiStartTime

      // データベースクエリ時間を測定
      const dbStartTime = Date.now()
      await dbUtil.getRecordCount('snow_reports')
      const dbTime = Date.now() - dbStartTime

      // 両方とも合理的な時間内であることを確認
      expect(apiTime).toBeLessThan(1000) // 1秒以内
      expect(dbTime).toBeLessThan(1000) // 1秒以内
    })
  })

  describe('リソース管理', () => {
    it('すべてのリソースが適切にクリーンアップされる', async () => {
      // 初期化
      await testConfig.initialize()
      await dbUtil.initialize()

      // 使用状況を確認
      expect(testConfig.getEnvironment().isInitialized()).toBe(true)
      expect(dbUtil.isConnected()).toBe(true)

      // クリーンアップ
      await testConfig.cleanup()
      await dbUtil.cleanup()

      // クリーンアップ後の状態を確認
      expect(testConfig.getEnvironment().isInitialized()).toBe(false)
      expect(dbUtil.isConnected()).toBe(false)
    })
  })
})