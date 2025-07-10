<template>
  <div class="snow-location-map">
    <!-- 地図読み込みボタン（遅延読み込み機能） -->
    <div v-if="!isMapInitialized && !autoLoad" class="map-placeholder">
      <div class="placeholder-content">
        <div class="placeholder-icon">📍</div>
        <p class="placeholder-text">{{ area }}の地図を読み込む</p>
        <button 
          @click="initializeMap" 
          :disabled="isLoading"
          class="load-map-btn"
        >
          {{ isLoading ? '読み込み中...' : '地図を表示' }}
        </button>
      </div>
    </div>

    <!-- 警告バナー（フォールバック使用時） -->
    <div 
      v-if="showWarningBanner && isMapInitialized" 
      class="warning-banner"
    >
      <div class="warning-content">
        <span class="warning-icon">⚠️</span>
        <span class="warning-text">{{ warningMessage }}</span>
        <button 
          @click="dismissWarning" 
          class="dismiss-btn"
          aria-label="警告を閉じる"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- エラー表示（API障害時） -->
    <div v-if="showError && isMapInitialized" class="error-display">
      <div class="error-content">
        <div class="error-header">
          <span class="error-icon">🚫</span>
          <h3 class="error-title">位置情報の取得に問題があります</h3>
        </div>
        
        <div class="error-details">
          <p class="error-message">{{ getErrorMessage(errorMessage) }}</p>
          
          <div class="error-actions">
            <button 
              @click="retryLoad" 
              :disabled="isLoading"
              class="retry-btn"
            >
              {{ isLoading ? '再試行中...' : '再読み込み' }}
            </button>
            
            <button 
              @click="showApproximateLocation" 
              :disabled="isLoading"
              class="fallback-btn"
            >
              概算位置で表示
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 地図コンテナ -->
    <div 
      v-show="isMapInitialized && !showError"
      ref="mapContainer" 
      class="map-container"
      :class="{ 'map-loading': isLoading }"
    ></div>

    <!-- ローディング表示 -->
    <div v-if="isLoading && isMapInitialized" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p class="loading-text">地図を読み込んでいます...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useGeocodingCache, type CoordinateResult } from '~/composables/useGeocodingCache'

interface Props {
  area: string
  autoLoad?: boolean // 自動読み込みフラグ（デフォルト: true）
}

const props = withDefaults(defineProps<Props>(), {
  autoLoad: true
})

// 地図とUI状態管理
const mapContainer = ref<HTMLElement>()
const isMapInitialized = ref(false)
const isLoading = ref(false)
const map = ref<any>(null)
const marker = ref<any>(null)

// エラーハンドリング状態（TDD設計通り）
const showError = ref(false)
const errorMessage = ref('')
const warningMessage = ref('')
const showWarningBanner = ref(false)

// キャッシュ機能
const { getCoordinates } = useGeocodingCache()

/**
 * TDD設計：エラーメッセージの分類と表示
 */
const getErrorMessage = (rawError: string): string => {
  if (rawError.includes('timeout') || rawError.includes('TIMEOUT')) {
    return '位置情報サービスの応答が遅延しています。ネットワーク接続を確認してください。'
  }
  if (rawError.includes('Failed to fetch') || rawError.includes('network')) {
    return 'インターネット接続に問題があります。接続を確認して再試行してください。'
  }
  if (rawError.includes('rate limit') || rawError.includes('429')) {
    return '位置情報サービスが一時的に利用できません。しばらく待ってから再試行してください。'
  }
  return `位置情報の取得中にエラーが発生しました: ${rawError}`
}

/**
 * TDD設計：警告バナーを閉じる
 */
const dismissWarning = () => {
  showWarningBanner.value = false
}

/**
 * TDD設計：地図の再読み込み
 */
const retryLoad = async () => {
  showError.value = false
  errorMessage.value = ''
  await loadMapData()
}

/**
 * TDD設計：概算位置での表示
 */
const showApproximateLocation = async () => {
  showError.value = false
  await loadMapData()
}

/**
 * 座標データの取得とエラーハンドリング（TDD設計）
 */
const loadMapData = async (): Promise<CoordinateResult | null> => {
  if (!props.area) return null
  
  isLoading.value = true
  
  try {
    const result = await getCoordinates(props.area)
    
    // TDD設計：エラー情報の処理
    if (result.warningMessage) {
      warningMessage.value = result.warningMessage
      showWarningBanner.value = true
    }
    
    if (result.errorMessage) {
      errorMessage.value = result.errorMessage
      showError.value = result.isFallbackUsed
    }
    
    return result
  } catch (error) {
    // 完全にフォールバックが失敗した場合
    showError.value = true
    errorMessage.value = error instanceof Error ? error.message : '不明なエラーが発生しました'
    return null
  } finally {
    isLoading.value = false
  }
}

/**
 * Leaflet地図の初期化
 */
