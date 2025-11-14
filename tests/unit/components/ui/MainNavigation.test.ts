import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import MainNavigation from '~/components/ui/MainNavigation.vue'

// Mock composables
vi.mock('~/composables/notifications/useNotificationManager', () => ({
  useNotificationManager: () => ({
    getSubscriptions: vi.fn(() => ['中央区', '港区']),
    getPreferences: vi.fn(() => ({
      subscriptions: ['中央区', '港区'],
      enablePush: true,
      enableInApp: true,
      lastUpdated: '2024-01-15T10:00:00Z'
    })),
    isEnabled: vi.fn(() => true)
  })
}))

vi.mock('~/composables/notifications/useNotificationHistoryService', () => ({
  useNotificationHistoryService: () => ({
    getStats: vi.fn(() => Promise.resolve({ unread: 3, total: 10 }))
  })
}))

// Mock Vue router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

describe('MainNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('メインナビゲーションが正しくレンダリングされる', () => {
    const wrapper = mount(MainNavigation)
    
    expect(wrapper.find('[data-testid="main-navigation"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="app-title"]').text()).toBe('稚内市除雪情報')
  })

  it('通知インジケーターが表示される', async () => {
    const wrapper = mount(MainNavigation)
    
    // Wait for async data loading
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const notificationIndicator = wrapper.find('[data-testid="notification-indicator"]')
    expect(notificationIndicator.exists()).toBe(true)
  })

  it('アクティブな購読がある場合、通知バッジが表示される', async () => {
    const wrapper = mount(MainNavigation)
    
    // Wait for component to initialize
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const badge = wrapper.find('[data-testid="notification-badge"]')
    expect(badge.exists()).toBe(true)
  })

  it('未読通知数が表示される', async () => {
    const wrapper = mount(MainNavigation)
    
    // Wait for async data loading
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const unreadCount = wrapper.find('[data-testid="unread-count"]')
    expect(unreadCount.exists()).toBe(true)
    expect(unreadCount.text()).toBe('3')
  })

  it('通知インジケーターをクリックすると通知設定ページに遷移する', async () => {
    const wrapper = mount(MainNavigation)
    
    const notificationButton = wrapper.find('[data-testid="notification-button"]')
    await notificationButton.trigger('click')
    
    expect(mockPush).toHaveBeenCalledWith('/notifications')
  })

  it('アプリタイトルをクリックするとホームページに遷移する', async () => {
    const wrapper = mount(MainNavigation)
    
    const titleLink = wrapper.find('[data-testid="home-link"]')
    await titleLink.trigger('click')
    
    expect(mockPush).toHaveBeenCalledWith('/')
  })

  it('除雪情報リンクをクリックすると除雪ページに遷移する', async () => {
    const wrapper = mount(MainNavigation)
    
    const josetsuLink = wrapper.find('[data-testid="josetsu-link"]')
    await josetsuLink.trigger('click')
    
    expect(mockPush).toHaveBeenCalledWith('/josetsu')
  })

  it('ナビゲーションリンクが正しく表示される', () => {
    const wrapper = mount(MainNavigation)
    
    const josetsuLink = wrapper.find('[data-testid="josetsu-link"]')
    expect(josetsuLink.exists()).toBe(true)
    expect(josetsuLink.text()).toBe('除雪情報')
  })
})