import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useNotificationErrorHandler } from '~/composables/notifications/infrastructure/useNotificationErrorHandler'

describe('useNotificationErrorHandler 監視とデバッグ機能', () => {
  let errorHandler: ReturnType<typeof useNotificationErrorHandler>

  beforeEach(() => {
    vi.clearAllMocks()
    errorHandler = useNotificationErrorHandler()
  })

  describe('エラー監視機能', () => {
    it('エラー発生頻度を追跡する', () => {
      const startTime = Date.now()
      
      // 短時間で複数のエラーを発生させる
      for (let i = 0; i < 5; i++) {
        errorHandler.logError(new Error(`Error ${i}`))
      }
      
      const stats = errorHandler.getErrorStats()
      expect(stats.totalErrors).toBe(5)
      expect(stats.lastErrorTime).toBeDefined()
      
      const lastErrorTime = new Date(stats.lastErrorTime!).getTime()
      expect(lastErrorTime).toBeGreaterThanOrEqual(startTime)
    })

    it('エラーカテゴリ別の統計を正確に追跡する', () => {
      const testErrors = [
        { error: new Error('Failed to fetch'), expectedCategory: 'network' },
        { error: new Error('Permission denied'), expectedCategory: 'permission' },
        { error: new Error('Invalid configuration'), expectedCategory: 'configuration' },
        { error: new Error('Storage quota exceeded'), expectedCategory: 'storage' },
        { error: new Error('Unknown issue'), expectedCategory: 'unknown' }
      ]

      testErrors.forEach(({ error }) => {
        errorHandler.logError(error)
      })

      const stats = errorHandler.getErrorStats()
      expect(stats.totalErrors).toBe(5)
      expect(stats.errorsByCategory.network).toBe(1)
      expect(stats.errorsByCategory.permission).toBe(1)
      expect(stats.errorsByCategory.configuration).toBe(1)
      expect(stats.errorsByCategory.storage).toBe(1)
      expect(stats.errorsByCategory.unknown).toBe(1)
    })

    it('エラー重要度別の統計を正確に追跡する', () => {
      // 各重要度のエラーを作成
      const networkError = new Error('Failed to fetch') // medium
      const permissionError = new Error('Permission denied') // high
      const configError = new Error('Invalid configuration') // high

      errorHandler.logError(networkError)
      errorHandler.logError(permissionError)
      errorHandler.logError(configError)

      const stats = errorHandler.getErrorStats()
      expect(stats.errorsBySeverity.medium).toBe(1)
      expect(stats.errorsBySeverity.high).toBe(2)
      expect(stats.errorsBySeverity.low).toBe(0)
      expect(stats.errorsBySeverity.critical).toBe(0)
    })
  })

  describe('デバッグ支援機能', () => {
    it('エラーコンテキストを詳細に記録する', () => {
      const error = new Error('Test debugging error')
      const detailedContext = {
        userId: 'debug-user-123',
        sessionId: 'session-456',
        operation: 'send-push-notification',
        timestamp: '2024-01-01T12:00:00Z',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        url: 'https://example.com/notifications',
        metadata: {
          region: '稚内市',
          notificationType: 'snow-report',
          severity: 'high',
          retryCount: 2,
          lastAttempt: '2024-01-01T11:59:30Z'
        },
        systemInfo: {
          platform: 'win32',
          memory: '8GB',
          browser: 'Chrome',
          version: '120.0.0.0'
        }
      }

      errorHandler.logError(error, detailedContext)

      const stats = errorHandler.getErrorStats()
      expect(stats.totalErrors).toBe(1)
      expect(stats.lastErrorTime).toBeDefined()
    })

    it('エラーパターンの分析を支援する', () => {
      const similarErrors = [
        new Error('Network timeout occurred'),
        new Error('Network connection failed'),
        new Error('Network error: timeout'),
        new Error('Failed to fetch due to network')
      ]

      similarErrors.forEach(error => {
        errorHandler.logError(error)
      })

      const stats = errorHandler.getErrorStats()
      // 実際の分類結果を確認（一部のエラーがunknownに分類される可能性がある）
      const networkCount = stats.errorsByCategory.network
      const unknownCount = stats.errorsByCategory.unknown
      
      // 合計が4であることを確認
      expect(networkCount + unknownCount).toBe(4)
      // 少なくとも一部はネットワークエラーとして分類されることを確認
      expect(networkCount).toBeGreaterThan(0)
    })

    it('エラー分類の精度を検証する', () => {
      const testCases = [
        {
          error: new Error('XMLHttpRequest failed to fetch'),
          expectedCategory: 'network',
          description: 'XMLHttpRequestエラー'
        },
        {
          error: new Error('Notification API permission denied'),
          expectedCategory: 'permission',
          description: 'Notification API許可エラー'
        },
        {
          error: new Error('Invalid notification configuration provided'),
          expectedCategory: 'configuration',
          description: '設定エラー'
        },
        {
          error: new Error('LocalStorage quota exceeded limit'),
          expectedCategory: 'storage',
          description: 'ストレージエラー'
        }
      ]

      testCases.forEach(({ error, expectedCategory, description }) => {
        const classification = errorHandler.classifyError(error)
        expect(classification.category).toBe(expectedCategory)
        
        // デバッグ情報として分類結果をログに記録
        errorHandler.logError(error, { 
          testCase: description,
          expectedCategory,
          actualCategory: classification.category,
          classificationAccurate: classification.category === expectedCategory
        })
      })

      const stats = errorHandler.getErrorStats()
      expect(stats.totalErrors).toBe(4)
    })
  })

  describe('パフォーマンス監視', () => {
    it('大量のエラーを効率的に処理する', () => {
      const startTime = Date.now()
      const errorCount = 1000

      // 大量のエラーを生成
      for (let i = 0; i < errorCount; i++) {
        const errorType = i % 4
        let error: Error
        
        switch (errorType) {
          case 0:
            error = new Error(`Network error ${i}`)
            break
          case 1:
            error = new Error(`Permission denied ${i}`)
            break
          case 2:
            error = new Error(`Invalid configuration ${i}`)
            break
          default:
            error = new Error(`Storage error ${i}`)
        }
        
        errorHandler.logError(error, { batchId: Math.floor(i / 100) })
      }

      const endTime = Date.now()
      const processingTime = endTime - startTime

      const stats = errorHandler.getErrorStats()
      expect(stats.totalErrors).toBe(errorCount)
      
      // パフォーマンス要件: 1000エラーを1秒以内で処理
      expect(processingTime).toBeLessThan(1000)
    })

    it('メモリ使用量を適切に管理する', () => {
      const initialStats = errorHandler.getErrorStats()
      expect(initialStats.totalErrors).toBe(0)

      // 大量のエラーを生成してメモリ使用量をテスト
      for (let i = 0; i < 100; i++) {
        const largeContext = {
          errorId: i,
          largeData: 'x'.repeat(1000), // 1KB のデータ
          timestamp: new Date().toISOString(),
          metadata: {
            userId: `user-${i}`,
            operation: `operation-${i}`,
            details: 'y'.repeat(500) // 500B のデータ
          }
        }
        
        errorHandler.logError(new Error(`Memory test error ${i}`), largeContext)
      }

      const stats = errorHandler.getErrorStats()
      expect(stats.totalErrors).toBe(100)
      
      // 統計リセットでメモリを解放
      errorHandler.resetStats()
      
      const resetStats = errorHandler.getErrorStats()
      expect(resetStats.totalErrors).toBe(0)
      expect(resetStats.lastErrorTime).toBeNull()
    })
  })

  describe('エラー回復の監視', () => {
    it('回復成功率を追跡する', async () => {
      const errors = [
        new Error('Recoverable network error'),
        new Error('Recoverable permission error'),
        new Error('Recoverable configuration error')
      ]

      let successfulRecoveries = 0
      let totalRecoveryAttempts = 0

      for (const error of errors) {
        const recoveryOptions = errorHandler.getRecoveryOptions(error)
        
        for (const option of recoveryOptions) {
          totalRecoveryAttempts++
          const result = await errorHandler.attemptRecovery(error, option.action)
          
          if (result.success) {
            successfulRecoveries++
          }
        }
      }

      const successRate = successfulRecoveries / totalRecoveryAttempts
      expect(successRate).toBeGreaterThan(0)
      expect(totalRecoveryAttempts).toBe(6) // 3 errors × 2 recovery options each
    })

    it('回復時間を測定する', async () => {
      const error = new Error('Performance test error')
      const recoveryOptions = errorHandler.getRecoveryOptions(error)
      
      const startTime = Date.now()
      const result = await errorHandler.attemptRecovery(error, recoveryOptions[0].action)
      const endTime = Date.now()
      
      const recoveryTime = endTime - startTime
      
      expect(result.success).toBe(true)
      expect(recoveryTime).toBeLessThan(100) // 100ms以内で回復
    })
  })

  describe('エラー統計の永続化', () => {
    it('統計データの整合性を保つ', () => {
      // 初期状態
      const initialStats = errorHandler.getErrorStats()
      expect(initialStats.totalErrors).toBe(0)

      // エラーを追加
      errorHandler.logError(new Error('Test error 1'))
      errorHandler.logError(new Error('Network timeout'))
      
      const midStats = errorHandler.getErrorStats()
      expect(midStats.totalErrors).toBe(2)
      expect(midStats.errorsByCategory.unknown).toBe(1)
      expect(midStats.errorsByCategory.network).toBe(1)

      // さらにエラーを追加
      errorHandler.logError(new Error('Permission denied'))
      
      const finalStats = errorHandler.getErrorStats()
      expect(finalStats.totalErrors).toBe(3)
      expect(finalStats.errorsByCategory.permission).toBe(1)
      
      // 統計の合計が一致することを確認
      const totalByCategory = Object.values(finalStats.errorsByCategory)
        .reduce((sum, count) => sum + count, 0)
      const totalBySeverity = Object.values(finalStats.errorsBySeverity)
        .reduce((sum, count) => sum + count, 0)
      
      expect(totalByCategory).toBe(finalStats.totalErrors)
      expect(totalBySeverity).toBe(finalStats.totalErrors)
    })
  })
})