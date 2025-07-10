/**
 * Nominatim APIへのリクエスト管理を行うコンポーザブル
 * - レート制限（1秒1リクエスト）
 * - 同時実行数制限とキューイング
 * - リクエストの重複防止
 * - リトライ機能と指数バックオフ
 * - APIリクエストのログ機能
 */
import { ref } from 'vue'
import { logApiRequest } from '~/utils/apiMonitor'

/**
 * リクエストを追跡する構造
 */
interface PendingRequest {
  promise: Promise<any>
  controller: AbortController
}

/**
 * キューイングされたリクエストの構造
 */
interface QueuedRequest {
  url: string
  area: string
  resolve: (value: any) => void
  reject: (reason?: any) => void
  controller: AbortController
}

/**
 * Nominatim APIへのリクエスト管理を提供するコンポーザブル
 */
export function useGeocodingApi() {
  // 最後のリクエスト時間を追跡
  const lastRequestTime = ref(0)
  
  // 進行中のリクエストを追跡
  const pendingRequests = ref<Record<string, PendingRequest>>({})
  
  // リクエストキュー
  const requestQueue = ref<QueuedRequest[]>([])
  
  // 同時実行数制限（最大2リクエスト）
  const MAX_CONCURRENT_REQUESTS = 2
  
  // 現在実行中のリクエスト数
  const activeRequestCount = ref(0)
  
  // APIリクエストの統計情報
  const stats = ref({
    totalRequests: 0,
    successRequests: 0,
    failedRequests: 0,
    retries: 0,
    totalLatency: 0,
    queuedRequests: 0
  })
  
  /**
   * キューから次のリクエストを処理
   */
  const processQueue = async () => {
    if (activeRequestCount.value >= MAX_CONCURRENT_REQUESTS || requestQueue.value.length === 0) {
      return
    }
    
    const queuedRequest = requestQueue.value.shift()
    if (!queuedRequest) return
    
    stats.value.queuedRequests--
    activeRequestCount.value++
    
    try {
      const result = await executeRequest(queuedRequest.url, queuedRequest.area, queuedRequest.controller)
      queuedRequest.resolve(result)
    } catch (error) {
      queuedRequest.reject(error)
    } finally {
      activeRequestCount.value--
      // 次のリクエストを処理
      setTimeout(processQueue, 100)
    }
  }
  
  /**
   * 実際のHTTPリクエストを実行
   */
  const executeRequest = async (url: string, area: string, controller: AbortController): Promise<any> => {
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime.value
    
    // 1秒に1リクエスト制限を適用
    if (timeSinceLastRequest < 1000 && lastRequestTime.value > 0) {
      const delay = 1000 - timeSinceLastRequest
      console.debug(`[GeoApi] Rate limiting in effect. Waiting ${delay}ms`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
    
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
        
        // 10秒タイムアウトを設定（デフォルトは無制限のため）
        const timeout = setTimeout(() => {
          controller.abort()
        }, 10000)
        
        const response = await fetch(url, { signal: controller.signal })
        clearTimeout(timeout)
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
        stats.value.successRequests++
        return data
      } catch (error) {
        const duration = Date.now() - startTime
        
        if (process.env.NODE_ENV !== 'production') {
          logApiRequest('GET', url, error instanceof Error ? error.message : 'Error', duration)
        }
        
        if (attempt === maxRetries) {
          stats.value.failedRequests++
          throw error
        }
        console.warn(`[GeoApi] Request failed, will retry: ${error}`)
      }
    }
  }

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
      return pendingRequests.value[area].promise
    }
    
    const controller = new AbortController()
    
    const requestPromise = new Promise<any>((resolve, reject) => {
      // 同時実行数制限チェック
      if (activeRequestCount.value >= MAX_CONCURRENT_REQUESTS) {
        // キューに追加
        console.debug(`[GeoApi] Queueing request for ${area} (queue size: ${requestQueue.value.length + 1})`)
        stats.value.queuedRequests++
        requestQueue.value.push({
          url,
          area,
          resolve,
          reject,
          controller
        })
        return
      }
      
      // 即座に実行
      activeRequestCount.value++
      executeRequest(url, area, controller)
        .then(resolve)
        .catch(reject)
        .finally(() => {
          activeRequestCount.value--
          // 次のリクエストを処理
          setTimeout(processQueue, 100)
        })
    })
    
    pendingRequests.value[area] = { promise: requestPromise, controller }
    
    // リクエスト完了後にpendingRequestsから削除
    requestPromise.finally(() => {
      delete pendingRequests.value[area]
    })
    
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
      try {
        pendingRequests.value[area].controller.abort()
      } catch (err) {
        console.warn('[GeoApi] Error aborting request:', err)
      }
      delete pendingRequests.value[area]
      return true
    }
    return false
  }
  
  /**
   * すべてのリクエストをキャンセル
   */
  const cancelAllRequests = () => {
    // 進行中のリクエストをキャンセル
    Object.keys(pendingRequests.value).forEach(area => {
      cancelRequest(area)
    })
    
    // キューをクリア
    requestQueue.value.forEach(req => {
      try {
        req.controller.abort()
        req.reject(new Error('Request cancelled'))
      } catch (err) {
        console.warn('[GeoApi] Error aborting queued request:', err)
      }
    })
    requestQueue.value = []
    stats.value.queuedRequests = 0
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
      pendingRequests: getPendingRequestsCount(),
      activeRequests: activeRequestCount.value,
      queueLength: requestQueue.value.length
    }
  }

  return { 
    fetchWithRateLimit,
    getPendingRequestsCount,
    cancelRequest,
    cancelAllRequests,
    getStats
  }
}
