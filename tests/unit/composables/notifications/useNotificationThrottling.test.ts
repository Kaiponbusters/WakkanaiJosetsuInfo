import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useNotificationThrottling } from './useNotificationThrottling'

describe('useNotificationThrottling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('通知スロットリング機能', () => {
    it('初期状態では通知キューが空である', () => {
      const { getQueueSize } = useNotificationThrottling()
      
      expect(getQueueSize()).toBe(0)
    })

    it('通知をスロットリングして重複を防ぐ', async () => {
      const { throttleNotification, getQueueSize } = useNotificationThrottling()
      
      const notification1 = { id: '1', area: '稚内市', type: 'start' as const, message: 'テスト通知1' }
      const notification2 = { id: '2', area: '稚内市', type: 'start' as const, message: 'テスト通知2' }
      
      await throttleNotification(notification1)
      await throttleNotification(notification2)
      
      // 同じ地域・タイプの通知は1つにまとめられる
      expect(getQueueSize()).toBe(1)
    })

    it('異なる地域の通知は別々にキューイングされる', async () => {
      const { throttleNotification, getQueueSize } = useNotificationThrottling()
      
      const notification1 = { id: '1', area: '稚内市', type: 'start' as const, message: 'テスト通知1' }
      const notification2 = { id: '2', area: '豊富町', type: 'start' as const, message: 'テスト通知2' }
      
      await throttleNotification(notification1)
      await throttleNotification(notification2)
      
      expect(getQueueSize()).toBe(2)
    })

    it('スロットリング期間後に通知が処理される', async () => {
      const mockCallback = vi.fn()
      const { throttleNotification, setThrottleCallback } = useNotificationThrottling()
      
      setThrottleCallback(mockCallback)
      
      const notification = { id: '1', area: '稚内市', type: 'start' as const, message: 'テスト通知' }
      
      await throttleNotification(notification)
      
      // 1秒後に処理される
      vi.advanceTimersByTime(1000)
      
      expect(mockCallback).toHaveBeenCalledTimes(1)
      const calledWith = mockCallback.mock.calls[0][0]
      expect(calledWith).toHaveLength(1)
      expect(calledWith[0]).toMatchObject(notification)
      expect(calledWith[0]).toHaveProperty('timestamp')
    })
  })

  describe('バッチ処理機能', () => {
    it('複数の通知をバッチで処理する', async () => {
      const mockCallback = vi.fn()
      const { batchNotifications, setBatchCallback } = useNotificationThrottling()
      
      setBatchCallback(mockCallback)
      
      const notifications = [
        { id: '1', area: '稚内市', type: 'start' as const, message: 'テスト通知1' },
        { id: '2', area: '豊富町', type: 'end' as const, message: 'テスト通知2' }
      ]
      
      await batchNotifications(notifications)
      
      expect(mockCallback).toHaveBeenCalledWith(notifications)
    })

    it('バッチサイズ制限を適用する', async () => {
      const mockCallback = vi.fn()
      const { batchNotifications, setBatchCallback, setBatchSize } = useNotificationThrottling()
      
      setBatchCallback(mockCallback)
      setBatchSize(2)
      
      const notifications = [
        { id: '1', area: '稚内市', type: 'start' as const, message: 'テスト通知1' },
        { id: '2', area: '豊富町', type: 'end' as const, message: 'テスト通知2' },
        { id: '3', area: '猿払村', type: 'start' as const, message: 'テスト通知3' }
      ]
      
      await batchNotifications(notifications)
      
      // 最初の2件が処理される
      expect(mockCallback).toHaveBeenCalledWith(notifications.slice(0, 2))
    })

    it('バッチ処理タイムアウトを適用する', async () => {
      const mockCallback = vi.fn()
      const { addToBatch, setBatchCallback, setBatchTimeout } = useNotificationThrottling()
      
      setBatchCallback(mockCallback)
      setBatchTimeout(500) // 500ms
      
      const notification = { id: '1', area: '稚内市', type: 'start' as const, message: 'テスト通知' }
      
      addToBatch(notification)
      
      // 500ms後にバッチが処理される
      vi.advanceTimersByTime(500)
      
      expect(mockCallback).toHaveBeenCalledTimes(1)
      const calledWith = mockCallback.mock.calls[0][0]
      expect(calledWith).toHaveLength(1)
      expect(calledWith[0]).toMatchObject(notification)
      expect(calledWith[0]).toHaveProperty('timestamp')
    })
  })

  describe('デバウンス機能', () => {
    it('高速な連続通知をデバウンスする', async () => {
      const mockCallback = vi.fn()
      const { debounceNotification, setDebounceCallback } = useNotificationThrottling()
      
      setDebounceCallback(mockCallback)
      
      const notification = { id: '1', area: '稚内市', type: 'start' as const, message: 'テスト通知' }
      
      // 連続で呼び出し
      debounceNotification(notification)
      debounceNotification(notification)
      debounceNotification(notification)
      
      // デバウンス期間（300ms）経過
      vi.advanceTimersByTime(300)
      
      // 最後の呼び出しのみ処理される
      expect(mockCallback).toHaveBeenCalledTimes(1)
      const calledWith = mockCallback.mock.calls[0][0]
      expect(calledWith).toMatchObject(notification)
      expect(calledWith).toHaveProperty('timestamp')
    })

    it('デバウンス期間中の新しい通知で期間がリセットされる', async () => {
      const mockCallback = vi.fn()
      const { debounceNotification, setDebounceCallback } = useNotificationThrottling()
      
      setDebounceCallback(mockCallback)
      
      const notification = { id: '1', area: '稚内市', type: 'start' as const, message: 'テスト通知' }
      
      debounceNotification(notification)
      
      // 200ms経過
      vi.advanceTimersByTime(200)
      
      // 新しい通知でリセット
      debounceNotification(notification)
      
      // さらに200ms経過（合計400ms）
      vi.advanceTimersByTime(200)
      
      // まだ処理されない（300msでリセットされたため）
      expect(mockCallback).not.toHaveBeenCalled()
      
      // さらに100ms経過（リセット後300ms）
      vi.advanceTimersByTime(100)
      
      expect(mockCallback).toHaveBeenCalledTimes(1)
    })
  })

  describe('統計情報', () => {
    it('処理統計を取得できる', () => {
      const { getProcessingStats } = useNotificationThrottling()
      
      const stats = getProcessingStats()
      
      expect(stats).toBeDefined()
      expect(typeof stats.throttledCount).toBe('number')
      expect(typeof stats.batchedCount).toBe('number')
      expect(typeof stats.debouncedCount).toBe('number')
    })

    it('統計をリセットできる', () => {
      const { getProcessingStats, resetStats } = useNotificationThrottling()
      
      resetStats()
      const stats = getProcessingStats()
      
      expect(stats.throttledCount).toBe(0)
      expect(stats.batchedCount).toBe(0)
      expect(stats.debouncedCount).toBe(0)
    })
  })
})