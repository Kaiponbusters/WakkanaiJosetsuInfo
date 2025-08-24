<template>
  <div class="p-4 bg-white rounded-lg shadow">
    <h2 class="text-lg font-bold mb-3">座標キャッシュテスト</h2>
    
    <div class="mb-4">
      <label class="block text-sm mb-1">地域名</label>
      <div class="flex">
        <input 
          v-model="areaName" 
          type="text" 
          class="flex-1 px-3 py-2 border border-gray-300 rounded-l"
          placeholder="地域名を入力"
        />
        <button 
          @click="testCoordinatesFetch" 
          class="px-4 py-2 bg-blue-500 text-white rounded-r hover:bg-blue-600"
          :disabled="loading"
        >
          {{ loading ? '取得中...' : '座標を取得' }}
        </button>
      </div>
    </div>
    
    <div v-if="result" class="mb-4">
      <h3 class="font-semibold mb-1">取得結果:</h3>
      <pre class="bg-gray-100 p-3 rounded text-sm">{{ JSON.stringify(result, null, 2) }}</pre>
    </div>
    
    <div class="mb-4">
      <h3 class="font-semibold mb-1">キャッシュ統計:</h3>
      <table class="w-full text-sm">
        <tr>
          <td class="py-1 font-medium">キャッシュサイズ:</td>
          <td>{{ stats.size }} 件</td>
        </tr>
        <tr>
          <td class="py-1 font-medium">ヒット回数:</td>
          <td>{{ stats.hits }} 回</td>
        </tr>
        <tr>
          <td class="py-1 font-medium">ミス回数:</td>
          <td>{{ stats.misses }} 回</td>
        </tr>
        <tr>
          <td class="py-1 font-medium">ヒット率:</td>
          <td>{{ stats.hitRate.toFixed(1) }}%</td>
        </tr>
      </table>
    </div>
    
    <button 
      @click="handleClearCache" 
      class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
    >
      キャッシュをクリア
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useGeocodingCache } from '~/composables/geocoding/useGeocodingCache'

const areaName = ref('')
const result = ref<any>(null)
const loading = ref(false)
const stats = ref({
  size: 0,
  hits: 0,
  misses: 0,
  hitRate: 0
})

const { getCoordinates, clearCache, getStats } = useGeocodingCache()

// 座標取得テスト
async function testCoordinatesFetch() {
  if (!areaName.value) return
  
  loading.value = true
  try {
    const coords = await getCoordinates(areaName.value)
    result.value = coords
  } catch (error) {
    result.value = { error: error instanceof Error ? error.message : String(error) }
  } finally {
    loading.value = false
    updateStats()
  }
}

// キャッシュクリア
function handleClearCache() {
  result.value = null
  clearCache()
  updateStats()
}

// 統計情報の更新
function updateStats() {
  stats.value = getStats()
}

// 初期状態で統計情報を更新
updateStats()
</script> 