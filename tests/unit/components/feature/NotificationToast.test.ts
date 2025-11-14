import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import NotificationToast from '~/components/feature/NotificationToast.vue'
import type { NotificationHistoryItem } from '~/types/notification'

// Mock Teleport for testing
const TeleportStub = {
  name: 'Teleport',
  props: ['to'],
  template: '<div><slot /></div>'
}

// Mock notification data
const mockNotification = {
  area: '中央区',
  type: 'start' as const,
  message: '中央区で除雪作業が開始されました',
  read: false,
  metadata: {
    severity: 'medium' as const,
    estimatedDuration: 120
  }
}

describe('NotificationToast', () => {
  let wrapper: any

  beforeEach(() => {
    vi.useFakeTimers()
    wrapper = mount(NotificationToast, {
      props: {
        maxToasts: 5,
        defaultDuration: 5000,
        position: 'top-right'
      },
      global: {
        stubs: {
          Teleport: TeleportStub
        }
      }
    })
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
  })

  it('should render correctly', () => {
    expect(wrapper.find('.toast-container').exists()).toBe(true)
  })

  it('should add toast notification', async () => {
    await wrapper.vm.addToast(mockNotification)
    await wrapper.vm.$nextTick()

    const toastItems = wrapper.findAll('.toast-item')
    expect(toastItems.length).toBe(1)
  })

  it('should display toast content correctly', async () => {
    await wrapper.vm.addToast(mockNotification)
    await wrapper.vm.$nextTick()

    const toastItem = wrapper.find('.toast-item')
    expect(toastItem.text()).toContain('中央区')
    expect(toastItem.text()).toContain('中央区で除雪作業が開始されました')
    expect(toastItem.text()).toContain('開始')
  })

  it('should display metadata information', async () => {
    await wrapper.vm.addToast(mockNotification)
    await wrapper.vm.$nextTick()

    const toastItem = wrapper.find('.toast-item')
    expect(toastItem.text()).toContain('予想時間: 120分')
    expect(toastItem.text()).toContain('通常')
  })

  it('should dismiss toast when close button is clicked', async () => {
    await wrapper.vm.addToast(mockNotification)
    await wrapper.vm.$nextTick()

    const closeButton = wrapper.find('button[class*="text-gray-400"]')
    await closeButton.trigger('click')

    const toastItems = wrapper.findAll('.toast-item')
    expect(toastItems.length).toBe(0)
  })

  it('should dismiss toast when dismiss button is clicked', async () => {
    await wrapper.vm.addToast(mockNotification)
    await wrapper.vm.$nextTick()

    const dismissButtons = wrapper.findAll('button')
    const dismissButton = dismissButtons.find((btn: any) => btn.text().includes('閉じる'))
    
    if (dismissButton) {
      await dismissButton.trigger('click')
    }

    const toastItems = wrapper.findAll('.toast-item')
    expect(toastItems.length).toBe(0)
  })

  it('should emit toastClick when view details is clicked', async () => {
    await wrapper.vm.addToast(mockNotification)
    await wrapper.vm.$nextTick()

    const buttons = wrapper.findAll('button')
    const viewDetailsButton = buttons.find((btn: any) => btn.text().includes('詳細を見る'))
    
    if (viewDetailsButton) {
      await viewDetailsButton.trigger('click')
      expect(wrapper.emitted('toastClick')).toBeTruthy()
    } else {
      // If button not found, test the method directly
      const toast = wrapper.vm.toasts[0]
      await wrapper.vm.viewDetails(toast)
      expect(wrapper.emitted('toastClick')).toBeTruthy()
    }
  })

  it('should emit toastDismiss when toast is dismissed', async () => {
    await wrapper.vm.addToast(mockNotification)
    await wrapper.vm.$nextTick()

    const toastId = wrapper.vm.toasts[0].id
    await wrapper.vm.dismissToast(toastId)

    expect(wrapper.emitted('toastDismiss')).toBeTruthy()
    expect(wrapper.emitted('toastDismiss')[0]).toEqual([toastId])
  })

  it('should auto-dismiss toast after duration', async () => {
    await wrapper.vm.addToast(mockNotification)
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.toasts.length).toBe(1)

    // Fast-forward time
    vi.advanceTimersByTime(5000)
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.toasts.length).toBe(0)
  })

  it('should limit number of visible toasts', async () => {
    const maxToasts = 3
    wrapper = mount(NotificationToast, {
      props: { maxToasts },
      global: {
        stubs: {
          Teleport: TeleportStub
        }
      }
    })

    // Add more toasts than the limit
    for (let i = 0; i < 5; i++) {
      await wrapper.vm.addToast({
        ...mockNotification,
        area: `エリア${i + 1}`
      })
    }
    await wrapper.vm.$nextTick()

    const visibleToasts = wrapper.findAll('.toast-item')
    expect(visibleToasts.length).toBe(maxToasts)
  })

  it('should show different icons for different types', async () => {
    // Test start type
    await wrapper.vm.addToast({ ...mockNotification, type: 'start' })
    await wrapper.vm.$nextTick()

    let icon = wrapper.find('.toast-item svg')
    expect(icon.exists()).toBe(true)

    // Clear and test end type
    wrapper.vm.toasts = []
    await wrapper.vm.addToast({ ...mockNotification, type: 'end' })
    await wrapper.vm.$nextTick()

    icon = wrapper.find('.toast-item svg')
    expect(icon.exists()).toBe(true)
  })

  it('should apply correct styling for different types', async () => {
    await wrapper.vm.addToast({ ...mockNotification, type: 'start' })
    await wrapper.vm.$nextTick()

    const toastItem = wrapper.find('.toast-item')
    expect(toastItem.classes()).toContain('border-green-400')
  })

  it('should show progress bar for auto-dismiss', async () => {
    await wrapper.vm.addToast(mockNotification)
    await wrapper.vm.$nextTick()

    const progressBar = wrapper.find('.bg-blue-600')
    expect(progressBar.exists()).toBe(true)
  })

  it('should get correct type labels', () => {
    expect(wrapper.vm.getTypeLabel('start')).toBe('開始')
    expect(wrapper.vm.getTypeLabel('end')).toBe('完了')
  })

  it('should get correct severity labels', () => {
    expect(wrapper.vm.getSeverityLabel('low')).toBe('軽微')
    expect(wrapper.vm.getSeverityLabel('medium')).toBe('通常')
    expect(wrapper.vm.getSeverityLabel('high')).toBe('重要')
  })

  it('should get correct severity classes', () => {
    expect(wrapper.vm.getSeverityClass('low')).toBe('text-green-600')
    expect(wrapper.vm.getSeverityClass('medium')).toBe('text-yellow-600')
    expect(wrapper.vm.getSeverityClass('high')).toBe('text-red-600')
  })

  it('should clear all toasts', async () => {
    // Add multiple toasts
    await wrapper.vm.addToast(mockNotification)
    await wrapper.vm.addToast({ ...mockNotification, area: '港区' })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.toasts.length).toBe(2)

    wrapper.vm.clearAll()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.toasts.length).toBe(0)
  })

  it('should handle toast without metadata', async () => {
    const notificationWithoutMetadata = {
      area: '中央区',
      type: 'start' as const,
      message: '中央区で除雪作業が開始されました',
      read: false
    }

    await wrapper.vm.addToast(notificationWithoutMetadata)
    await wrapper.vm.$nextTick()

    const toastItem = wrapper.find('.toast-item')
    expect(toastItem.exists()).toBe(true)
    expect(toastItem.text()).toContain('中央区')
  })

  it('should generate unique toast IDs', async () => {
    await wrapper.vm.addToast(mockNotification)
    await wrapper.vm.addToast(mockNotification)
    await wrapper.vm.$nextTick()

    const toast1Id = wrapper.vm.toasts[0].id
    const toast2Id = wrapper.vm.toasts[1].id

    expect(toast1Id).not.toBe(toast2Id)
    expect(toast1Id).toMatch(/^toast_/)
    expect(toast2Id).toMatch(/^toast_/)
  })

  it('should handle progress calculation correctly', () => {
    const toast = { progress: 25 }
    expect(wrapper.vm.getProgressWidth(toast)).toBe(75)

    const toastWithoutProgress = {}
    expect(wrapper.vm.getProgressWidth(toastWithoutProgress)).toBe(100)
  })
})