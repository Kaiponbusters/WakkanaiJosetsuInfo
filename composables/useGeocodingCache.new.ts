import { ref } from 'vue'
import { useGeocodingService } from './useGeocodingService'
import { NominatimProvider } from '../providers/NominatimProvider'
import { TokenBucketRateLimiter } from '../utils/TokenBucketRateLimiter'

/**
 * 座標情報の型定義 (既存との互換性)
 */
export interface Coordinates {
  lat: number
  lng: number
}

/**
 * 既存のuseGeocodingCacheとの互換インターフェース
 * 新しいレート制限機能付きサービスを内部で使用
 */
export function useGeocodingCache() {
  // 新しいサービスのインスタンス作成
  const provider = new NominatimProvider({
    userAgent: 'WakkanaiJosetsuSystem/1.0 (https://github.com/Kaiponbusters/WakkanaiJosetsuInfo)'
  })
  
  const rateLimiter = new TokenBucketRateLimiter({
    maxTokens: 1,
    refillRate: 1000 // 1秒に1リクエスト
  })

  const service = useGeocodingService(provider, rateLimiter)

  // デバッグ用: キャッシュヒット回数とミス回数を追跡
  const stats = ref({
    hits: 0,
    misses: 0
  })

  /**
   * 座標情報をキャッシュから取得、なければAPIから取得してキャッシュする
   * @param area 地域名
   * @returns 座標情報
   */
  const getCoordinates = async (area: string): Promise<Coordinates> => {
    try {
      const result = await service.geocode(area)
      
      // 統計情報を更新
      if (result.source === 'cache') {
        stats.value.hits++
      } else {
        stats.value.misses++
      }
      
      return result.coordinates
    } catch (error) {
      stats.value.misses++
      throw error
    }
  }

  /**
   * キャッシュをクリアする
   */
  const clearCache = () => {
    service.clearCache()
    service.resetMetrics()
    stats.value = { hits: 0, misses: 0 }
  }

  /**
   * キャッシュの統計情報を取得
   */
  const getStats = () => {
    const metrics = service.getMetrics()
    
    return {
      hits: stats.value.hits,
      misses: stats.value.misses,
      size: metrics.requests.total - metrics.requests.failed,
      hitRate: stats.value.hits + stats.value.misses > 0
        ? (stats.value.hits / (stats.value.hits + stats.value.misses)) * 100
        : 0
    }
  }

  return {
    getCoordinates,
    clearCache,
    getStats
  }
}