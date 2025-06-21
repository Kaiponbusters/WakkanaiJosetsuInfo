<template>
  <div class="min-h-screen bg-gray-50">
    <!-- ヘッダー -->
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">
              稚内市除排雪情報システム - ダッシュボード
            </h1>
            <p v-if="userProfile" class="text-sm text-gray-600 mt-1">
              {{ userProfile.full_name || userProfile.email }}さん（{{ getRoleDisplayName(userProfile.role) }}）
            </p>
          </div>
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-500">
              最終ログイン: {{ formatDateTime(userProfile?.last_login) }}
            </span>
            <button
              @click="handleLogout"
              class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- メインコンテンツ -->
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <!-- ステータスカード -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    アカウント状態
                  </dt>
                  <dd class="text-lg font-medium text-gray-900">
                    <span :class="userProfile?.is_active ? 'text-green-600' : 'text-red-600'">
                      {{ userProfile?.is_active ? '有効' : '無効' }}
                    </span>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    ログイン失敗回数
                  </dt>
                  <dd class="text-lg font-medium text-gray-900">
                    {{ userProfile?.failed_login_count || 0 }} 回
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    担当部署
                  </dt>
                  <dd class="text-lg font-medium text-gray-900">
                    {{ userProfile?.department || '未設定' }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 機能メニュー -->
      <div class="bg-white shadow overflow-hidden sm:rounded-md">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900">
            利用可能な機能
          </h3>
          <p class="mt-1 max-w-2xl text-sm text-gray-500">
            権限に応じて利用できる機能をご利用ください。
          </p>
        </div>
        <ul class="divide-y divide-gray-200">
          <!-- 除排雪情報作成 -->
          <li>
            <NuxtLink
              to="/create"
              class="block hover:bg-gray-50 px-4 py-4 sm:px-6 transition-colors"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <svg class="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-gray-900">
                      除排雪情報の登録
                    </p>
                    <p class="text-sm text-gray-500">
                      新しい除排雪予定を登録します
                    </p>
                  </div>
                </div>
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
            </NuxtLink>
          </li>

          <!-- 除排雪情報一覧 -->
          <li>
            <NuxtLink
              to="/snowlist"
              class="block hover:bg-gray-50 px-4 py-4 sm:px-6 transition-colors"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <svg class="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-gray-900">
                      除排雪情報一覧
                    </p>
                    <p class="text-sm text-gray-500">
                      登録済みの除排雪情報を確認・編集します
                    </p>
                  </div>
                </div>
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
            </NuxtLink>
          </li>

          <!-- 管理機能（管理者のみ） -->
          <li v-if="isAdminUser">
            <NuxtLink
              to="/admin"
              class="block hover:bg-gray-50 px-4 py-4 sm:px-6 transition-colors"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <svg class="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-gray-900">
                      管理機能
                    </p>
                    <p class="text-sm text-gray-500">
                      ユーザー管理、システム設定
                    </p>
                  </div>
                </div>
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { formatDateTimeForDisplay } from '~/utils/formatters'

// 認証ミドルウェアを適用
definePageMeta({
  middleware: 'auth'
})

// ページタイトル設定
useHead({
  title: 'ダッシュボード - 稚内市除排雪情報システム'
})

const { logout, getUserProfile, isAdmin } = useAuth()

// ユーザープロファイル
const userProfile = ref(null)
const isAdminUser = ref(false)

// 初期データ読み込み
onMounted(async () => {
  userProfile.value = await getUserProfile()
  isAdminUser.value = await isAdmin()
})

// ロール表示名変換
const getRoleDisplayName = (role: string): string => {
  switch (role) {
    case 'admin':
      return '管理者'
    case 'staff':
      return '職員'
    case 'vehicle':
      return '車載端末'
    default:
      return role
  }
}

// 日時フォーマット
const formatDateTime = (dateString: string | null): string => {
  if (!dateString) return '未記録'
  return formatDateTimeForDisplay(dateString)
}

// ログアウト処理
const handleLogout = async () => {
  if (confirm('ログアウトしますか？')) {
    await logout()
  }
}
</script> 