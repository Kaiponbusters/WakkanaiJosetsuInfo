import { describe, it, expect, beforeEach, vi } from 'vitest'

// モック
const mockServiceWorkerRegistration = {
  installing: null,
  waiting: null,
  active: null,
  scope: '/',
  showNotification: vi.fn(),
  unregister: vi.fn()
}

const mockNavigator = {
  serviceWorker: {
    register: vi.fn(),
    ready: Promise.resolve(mockServiceWorkerRegistration)
  }
}

const mockNotification = {
  permission: 'default' as NotificationPermission,
  requestPermission: vi.fn()
}

// グローバルモック
vi.stubGlobal('navigator', mockNavigator)
vi.stubGlobal('Notification', mockNotification)
vi.stubGlobal('window', { Notification: mockNotification })

describe('usePushNotificationService', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    
    // モックの初期状態を設定
    mockNotification.permission = 'default'
    mockServiceWorkerRegistration.showNotification.mockResolvedValue(undefined)
    mockServiceWorkerRegistration.unregister.mockResolvedValue(true)
    mockNavigator.serviceWorker.register.mockResolvedValue(mockServiceWorkerRegistration)
    mockNotification.requestPermission.mockResolvedValue('granted')
  })

  describe('基本機能', () => {
    it('ブラウザサポートを正しく検出する', async () => {
      const { usePushNotificationService } = await import('~/composables/notifications/usePushNotificationService')
      const service = usePushNotificationService()
      
      expect(service.isSupported).toBe(true)
    })

    it('正常に初期化される', async () => {
      const { usePushNotificationService } = await import('~/composables/notifications/usePushNotificationService')
      const service = usePushNotificationService()
      
      const result = await service.initialize()
      
      expect(result).toBe(true)
      expect(mockNavigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js', { scope: '/' })
      expect(service.isServiceWorkerRegistered.value).toBe(true)
    })

    it('許可リクエストが成功する', async () => {
      mockNotification.requestPermission.mockResolvedValue('granted')
      
      const { usePushNotificationService } = await import('~/composables/notifications/usePushNotificationService')
      const service = usePushNotificationService()
      
      const result = await service.requestPermission()
      
      expect(result).toBe(true)
      expect(service.permission.value).toBe('granted')
      expect(service.isPermissionGranted()).toBe(true)
    })

    it('許可リクエストが拒否される', async () => {
      mockNotification.requestPermission.mockResolvedValue('denied')
      
      const { usePushNotificationService } = await import('~/composables/notifications/usePushNotificationService')
      const service = usePushNotificationService()
      
      const result = await service.requestPermission()
      
      expect(result).toBe(false)
      expect(service.permission.value).toBe('denied')
      expect(service.isPermissionDenied()).toBe(true)
    })

    it('プッシュ通知を送信する', async () => {
      mockNotification.permission = 'granted'
      
      const { usePushNotificationService } = await import('~/composables/notifications/usePushNotificationService')
      const service = usePushNotificationService()
      await service.initialize()
      
      const payload = {
        title: 'テスト通知',
        body: 'これはテスト通知です'
      }
      
      const result = await service.sendNotification(payload)
      
      expect(result).toBe(true)
      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        'テスト通知',
        expect.objectContaining({
          body: 'これはテスト通知です',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'snow-notification'
        })
      )
    })

    it('サービスワーカーを登録解除する', async () => {
      const { usePushNotificationService } = await import('~/composables/notifications/usePushNotificationService')
      const service = usePushNotificationService()
      await service.initialize()
      
      const result = await service.unregisterServiceWorker()
      
      expect(result).toBe(true)
      expect(mockServiceWorkerRegistration.unregister).toHaveBeenCalled()
      expect(service.isServiceWorkerRegistered.value).toBe(false)
    })
  })

  describe('エラーハンドリング', () => {
    it('サービスワーカー登録に失敗した場合', async () => {
      mockNavigator.serviceWorker.register.mockRejectedValue(new Error('Registration failed'))
      
      const { usePushNotificationService } = await import('~/composables/notifications/usePushNotificationService')
      const service = usePushNotificationService()
      
      const result = await service.initialize()
      
      expect(result).toBe(false)
      expect(service.isServiceWorkerRegistered.value).toBe(false)
    })

    it('許可が取得されていない場合、通知送信に失敗する', async () => {
      mockNotification.permission = 'denied'
      
      const { usePushNotificationService } = await import('~/composables/notifications/usePushNotificationService')
      const service = usePushNotificationService()
      await service.initialize()
      
      const payload = {
        title: 'テスト通知',
        body: 'これはテスト通知です'
      }
      
      const result = await service.sendNotification(payload)
      
      expect(result).toBe(false)
      expect(mockServiceWorkerRegistration.showNotification).not.toHaveBeenCalled()
    })

    it('通知送信でエラーが発生した場合', async () => {
      mockNotification.permission = 'granted'
      mockServiceWorkerRegistration.showNotification.mockRejectedValue(new Error('Notification failed'))
      
      const { usePushNotificationService } = await import('~/composables/notifications/usePushNotificationService')
      const service = usePushNotificationService()
      await service.initialize()
      
      const payload = {
        title: 'テスト通知',
        body: 'これはテスト通知です'
      }
      
      const result = await service.sendNotification(payload)
      
      expect(result).toBe(false)
    })
  })

  describe('許可状態の確認', () => {
    it('許可状態を正しく返す', async () => {
      mockNotification.permission = 'granted'
      
      const { usePushNotificationService } = await import('~/composables/notifications/usePushNotificationService')
      const service = usePushNotificationService()
      
      expect(service.getPermissionStatus()).toBe('granted')
      expect(service.isPermissionGranted()).toBe(true)
      expect(service.isPermissionDenied()).toBe(false)
    })

    it('拒否状態を正しく返す', async () => {
      mockNotification.permission = 'denied'
      
      const { usePushNotificationService } = await import('~/composables/notifications/usePushNotificationService')
      const service = usePushNotificationService()
      
      expect(service.getPermissionStatus()).toBe('denied')
      expect(service.isPermissionGranted()).toBe(false)
      expect(service.isPermissionDenied()).toBe(true)
    })
  })
})