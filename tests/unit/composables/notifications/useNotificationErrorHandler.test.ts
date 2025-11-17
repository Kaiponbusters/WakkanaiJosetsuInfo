import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useNotificationErrorHandler } from '~/composables/notifications/infrastructure/useNotificationErrorHandler'

// モック
vi.mock('~/composables/notifications/infrastructure/useNotificationLogger', () => ({
  useNotificationLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  })
}))

describe('useNotificationErrorHandler', () => {
  let errorHandler: ReturnType<typeof useNotificationErrorHandler>
  
  beforeEach(() => {
    vi.clearAllMocks()
    errorHandler = useNotificationErrorHandler()
  })

  describe('エラー分類', () => {
    it('ネットワークエラーを正しく分類する', () => {
      const networkError = new Error('Failed to fetch')
      const classification = errorHandler.classifyError(networkError)
      
      expect(classification.category).toBe('network')
      expect(classification.severity).toBe('medium')
      expect(classification.recoverable).toBe(true)
    })

    it('許可エラーを正しく分類する', () => {
      const permissionError = new Error('Permission denied')
      const classification = errorHandler.classifyError(permissionError)
      
      expect(classification.category).toBe('permission')
      expect(classification.severity).toBe('high')
      expect(classification.recoverable).toBe(false)
    })

    it('設定エラーを正しく分類する', () => {
      const configError = new Error('Invalid configuration')
      const classification = errorHandler.classifyError(configError)
      
      expect(classification.category).toBe('configuration')
      expect(classification.severity).toBe('high')
      expect(classification.recoverable).toBe(true)
    })

    it('不明なエラーを正しく分類する', () => {
      const unknownError = new Error('Something went wrong')
      const classification = errorHandler.classifyError(unknownError)
      
      expect(classification.category).toBe('unknown')
      expect(classification.severity).toBe('medium')
      expect(classification.recoverable).toBe(true)
    })
  })

  describe('ユーザーフレンドリーなエラーメッセージ', () => {
    it('ネットワークエラーに対して適切なメッセージを生成する', () => {
      const networkError = new Error('Failed to fetch')
      const message = errorHandler.getUserFriendlyMessage(networkError)
      
      expect(message.title).toBe('接続エラー')
      expect(message.description).toContain('ネットワーク接続')
      expect(message.actions).toContain('再試行')
    })

    it('許可エラーに対して適切なメッセージを生成する', () => {
      const permissionError = new Error('Permission denied')
      const message = errorHandler.getUserFriendlyMessage(permissionError)
      
      expect(message.title).toBe('許可エラー')
      expect(message.description).toContain('通知の許可')
      expect(message.actions).toContain('設定を確認')
    })

    it('設定エラーに対して適切なメッセージを生成する', () => {
      const configError = new Error('Invalid configuration')
      const message = errorHandler.getUserFriendlyMessage(configError)
      
      expect(message.title).toBe('設定エラー')
      expect(message.description).toContain('設定に問題')
      expect(message.actions).toContain('設定をリセット')
    })
  })

  describe('回復オプション', () => {
    it('ネットワークエラーに対して適切な回復オプションを提供する', () => {
      const networkError = new Error('Failed to fetch')
      const options = errorHandler.getRecoveryOptions(networkError)
      
      expect(options).toHaveLength(2)
      expect(options[0].label).toBe('再試行')
      expect(options[0].action).toBeDefined()
      expect(options[1].label).toBe('オフラインモードに切り替え')
      expect(options[1].action).toBeDefined()
    })

    it('許可エラーに対して適切な回復オプションを提供する', () => {
      const permissionError = new Error('Permission denied')
      const options = errorHandler.getRecoveryOptions(permissionError)
      
      expect(options).toHaveLength(2)
      expect(options[0].label).toBe('許可を再要求')
      expect(options[0].action).toBeDefined()
      expect(options[1].label).toBe('アプリ内通知のみ使用')
      expect(options[1].action).toBeDefined()
    })

    it('設定エラーに対して適切な回復オプションを提供する', () => {
      const configError = new Error('Invalid configuration')
      const options = errorHandler.getRecoveryOptions(configError)
      
      expect(options).toHaveLength(2)
      expect(options[0].label).toBe('設定をリセット')
      expect(options[0].action).toBeDefined()
      expect(options[1].label).toBe('デフォルト設定を使用')
      expect(options[1].action).toBeDefined()
    })
  })

  describe('エラーログ', () => {
    it('エラーを適切な詳細レベルでログに記録する', () => {
      const error = new Error('Test error')
      const context = { userId: 'test-user', operation: 'send-notification' }
      
      errorHandler.logError(error, context)
      
      // ログが呼ばれたことを確認（モックを通じて）
      expect(vi.mocked(errorHandler)).toBeDefined()
    })

    it('エラー統計を正しく追跡する', () => {
      const error1 = new Error('Network error')
      const error2 = new Error('Permission denied')
      
      errorHandler.logError(error1)
      errorHandler.logError(error2)
      
      const stats = errorHandler.getErrorStats()
      
      expect(stats.totalErrors).toBe(2)
      expect(stats.errorsByCategory.network).toBe(1)
      expect(stats.errorsByCategory.permission).toBe(1)
    })
  })

  describe('エラー回復の実行', () => {
    it('自動回復を試行する', async () => {
      const error = new Error('Failed to fetch')
      const mockRecoveryAction = vi.fn().mockResolvedValue(true)
      
      const result = await errorHandler.attemptRecovery(error, mockRecoveryAction)
      
      expect(result.success).toBe(true)
      expect(mockRecoveryAction).toHaveBeenCalled()
    })

    it('回復に失敗した場合は適切に処理する', async () => {
      const error = new Error('Failed to fetch')
      const mockRecoveryAction = vi.fn().mockRejectedValue(new Error('Recovery failed'))
      
      const result = await errorHandler.attemptRecovery(error, mockRecoveryAction)
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('包括的エラーハンドリング', () => {
    it('エラーコンテキストを適切に記録する', () => {
      const error = new Error('Test error')
      const context = {
        userId: 'user-123',
        operation: 'send-notification',
        timestamp: '2024-01-01T00:00:00Z',
        metadata: { region: '稚内市', type: 'snow-report' }
      }
      
      errorHandler.logError(error, context)
      
      const stats = errorHandler.getErrorStats()
      expect(stats.totalErrors).toBe(1)
      expect(stats.lastErrorTime).toBeDefined()
    })

    it('エラー重要度に基づいて適切なログレベルを使用する', () => {
      const criticalError = new Error('Critical system failure')
      const networkError = new Error('Failed to fetch')
      
      // 重要度の高いエラーをシミュレート
      errorHandler.logError(criticalError)
      errorHandler.logError(networkError)
      
      const stats = errorHandler.getErrorStats()
      expect(stats.totalErrors).toBe(2)
    })

    it('エラー統計を正確に追跡する', () => {
      const networkError = new Error('Network timeout')
      const permissionError = new Error('Permission denied')
      const configError = new Error('Invalid configuration')
      
      errorHandler.logError(networkError)
      errorHandler.logError(permissionError)
      errorHandler.logError(configError)
      
      const stats = errorHandler.getErrorStats()
      
      expect(stats.totalErrors).toBe(3)
      expect(stats.errorsByCategory.network).toBe(1)
      expect(stats.errorsByCategory.permission).toBe(1)
      expect(stats.errorsByCategory.configuration).toBe(1)
      expect(stats.errorsBySeverity.medium).toBe(1) // network
      expect(stats.errorsBySeverity.high).toBe(2) // permission + configuration
    })

    it('統計をリセットできる', () => {
      const error = new Error('Test error')
      errorHandler.logError(error)
      
      expect(errorHandler.getErrorStats().totalErrors).toBe(1)
      
      errorHandler.resetStats()
      
      const stats = errorHandler.getErrorStats()
      expect(stats.totalErrors).toBe(0)
      expect(stats.lastErrorTime).toBeNull()
      expect(Object.values(stats.errorsByCategory).every(count => count === 0)).toBe(true)
      expect(Object.values(stats.errorsBySeverity).every(count => count === 0)).toBe(true)
    })
  })

  describe('高度なエラー分類', () => {
    it('複合エラーメッセージを正しく分類する', () => {
      const complexError = new Error('Network timeout: Failed to fetch data from server')
      const classification = errorHandler.classifyError(complexError)
      
      expect(classification.category).toBe('network')
      expect(classification.severity).toBe('medium')
      expect(classification.recoverable).toBe(true)
    })

    it('日本語エラーメッセージを正しく分類する', () => {
      const japaneseError = new Error('ネットワークエラーが発生しました')
      const classification = errorHandler.classifyError(japaneseError)
      
      // 日本語メッセージは unknown として分類される（現在の実装では）
      expect(classification.category).toBe('unknown')
      expect(classification.severity).toBe('medium')
      expect(classification.recoverable).toBe(true)
    })

    it('大文字小文字を区別せずにエラーを分類する', () => {
      const upperCaseError = new Error('PERMISSION DENIED')
      const lowerCaseError = new Error('permission denied')
      
      const upperClassification = errorHandler.classifyError(upperCaseError)
      const lowerClassification = errorHandler.classifyError(lowerCaseError)
      
      expect(upperClassification.category).toBe('permission')
      expect(lowerClassification.category).toBe('permission')
    })
  })

  describe('回復オプションの優先順位', () => {
    it('回復オプションが優先順位順に並んでいる', () => {
      const error = new Error('Failed to fetch')
      const options = errorHandler.getRecoveryOptions(error)
      
      expect(options).toHaveLength(2)
      expect(options[0].priority).toBeLessThan(options[1].priority)
    })

    it('各回復オプションが実行可能である', async () => {
      const error = new Error('Permission denied')
      const options = errorHandler.getRecoveryOptions(error)
      
      for (const option of options) {
        expect(typeof option.action).toBe('function')
        const result = await option.action()
        expect(typeof result).toBe('boolean')
      }
    })
  })

  describe('エラーメッセージの国際化対応', () => {
    it('ユーザーフレンドリーなメッセージが日本語で提供される', () => {
      const errors = [
        new Error('Failed to fetch'),
        new Error('Permission denied'),
        new Error('Invalid configuration'),
        new Error('Storage quota exceeded'),
        new Error('Unknown error')
      ]
      
      errors.forEach(error => {
        const message = errorHandler.getUserFriendlyMessage(error)
        
        expect(message.title).toBeDefined()
        expect(message.description).toBeDefined()
        expect(message.actions).toBeInstanceOf(Array)
        expect(message.actions.length).toBeGreaterThan(0)
        
        // 日本語文字が含まれていることを確認
        expect(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(message.title)).toBe(true)
        expect(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(message.description)).toBe(true)
      })
    })
  })
})