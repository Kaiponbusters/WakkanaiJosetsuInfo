export interface SnowReportData {
  area: string
  start_time: string
  end_time: string
}

export interface ApiResponse {
  success: boolean
  data?: any
  error?: string
  statusCode: number
}

export interface RetryConfig {
  maxRetries: number
  retryDelay: number
}

export interface ResponseTimeStats {
  min: number
  max: number
  average: number
  history: number[]
}

export class ApiTestClient {
  private baseUrl: string
  private initialized = true
  private defaultHeaders: Record<string, string>
  private timeout = 5000
  private retryConfig: RetryConfig = { maxRetries: 1, retryDelay: 1000 }
  private responseTimes: number[] = []

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }

  cleanup(): void {
    this.responseTimes = []
  }

  getBaseUrl(): string {
    return this.baseUrl
  }

  isInitialized(): boolean {
    return this.initialized
  }

  getDefaultHeaders(): Record<string, string> {
    return { ...this.defaultHeaders }
  }

  setCustomHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers }
  }

  setTimeout(timeout: number): void {
    this.timeout = timeout
  }

  getTimeout(): number {
    return this.timeout
  }

  setRetryConfig(config: RetryConfig): void {
    this.retryConfig = config
  }

  getRetryConfig(): RetryConfig {
    return { ...this.retryConfig }
  }

  async createSnowReport(data: SnowReportData): Promise<ApiResponse> {
    const startTime = Date.now()
    
    try {
      // ネットワークエラーのシミュレート
      if (this.baseUrl.includes('invalid-url')) {
        throw new Error('Network error')
      }

      // サーバーエラーのシミュレート
      if (data.area === 'SERVER_ERROR_TRIGGER') {
        const responseTime = Date.now() - startTime
        this.responseTimes.push(responseTime)
        return {
          success: false,
          error: 'Internal server error',
          statusCode: 500
        }
      }

      // バリデーションエラーのシミュレート
      if (!data.area || !data.start_time || !data.end_time) {
        const responseTime = Date.now() - startTime
        this.responseTimes.push(responseTime)
        return {
          success: false,
          error: 'Missing required fields',
          statusCode: 400
        }
      }

      // 正常レスポンスのシミュレート
      const responseTime = Date.now() - startTime
      this.responseTimes.push(responseTime)
      
      return {
        success: true,
        data: {
          id: 1,
          ...data,
          created_at: new Date().toISOString()
        },
        statusCode: 201
      }
    } catch (error) {
      throw error
    }
  }

  async updateSnowReport(id: number, data: SnowReportData): Promise<ApiResponse> {
    const startTime = Date.now()
    
    // 404エラーのシミュレート
    if (id === 999) {
      const responseTime = Date.now() - startTime
      this.responseTimes.push(responseTime)
      return {
        success: false,
        error: 'Snow report not found',
        statusCode: 404
      }
    }

    // 正常レスポンスのシミュレート
    const responseTime = Date.now() - startTime
    this.responseTimes.push(responseTime)
    
    return {
      success: true,
      data: {
        id,
        ...data,
        updated_at: new Date().toISOString()
      },
      statusCode: 200
    }
  }

  async deleteSnowReport(id: number): Promise<ApiResponse> {
    const startTime = Date.now()
    
    // 正常レスポンスのシミュレート
    const responseTime = Date.now() - startTime
    this.responseTimes.push(responseTime)
    
    return {
      success: true,
      data: { message: 'Snow report deleted successfully' },
      statusCode: 200
    }
  }

  async getSnowReports(): Promise<SnowReportData[]> {
    const startTime = Date.now()
    
    // 少し時間をかけてAPIコールをシミュレート
    await new Promise(resolve => setTimeout(resolve, 1))
    
    // レスポンス時間を記録
    const responseTime = Date.now() - startTime
    this.responseTimes.push(responseTime)
    
    // モックデータを返す
    return [
      {
        area: '稚内市中央',
        start_time: '2024-01-01T09:00:00Z',
        end_time: '2024-01-01T12:00:00Z'
      }
    ]
  }

  validateApiResponse(response: ApiResponse): boolean {
    if (!response.success && response.statusCode >= 400) {
      return false
    }
    return response.success === true
  }

  hasCorrectResponseFormat(response: any): boolean {
    return (
      typeof response === 'object' &&
      typeof response.success === 'boolean' &&
      typeof response.statusCode === 'number' &&
      (response.data !== undefined || response.error !== undefined)
    )
  }

  getLastResponseTime(): number {
    return this.responseTimes[this.responseTimes.length - 1] || 0
  }

  getAverageResponseTime(): number {
    if (this.responseTimes.length === 0) return 0
    const sum = this.responseTimes.reduce((acc, time) => acc + time, 0)
    return sum / this.responseTimes.length
  }

  getResponseTimeStats(): ResponseTimeStats {
    if (this.responseTimes.length === 0) {
      return {
        min: 0,
        max: 0,
        average: 0,
        history: []
      }
    }

    return {
      min: Math.min(...this.responseTimes),
      max: Math.max(...this.responseTimes),
      average: this.getAverageResponseTime(),
      history: [...this.responseTimes]
    }
  }
}