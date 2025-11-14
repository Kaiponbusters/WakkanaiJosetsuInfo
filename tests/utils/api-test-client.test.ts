import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ApiTestClient } from './api-test-client'

describe('ApiTestClient', () => {
  let apiClient: ApiTestClient
  
  const testSnowReportData = {
    area: '稚内市中央',
    start_time: '2024-01-01T09:00:00Z',
    end_time: '2024-01-01T12:00:00Z'
  }

  beforeEach(() => {
    apiClient = new ApiTestClient('http://localhost:3000')
  })

  afterEach(() => {
    apiClient.cleanup()
  })

  describe('初期化', () => {
    it('APIテストクライアントが正常に初期化される', () => {
      expect(apiClient.getBaseUrl()).toBe('http://localhost:3000')
      expect(apiClient.isInitialized()).toBe(true)
    })

    it('デフォルトヘッダーが設定される', () => {
      const headers = apiClient.getDefaultHeaders()
      expect(headers['Content-Type']).toBe('application/json')
      expect(headers['Accept']).toBe('application/json')
    })
  })

  describe('除雪情報API', () => {
    it('除雪情報を作成できる', async () => {
      const response = await apiClient.createSnowReport(testSnowReportData)
      
      expect(response).toBeDefined()
      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      expect(response.statusCode).toBe(201)
    })

    it('除雪情報を更新できる', async () => {
      const updateData = {
        ...testSnowReportData,
        area: '稚内市更新'
      }
      
      const response = await apiClient.updateSnowReport(1, updateData)
      
      expect(response).toBeDefined()
      expect(response.success).toBe(true)
      expect(response.statusCode).toBe(200)
    })

    it('除雪情報を削除できる', async () => {
      const response = await apiClient.deleteSnowReport(1)
      
      expect(response).toBeDefined()
      expect(response.success).toBe(true)
      expect(response.statusCode).toBe(200)
    })

    it('除雪情報一覧を取得できる', async () => {
      const reports = await apiClient.getSnowReports()
      
      expect(Array.isArray(reports)).toBe(true)
    })
  })

  describe('レスポンス検証', () => {
    it('正常なAPIレスポンスを検証できる', () => {
      const validResponse = {
        success: true,
        data: { id: 1, area: '稚内市中央' },
        statusCode: 200
      }
      
      const isValid = apiClient.validateApiResponse(validResponse)
      expect(isValid).toBe(true)
    })

    it('不正なAPIレスポンスを検出できる', () => {
      const invalidResponse = {
        success: false,
        error: 'Invalid data',
        statusCode: 400
      }
      
      const isValid = apiClient.validateApiResponse(invalidResponse)
      expect(isValid).toBe(false)
    })

    it('レスポンス形式の検証ができる', () => {
      const response = {
        success: true,
        data: {},
        statusCode: 200
      }
      
      const hasCorrectFormat = apiClient.hasCorrectResponseFormat(response)
      expect(hasCorrectFormat).toBe(true)
    })
  })

  describe('エラーハンドリング', () => {
    it('ネットワークエラーを適切に処理する', async () => {
      const invalidClient = new ApiTestClient('http://invalid-url')
      
      await expect(invalidClient.createSnowReport(testSnowReportData))
        .rejects.toThrow('Network error')
    })

    it('400エラーレスポンスを処理する', async () => {
      const response = await apiClient.createSnowReport({} as any)
      
      expect(response.success).toBe(false)
      expect(response.statusCode).toBe(400)
      expect(response.error).toBeDefined()
    })

    it('404エラーレスポンスを処理する', async () => {
      const response = await apiClient.updateSnowReport(999, testSnowReportData)
      
      expect(response.success).toBe(false)
      expect(response.statusCode).toBe(404)
      expect(response.error).toBeDefined()
    })

    it('500エラーレスポンスを処理する', async () => {
      // サーバーエラーをシミュレート
      const response = await apiClient.createSnowReport({
        area: 'SERVER_ERROR_TRIGGER',
        start_time: '2024-01-01T09:00:00Z',
        end_time: '2024-01-01T12:00:00Z'
      })
      
      expect(response.success).toBe(false)
      expect(response.statusCode).toBe(500)
      expect(response.error).toBeDefined()
    })
  })

  describe('パフォーマンス測定', () => {
    it('APIレスポンス時間を測定できる', async () => {
      const startTime = Date.now()
      await apiClient.getSnowReports()
      const responseTime = apiClient.getLastResponseTime()
      
      expect(responseTime).toBeGreaterThan(0)
      expect(responseTime).toBeLessThan(5000) // 5秒以内
    })

    it('複数のAPIコールの平均レスポンス時間を計算できる', async () => {
      await apiClient.getSnowReports()
      await apiClient.getSnowReports()
      await apiClient.getSnowReports()
      
      const averageTime = apiClient.getAverageResponseTime()
      expect(averageTime).toBeGreaterThan(0)
    })

    it('レスポンス時間の統計情報を取得できる', () => {
      const stats = apiClient.getResponseTimeStats()
      
      expect(stats).toBeDefined()
      expect(typeof stats.min).toBe('number')
      expect(typeof stats.max).toBe('number')
      expect(typeof stats.average).toBe('number')
      expect(Array.isArray(stats.history)).toBe(true)
    })
  })

  describe('リクエスト設定', () => {
    it('カスタムヘッダーを設定できる', () => {
      const customHeaders = { 'X-Test-Header': 'test-value' }
      apiClient.setCustomHeaders(customHeaders)
      
      const headers = apiClient.getDefaultHeaders()
      expect(headers['X-Test-Header']).toBe('test-value')
    })

    it('タイムアウト設定ができる', () => {
      apiClient.setTimeout(10000)
      
      const timeout = apiClient.getTimeout()
      expect(timeout).toBe(10000)
    })

    it('リトライ設定ができる', () => {
      apiClient.setRetryConfig({ maxRetries: 3, retryDelay: 1000 })
      
      const retryConfig = apiClient.getRetryConfig()
      expect(retryConfig.maxRetries).toBe(3)
      expect(retryConfig.retryDelay).toBe(1000)
    })
  })
})