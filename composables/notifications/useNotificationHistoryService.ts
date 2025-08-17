import { ref, computed } from 'vue'
import { useNotificationStorage } from './useNotificationStorage'
import { useNotificationLogger } from './useNotificationLogger'
import type { 
  NotificationHistoryItem, 
  NotificationFilter, 
  NotificationStats,
  NotificationHistoryManager
} from '~/types/notification'
import { 
  createNotificationMessage,
  groupNotificationsByDate,
  sortNotificationsByDate
} from '~/utils/notificationUtils'

export const useNotificationHistoryService = (): NotificationHistoryManager => {
  const storage = useNotificationStorage()
  const logger = useNotificationLogger()
  
  const isInitialized = ref(false)
  const lastCleanup = ref<string | null>(null)
  
  // Auto-cleanup interval (24 hours)
  const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000

  const initialize = async (): Promise<void> => {
    try {
      logger.info('Initializing notification history service')
      
      // Check if cleanup is needed
      await performMaintenanceIfNeeded()
      
      isInitialized.value = true
      logger.info('Notification history service initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize notification history service', error)
      throw error
    }
  }

  const performMaintenanceIfNeeded = async (): Promise<void> => {
    try {
      const now = new Date()
      const lastCleanupTime = lastCleanup.value ? new Date(lastCleanup.value) : null
      
      if (!lastCleanupTime || (now.getTime() - lastCleanupTime.getTime()) > CLEANUP_INTERVAL) {
        logger.info('Performing maintenance cleanup')
        
        // Clean up old notifications (older than 30 days)
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
        await storage.clearHistory(thirtyDaysAgo.toISOString())
        
        lastCleanup.value = now.toISOString()
        logger.info('Maintenance cleanup completed')
      }
    } catch (error) {
      logger.warn('Maintenance cleanup failed', error)
    }
  }

  const addNotification = async (
    item: Omit<NotificationHistoryItem, 'id' | 'timestamp' | 'status'>
  ): Promise<NotificationHistoryItem> => {
    try {
      if (!isInitialized.value) {
        await initialize()
      }

      // Create message if not provided
      const notificationItem = {
        ...item,
        message: item.message || createNotificationMessage(item.type, item.area, item.metadata)
      }

      const savedItem = await storage.addHistoryItem(notificationItem)
      
      logger.info(`Added notification to history: ${savedItem.id}`, {
        area: savedItem.area,
        type: savedItem.type
      })

      return savedItem
    } catch (error) {
      logger.error('Failed to add notification to history', error)
      throw error
    }
  }

  const getNotifications = async (filter?: NotificationFilter): Promise<NotificationHistoryItem[]> => {
    try {
      if (!isInitialized.value) {
        await initialize()
      }

      const notifications = await storage.getHistory(filter)
      
      logger.debug(`Retrieved ${notifications.length} notifications from history`, {
        filter,
        count: notifications.length
      })

      return notifications
    } catch (error) {
      logger.error('Failed to get notifications from history', error)
      return []
    }
  }

  const getNotificationsByDate = async (filter?: NotificationFilter): Promise<Record<string, NotificationHistoryItem[]>> => {
    try {
      const notifications = await getNotifications(filter)
      return groupNotificationsByDate(notifications)
    } catch (error) {
      logger.error('Failed to get notifications grouped by date', error)
      return {}
    }
  }

  const getRecentNotifications = async (limit: number = 10): Promise<NotificationHistoryItem[]> => {
    try {
      const filter: NotificationFilter = { limit }
      return await getNotifications(filter)
    } catch (error) {
      logger.error('Failed to get recent notifications', error)
      return []
    }
  }

  const getUnreadNotifications = async (): Promise<NotificationHistoryItem[]> => {
    try {
      const filter: NotificationFilter = { status: ['unread'] }
      return await getNotifications(filter)
    } catch (error) {
      logger.error('Failed to get unread notifications', error)
      return []
    }
  }

  const getNotificationsByArea = async (area: string): Promise<NotificationHistoryItem[]> => {
    try {
      const filter: NotificationFilter = { areas: [area] }
      return await getNotifications(filter)
    } catch (error) {
      logger.error(`Failed to get notifications for area: ${area}`, error)
      return []
    }
  }

  const markAsRead = async (id: string): Promise<void> => {
    try {
      if (!isInitialized.value) {
        await initialize()
      }

      await storage.markAsRead(id)
      
      logger.info(`Marked notification as read: ${id}`)
    } catch (error) {
      logger.error(`Failed to mark notification as read: ${id}`, error)
      throw error
    }
  }

  const markAllAsRead = async (area?: string): Promise<void> => {
    try {
      if (!isInitialized.value) {
        await initialize()
      }

      await storage.markAllAsRead(area)
      
      logger.info(`Marked all notifications as read${area ? ` for area: ${area}` : ''}`)
    } catch (error) {
      logger.error('Failed to mark all notifications as read', error)
      throw error
    }
  }

  const deleteNotification = async (id: string): Promise<void> => {
    try {
      if (!isInitialized.value) {
        await initialize()
      }

      await storage.deleteNotification(id)
      
      logger.info(`Deleted notification: ${id}`)
    } catch (error) {
      logger.error(`Failed to delete notification: ${id}`, error)
      throw error
    }
  }

  const clearHistory = async (olderThan?: string): Promise<void> => {
    try {
      if (!isInitialized.value) {
        await initialize()
      }

      await storage.clearHistory(olderThan)
      
      logger.info(`Cleared notification history${olderThan ? ` older than: ${olderThan}` : ''}`)
    } catch (error) {
      logger.error('Failed to clear notification history', error)
      throw error
    }
  }

  const getStats = async (): Promise<NotificationStats> => {
    try {
      if (!isInitialized.value) {
        await initialize()
      }

      const stats = await storage.getStats()
      
      logger.debug('Retrieved notification statistics', stats)
      
      return stats
    } catch (error) {
      logger.error('Failed to get notification statistics', error)
      return {
        total: 0,
        unread: 0,
        byArea: {},
        byType: { start: 0, end: 0 }
      }
    }
  }

  const exportHistory = async (): Promise<string> => {
    try {
      if (!isInitialized.value) {
        await initialize()
      }

      const notifications = await getNotifications()
      const stats = await getStats()
      
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        stats,
        notifications
      }

      const jsonString = JSON.stringify(exportData, null, 2)
      
      logger.info(`Exported ${notifications.length} notifications`)
      
      return jsonString
    } catch (error) {
      logger.error('Failed to export notification history', error)
      throw error
    }
  }

  const importHistory = async (data: string): Promise<void> => {
    try {
      if (!isInitialized.value) {
        await initialize()
      }

      const importData = JSON.parse(data)
      
      if (!importData.notifications || !Array.isArray(importData.notifications)) {
        throw new Error('Invalid import data format')
      }

      // Clear existing history before import
      await clearHistory()

      // Import notifications one by one to ensure validation
      let importedCount = 0
      for (const notification of importData.notifications) {
        try {
          await storage.addHistoryItem({
            area: notification.area,
            type: notification.type,
            message: notification.message,
            read: notification.read || false,
            metadata: notification.metadata
          })
          importedCount++
        } catch (error) {
          logger.warn(`Failed to import notification: ${notification.id}`, error)
        }
      }

      logger.info(`Imported ${importedCount} notifications from ${importData.notifications.length} total`)
    } catch (error) {
      logger.error('Failed to import notification history', error)
      throw error
    }
  }

  // Auto-initialize when service is created
  initialize().catch(error => {
    logger.error('Auto-initialization failed', error)
  })

  return {
    addNotification,
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearHistory,
    getStats,
    exportHistory,
    importHistory,
    
    // Additional convenience methods
    getNotificationsByDate,
    getRecentNotifications,
    getUnreadNotifications,
    getNotificationsByArea
  } as NotificationHistoryManager & {
    getNotificationsByDate(filter?: NotificationFilter): Promise<Record<string, NotificationHistoryItem[]>>
    getRecentNotifications(limit?: number): Promise<NotificationHistoryItem[]>
    getUnreadNotifications(): Promise<NotificationHistoryItem[]>
    getNotificationsByArea(area: string): Promise<NotificationHistoryItem[]>
  }
}