const initializeLeafletMap = async (lat: number, lng: number) => {
  // Leafletの動的インポート（サーバーサイドレンダリング対応）
  const L = await import('leaflet').then(m => m.default || m)
  await import('leaflet/dist/leaflet.css')
  
  await nextTick()
  
  if (!mapContainer.value) {
    throw new Error('Map container not found')
  }
  
  // 既存の地図をクリーンアップ
  if (map.value) {
    map.value.remove()
  }
  
  // 地図を初期化
  map.value = L.map(mapContainer.value).setView([lat, lng], 15)
  
  // タイルレイヤーを追加
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map.value)
  
  // マーカーを追加
  if (marker.value) {
    marker.value.remove()
  }
  
  marker.value = L.marker([lat, lng])
    .addTo(map.value)
    .bindPopup(`${props.area}<br/>緯度: ${lat}<br/>経度: ${lng}`)
    .openPopup()
}

/**
 * 地図の初期化処理
 */
const initializeMap = async () => {
  if (isMapInitialized.value) return
  
  const result = await loadMapData()
  if (!result) return
  
  try {
    await initializeLeafletMap(result.coordinates.lat, result.coordinates.lng)
    isMapInitialized.value = true
  } catch (error) {
    console.error('[SnowLocationMap] Error initializing map:', error)
    showError.value = true
    errorMessage.value = '地図の初期化に失敗しました'
  }
}

/**
 * 地図の更新（エリア変更時）
 */
const updateMap = async () => {
  if (!isMapInitialized.value) return
  
  const result = await loadMapData()
  if (!result) return
  
  try {
    // 地図の中心を更新
    if (map.value) {
      map.value.setView([result.coordinates.lat, result.coordinates.lng], 15)
      
      // マーカーを更新
      if (marker.value) {
        marker.value.setLatLng([result.coordinates.lat, result.coordinates.lng])
        marker.value.bindPopup(`${props.area}<br/>緯度: ${result.coordinates.lat}<br/>経度: ${result.coordinates.lng}`)
      }
    }
  } catch (error) {
    console.error('[SnowLocationMap] Error updating map:', error)
    showError.value = true
    errorMessage.value = '地図の更新に失敗しました'
  }
}

// エリア変更の監視
watch(() => props.area, async (newArea, oldArea) => {
  if (newArea !== oldArea && newArea) {
    if (isMapInitialized.value) {
      await updateMap()
    } else if (props.autoLoad) {
      await initializeMap()
    }
  }
})

// ライフサイクル
onMounted(() => {
  if (props.autoLoad && props.area) {
    initializeMap()
  }
})

onBeforeUnmount(() => {
  // Leaflet地図のクリーンアップ
  if (map.value) {
    map.value.remove()
    map.value = null
  }
  if (marker.value) {
    marker.value = null
  }
})
</script>

<style scoped>
.snow-location-map {
  position: relative;
  width: 100%;
  min-height: 300px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 地図プレースホルダー */
.map-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border: 2px dashed #cbd5e0;
}

.placeholder-content {
  text-align: center;
  color: #4a5568;
}

.placeholder-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.placeholder-text {
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  color: #2d3748;
}

.load-map-btn {
  background: #3182ce;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.load-map-btn:hover:not(:disabled) {
  background: #2c5aa0;
  transform: translateY(-1px);
}

.load-map-btn:disabled {
  background: #a0aec0;
  cursor: not-allowed;
}

/* 警告バナー */
.warning-banner {
  background: linear-gradient(90deg, #fed7d7 0%, #feb2b2 100%);
  border-left: 4px solid #e53e3e;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
}

.warning-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.warning-icon {
  font-size: 1.25rem;
  margin-right: 0.5rem;
}

.warning-text {
  flex: 1;
  color: #742a2a;
  font-weight: 500;
}

.dismiss-btn {
  background: none;
  border: none;
  color: #742a2a;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
}

.dismiss-btn:hover {
  background: rgba(116, 42, 42, 0.1);
}

/* エラー表示 */
.error-display {
  background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
  border: 1px solid #fc8181;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 0.5rem 0;
}

.error-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
}

.error-icon {
  font-size: 1.5rem;
  margin-right: 0.5rem;
}

.error-title {
  color: #742a2a;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.error-message {
  color: #742a2a;
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

.error-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.retry-btn, .fallback-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn {
  background: #3182ce;
  color: white;
}

.retry-btn:hover:not(:disabled) {
  background: #2c5aa0;
}

.fallback-btn {
  background: #38a169;
  color: white;
}

.fallback-btn:hover:not(:disabled) {
  background: #2f855a;
}

.retry-btn:disabled, .fallback-btn:disabled {
  background: #a0aec0;
  cursor: not-allowed;
}

/* 地図コンテナ */
.map-container {
  width: 100%;
  height: 300px;
  position: relative;
}

.map-loading {
  opacity: 0.7;
}

/* ローディング表示 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-left: 4px solid #3182ce;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  margin-top: 1rem;
  color: #4a5568;
  font-size: 0.875rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* レスポンシブ対応 */
@media (max-width: 640px) {
  .error-actions {
    flex-direction: column;
  }
  
  .retry-btn, .fallback-btn {
    width: 100%;
  }
  
  .warning-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .dismiss-btn {
    align-self: flex-end;
  }
}
</style>