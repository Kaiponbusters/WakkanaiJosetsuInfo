import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useNotificationLogger } from '~/composables/notifications/useNotificationLogger'

describe('useNotificationLogger', () => {
  let logger: ReturnType<typeof useNotificationLogger>
  let consoleSpy: {
    debug: any
    info: any
    warn: any
    error: any
  }

  beforeEach(() => {
    // コンソールメソッドをモック
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {})
    }
    
    logger = useNotificationLogger()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('ログレベル別の記録', () => {
    it('debugログを正しく記録する', () => {
      const message = 'デバッグメッセージ'
      const context = { userId: 'test-user' }
      
      logger.debug(message, context)
      
      const logs = logger.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].level).toBe('debug')
      expect(logs[0].message).toBe(message)
      expect(logs[0].context).toEqual(context)
      expect(logs[0].timestamp).toBeDefined()
    })

    it('infoログを正しく記録する', () => {
      const message = '情報メッセージ'
      const context = { operation: 'send-notification' }
      
      logger.info(message, context)
      
      const logs = logger.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].level).toBe('info')
      expect(logs[0].message).toBe(message)
      expect(logs[0].context).toEqual(context)
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        '[NotificationSystem] 情報メッセージ',
        context
      )
    })

    it('warnログを正しく記録する', () => {
      const message = '警告メッセージ'
      const context = { errorCode: 'WARN_001' }
      
      logger.warn(message, context)
      
      const logs = logger.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].level).toBe('warn')
      expect(logs[0].message).toBe(message)
      expect(logs[0].context).toEqual(context)
      
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        '[NotificationSystem] 警告メッセージ',
        context
      )
    })

    it('errorログを正しく記録する', () => {
      const message = 'エラーメッセージ'
      const context = { error: 'CRITICAL_ERROR', stack: 'stack trace' }
      
      logger.error(message, context)
      
      const logs = logger.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].level).toBe('error')
      expect(logs[0].message).toBe(message)
      expect(logs[0].context).toEqual(context)
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        '[NotificationSystem] エラーメッセージ',
        context
      )
    })
  })

  describe('ログ管理', () => {
    it('複数のログを時系列順で記録する', () => {
      logger.info('最初のメッセージ')
      logger.warn('2番目のメッセージ')
      logger.error('3番目のメッセージ')
      
      const logs = logger.getLogs()
      expect(logs).toHaveLength(3)
      
      // 最新のログが最初に来る（unshiftで追加されるため）
      expect(logs[0].message).toBe('3番目のメッセージ')
      expect(logs[1].message).toBe('2番目のメッセージ')
      expect(logs[2].message).toBe('最初のメッセージ')
    })

    it('最大ログエントリ数を超えた場合に古いログを削除する', () => {
      // 102個のログを追加（MAX_LOG_ENTRIES = 100を超える）
      for (let i = 0; i < 102; i++) {
        logger.info(`メッセージ ${i}`)
      }
      
      const logs = logger.getLogs()
      expect(logs).toHaveLength(100)
      
      // 最新の100個のログが保持されている
      expect(logs[0].message).toBe('メッセージ 101')
      expect(logs[99].message).toBe('メッセージ 2')
    })

    it('ログをクリアできる', () => {
      logger.info('テストメッセージ1')
      logger.warn('テストメッセージ2')
      
      expect(logger.getLogs()).toHaveLength(2)
      
      logger.clearLogs()
      
      expect(logger.getLogs()).toHaveLength(0)
    })
  })

  describe('コンテキストなしのログ', () => {
    it('コンテキストなしでログを記録できる', () => {
      logger.info('コンテキストなしメッセージ')
      
      const logs = logger.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].context).toBeUndefined()
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        '[NotificationSystem] コンテキストなしメッセージ',
        ''
      )
    })
  })

  describe('開発環境でのデバッグログ', () => {
    it('開発環境でデバッグログをコンソールに出力する', () => {
      // NODE_ENVを一時的に変更
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      logger.debug('開発環境デバッグメッセージ')
      
      expect(consoleSpy.debug).toHaveBeenCalledWith(
        '[NotificationSystem] 開発環境デバッグメッセージ',
        ''
      )
      
      // 元の環境変数を復元
      process.env.NODE_ENV = originalEnv
    })

    it('本番環境でデバッグログをコンソールに出力しない', () => {
      // NODE_ENVを一時的に変更
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      
      logger.debug('本番環境デバッグメッセージ')
      
      expect(consoleSpy.debug).not.toHaveBeenCalled()
      
      // ログには記録される
      const logs = logger.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].level).toBe('debug')
      
      // 元の環境変数を復元
      process.env.NODE_ENV = originalEnv
    })
  })

  describe('タイムスタンプ', () => {
    it('各ログエントリに正しいタイムスタンプが付与される', () => {
      const beforeTime = new Date().toISOString()
      
      logger.info('タイムスタンプテスト')
      
      const afterTime = new Date().toISOString()
      const logs = logger.getLogs()
      
      expect(logs[0].timestamp).toBeDefined()
      expect(logs[0].timestamp >= beforeTime).toBe(true)
      expect(logs[0].timestamp <= afterTime).toBe(true)
    })
  })
})