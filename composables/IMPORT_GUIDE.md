# Composables Import ガイド

## 基本的なImport方法

### 1. 通知関連 Composables

```typescript
// 通知管理
import { useNotificationManager } from '~/composables/notifications'

// 使用例
const { createNotification, notifications } = useNotificationManager()

// 通知履歴
import { useNotificationHistoryService } from '~/composables/notifications'

// 使用例
const { getHistory, clearHistory } = useNotificationHistoryService()

// 通知ストレージ
import { useNotificationStorage } from '~/composables/notifications'

// 使用例
const { saveNotification, loadNotifications } = useNotificationStorage()
```

### 2. 地理情報関連 Composables

```typescript
// ジオコーディングサービス
import { useGeocodingService } from '~/composables/geocoding'

// 使用例
const { geocode, reverseGeocode, isLoading } = useGeocodingService()

// ジオコーディングキャッシュ
import { useGeocodingCache } from '~/composables/geocoding'

// 使用例
const { getCachedResult, setCachedResult } = useGeocodingCache()

// Leaflet地図
import { useLeafletMap } from '~/composables/geocoding'

// 使用例
const { initMap, addMarker, setView } = useLeafletMap()
```

### 3. フォーム関連 Composables

```typescript
// 除雪報告フォーム
import { useSnowReportForm } from '~/composables/forms'

// 使用例
const { 
  formData, 
  validateForm, 
  submitForm, 
  isValid 
} = useSnowReportForm()
```

### 4. UI関連 Composables

```typescript
// ローディング状態管理
import { useLoadingState } from '~/composables/ui'

// 使用例
const { 
  isLoading, 
  startLoading, 
  stopLoading, 
  withLoading 
} = useLoadingState()
```

### 5. 共通ユーティリティ

```typescript
// エラーハンドリング
import { useErrorHandler } from '~/composables/useErrorHandler'

// 使用例
const { handleError, clearErrors, errors } = useErrorHandler()
```

## 複数Composableの同時Import

### 通知関連をまとめてImport

```typescript
import { 
  useNotificationManager,
  useNotificationHistoryService,
  useNotificationStorage,
  useNotificationErrorHandler,
  useNotificationLogger
} from '~/composables/notifications'
```

### 地理情報関連をまとめてImport

```typescript
import { 
  useGeocodingService,
  useGeocodingCache,
  useLeafletMap
} from '~/composables/geocoding'
```

## Vue コンポーネントでの使用例

### 通知機能を使用するコンポーネント

```vue
<template>
  <div>
    <button @click="showNotification">通知を表示</button>
    <div v-for="notification in notifications" :key="notification.id">
      {{ notification.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNotificationManager } from '~/composables/notifications'

const { createNotification, notifications } = useNotificationManager()

const showNotification = () => {
  createNotification({
    type: 'success',
    message: '操作が完了しました',
    duration: 3000
  })
}
</script>
```

### 地図機能を使用するコンポーネント

```vue
<template>
  <div>
    <div ref="mapContainer" class="map-container"></div>
    <button @click="searchLocation">住所を検索</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useLeafletMap, useGeocodingService } from '~/composables/geocoding'

const mapContainer = ref<HTMLElement>()
const { initMap, addMarker } = useLeafletMap()
const { geocode, isLoading } = useGeocodingService()

onMounted(() => {
  if (mapContainer.value) {
    initMap(mapContainer.value)
  }
})

const searchLocation = async () => {
  try {
    const result = await geocode('稚内市中央3丁目')
    if (result) {
      addMarker(result.lat, result.lng, '検索結果')
    }
  } catch (error) {
    console.error('住所検索エラー:', error)
  }
}
</script>
```

### フォームを使用するコンポーネント

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <input 
      v-model="formData.location" 
      placeholder="除雪場所"
      :class="{ 'error': !isValid }"
    />
    <button 
      type="submit" 
      :disabled="isLoading || !isValid"
    >
      {{ isLoading ? '送信中...' : '報告する' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { useSnowReportForm } from '~/composables/forms'
import { useLoadingState } from '~/composables/ui'

const { formData, validateForm, submitForm, isValid } = useSnowReportForm()
const { isLoading, withLoading } = useLoadingState()

const handleSubmit = async () => {
  if (!validateForm()) return
  
  await withLoading(async () => {
    await submitForm()
  })
}
</script>
```

## TypeScript型定義の活用

### 型安全なImport

```typescript
// 型も一緒にImport
import type { NotificationOptions } from '~/composables/notifications'
import { useNotificationManager } from '~/composables/notifications'

const { createNotification } = useNotificationManager()

// 型安全な使用
const options: NotificationOptions = {
  type: 'info',
  message: 'お知らせ',
  duration: 5000
}

createNotification(options)
```

## エラーハンドリングのベストプラクティス

### 共通エラーハンドリングとの組み合わせ

```typescript
import { useErrorHandler } from '~/composables/useErrorHandler'
import { useGeocodingService } from '~/composables/geocoding'

const { handleError } = useErrorHandler()
const { geocode } = useGeocodingService()

const searchWithErrorHandling = async (address: string) => {
  try {
    const result = await geocode(address)
    return result
  } catch (error) {
    handleError(error, '住所検索に失敗しました')
    return null
  }
}
```

## パフォーマンス最適化

### 必要なComposableのみをImport

```typescript
// ❌ 悪い例: 使わない機能もImport
import { 
  useNotificationManager,
  useNotificationHistoryService,  // 使わない
  useNotificationStorage,         // 使わない
  useNotificationErrorHandler,    // 使わない
  useNotificationLogger          // 使わない
} from '~/composables/notifications'

// ✅ 良い例: 必要な機能のみImport
import { useNotificationManager } from '~/composables/notifications'
```

### 動的Import（必要に応じて）

```typescript
// 重い処理を含むComposableは動的Import
const loadMapFeatures = async () => {
  const { useLeafletMap } = await import('~/composables/geocoding')
  return useLeafletMap()
}
```

## トラブルシューティング

### よくあるImportエラー

1. **モジュールが見つからない**
   ```
   Error: Cannot resolve module '~/composables/notifications'
   ```
   → `index.ts`ファイルが存在することを確認

2. **型エラー**
   ```
   Error: Property 'createNotification' does not exist
   ```
   → 正しいComposable名でImportしているか確認

3. **循環参照エラー**
   ```
   Error: Circular dependency detected
   ```
   → Composable間の依存関係を見直し

### デバッグ方法

```typescript
// Composableの内容を確認
import * as notifications from '~/composables/notifications'
console.log('Available composables:', Object.keys(notifications))
```

## 今後の拡張

新しい機能領域が追加される場合は、以下の手順で新しいサブディレクトリを作成してください：

1. 新しいサブディレクトリを作成
2. `index.ts`ファイルを作成してexportを定義
3. このガイドを更新
4. 関連するテストファイルを作成

例：
```bash
mkdir composables/auth
touch composables/auth/index.ts
touch composables/auth/useAuth.ts
touch composables/auth/useAuth.test.ts
```