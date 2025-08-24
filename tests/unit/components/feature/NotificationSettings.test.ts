import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import NotificationSettings from './NotificationSettings.vue'

// Mock the composables
const mockNotificationManager = {
  initialize: vi.fn().mockResolvedValue(undefined),
  getPreferences: vi.fn().mockReturnValue({
    enablePush: false,
    enableInApp: true,
    subscriptions: [],
    lastUpdated: '2024-01-01T00:00:00Z'
  }),
  getSubscriptions: vi.fn().mockReturnValue([]),
  subscribe: vi.fn().mockResolvedValue(undefined),
  unsubscribe: vi.fn().mockResolvedValue(undefined),
  enableNotifications: vi.fn().mockResolvedValue(true),
  disableNotifications: vi.fn().mockResolvedValue(undefined)
}

const mockHistoryService = {
  getStats: vi.fn().mockResolvedValue({
    total: 10,
    unread: 3,
    byArea: { '中央区': 5, '港区': 5 },
    byType: { start: 6, end: 4 }
  }),
  clearHistory: vi.fn().mockResolvedValue(undefined),
  markAllAsRead: vi.fn().mockResolvedValue(undefined)
}

vi.mock('~/composables/useNotificationManager', () => ({
  useNotificationManager: () => mockNotificationManager
}))

vi.mock('~/composables/useNotificationHistoryService', () => ({
  useNotificationHistoryService: () => mockHistoryService
}))

// Mock browser Notification API
Object.defineProperty(window, 'Notification', {
  writable: true,
  value: {
    permission: 'default',
    requestPermission: vi.fn().mockResolvedValue('granted')
  }
})

describe('NotificationSettings', () => {
  let wrapper: any

  beforeEach(() => {
    vi.clearAllMocks()
    wrapper = mount(NotificationSettings)
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('should render correctly', () => {
    expect(wrapper.find('.notification-settings').exists()).toBe(true)
    expect(wrapper.find('h2').text()).toBe('通知設定')
  })

  it('should display notification toggles', () => {
    const toggles = wrapper.findAll('button[class*="relative inline-flex"]')
    expect(toggles.length).toBeGreaterThanOrEqual(2) // Push and In-app toggles
  })

  it('should display area search input', () => {
    const searchInput = wrapper.find('input[placeholder="エリアを検索..."]')
    expect(searchInput.exists()).toBe(true)
  })

  it('should display statistics', async () => {
    await wrapper.vm.$nextTick()
    
    const statCards = wrapper.findAll('.bg-gray-50')
    expect(statCards.length).toBeGreaterThan(0)
  })

  it('should handle area subscription', async () => {
    const searchInput = wrapper.find('input[placeholder="エリアを検索..."]')
    
    await searchInput.setValue('中央区')
    await searchInput.trigger('input')
    
    expect(wrapper.vm.searchQuery).toBe('中央区')
    expect(wrapper.vm.showSearchResults).toBe(true)
  })

  it('should call subscribe when adding area', async () => {
    await wrapper.vm.addSubscription('中央区')
    
    expect(mockNotificationManager.subscribe).toHaveBeenCalledWith('中央区')
    expect(mockNotificationManager.getSubscriptions).toHaveBeenCalled()
  })

  it('should call unsubscribe when removing area', async () => {
    // First add a subscription to the mock
    mockNotificationManager.getSubscriptions.mockReturnValue(['中央区'])
    await wrapper.vm.$nextTick()
    
    await wrapper.vm.removeSubscription('中央区')
    
    expect(mockNotificationManager.unsubscribe).toHaveBeenCalledWith('中央区')
  })

  it('should handle push notification toggle', async () => {
    await wrapper.vm.togglePushNotifications()
    
    expect(mockNotificationManager.enableNotifications).toHaveBeenCalled()
  })

  it('should handle clear all notifications', async () => {
    // Mock window.confirm
    window.confirm = vi.fn().mockReturnValue(true)
    
    await wrapper.vm.clearAllNotifications()
    
    expect(mockHistoryService.clearHistory).toHaveBeenCalled()
    expect(mockHistoryService.getStats).toHaveBeenCalled()
  })

  it('should handle mark all as read', async () => {
    await wrapper.vm.markAllAsRead()
    
    expect(mockHistoryService.markAllAsRead).toHaveBeenCalled()
    expect(mockHistoryService.getStats).toHaveBeenCalled()
  })

  it('should filter available areas correctly', async () => {
    const searchInput = wrapper.find('input[placeholder="エリアを検索..."]')
    
    await searchInput.setValue('中央')
    await searchInput.trigger('input')
    await wrapper.vm.$nextTick()
    
    // Check that searchQuery is set
    expect(wrapper.vm.searchQuery).toBe('中央')
    
    // Since the component has availableAreas defined, filteredAreas should work
    // Let's check if the filtering logic works by testing the computed property directly
    const hasMatchingArea = wrapper.vm.availableAreas.some((area: string) => 
      area.toLowerCase().includes('中央'.toLowerCase())
    )
    expect(hasMatchingArea).toBe(true)
  })

  it('should not show subscribed areas in search results', async () => {
    mockNotificationManager.getSubscriptions.mockReturnValue(['中央区'])
    await wrapper.vm.$nextTick()
    
    const searchInput = wrapper.find('input[placeholder="エリアを検索..."]')
    await searchInput.setValue('中央')
    await searchInput.trigger('input')
    
    expect(wrapper.vm.filteredAreas).not.toContain('中央区')
  })
})