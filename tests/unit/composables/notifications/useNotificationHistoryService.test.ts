import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useNotificationHistoryService } from '~/composables/notifications/services/useNotificationHistoryService'
import type { NotificationHistoryItem } from '~/types/notification'

// Mock the dependencies
const mockStorage = {
  getHistory: vi.fn(),
  addHistoryItem: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  deleteNotification: vi.fn(),
  clearHistory: vi.fn(),
  getStats: vi.fn(),
  getPreferences: vi.fn(),
  savePreferences: vi.fn(),
  isStorageAvailable: vi.fn().mockReturnValue(true)
}

const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  getLogs: vi.fn().mockReturnValue([]),
  clearLogs: vi.fn()
}

vi.mock('~/composables/notifications/useNotificationStorage', () => ({
  useNotificationStorage: () => mockStorage
}))

vi.mock('~/composables/notifications/useNotificationLogger', () => ({
  useNotificationLogger: () => mockLogger
}))

describe('useNotificationHistoryService', () => {
  let service: ReturnType<typeof useNotificationHistoryService>

  beforeEach(() => {
    vi.clearAllMocks()
    service = useNotificationHistoryService()
  })

  describe('addNotification', () => {
    it('should add notification successfully', async () => {
      const mockNotification: NotificationHistoryItem = {
        id: 'test-id',
        area: '中央区',
        type: 'start',
        message: '除雪作業が開始されました: 中央区',
        timestamp: '2024-01-01T10:00:00Z',
        read: false,
        status: 'unread'
      }

      mockStorage.addHistoryItem.mockResolvedValue(mockNotification)

      const result = await service.addNotification({
        area: '中央区',
        type: 'start',
        message: '除雪作業が開始されました: 中央区',
        read: false
      })

      expect(result).toEqual(mockNotification)
      expect(mockStorage.addHistoryItem).toHaveBeenCalledWith({
        area: '中央区',
        type: 'start',
        message: '除雪作業が開始されました: 中央区',
        read: false
      })
    })

    it('should create message automatically if not provided', async () => {
      const mockNotification: NotificationHistoryItem = {
        id: 'test-id',
        area: '中央区',
        type: 'start',
        message: '除雪作業が開始されました: 中央区',
        timestamp: '2024-01-01T10:00:00Z',
        read: false,
        status: 'unread'
      }

      mockStorage.addHistoryItem.mockResolvedValue(mockNotification)

      await service.addNotification({
        area: '中央区',
        type: 'start',
        message: '除雪作業が開始されました: 中央区',
        read: false
      })

      expect(mockStorage.addHistoryItem).toHaveBeenCalledWith({
        area: '中央区',
        type: 'start',
        message: '除雪作業が開始されました: 中央区',
        read: false
      })
    })
  })

  describe('getNotifications', () => {
    it('should retrieve notifications successfully', async () => {
      const mockNotifications: NotificationHistoryItem[] = [
        {
          id: '1',
          area: '中央区',
          type: 'start',
          message: 'Test 1',
          timestamp: '2024-01-01T10:00:00Z',
          read: false,
          status: 'unread'
        }
      ]

      mockStorage.getHistory.mockResolvedValue(mockNotifications)

      const result = await service.getNotifications()

      expect(result).toEqual(mockNotifications)
      expect(mockStorage.getHistory).toHaveBeenCalledWith(undefined)
    })

    it('should handle errors gracefully', async () => {
      mockStorage.getHistory.mockRejectedValue(new Error('Storage error'))

      const result = await service.getNotifications()

      expect(result).toEqual([])
      expect(mockLogger.error).toHaveBeenCalled()
    })
  })

  describe('getNotifications with filters', () => {
    it('should get notifications with limit filter', async () => {
      const mockNotifications: NotificationHistoryItem[] = []
      mockStorage.getHistory.mockResolvedValue(mockNotifications)

      await service.getNotifications({ limit: 10 })

      expect(mockStorage.getHistory).toHaveBeenCalledWith({ limit: 10 })
    })

    it('should get notifications with status filter', async () => {
      const mockNotifications: NotificationHistoryItem[] = []
      mockStorage.getHistory.mockResolvedValue(mockNotifications)

      await service.getNotifications({ status: ['unread'] })

      expect(mockStorage.getHistory).toHaveBeenCalledWith({ status: ['unread'] })
    })

    it('should get notifications with area filter', async () => {
      const mockNotifications: NotificationHistoryItem[] = []
      mockStorage.getHistory.mockResolvedValue(mockNotifications)

      await service.getNotifications({ areas: ['中央区'] })

      expect(mockStorage.getHistory).toHaveBeenCalledWith({ areas: ['中央区'] })
    })
  })

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      mockStorage.markAsRead.mockResolvedValue(undefined)

      await service.markAsRead('test-id')

      expect(mockStorage.markAsRead).toHaveBeenCalledWith('test-id')
      expect(mockLogger.info).toHaveBeenCalledWith('Marked notification as read: test-id')
    })
  })

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      mockStorage.markAllAsRead.mockResolvedValue(undefined)

      await service.markAllAsRead()

      expect(mockStorage.markAllAsRead).toHaveBeenCalledWith(undefined)
      expect(mockLogger.info).toHaveBeenCalledWith('Marked all notifications as read')
    })

    it('should mark all notifications as read for specific area', async () => {
      mockStorage.markAllAsRead.mockResolvedValue(undefined)

      await service.markAllAsRead('中央区')

      expect(mockStorage.markAllAsRead).toHaveBeenCalledWith('中央区')
      expect(mockLogger.info).toHaveBeenCalledWith('Marked all notifications as read for area: 中央区')
    })
  })

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      mockStorage.deleteNotification.mockResolvedValue(undefined)

      await service.deleteNotification('test-id')

      expect(mockStorage.deleteNotification).toHaveBeenCalledWith('test-id')
      expect(mockLogger.info).toHaveBeenCalledWith('Deleted notification: test-id')
    })
  })

  describe('clearHistory', () => {
    it('should clear all history', async () => {
      mockStorage.clearHistory.mockResolvedValue(undefined)

      await service.clearHistory()

      expect(mockStorage.clearHistory).toHaveBeenCalledWith(undefined)
      expect(mockLogger.info).toHaveBeenCalledWith('Cleared notification history')
    })

    it('should clear history older than specified date', async () => {
      const cutoffDate = '2024-01-01T00:00:00Z'
      mockStorage.clearHistory.mockResolvedValue(undefined)

      await service.clearHistory(cutoffDate)

      expect(mockStorage.clearHistory).toHaveBeenCalledWith(cutoffDate)
      expect(mockLogger.info).toHaveBeenCalledWith(`Cleared notification history older than: ${cutoffDate}`)
    })
  })

  describe('getStats', () => {
    it('should get notification statistics', async () => {
      const mockStats = {
        total: 5,
        unread: 2,
        byArea: { '中央区': 3, '港区': 2 },
        byType: { start: 3, end: 2 }
      }

      mockStorage.getStats.mockResolvedValue(mockStats)

      const result = await service.getStats()

      expect(result).toEqual(mockStats)
      expect(mockStorage.getStats).toHaveBeenCalled()
    })

    it('should return default stats on error', async () => {
      mockStorage.getStats.mockRejectedValue(new Error('Storage error'))

      const result = await service.getStats()

      expect(result).toEqual({
        total: 0,
        unread: 0,
        byArea: {},
        byType: { start: 0, end: 0 }
      })
    })
  })

  describe('exportHistory', () => {
    it('should export notification history', async () => {
      const mockNotifications: NotificationHistoryItem[] = [
        {
          id: '1',
          area: '中央区',
          type: 'start',
          message: 'Test',
          timestamp: '2024-01-01T10:00:00Z',
          read: false,
          status: 'unread'
        }
      ]

      const mockStats = {
        total: 1,
        unread: 1,
        byArea: { '中央区': 1 },
        byType: { start: 1, end: 0 }
      }

      mockStorage.getHistory.mockResolvedValue(mockNotifications)
      mockStorage.getStats.mockResolvedValue(mockStats)

      const result = await service.exportHistory()

      expect(typeof result).toBe('string')
      const parsed = JSON.parse(result)
      expect(parsed.version).toBe('1.0')
      expect(parsed.notifications).toEqual(mockNotifications)
      expect(parsed.stats).toEqual(mockStats)
    })
  })
})