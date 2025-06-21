<template>
  <div class="space-y-6">
    <!-- 統計カード -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- ユーザー数 -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  登録ユーザー数
                </dt>
                <dd class="flex items-baseline">
                  <div class="text-2xl font-semibold text-gray-900">
                    {{ stats.totalUsers }}
                  </div>
                  <div class="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                    <svg class="self-center flex-shrink-0 h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                    </svg>
                    <span class="sr-only">Increased by</span>
                    アクティブ {{ stats.activeUsers }}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <!-- 車載端末数 -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  車載端末数
                </dt>
                <dd class="flex items-baseline">
                  <div class="text-2xl font-semibold text-gray-900">
                    {{ stats.totalDevices }}
                  </div>
                  <div class="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                    オンライン {{ stats.onlineDevices }}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <!-- 除排雪情報数 -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  除排雪情報
                </dt>
                <dd class="flex items-baseline">
                  <div class="text-2xl font-semibold text-gray-900">
                    {{ stats.totalReports }}
                  </div>
                  <div class="ml-2 flex items-baseline text-sm font-semibold text-blue-600">
                    今月 {{ stats.thisMonthReports }}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <!-- 監査ログ数 -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  監査ログ
                </dt>
                <dd class="flex items-baseline">
                  <div class="text-2xl font-semibold text-gray-900">
                    {{ stats.totalAuditLogs }}
                  </div>
                  <div class="ml-2 flex items-baseline text-sm font-semibold text-gray-600">
                    今日 {{ stats.todayAuditLogs }}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- クイックアクション -->
    <div class="bg-white shadow rounded-lg">
      <div class="px-4 py-5 sm:px-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900">
          クイックアクション
        </h3>
        <p class="mt-1 max-w-2xl text-sm text-gray-500">
          よく使用する管理機能に素早くアクセスできます。
        </p>
      </div>
      <div class="px-4 py-5 sm:p-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            @click="openCreateUserModal"
            class="relative p-4 border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div class="flex-1 text-left">
                <h4 class="text-sm font-medium text-gray-900">新規ユーザー作成</h4>
                <p class="text-sm text-gray-500">スタッフアカウントを作成</p>
              </div>
            </div>
          </button>

          <button
            @click="openCreateDeviceModal"
            class="relative p-4 border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
          >
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div class="flex-1 text-left">
                <h4 class="text-sm font-medium text-gray-900">車載端末登録</h4>
                <p class="text-sm text-gray-500">新しい車載端末を登録</p>
              </div>
            </div>
          </button>

          <NuxtLink
            to="/admin/audit"
            class="relative p-4 border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors block"
          >
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <svg class="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div class="flex-1 text-left">
                <h4 class="text-sm font-medium text-gray-900">監査ログ確認</h4>
                <p class="text-sm text-gray-500">システムの活動を確認</p>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- 最近のアクティビティ -->
    <div class="bg-white shadow rounded-lg">
      <div class="px-4 py-5 sm:px-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900">
          最近のアクティビティ
        </h3>
        <p class="mt-1 max-w-2xl text-sm text-gray-500">
          システムの最近の活動履歴です。
        </p>
      </div>
      <div class="px-4 py-5 sm:p-6">
        <div v-if="isLoadingActivity" class="text-center py-4">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p class="mt-2 text-sm text-gray-500">読み込み中...</p>
        </div>
        
        <div v-else-if="recentActivity.length === 0" class="text-center py-8">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="mt-2 text-sm text-gray-500">アクティビティがありません</p>
        </div>

        <div v-else class="flow-root">
          <ul class="-mb-8">
            <li v-for="(activity, index) in recentActivity" :key="activity.id" class="relative pb-8">
              <div v-if="index !== recentActivity.length - 1" class="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"></div>
              <div class="relative flex items-start space-x-3">
                <div class="relative">
                  <div :class="getActivityIconClass(activity.action)" class="h-10 w-10 rounded-full flex items-center justify-center ring-8 ring-white">
                    <component :is="getActivityIcon(activity.action)" class="h-5 w-5 text-white" />
                  </div>
                </div>
                <div class="min-w-0 flex-1">
                  <div>
                    <div class="text-sm">
                      <span class="font-medium text-gray-900">{{ activity.user_name || 'システム' }}</span>
                      {{ getActivityDescription(activity) }}
                    </div>
                    <p class="mt-0.5 text-sm text-gray-500">
                      {{ formatDateTime(activity.created_at) }}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDateTimeForDisplay } from '~/utils/formatters'

