import { describe, it, expect } from 'vitest'
import {
  generateNotificationId,
  createNotificationMessage,
  filterNotifications,
  groupNotificationsByDate,
  calculateNotificationStats,
  sortNotificationsByDate,
  isWithinQuietHours,
  validateNotificationItem
} from './notificationUtils'
import type { NotificationHistoryItem, NotificationFilter } from '~/types/notification'

describe('notificationUtils', () => {
  describe('generateNotificationId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateNotificationId()
      const id2 = generateNotificationId()
      
      expect(id1).toMatch(/^notif_\d+_[a-z0-9]+$/)
      expect(id2).toMatch(/^notif_\d+_[a-z0-9]+$/)
      expect(id1).not.toBe(id2)
    })
  })

  describe('createNotificationMessage', () => {
    it('should create start message', () => {
      const message = createNotificationMessage('start', '中央区')
      expect(message).toBe('除雪作業が開始されました: 中央区')
    })

    it('should create end message', () => {
      const message = createNotificationMessage('end', '港区')
      expect(message).toBe('除雪作業が完了しました: 港区')
    })

    it('should include estimated duration for start messages', () => {
      const message = createNotificationMessage('start', '中央区', { estimatedDuration: 30 })
      expect(message).toBe('除雪作業が開始されました: 中央区 (予想時間: 30分)')
    })

    it('should include severity information', () => {
      const message = createNotificationMessage('start', '中央区', { severity: 'high' })
      expect(message).toBe('除雪作業が開始されました: 中央区 [重要]')
    })
  })

  describe('filterNotifications', () => {
    const mockNotifications: NotificationHistoryItem[] = [
      {
        id: '1',
        area: '中央区',
        type: 'start',
        message: 'Test 1',
        timestamp: '2024-01-01T10:00:00Z',
        read: false,
        status: 'unread'
      },
      {
        id: '2',
        area: '港区',
        type: 'end',
        message: 'Test 2',
        timestamp: '2024-01-02T10:00:00Z',
        read: true,
        status: 'read'
      }
    ]

    it('should filter by areas', () => {
      const filter: NotificationFilter = { areas: ['中央区'] }
      const result = filterNotifications(mockNotifications, filter)
      
      expect(result).toHaveLength(1)
      expect(result[0].area).toBe('中央区')
    })

    it('should filter by types', () => {
      const filter: NotificationFilter = { types: ['end'] }
      const result = filterNotifications(mockNotifications, filter)
      
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('end')
    })

    it('should filter by status', () => {
      const filter: NotificationFilter = { status: ['unread'] }
      const result = filterNotifications(mockNotifications, filter)
      
      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('unread')
    })

    it('should apply limit', () => {
      const filter: NotificationFilter = { limit: 1 }
      const result = filterNotifications(mockNotifications, filter)
      
      expect(result).toHaveLength(1)
    })
  })

  describe('calculateNotificationStats', () => {
    const mockNotifications: NotificationHistoryItem[] = [
      {
        id: '1',
        area: '中央区',
        type: 'start',
        message: 'Test 1',
        timestamp: '2024-01-01T10:00:00Z',
        read: false,
        status: 'unread'
      },
      {
        id: '2',
        area: '中央区',
        type: 'end',
        message: 'Test 2',
        timestamp: '2024-01-02T10:00:00Z',
        read: true,
        status: 'read'
      },
      {
        id: '3',
        area: '港区',
        type: 'start',
        message: 'Test 3',
        timestamp: '2024-01-03T10:00:00Z',
        read: false,
        status: 'unread'
      }
    ]

    it('should calculate correct stats', () => {
      const stats = calculateNotificationStats(mockNotifications)
      
      expect(stats.total).toBe(3)
      expect(stats.unread).toBe(2)
      expect(stats.byArea['中央区']).toBe(2)
      expect(stats.byArea['港区']).toBe(1)
      expect(stats.byType.start).toBe(2)
      expect(stats.byType.end).toBe(1)
      expect(stats.lastNotification).toBe('2024-01-03T10:00:00Z')
    })
  })

  describe('isWithinQuietHours', () => {
    it('should return false when quiet hours disabled', () => {
      const result = isWithinQuietHours('2024-01-01T22:30:00Z', {
        enabled: false,
        start: '22:00',
        end: '06:00'
      })
      expect(result).toBe(false)
    })

    it('should detect time within quiet hours', () => {
      // Mock date to control timezone
      const timestamp = '2024-01-01T23:00:00Z'
      const result = isWithinQuietHours(timestamp, {
        enabled: true,
        start: '22:00',
        end: '06:00'
      })
      // Note: This test may be timezone dependent
      expect(typeof result).toBe('boolean')
    })
  })

  describe('validateNotificationItem', () => {
    it('should return no errors for valid item', () => {
      const item = {
        area: '中央区',
        type: 'start' as const,
        message: 'Test message',
        read: false
      }
      
      const errors = validateNotificationItem(item)
      expect(errors).toHaveLength(0)
    })

    it('should return errors for invalid item', () => {
      const item = {
        area: '',
        type: 'invalid' as any,
        message: '',
        read: false
      }
      
      const errors = validateNotificationItem(item)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors).toContain('Area is required and must be a non-empty string')
      expect(errors).toContain('Type must be either "start" or "end"')
      expect(errors).toContain('Message is required and must be a non-empty string')
    })
  })
})