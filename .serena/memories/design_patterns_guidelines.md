# デザインパターンとアーキテクチャガイドライン

## 関心の分離原則

### UIコンポーネント設計
```typescript
// ✅ 良い例：UIロジックのみに集中
<template>
  <button @click="handleSubmit" :disabled="isLoading">
    {{ isLoading ? '送信中...' : '送信' }}
  </button>
</template>

<script setup lang="ts">
// ビジネスロジックはComposableに委譲
const { isLoading, handleSubmit } = useSnowReportForm()
</script>
```

### Composables設計パターン
```typescript
// ✅ 推奨：機能別分離
// composables/notifications/useNotificationManager.ts
export function useNotificationManager() {
  // 通知管理ロジックのみ
}

// composables/geocoding/useGeocodingService.ts  
export function useGeocodingService() {
  // ジオコーディングロジックのみ
}
```

## 状態管理パターン

### ローカル vs グローバル状態
```typescript
// ローカル状態（単一コンポーネント）
const isLoading = ref(false)
const formData = reactive({ name: '', location: '' })

// グローバル状態（複数コンポーネント共有）
const user = useState('user', () => null)
const notifications = useState('notifications', () => [])

// 永続化状態（localStorage連携）
const { cachedData, setCachedData } = useGeocodingCache()
```

### エラーハンドリングパターン
```typescript
// ✅ 推奨：統一されたエラーハンドリング
export function useApiCall() {
  const { handleError } = useErrorHandler()
  const { setLoading, setError } = useLoadingState()
  
  const fetchData = async () => {
    try {
      setLoading(true)
      const result = await apiCall()
      return result
    } catch (error) {
      const friendlyMessage = 'データ取得に失敗しました'
      handleError(error, friendlyMessage)
      setError(friendlyMessage)
    } finally {
      setLoading(false)
    }
  }
  
  return { fetchData }
}
```

## レイヤー分離アーキテクチャ

### 1. プレゼンテーション層（components/）
```vue
<!-- ✅ UI表示・操作のみ -->
<template>
  <div class="map-container" ref="mapContainer">
    <LoadingSpinner v-if="isLoading" />
    <ErrorMessage v-if="error" :message="error" />
  </div>
</template>

<script setup lang="ts">
// UIロジックのみ、ビジネスロジックは含まない
const { mapContainer, isLoading, error } = useLeafletMap()
</script>
```

### 2. ビジネスロジック層（composables/）
```typescript
// ✅ 再利用可能なビジネスロジック
export function useSnowReportForm() {
  const formData = ref<SnowReportData>({})
  const { validateSnowReport } = useFormValidation()
  const { submitSnowReport } = useSnowReportApi()
  
  const submitForm = async () => {
    if (!validateSnowReport(formData.value)) {
      throw new Error('バリデーションエラー')
    }
    return await submitSnowReport(formData.value)
  }
  
  return { formData, submitForm }
}
```

### 3. データアクセス層（server/api/）
```typescript
// ✅ データの永続化・取得
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const supabase = useSupabaseServiceRole()
  
  const { data, error } = await supabase
    .from('snow_reports')
    .insert(body)
    
  if (error) throw createError({
    statusCode: 500,
    statusMessage: 'データ登録に失敗しました'
  })
  
  return data
})
```

### 4. ユーティリティ層（utils/）
```typescript
// ✅ 純粋関数によるデータ変換
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
```

## 依存性注入パターン

### Composableの依存性管理
```typescript
// ✅ 依存関係の明確化
export function useNotificationWithErrorHandling() {
  // 他のComposableに依存
  const { createNotification } = useNotificationManager()
  const { handleError } = useErrorHandler()
  
  const notifyWithErrorHandling = async (action: () => Promise<void>) => {
    try {
      await action()
      createNotification({
        type: 'success',
        message: '操作が完了しました'
      })
    } catch (error) {
      handleError(error)
      createNotification({
        type: 'error', 
        message: '操作に失敗しました'
      })
    }
  }
  
  return { notifyWithErrorHandling }
}
```

## ファクトリーパターン

### コンポーネントファクトリー
```typescript
// ✅ 設定に基づくコンポーネント生成
export function createMapComponent(config: MapConfig) {
  return defineComponent({
    setup() {
      const { initMap } = useLeafletMap(config)
      return { initMap }
    }
  })
}

// 使用例
const SnowMap = createMapComponent({
  center: [45.4167, 141.6833], // 稚内市
  zoom: 13,
  markers: true
})
```

