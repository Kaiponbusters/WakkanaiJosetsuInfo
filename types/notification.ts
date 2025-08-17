export type NotificationType = 'start' | 'end'
export type NotificationStatus = 'unread' | 'read' | 'archived'

export interface NotificationHistoryItem {
  id: string
  area: string
  type: NotificationType
  message: string
  timestamp: string
  read: boolean
  status: NotificationStatus
  metadata?: {
    reportId?: string
    location?: string
    severity?: 'low' | 'medium' | 'high'
    estimatedDuration?: number
  }
}

export interface NotificationPreferences {
  subscriptions: string[]
  enablePush: boolean
  enableInApp: boolean
  lastUpdated: string
  settings?: {
    soundEnabled: boolean
    vibrationEnabled: boolean
    quietHours?: {
      enabled: boolean
      start: string // HH:mm format
      end: string   // HH:mm format
    }
  }
}

export interface NotificationFilter {
  areas?: string[]
  types?: NotificationType[]
  status?: NotificationStatus[]
  dateRange?: {
    start: string
    end: string
  }
  limit?: number
  offset?: number
}

export interface NotificationStats {
  total: number
  unread: number
  byArea: Record<string, number>
  byType: Record<NotificationType, number>
  lastNotification?: string
}

export interface NotificationHistoryManager {
  addNotification(item: Omit<NotificationHistoryItem, 'id' | 'timestamp' | 'status'>): Promise<NotificationHistoryItem>
  getNotifications(filter?: NotificationFilter): Promise<NotificationHistoryItem[]>
  markAsRead(id: string): Promise<void>
  markAllAsRead(area?: string): Promise<void>
  deleteNotification(id: string): Promise<void>
  clearHistory(olderThan?: string): Promise<void>
  getStats(): Promise<NotificationStats>
  exportHistory(): Promise<string>
  importHistory(data: string): Promise<void>
}

export interface NotificationStorageSchema {
  version: number
  preferences: NotificationPreferences
  history: NotificationHistoryItem[]
  lastCleanup: string
}