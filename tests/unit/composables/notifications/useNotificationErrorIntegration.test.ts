import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useNotificationErrorHandler } from './useNotificationErrorHandler'
import { useNotificationLogger } from './useNotificationLogger'

// モック
const mockLoggerMethods = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  getLogs: vi.fn(() => []),
  clearLogs: vi.fn()
}

vi.mock('./useNotificationLogger', () => ({
  useNotificationLogger: vi.fn(() => mockLoggerMethods)
}))

describe('useNotificationErrorHandler 統合テスト', () => {
  let errorHandler: ReturnType<typeof useNotificationErrorHandler>

  beforeEach(() => {
    vi.clearAllMocks()
    // モックメソッドをリセット
    Object.values(mockLoggerMethods).forEach(mock => mock.mockClear())
    errorHandler = useNotificationErrorHandler()
  })

  describe('エラーハンドリングフローの統合', () => {
    it('エラー発生から回復まで完全なフローを処理する', async () => {
      const networkError = new Error('Failed to fetch data from server')
      const context = {
        userId: 'user-123',
        operation: 'send-notification',
        region: '稚内市'
      }

      // 1. エラーを分類
      const classification = errorHandler.classifyError(networkError)
      expect(classification.category).toBe('network')
      expect(classification.recoverable).toBe(true)

      // 2. エラーをログに記録
      errorHandler.logError(networkError, context)

      // 3. ユーザーフレンドリーなメッセージを取得
      const userMessage = errorHandler.getUserFriendlyMessage(networkError)
      expect(userMessage.title).toBe('接続エラー')
      expect(userMessage.actions).toContain('再試行')

      // 4. 回復オプションを取得
      const recoveryOptions = errorHandler.getRecoveryOptions(networkError)
      expect(recoveryOptions).toHaveLength(2)
      expect(recoveryOptions[0].label).toBe('再試行')

      // 5. 回復を試行
      const result = await errorHandler.attemptRecovery(
        networkError,
        recoveryOptions[0].action
      )
      expect(result.success).toBe(true)

      // 6. 統計を確認
      const stats = errorHandler.getErrorStats()
      expect(stats.totalErrors).toBe(1)
      expect(stats.errorsByCategory.network).toBe(1)
    })

    it('複数のエラーを連続して処理する', async () => {
      const errors = [
        new Error('Failed to fetch'),
        new Error('Permission denied'),
        new Error('Invalid configuration'),
        new Error('Storage quota exceeded')
      ]

      // 各エラーを処理
      for (const error of errors) {
        errorHandler.logError(error)
        const classification = errorHandler.classifyError(error)
        const userMessage = errorHandler.getUserFriendlyMessage(error)
        const recoveryOptions = errorHandler.getRecoveryOptions(error)

        expect(classification).toBeDefined()
        expect(userMessage.title).toBeDefined()
        expect(recoveryOptions.length).toBeGreaterThan(0)
      }

      // 統計を確認
      const stats = errorHandler.getErrorStats()
      expect(stats.totalErrors).toBe(4)
      expect(stats.errorsByCategory.network).toBe(1)
      expect(stats.errorsByCategory.permission).toBe(1)
      expect(stats.errorsByCategory.configuration).toBe(1)
      expect(stats.errorsByCategory.storage).toBe(1)
    })

    it('エラー回復の失敗を適切に処理する', async () => {
      const error = new Error('Critical system failure')
      
      // 失敗する回復アクションを作成
      const failingRecoveryAction = vi.fn().mockRejectedValue(
        new Error('Recovery action failed')
      )

      // エラーをログに記録
      errorHandler.logError(error)

      // 回復を試行（失敗する）
      const result = await errorHandler.attemptRecovery(error, failingRecoveryAction)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error?.message).toBe('Recovery action failed')

      // 失敗した回復アクションが呼ばれたことを確認
      expect(failingRecoveryAction).toHaveBeenCalled()
    })
  })

  describe('ログとエラーハンドリングの統合', () => {
    it('エラー重要度に応じて適切なログレベルでログを記録する', () => {
      const criticalError = new Error('System crash')
      const networkError = new Error('Failed to fetch')
      const configError = new Error('Invalid configuration')

      // 各エラーをログに記録
      errorHandler.logError(criticalError)
      errorHandler.logError(networkError)
      errorHandler.logError(configError)

      // ログが適切に呼ばれたことを確認
      expect(mockLoggerMethods.warn).toHaveBeenCalled()
      expect(mockLoggerMethods.error).toHaveBeenCalled()
    })

    it('エラーコンテキストがログに正しく記録される', () => {
      const error = new Error('Test error')
      const context = {
        userId: 'user-456',
        operation: 'push-notification',
        timestamp: '2024-01-01T12:00:00Z',
        metadata: {
          region: '稚内市',
          notificationType: 'snow-report',
          severity: 'high'
        }
      }

      errorHandler.logError(error, context)

      // ログメソッドが適切なコンテキストで呼ばれたことを確認
      expect(mockLoggerMethods.warn).toHaveBeenCalledWith(
        expect.stringContaining('中重要度エラーが発生しました'),
        expect.objectContaining({
          error: 'Test error',
          classification: expect.any(Object),
          context: context,
          timestamp: expect.any(String)
        })
      )
    })
  })

  describe('エラー統計とモニタリング', () => {
    it('エラー統計が時系列で正確に追跡される', () => {
      const startTime = new Date().toISOString()

      // 複数のエラーを時間差で記録
      errorHandler.logError(new Error('First error'))
      errorHandler.logError(new Error('Network timeout'))
      errorHandler.logError(new Error('Permission denied'))

      const stats = errorHandler.getErrorStats()

      expect(stats.totalErrors).toBe(3)
      expect(stats.lastErrorTime).toBeDefined()
      expect(stats.lastErrorTime! >= startTime).toBe(true)
      expect(stats.errorsByCategory.unknown).toBe(1)
      expect(stats.errorsByCategory.network).toBe(1)
      expect(stats.errorsByCategory.permission).toBe(1)
    })

    it('統計リセット後に新しいエラーが正しく追跡される', () => {
      // 初期エラーを記録
      errorHandler.logError(new Error('Initial error'))
      expect(errorHandler.getErrorStats().totalErrors).toBe(1)

      // 統計をリセット
      errorHandler.resetStats()
      expect(errorHandler.getErrorStats().totalErrors).toBe(0)

      // 新しいエラーを記録
      errorHandler.logError(new Error('New error'))
      const stats = errorHandler.getErrorStats()

      expect(stats.totalErrors).toBe(1)
      expect(stats.errorsByCategory.unknown).toBe(1)
    })
  })

  describe('実際のエラーシナリオのシミュレーション', () => {
    it('ネットワーク障害シナリオを処理する', async () => {
      const networkErrors = [
        new Error('Failed to fetch'),
        new Error('Network timeout'),
        new Error('Connection refused'),
        new Error('Server unavailable')
      ]

      for (const error of networkErrors) {
        // エラーを分類
        const classification = errorHandler.classifyError(error)
        expect(classification.category).toBe('network')
        expect(classification.recoverable).toBe(true)

        // エラーをログに記録
        errorHandler.logError(error, { scenario: 'network-failure' })

        // 回復オプションを取得して実行
        const recoveryOptions = errorHandler.getRecoveryOptions(error)
        const result = await errorHandler.attemptRecovery(error, recoveryOptions[0].action)
        expect(result.success).toBe(true)
      }

      const stats = errorHandler.getErrorStats()
      expect(stats.errorsByCategory.network).toBe(4)
      expect(stats.errorsBySeverity.medium).toBe(4)
    })

    it('許可拒否シナリオを処理する', async () => {
      const permissionError = new Error('Notification permission denied')
      
      // エラーを分類
      const classification = errorHandler.classifyError(permissionError)
      expect(classification.category).toBe('permission')
      expect(classification.recoverable).toBe(false)

      // ユーザーフレンドリーなメッセージを取得
      const userMessage = errorHandler.getUserFriendlyMessage(permissionError)
      expect(userMessage.title).toBe('許可エラー')
      expect(userMessage.actions).toContain('アプリ内通知のみ使用')

      // 回復オプションを実行
      const recoveryOptions = errorHandler.getRecoveryOptions(permissionError)
      const fallbackOption = recoveryOptions.find(option => 
        option.label === 'アプリ内通知のみ使用'
      )
      
      expect(fallbackOption).toBeDefined()
      const result = await errorHandler.attemptRecovery(
        permissionError, 
        fallbackOption!.action
      )
      expect(result.success).toBe(true)
    })

    it('設定エラーシナリオを処理する', async () => {
      const configError = new Error('Invalid notification configuration')
      
      // エラーを分類
      const classification = errorHandler.classifyError(configError)
      expect(classification.category).toBe('configuration')
      expect(classification.severity).toBe('high')

      // エラーをログに記録
      errorHandler.logError(configError, { 
        configSection: 'notifications',
        invalidValue: 'undefined'
      })

      // 設定リセット回復オプションを実行
      const recoveryOptions = errorHandler.getRecoveryOptions(configError)
      const resetOption = recoveryOptions.find(option => 
        option.label === '設定をリセット'
      )
      
      expect(resetOption).toBeDefined()
      const result = await errorHandler.attemptRecovery(configError, resetOption!.action)
      expect(result.success).toBe(true)
    })
  })
})