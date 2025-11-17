import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NominatimProvider } from '~/composables/geocoding/NominatimProvider'

// fetchをモック化
global.fetch = vi.fn()

describe('NominatimProvider', () => {
  let provider: NominatimProvider

  beforeEach(() => {
    provider = new NominatimProvider({
      userAgent: 'WakkanaiJosetsuSystem/1.0'
    })
    vi.clearAllMocks()
  })

  it('should geocode area successfully', async () => {
    const mockResponse = [{
      lat: '45.4064',
      lon: '141.6731',
      display_name: '稚内市, 北海道, 日本'
    }]

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    } as Response)

    const result = await provider.geocode('稚内市')
    
    expect(result).toEqual({
      lat: 45.4064,
      lng: 141.6731
    })
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('nominatim.openstreetmap.org'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'User-Agent': 'WakkanaiJosetsuSystem/1.0'
        })
      })
    )
  })

  it('should throw error when no results found', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([])
    } as Response)

    await expect(provider.geocode('存在しない地域'))
      .rejects.toThrow('No coordinates found')
  })

  it('should throw error when API returns error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests'
    } as Response)

    await expect(provider.geocode('稚内市'))
      .rejects.toThrow('Nominatim API error: 429')
  })

  it('should have correct provider configuration', () => {
    expect(provider.name).toBe('nominatim')
    expect(provider.rateLimit.requestsPerSecond).toBe(1)
  })

  it('should validate empty query', async () => {
    await expect(provider.geocode(''))
      .rejects.toThrow('Query cannot be empty')
  })

  it('should validate empty user agent', () => {
    expect(() => new NominatimProvider({ userAgent: '' }))
      .toThrow('User-Agent is required for Nominatim API')
  })

  it('should handle timeout', async () => {
    const timeoutProvider = new NominatimProvider({
      userAgent: 'Test/1.0',
      timeout: 1 // 1ms timeout
    })

    // モックで遅延をシミュレート - AbortErrorを投げる
    vi.mocked(fetch).mockRejectedValueOnce(
      Object.assign(new Error('This operation was aborted'), { name: 'AbortError' })
    )

    await expect(timeoutProvider.geocode('稚内市'))
      .rejects.toThrow('Request timeout')
  })
})