## オブザーバーパターン

### リアルタイム通知システム
```typescript
// ✅ Supabaseリアルタイムとオブザーバーパターン
export function useRealtimeNotifications() {
  const notifications = ref<Notification[]>([])
  const supabase = useSupabaseClient()
  
  // オブザーバー登録
  const subscribe = () => {
    return supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      }, (payload) => {
        notifications.value.push(payload.new as Notification)
      })
      .subscribe()
  }
  
  return { notifications, subscribe }
}
```

## コマンドパターン

### アクション管理
```typescript
// ✅ アクションの抽象化
interface Command {
  execute(): Promise<void>
  undo?(): Promise<void>
}

class CreateSnowReportCommand implements Command {
  constructor(
    private data: SnowReportData,
    private api: SnowReportApi
  ) {}
  
  async execute() {
    await this.api.create(this.data)
  }
  
  async undo() {
    await this.api.delete(this.data.id)
  }
}

export function useCommandManager() {
  const history: Command[] = []
  
  const executeCommand = async (command: Command) => {
    await command.execute()
    history.push(command)
  }
  
  const undoLastCommand = async () => {
    const lastCommand = history.pop()
    if (lastCommand?.undo) {
      await lastCommand.undo()
    }
  }
  
  return { executeCommand, undoLastCommand }
}
```

## シングルトンパターン

### グローバル設定管理
```typescript
// ✅ アプリケーション設定のシングルトン
class AppConfig {
  private static instance: AppConfig
  private config: Record<string, any> = {}
  
  static getInstance(): AppConfig {
    if (!AppConfig.instance) {
      AppConfig.instance = new AppConfig()
    }
    return AppConfig.instance
  }
  
  setConfig(key: string, value: any) {
    this.config[key] = value
  }
  
  getConfig(key: string) {
    return this.config[key]
  }
}

export const useAppConfig = () => AppConfig.getInstance()
```

## アダプターパターン

### 外部API統合
```typescript
// ✅ 外部APIの抽象化
interface GeocodingProvider {
  geocode(address: string): Promise<Coordinates>
}

class NominatimAdapter implements GeocodingProvider {
  async geocode(address: string): Promise<Coordinates> {
    // Nominatim API固有の実装
    const response = await fetch(`/nominatim?q=${address}`)
    const data = await response.json()
    return { lat: data[0].lat, lng: data[0].lon }
  }
}

class GoogleMapsAdapter implements GeocodingProvider {
  async geocode(address: string): Promise<Coordinates> {
    // Google Maps API固有の実装
    // ...
  }
}

export function useGeocodingProvider() {
  // 設定に基づいてプロバイダーを選択
  const provider = useRuntimeConfig().public.geocodingProvider === 'google'
    ? new GoogleMapsAdapter()
    : new NominatimAdapter()
    
  return provider
}
```

## テスタビリティの確保

### モック可能な設計
```typescript
// ✅ 依存性注入でテスト容易性を確保
export function useDataService(
  apiClient = $fetch, // デフォルト値、テスト時はモック注入可能
  storage = localStorage // デフォルト値、テスト時はモック注入可能
) {
  const fetchData = async (id: string) => {
    return await apiClient(`/api/data/${id}`)
  }
  
  const saveData = (key: string, data: any) => {
    storage.setItem(key, JSON.stringify(data))
  }
  
  return { fetchData, saveData }
}
```

## パフォーマンス最適化パターン

### 遅延読み込み
```typescript
// ✅ 重いライブラリの遅延読み込み
export function useLeafletMap() {
  const initializeMap = async () => {
    // Leafletライブラリを動的に読み込み
    const L = await import('leaflet').then(m => m.default || m)
    // 初期化処理
  }
  
  return { initializeMap }
}
```

### メモ化パターン
```typescript
// ✅ 計算結果のキャッシュ
export function useGeocodingCache() {
  const cache = new Map<string, Coordinates>()
  
  const geocodeWithCache = async (address: string) => {
    if (cache.has(address)) {
      return cache.get(address)!
    }
    
    const result = await geocode(address)
    cache.set(address, result)
    return result
  }
  
  return { geocodeWithCache }
}
```