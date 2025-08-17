import type { 
  NotificationHistoryItem, 
  NotificationFilter, 
  NotificationStats,
  NotificationType 
} from '~/types/notification'

/**
 * Generate a unique notification ID
 */
export function generateNotificationId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Create a notification message based on type and area
 */
export function createNotificationMessage(
  type: NotificationType, 
  area: string, 
  metadata?: any
): string {
  const baseMessages = {
    start: `除雪作業が開始されました: ${area}`,
    end: `除雪作業が完了しました: ${area}`
  }

  let message = baseMessages[type]

  if (metadata?.estimatedDuration && type === 'start') {
    message += ` (予想時間: ${metadata.estimatedDuration}分)`
  }

  if (metadata?.severity) {
    const severityText: Record<string, string> = {
      low: '軽微',
      medium: '通常',
      high: '重要'
    }
    message += ` [${severityText[metadata.severity] || '通常'}]`
  }

  return message
}

/**
 * Filter notifications based on criteria
 */
export function filterNotifications(
  notifications: NotificationHistoryItem[],
  filter: NotificationFilter
): NotificationHistoryItem[] {
  let filtered = [...notifications]

  // Filter by areas
  if (filter.areas && filter.areas.length > 0) {
    filtered = filtered.filter(n => filter.areas!.includes(n.area))
  }

  // Filter by types
  if (filter.types && filter.types.length > 0) {
    filtered = filtered.filter(n => filter.types!.includes(n.type))
  }

  // Filter by status
  if (filter.status && filter.status.length > 0) {
    filtered = filtered.filter(n => filter.status!.includes(n.status))
  }

  // Filter by date range
  if (filter.dateRange) {
    const startDate = new Date(filter.dateRange.start)
    const endDate = new Date(filter.dateRange.end)
    
    filtered = filtered.filter(n => {
      const notifDate = new Date(n.timestamp)
      return notifDate >= startDate && notifDate <= endDate
    })
  }

  // Apply pagination
  if (filter.offset) {
    filtered = filtered.slice(filter.offset)
  }

  if (filter.limit) {
    filtered = filtered.slice(0, filter.limit)
  }

  return filtered
}

/**
 * Group notifications by date
 */
export function groupNotificationsByDate(
  notifications: NotificationHistoryItem[]
): Record<string, NotificationHistoryItem[]> {
  const groups: Record<string, NotificationHistoryItem[]> = {}

  notifications.forEach(notification => {
    const date = new Date(notification.timestamp).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(notification)
  })

  // Sort each group by timestamp (newest first)
  Object.keys(groups).forEach(date => {
    groups[date].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  })

  return groups
}

/**
 * Calculate notification statistics
 */
export function calculateNotificationStats(
  notifications: NotificationHistoryItem[]
): NotificationStats {
  const stats: NotificationStats = {
    total: notifications.length,
    unread: 0,
    byArea: {},
    byType: { start: 0, end: 0 }
  }

  notifications.forEach(notification => {
    // Count unread
    if (!notification.read) {
      stats.unread++
    }

    // Count by area
    if (!stats.byArea[notification.area]) {
      stats.byArea[notification.area] = 0
    }
    stats.byArea[notification.area]++

    // Count by type
    stats.byType[notification.type]++

    // Track latest notification
    if (!stats.lastNotification || 
        new Date(notification.timestamp) > new Date(stats.lastNotification)) {
      stats.lastNotification = notification.timestamp
    }
  })

  return stats
}

/**
 * Sort notifications by timestamp (newest first)
 */
export function sortNotificationsByDate(
  notifications: NotificationHistoryItem[]
): NotificationHistoryItem[] {
  return [...notifications].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
}

/**
 * Check if notification is within quiet hours
 */
export function isWithinQuietHours(
  timestamp: string,
  quietHours?: { enabled: boolean; start: string; end: string }
): boolean {
  if (!quietHours?.enabled) {
    return false
  }

  const notifTime = new Date(timestamp)
  const hours = notifTime.getHours()
  const minutes = notifTime.getMinutes()
  const timeInMinutes = hours * 60 + minutes

  const [startHour, startMin] = quietHours.start.split(':').map(Number)
  const [endHour, endMin] = quietHours.end.split(':').map(Number)
  
  const startInMinutes = startHour * 60 + startMin
  const endInMinutes = endHour * 60 + endMin

  // Handle overnight quiet hours (e.g., 22:00 to 06:00)
  if (startInMinutes > endInMinutes) {
    return timeInMinutes >= startInMinutes || timeInMinutes <= endInMinutes
  }

  return timeInMinutes >= startInMinutes && timeInMinutes <= endInMinutes
}

/**
 * Validate notification data
 */
export function validateNotificationItem(
  item: Partial<NotificationHistoryItem>
): string[] {
  const errors: string[] = []

  if (!item.area || typeof item.area !== 'string' || item.area.trim().length === 0) {
    errors.push('Area is required and must be a non-empty string')
  }

  if (!item.type || !['start', 'end'].includes(item.type)) {
    errors.push('Type must be either "start" or "end"')
  }

  if (!item.message || typeof item.message !== 'string' || item.message.trim().length === 0) {
    errors.push('Message is required and must be a non-empty string')
  }

  if (item.timestamp && isNaN(new Date(item.timestamp).getTime())) {
    errors.push('Timestamp must be a valid date string')
  }

  return errors
}