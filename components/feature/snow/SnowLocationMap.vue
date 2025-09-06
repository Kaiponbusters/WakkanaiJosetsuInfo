<template>
  <div class="snow-location-map" data-testid="snow-location-map">
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
          </div>
        </div>
      </div>
    </div>

    <!-- 地図コンテナ（クライアント限定） -->
    <ClientOnly>
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
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useGeocodingCache, type Coordinates } from '~/composables/geocoding/useGeocodingCache'

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

// エラーハンドリング状態
const showError = ref(false)
const errorMessage = ref('')

// キャッシュ機能
const { getCoordinates } = useGeocodingCache()

/**
 * エラーメッセージの分類と表示
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
 * 地図の再読み込み
 */
const retryLoad = async () => {
  showError.value = false
  errorMessage.value = ''
  await loadMapData()
}

/**
 * 座標データの取得とエラーハンドリング
 */
const loadMapData = async (): Promise<Coordinates | null> => {
  if (!props.area) return null
  
  isLoading.value = true
  
  try {
    const coordinates = await getCoordinates(props.area)
    return coordinates
  } catch (error) {
    showError.value = true
    errorMessage.value = error instanceof Error ? getErrorMessage(error.message) : '不明なエラーが発生しました'
    return null
  } finally {
    isLoading.value = false
  }
}

/**
 * Leaflet地図の初期化
 */
const initializeLeafletMap = async (lat: number, lng: number) => {
  // Leafletの動的インポート（修正版）
  let L: any
  try {
    const leafletModule = await import('leaflet')
    L = leafletModule.default || leafletModule
  } catch (error) {
    console.error('[SnowLocationMap] Failed to import Leaflet:', error)
    throw new Error('地図ライブラリの読み込みに失敗しました')
  }
  // CSS import is handled by Nuxt configuration
  
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

  // 初期化直後にサイズ再計算（非表示初期化対策）
  await nextTick()
  if (map.value) {
    map.value.invalidateSize(true)
  }
}

/**
 * 地図の初期化処理
 */
const initializeMap = async () => {
  if (isMapInitialized.value) return
  
  const result = await loadMapData()
  if (!result) return
  
  try {
    await initializeLeafletMap(result.lat, result.lng)
    isMapInitialized.value = true
    // 可視化直後の再計算
    await nextTick()
    if (map.value) {
      map.value.invalidateSize(true)
    }
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
      map.value.setView([result.lat, result.lng], 15)
      
      // マーカーを更新
      if (marker.value) {
        marker.value.setLatLng([result.lat, result.lng])
        marker.value.bindPopup(`${props.area}<br/>緯度: ${result.lat}<br/>経度: ${result.lng}`)
      }

      // 更新後にサイズ再計算（親の表示状態変化等に対応）
      map.value.invalidateSize(true)
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

// エラー解除等で再表示された際に再計算
watch(() => showError.value, async (newVal, oldVal) => {
  if (oldVal === true && newVal === false && isMapInitialized.value) {
    await nextTick()
    if (map.value) {
      map.value.invalidateSize(true)
    }
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

.retry-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  background: #3182ce;
  color: white;
}

.retry-btn:hover:not(:disabled) {
  background: #2c5aa0;
}

.retry-btn:disabled {
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
  
  .retry-btn {
    width: 100%;
  }
}
</style>