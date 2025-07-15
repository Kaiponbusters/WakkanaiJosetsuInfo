/**
 * Nominatim API Provider
 * OpenStreetMapのNominatim APIを使用したジオコーディングプロバイダ
 */

export interface Coordinates {
  lat: number
  lng: number
}

export interface RateLimitConfig {
  requestsPerSecond: number
}

export interface ProviderConfig {
  userAgent: string
  timeout?: number
}

interface NominatimResponse {
  lat: string
  lon: string
  display_name: string
}

export class NominatimProvider {
  readonly name = 'nominatim'
  readonly rateLimit: RateLimitConfig = {
    requestsPerSecond: 1
  }

  private readonly config: ProviderConfig
  private readonly baseUrl = 'https://nominatim.openstreetmap.org'

  constructor(config: ProviderConfig) {
    this.validateConfig(config)
    this.config = { ...config }
  }

  async geocode(query: string): Promise<Coordinates> {
    this.validateQuery(query)
    
    const url = this.buildSearchUrl(query)
    const response = await this.makeRequest(url)
    const data = await this.parseResponse(response)
    
    return this.extractCoordinates(data)
  }

  private validateConfig(config: ProviderConfig): void {
    if (!config.userAgent || config.userAgent.trim() === '') {
      throw new Error('User-Agent is required for Nominatim API')
    }
  }

  private validateQuery(query: string): void {
    if (!query || query.trim() === '') {
      throw new Error('Query cannot be empty')
    }
  }

  private buildSearchUrl(query: string): string {
    const params = new URLSearchParams({
      format: 'json',
      q: query.trim(),
      limit: '1'
    })
    return `${this.baseUrl}/search?${params.toString()}`
  }

  private async makeRequest(url: string): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout || 10000)

    try {
      const response = await fetch(url, {
        headers: this.buildHeaders(),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout')
      }
      throw error
    }
  }

  private buildHeaders(): Record<string, string> {
    return {
      'User-Agent': this.config.userAgent,
      'Accept': 'application/json'
    }
  }

  private async parseResponse(response: Response): Promise<NominatimResponse[]> {
    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`)
    }

    try {
      return await response.json()
    } catch (error) {
      throw new Error('Invalid JSON response from Nominatim API')
    }
  }

  private extractCoordinates(data: NominatimResponse[]): Coordinates {
    if (!data || data.length === 0) {
      throw new Error('No coordinates found')
    }

    const result = data[0]
    const lat = this.parseFloat(result.lat, 'latitude')
    const lng = this.parseFloat(result.lon, 'longitude')

    return { lat, lng }
  }

  private parseFloat(value: string, fieldName: string): number {
    const parsed = parseFloat(value)
    if (isNaN(parsed)) {
      throw new Error(`Invalid ${fieldName} value: ${value}`)
    }
    return parsed
  }
}