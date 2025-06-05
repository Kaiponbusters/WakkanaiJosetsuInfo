<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-4">座標キャッシュテスト</h1>
    <p class="mb-6">
      地図表示機能の座標キャッシュ機能をテストするページです。このページでは、地域名から座標を取得する機能をテストできます。
      同じ地域名で複数回テストすると、2回目以降はキャッシュから取得されるため高速に結果が返ります。
    </p>
    
    <div class="grid md:grid-cols-2 gap-6">
      <div>
        <GeocodingCacheTest />
      </div>
      
      <div>
        <h2 class="text-xl font-bold mb-3">地図表示テスト</h2>
        <div class="mb-4">
          <label class="block text-sm mb-1">地域名</label>
          <div class="flex">
            <input 
              v-model="areaInputValue" 
              type="text" 
              class="flex-1 px-3 py-2 border border-gray-300 rounded-l"
              placeholder="地域名を入力"
            />
            <button 
              @click="testArea = areaInputValue" 
              class="px-4 py-2 bg-blue-500 text-white rounded-r hover:bg-blue-600"
            >
              表示
            </button>
          </div>
        </div>
        
        <SnowLocationMap v-if="testArea" :area="testArea" />
      </div>
    </div>
    
    <div class="mt-8">
      <h2 class="text-xl font-bold mb-3">使い方</h2>
      <ol class="list-decimal pl-5 space-y-2">
        <li>左側の「座標キャッシュテスト」で地域名を入力して座標を取得します。</li>
        <li>同じ地域名で再度テストして、キャッシュから取得されることを確認します（ヒット回数が増加）。</li>
        <li>右側の「地図表示テスト」で同じ地域名を入力すると、キャッシュから座標を取得して地図を表示します。</li>
        <li>「キャッシュをクリア」ボタンでキャッシュを消去すると、再度APIからデータを取得します。</li>
      </ol>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import GeocodingCacheTest from '~/components/GeocodingCacheTest.vue'
import SnowLocationMap from '~/components/SnowLocationMap.vue'

const areaInputValue = ref('')
const testArea = ref('')
</script> 