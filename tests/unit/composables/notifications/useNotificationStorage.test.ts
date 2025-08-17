import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useNotificationStorage } from './useNotificationStorage'
import type { NotificationPreferences } from './useNotificationManager'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('useNotificationStorage', () => {
  let storage: ReturnType<typeof useNotificationStorage>

  beforeEach(() => {
    storage = useNotificationStorage()
    vi.clearAllMocks()
  })

  it('should check storage availability', () => {
    localStorageMock.setItem.mockImplementation(() => {})
    localStorageMock.removeItem.mockImplementation(() => {})
    
    expect(storage.isStorageAvailable()).toBe(true)
  })

  it('should return null when no preferences are stored', async () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    const preferences = await storage.getPreferences()
    expect(preferences).toBeNull()
  })

  it('should save and retrieve preferences', async () => {
    const testPreferences: NotificationPreferences = {
      subscriptions: ['downtown', 'harbor'],
      enablePush: true,
      enableInApp: true,
      lastUpdated: '2024-01-01T00:00:00.000Z'
    }

    localStorageMock.getItem.mockReturnValue(JSON.stringify(testPreferences))
    
    await storage.savePreferences(testPreferences)
    const retrieved = await storage.getPreferences()
    
    expect(retrieved).toEqual(expect.objectContaining({
      subscriptions: ['downtown', 'harbor'],
      enablePush: true,
      enableInApp: true
    }))
  })

  it('should handle corrupted preferences gracefully', async () => {
    localStorageMock.getItem.mockReturnValue('invalid json')
    
    const preferences = await storage.getPreferences()
    expect(preferences).toBeNull()
  })

  it('should return empty array when no history is stored', async () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    const history = await storage.getHistory()
    expect(history).toEqual([])
  })
})