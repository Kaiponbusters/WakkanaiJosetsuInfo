import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useNotificationManager } from './useNotificationManager'

// Mock the dependencies
vi.mock('./useNotificationStorage', () => ({
  useNotificationStorage: () => ({
    getPreferences: vi.fn().mockResolvedValue(null),
    savePreferences: vi.fn().mockResolvedValue(undefined),
    getHistory: vi.fn().mockResolvedValue([]),
    addHistoryItem: vi.fn().mockResolvedValue(undefined),
    clearHistory: vi.fn().mockResolvedValue(undefined),
    isStorageAvailable: vi.fn().mockReturnValue(true)
  })
}))

vi.mock('./useNotificationLogger', () => ({
  useNotificationLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    getLogs: vi.fn().mockReturnValue([]),
    clearLogs: vi.fn()
  })
}))

// Mock the realtime listener
vi.mock('./useRealtimeListener', () => ({
  useRealtimeListener: () => ({
    isConnected: { value: false },
    isConnecting: { value: false },
    connectionError: { value: null },
    reconnectAttempts: { value: 0 },
    subscribe: vi.fn().mockResolvedValue(true),
    unsubscribe: vi.fn().mockResolvedValue(undefined),
    addEventHandler: vi.fn(),
    removeEventHandler: vi.fn()
  })
}))

// Mock the notification pipeline
vi.mock('./useNotificationPipeline', () => ({
  useNotificationPipeline: () => ({
    queueNotification: vi.fn().mockResolvedValue(undefined)
  })
}))

// Mock the push notification service
vi.mock('./usePushNotificationService', () => ({
  usePushNotificationService: () => ({
    isSupported: true,
    permission: { value: 'default' },
    isServiceWorkerRegistered: { value: false },
    registration: { value: null },
    initialize: vi.fn().mockResolvedValue(true),
    requestPermission: vi.fn().mockResolvedValue(true),
    registerServiceWorker: vi.fn().mockResolvedValue(true),
    sendNotification: vi.fn().mockResolvedValue(true),
    getPermissionStatus: vi.fn().mockReturnValue('default'),
    isPermissionGranted: vi.fn().mockReturnValue(false),
    isPermissionDenied: vi.fn().mockReturnValue(false),
    unregisterServiceWorker: vi.fn().mockResolvedValue(true)
  })
}))

// Mock Vue composables
vi.mock('vue', () => ({
  ref: vi.fn((value) => ({ value })),
  computed: vi.fn((fn) => ({ value: fn() })),
  onUnmounted: vi.fn()
}))

// Mock browser Notification API
Object.defineProperty(window, 'Notification', {
  writable: true,
  value: {
    permission: 'default',
    requestPermission: vi.fn().mockResolvedValue('granted')
  }
})

describe('useNotificationManager', () => {
  let manager: ReturnType<typeof useNotificationManager>

  beforeEach(() => {
    manager = useNotificationManager()
    vi.clearAllMocks()
  })

  it('should initialize successfully', async () => {
    await expect(manager.initialize()).resolves.not.toThrow()
  })

  it('should start with empty subscriptions', () => {
    expect(manager.getSubscriptions()).toEqual([])
  })

  it('should subscribe to an area', async () => {
    await manager.initialize()
    await manager.subscribe('downtown')
    
    expect(manager.getSubscriptions()).toContain('downtown')
    expect(manager.isSubscribed('downtown')).toBe(true)
  })

  it('should unsubscribe from an area', async () => {
    await manager.initialize()
    await manager.subscribe('downtown')
    await manager.unsubscribe('downtown')
    
    expect(manager.getSubscriptions()).not.toContain('downtown')
    expect(manager.isSubscribed('downtown')).toBe(false)
  })

  it('should not duplicate subscriptions', async () => {
    await manager.initialize()
    await manager.subscribe('downtown')
    await manager.subscribe('downtown')
    
    const subscriptions = manager.getSubscriptions()
    expect(subscriptions.filter(area => area === 'downtown')).toHaveLength(1)
  })

  it('should handle invalid area names', async () => {
    await manager.initialize()
    
    await expect(manager.subscribe('')).rejects.toThrow('Invalid area name provided')
    await expect(manager.subscribe(null as any)).rejects.toThrow('Invalid area name provided')
  })

  it('should enable notifications when browser supports them', async () => {
    await manager.initialize()
    
    const result = await manager.enableNotifications()
    expect(result).toBe(true)
  })

  it('should return correct preferences', async () => {
    await manager.initialize()
    await manager.subscribe('downtown')
    
    const preferences = manager.getPreferences()
    expect(preferences.subscriptions).toContain('downtown')
    expect(preferences.enableInApp).toBe(true)
    expect(preferences.lastUpdated).toBeDefined()
  })

  describe('リアルタイム機能', () => {
    it('should start realtime listening', async () => {
      await manager.initialize()
      
      const result = await manager.startRealtimeListening()
      expect(result).toBe(true)
    })

    it('should stop realtime listening', async () => {
      await manager.initialize()
      
      await expect(manager.stopRealtimeListening()).resolves.not.toThrow()
    })

    it('should return connection status', async () => {
      await manager.initialize()
      
      const status = manager.getConnectionStatus()
      expect(status).toHaveProperty('isConnected')
      expect(status).toHaveProperty('isConnecting')
      expect(status).toHaveProperty('error')
      expect(status).toHaveProperty('reconnectAttempts')
    })

    it('should check if realtime is connected', async () => {
      await manager.initialize()
      
      const isConnected = manager.isRealtimeConnected()
      expect(typeof isConnected).toBe('boolean')
    })
  })
})