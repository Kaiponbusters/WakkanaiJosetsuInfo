/**
 * Nominatim APIへのリクエスト管理を行うコンポーザブル
 * - レート制限（1秒1リクエスト）
 * - リクエストの重複防止
 * - リトライ機能と指数バックオフ
 * - APIリクエストのログ機能
 */
import { ref } from 'vue'
import { logApiRequest } from '~/utils/apiMonitor'

/**
 * Nominatim APIへのリクエスト管理を提供するコンポーザブル
 */
export function useGeocodingApi() {
  // 最後のリクエスト時間を追跡
  const lastRequestTime = ref(0)
  
  // 進行中のリクエストを追跡
  const pendingRequests = ref<Record<string, Promise<any>>>({})
  
  // APIリクエストの統計情報
  const stats = ref({
    totalRequests: 0,
    successRequests: 0,
    failedRequests: 0,
    retries: 0,
    totalLatency: 0
  })
  
  /**
   * レート制限付きfetch関数
   * @param url リクエストURL
   * @param area 地域名（リクエスト識別子として使用）
   * @returns レスポンスデータのPromise
   */
  const fetchWithRateLimit = async (url: string, area: string): Promise<any> => {
    stats.value.totalRequests++
    
    // 既に同じエリアへのリクエストが進行中なら、それを返す
    if (area in pendingRequests.value) {
      console.debug(`[GeoApi] Reusing in-flight request for ${area}`)
      return pendingRequests.value[area]
    }
    
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime.value
    
    // 1秒に1リクエスト制限を適用
    if (timeSinceLastRequest < 1000 && lastRequestTime.value > 0) {
      const delay = 1000 - timeSinceLastRequest
      console.debug(`[GeoApi] Rate limiting in effect. Waiting ${delay}ms`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
    
    const requestPromise = (async () => {
      // リトライ回数とバックオフ設定
      const maxRetries = 3
      let currentDelay = 1000  // 初回は1秒待機
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        let startTime = Date.now()
        
        try {
          if (attempt > 0) {
            stats.value.retries++
            console.debug(`[GeoApi] Retry attempt ${attempt} for ${area}`)
            await new Promise(resolve => setTimeout(resolve, currentDelay))
            currentDelay *= 2  // 指数バックオフ
            startTime = Date.now() // リトライ待機後の時間を測定開始点とする
          }
          
          lastRequestTime.value = Date.now()
          const response = await fetch(url)
          const duration = Date.now() - startTime
          
          // 開発環境では詳細ログを表示
          if (process.env.NODE_ENV !== 'production') {
            logApiRequest('GET', url, response.status, duration)
          }
          
          stats.value.totalLatency += duration
          
          if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`)
          }
          
          const data = await response.json()
          delete pendingRequests.value[area]
          stats.value.successRequests++
          return data
        } catch (error) {
          const duration = Date.now() - startTime
          
          if (process.env.NODE_ENV !== 'production') {
            logApiRequest('GET', url, error instanceof Error ? error.message : 'Error', duration)
          }
          
          if (attempt === maxRetries) {
            delete pendingRequests.value[area]
            stats.value.failedRequests++
            throw error
          }
          console.warn(`[GeoApi] Request failed, will retry: ${error}`)
        }
      }
    })()
    
    pendingRequests.value[area] = requestPromise
    return requestPromise
  }

  /**
   * 現在進行中のリクエスト数を取得
   */
  const getPendingRequestsCount = () => {
    return Object.keys(pendingRequests.value).length
  }
  
  /**
   * 特定の進行中リクエストをキャンセル
   * @param area 地域名
   */
  const cancelRequest = (area: string) => {
    if (area in pendingRequests.value) {
      delete pendingRequests.value[area]
      return true
    }
    return false
  }
  
  /**
   * APIリクエストの統計情報を取得
   */
  const getStats = () => {
    return {
      ...stats.value,
      avgLatency: stats.value.totalRequests > 0 
        ? stats.value.totalLatency / stats.value.totalRequests 
        : 0,
      successRate: stats.value.totalRequests > 0 
        ? (stats.value.successRequests / stats.value.totalRequests) * 100 
        : 0,
      pendingRequests: getPendingRequestsCount()
    }
  }

  return { 
    fetchWithRateLimit,
    getPendingRequestsCount,
    cancelRequest,
    getStats
  }
} 