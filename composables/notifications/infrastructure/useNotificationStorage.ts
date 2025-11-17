import type { 
  NotificationPreferences, 
  NotificationHistoryItem,
  NotificationStorageSchema,
  NotificationFilter,
  NotificationStats
} from '~/types/notification'
import { 
  generateNotificationId,
  filterNotifications,
  calculateNotificationStats,
  sortNotificationsByDate,
  validateNotificationItem
} from '~/utils/notificationUtils'

export interface NotificationStorage {
  getPreferences(): Promise<NotificationPreferences | null>
  savePreferences(preferences: NotificationPreferences): Promise<void>
  getHistory(filter?: NotificationFilter): Promise<NotificationHistoryItem[]>
  addHistoryItem(item: Omit<NotificationHistoryItem, 'id' | 'timestamp' | 'status'>): Promise<NotificationHistoryItem>
  markAsRead(id: string): Promise<void>
  markAllAsRead(area?: string): Promise<void>
  deleteNotification(id: string): Promise<void>
  clearHistory(olderThan?: string): Promise<void>
  getStats(): Promise<NotificationStats>
  isStorageAvailable(): boolean
}

const STORAGE_KEYS = {
  PREFERENCES: 'wakkanai_notification_preferences',
  HISTORY: 'wakkanai_notification_history'
} as const

const MAX_HISTORY_ITEMS = 50

export const useNotificationStorage = (): NotificationStorage => {
  
  const isStorageAvailable = (): boolean => {
    try {
      const test = '__storage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }

  const getPreferences = async (): Promise<NotificationPreferences | null> => {
    try {
      if (!isStorageAvailable()) {
        return null
      }

      const stored = localStorage.getItem(STORAGE_KEYS.PREFERENCES)
      if (!stored) {
        return null
      }

      const preferences = JSON.parse(stored) as NotificationPreferences
      
      // Validate the structure
      if (!preferences || typeof preferences !== 'object') {
        return null
      }

      return {
        subscriptions: Array.isArray(preferences.subscriptions) ? preferences.subscriptions : [],
        enablePush: typeof preferences.enablePush === 'boolean' ? preferences.enablePush : false,
        enableInApp: typeof preferences.enableInApp === 'boolean' ? preferences.enableInApp : true,
        lastUpdated: preferences.lastUpdated || new Date().toISOString()
      }
    } catch (error) {
      console.error('Failed to get notification preferences:', error)
      return null
    }
  }

  const savePreferences = async (preferences: NotificationPreferences): Promise<void> => {
    try {
      if (!isStorageAvailable()) {
        throw new Error('Local storage is not available')
      }

      const toSave: NotificationPreferences = {
        ...preferences,
        lastUpdated: new Date().toISOString()
      }

      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(toSave))
    } catch (error) {
      console.error('Failed to save notification preferences:', error)
      throw error
    }
  }

  const getHistory = async (filter?: NotificationFilter): Promise<NotificationHistoryItem[]> => {
    try {
      if (!isStorageAvailable()) {
        return []
      }

      const stored = localStorage.getItem(STORAGE_KEYS.HISTORY)
      if (!stored) {
        return []
      }

      const history = JSON.parse(stored)
      if (!Array.isArray(history)) {
        return []
      }

      // Validate and filter valid history items
      let validHistory = history.filter((item: any) => 
        item && 
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.area === 'string' &&
        (item.type === 'start' || item.type === 'end') &&
        typeof item.message === 'string' &&
        typeof item.timestamp === 'string' &&
        typeof item.read === 'boolean'
      ).map((item: any) => ({
        ...item,
        status: item.status || (item.read ? 'read' : 'unread')
      }))

      // Apply filters if provided
      if (filter) {
        validHistory = filterNotifications(validHistory, filter)
      }

      return sortNotificationsByDate(validHistory)
    } catch (error) {
      console.error('Failed to get notification history:', error)
      return []
    }
  }

  const addHistoryItem = async (item: Omit<NotificationHistoryItem, 'id' | 'timestamp' | 'status'>): Promise<NotificationHistoryItem> => {
    try {
      if (!isStorageAvailable()) {
        throw new Error('Local storage is not available')
      }

      // Validate the input item
      const validationErrors = validateNotificationItem(item)
      if (validationErrors.length > 0) {
        throw new Error(`Invalid notification item: ${validationErrors.join(', ')}`)
      }

      // Create complete notification item
      const newItem: NotificationHistoryItem = {
        ...item,
        id: generateNotificationId(),
        timestamp: new Date().toISOString(),
        status: 'unread',
        read: false
      }

      const currentHistory = await getHistory()
      
      // Add new item at the beginning
      const updatedHistory = [newItem, ...currentHistory]
      
      // Limit to MAX_HISTORY_ITEMS
      if (updatedHistory.length > MAX_HISTORY_ITEMS) {
        updatedHistory.splice(MAX_HISTORY_ITEMS)
      }

      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updatedHistory))
      return newItem
    } catch (error) {
      console.error('Failed to add notification history item:', error)
      throw error
    }
  }

  const markAsRead = async (id: string): Promise<void> => {
    try {
      if (!isStorageAvailable()) {
        return
      }

      const currentHistory = await getHistory()
      const updatedHistory = currentHistory.map(item => 
        item.id === id 
          ? { ...item, read: true, status: 'read' as const }
          : item
      )

      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updatedHistory))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      throw error
    }
  }

  const markAllAsRead = async (area?: string): Promise<void> => {
    try {
      if (!isStorageAvailable()) {
        return
      }

      const currentHistory = await getHistory()
      const updatedHistory = currentHistory.map(item => 
        (!area || item.area === area)
          ? { ...item, read: true, status: 'read' as const }
          : item
      )

      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updatedHistory))
    } catch (error) {
      console.error('Failed to mark notifications as read:', error)
      throw error
    }
  }

  const deleteNotification = async (id: string): Promise<void> => {
    try {
      if (!isStorageAvailable()) {
        return
      }

      const currentHistory = await getHistory()
      const updatedHistory = currentHistory.filter(item => item.id !== id)

      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updatedHistory))
    } catch (error) {
      console.error('Failed to delete notification:', error)
      throw error
    }
  }

  const clearHistory = async (olderThan?: string): Promise<void> => {
    try {
      if (!isStorageAvailable()) {
        return
      }

      if (!olderThan) {
        // Clear all history
        localStorage.removeItem(STORAGE_KEYS.HISTORY)
        return
      }

      // Clear history older than specified date
      const cutoffDate = new Date(olderThan)
      const currentHistory = await getHistory()
      const filteredHistory = currentHistory.filter(item => 
        new Date(item.timestamp) >= cutoffDate
      )

      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(filteredHistory))
    } catch (error) {
      console.error('Failed to clear notification history:', error)
      throw error
    }
  }

  const getStats = async (): Promise<NotificationStats> => {
    try {
      const history = await getHistory()
      return calculateNotificationStats(history)
    } catch (error) {
      console.error('Failed to get notification stats:', error)
      return {
        total: 0,
        unread: 0,
        byArea: {},
        byType: { start: 0, end: 0 }
      }
    }
  }

  return {
    getPreferences,
    savePreferences,
    getHistory,
    addHistoryItem,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearHistory,
    getStats,
    isStorageAvailable
  }
}