// 管理者ミドルウェアを適用
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

// ページタイトル設定
useHead({
  title: '管理ダッシュボード - 稚内市除排雪情報システム'
})

const supabase = useSupabaseClient()

// 統計データ
const stats = ref({
  totalUsers: 0,
  activeUsers: 0,
  totalDevices: 0,
  onlineDevices: 0,
  totalReports: 0,
  thisMonthReports: 0,
  totalAuditLogs: 0,
  todayAuditLogs: 0
})

// 最近のアクティビティ
const recentActivity = ref([])
const isLoadingActivity = ref(true)

// 初期データ読み込み
onMounted(async () => {
  await Promise.all([
    loadStats(),
    loadRecentActivity()
  ])
})

// 統計データの読み込み
const loadStats = async () => {
  try {
    // ユーザー統計
    const { count: totalUsers } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })

    const { count: activeUsers } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // デバイス統計
    const { count: totalDevices } = await supabase
      .from('vehicle_devices')
      .select('*', { count: 'exact', head: true })

    const { count: onlineDevices } = await supabase
      .from('vehicle_devices')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .gte('last_seen', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    // レポート統計
    const { count: totalReports } = await supabase
      .from('snow_reports')
      .select('*', { count: 'exact', head: true })

    const thisMonth = new Date()
    thisMonth.setDate(1)
    const { count: thisMonthReports } = await supabase
      .from('snow_reports')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thisMonth.toISOString())

    // 監査ログ統計
    const { count: totalAuditLogs } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count: todayAuditLogs } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())

    stats.value = {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      totalDevices: totalDevices || 0,
      onlineDevices: onlineDevices || 0,
      totalReports: totalReports || 0,
      thisMonthReports: thisMonthReports || 0,
      totalAuditLogs: totalAuditLogs || 0,
      todayAuditLogs: todayAuditLogs || 0
    }
  } catch (error) {
    console.error('統計データ読み込みエラー:', error)
  }
}

// 最近のアクティビティ読み込み
const loadRecentActivity = async () => {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        *,
        user_profiles (full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw error

    recentActivity.value = data.map(item => ({
      ...item,
      user_name: item.user_profiles?.full_name
    }))
  } catch (error) {
    console.error('アクティビティ読み込みエラー:', error)
  } finally {
    isLoadingActivity.value = false
  }
}

// アクティビティアイコンの取得
const getActivityIcon = (action: string) => {
  switch (action) {
    case 'INSERT':
      return 'svg' // 追加アイコン
    case 'UPDATE':
      return 'svg' // 編集アイコン
    case 'DELETE':
      return 'svg' // 削除アイコン
    default:
      return 'svg' // デフォルトアイコン
  }
}

// アクティビティアイコンのクラス取得
const getActivityIconClass = (action: string) => {
  switch (action) {
    case 'INSERT':
      return 'bg-green-500'
    case 'UPDATE':
      return 'bg-blue-500'
    case 'DELETE':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

// アクティビティの説明テキスト取得
const getActivityDescription = (activity: any) => {
  const table = activity.table_name
  const action = activity.action
  
  let tableJa = table
  switch (table) {
    case 'snow_reports':
      tableJa = '除排雪情報'
      break
    case 'user_profiles':
      tableJa = 'ユーザー'
      break
    case 'vehicle_devices':
      tableJa = '車載端末'
      break
  }

  switch (action) {
    case 'INSERT':
      return `${tableJa}を作成しました`
    case 'UPDATE':
      return `${tableJa}を更新しました`
    case 'DELETE':
      return `${tableJa}を削除しました`
    default:
      return `${tableJa}を操作しました`
  }
}

// 日時フォーマット
const formatDateTime = (dateString: string): string => {
  return formatDateTimeForDisplay(dateString)
}

// モーダル表示関数（今後実装）
const openCreateUserModal = () => {
  // TODO: ユーザー作成モーダルを開く
  alert('ユーザー作成機能は実装中です')
}

const openCreateDeviceModal = () => {
  // TODO: デバイス登録モーダルを開く
  alert('デバイス登録機能は実装中です')
}
</script> 