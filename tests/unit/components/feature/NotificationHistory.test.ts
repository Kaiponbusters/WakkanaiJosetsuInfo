import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import NotificationHistory from './NotificationHistory.vue'
import type { NotificationHistoryItem } from '~/types/notification'

// Mock notification data
const mockNotifications: NotificationHistoryItem[] = [
  {
    id: '1',
    area: '中央区',
    type: 'start',
    message: '中央区で除雪作業が開始されました',
    timestamp: '2024-01-15T10:00:00Z',
    read: false,
    status: 'unread',
    metadata: {
      severity: 'medium',
      estimatedDuration: 120
    }
  },
  {
    id: '2',
    area: '港区',
    type: 'end',
    message: '港区の除雪作業が完了しました',
    timestamp: '2024-01-15T08:30:00Z',
    read: true,
    status: 'read',
    metadata: {
      severity: 'low',
      estimatedDuration: 90
    }
  },
  {
    id: '3',
    area: '中央区',
    type: 'start',
    message: '中央区で除雪作業が開始されました',
    timestamp: '2024-01-14T14:15:00Z',
    read: true,
    status: 'read'
  }
]

// Mock the history service
const mockHistoryService = {
  getNotifications: vi.fn().mockResolvedValue(mockNotifications),
  getStats: vi.fn().mockResolvedValue({
    total: 3,
    unread: 1,
    byArea: { '中央区': 2, '港区': 1 },
    byType: { start: 2, end: 1 }
  }),
  markAsRead: vi.fn().mockResolvedValue(undefined),
  deleteNotification: vi.fn().mockResolvedValue(undefined)
}

vi.mock('~/composables/useNotificationHistoryService', () => ({
  useNotificationHistoryService: () => mockHistoryService
}))

describe('NotificationHistory', () => {
  let wrapper: any

  beforeEach(() => {
    vi.clearAllMocks()
    wrapper = mount(NotificationHistory)
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('should render correctly', () => {
    expect(wrapper.find('.notification-history').exists()).toBe(true)
    expect(wrapper.find('h2').text()).toBe('通知履歴')
  })

  it('should display filter controls', () => {
    const selects = wrapper.findAll('select')
    expect(selects.length).toBe(3) // Area, Type, Status filters
    
    // Check filter labels
    const labels = wrapper.findAll('label')
    const labelTexts = labels.map((label: any) => label.text())
    expect(labelTexts).toContain('エリア')
    expect(labelTexts).toContain('種類')
    expect(labelTexts).toContain('状態')
  })

  it('should display summary information', async () => {
    await wrapper.vm.$nextTick()
    
    const summary = wrapper.find('.summary-section')
    expect(summary.exists()).toBe(true)
    expect(summary.text()).toContain('総件数')
    expect(summary.text()).toContain('表示中')
  })

  it('should load notifications on mount', async () => {
    await wrapper.vm.$nextTick()
    
    expect(mockHistoryService.getNotifications).toHaveBeenCalled()
    expect(mockHistoryService.getStats).toHaveBeenCalled()
  })

  it('should group notifications by date', async () => {
    await wrapper.vm.$nextTick()
    
    const dateGroups = wrapper.findAll('.date-group')
    expect(dateGroups.length).toBeGreaterThan(0)
  })

  it('should display notification items', async () => {
    await wrapper.vm.$nextTick()
    
    const notificationItems = wrapper.findAll('.notification-item')
    expect(notificationItems.length).toBeGreaterThan(0)
  })

  it('should handle area filter', async () => {
    const areaSelect = wrapper.find('select').element as HTMLSelectElement
    areaSelect.value = '中央区'
    await wrapper.find('select').trigger('change')
    
    expect(wrapper.vm.filters.selectedArea).toBe('中央区')
  })

  it('should handle type filter', async () => {
    const selects = wrapper.findAll('select')
    const typeSelect = selects[1].element as HTMLSelectElement
    typeSelect.value = 'start'
    await selects[1].trigger('change')
    
    expect(wrapper.vm.filters.selectedType).toBe('start')
  })

  it('should handle status filter', async () => {
    const selects = wrapper.findAll('select')
    const statusSelect = selects[2].element as HTMLSelectElement
    statusSelect.value = 'unread'
    await selects[2].trigger('change')
    
    expect(wrapper.vm.filters.selectedStatus).toBe('unread')
  })

  it('should toggle read status', async () => {
    await wrapper.vm.$nextTick()
    
    const notification = mockNotifications[0]
    await wrapper.vm.toggleRead(notification)
    
    expect(mockHistoryService.markAsRead).toHaveBeenCalledWith(notification.id)
  })

  it('should delete notification', async () => {
    // Mock window.confirm
    window.confirm = vi.fn().mockReturnValue(true)
    
    await wrapper.vm.$nextTick()
    
    const notificationId = mockNotifications[0].id
    await wrapper.vm.deleteNotification(notificationId)
    
    expect(mockHistoryService.deleteNotification).toHaveBeenCalledWith(notificationId)
  })

  it('should not delete notification when user cancels', async () => {
    // Mock window.confirm to return false
    window.confirm = vi.fn().mockReturnValue(false)
    
    await wrapper.vm.$nextTick()
    
    const notificationId = mockNotifications[0].id
    await wrapper.vm.deleteNotification(notificationId)
    
    expect(mockHistoryService.deleteNotification).not.toHaveBeenCalled()
  })

  it('should format dates correctly', () => {
    const today = new Date().toDateString()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayString = yesterday.toDateString()
    
    expect(wrapper.vm.formatDate(today)).toBe('今日')
    expect(wrapper.vm.formatDate(yesterdayString)).toBe('昨日')
  })

  it('should format time correctly', () => {
    const timestamp = '2024-01-15T10:30:00Z'
    const formatted = wrapper.vm.formatTime(timestamp)
    expect(formatted).toMatch(/\d{2}:\d{2}/)
  })

  it('should get correct type labels', () => {
    expect(wrapper.vm.getTypeLabel('start')).toBe('開始')
    expect(wrapper.vm.getTypeLabel('end')).toBe('完了')
  })

  it('should get correct status labels', () => {
    expect(wrapper.vm.getStatusLabel('unread')).toBe('未読')
    expect(wrapper.vm.getStatusLabel('read')).toBe('既読')
  })

  it('should get correct severity labels', () => {
    expect(wrapper.vm.getSeverityLabel('low')).toBe('軽微')
    expect(wrapper.vm.getSeverityLabel('medium')).toBe('通常')
    expect(wrapper.vm.getSeverityLabel('high')).toBe('重要')
  })

  it('should handle load more functionality', async () => {
    await wrapper.vm.$nextTick()
    
    // Set hasMore to true to show the button
    wrapper.vm.hasMore = true
    await wrapper.vm.$nextTick()
    
    const loadMoreButton = wrapper.find('button:contains("さらに読み込む")')
    if (loadMoreButton.exists()) {
      await loadMoreButton.trigger('click')
      expect(wrapper.vm.currentPage).toBe(1)
    }
  })

  it('should filter notifications correctly', async () => {
    await wrapper.vm.$nextTick()
    
    // Set filter
    wrapper.vm.filters.selectedArea = '中央区'
    await wrapper.vm.$nextTick()
    
    const filtered = wrapper.vm.filteredNotifications
    expect(filtered.every((n: NotificationHistoryItem) => n.area === '中央区')).toBe(true)
  })

  it('should show empty state when no notifications', async () => {
    // Mock empty notifications and stats
    mockHistoryService.getNotifications.mockResolvedValueOnce([])
    mockHistoryService.getStats.mockResolvedValueOnce({
      total: 0,
      unread: 0,
      byArea: {},
      byType: { start: 0, end: 0 }
    })
    
    const emptyWrapper = mount(NotificationHistory)
    await emptyWrapper.vm.$nextTick()
    
    // Wait for loading to complete
    await new Promise(resolve => setTimeout(resolve, 100))
    await emptyWrapper.vm.$nextTick()
    
    expect(emptyWrapper.text()).toContain('通知履歴がありません')
    
    emptyWrapper.unmount()
  })

  it('should show loading state', async () => {
    wrapper.vm.loading = true
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('通知履歴を読み込み中')
  })
})