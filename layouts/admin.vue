<template>
  <div class="min-h-screen bg-gray-50">
    <!-- サイドバー -->
    <div class="fixed inset-y-0 left-0 w-64 bg-gray-800">
      <div class="flex items-center justify-center h-16 px-4 bg-gray-900">
        <h1 class="text-white text-lg font-semibold">
          管理画面
        </h1>
      </div>
      
      <nav class="mt-5 px-2 space-y-1">
        <NuxtLink
          to="/admin"
          exact-active-class="bg-gray-900 text-white"
          class="text-gray-300 hover:bg-gray-700 hover:text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors"
        >
          <svg class="text-gray-400 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v0"></path>
          </svg>
          ダッシュボード
        </NuxtLink>

        <NuxtLink
          to="/admin/users"
          active-class="bg-gray-900 text-white"
          class="text-gray-300 hover:bg-gray-700 hover:text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors"
        >
          <svg class="text-gray-400 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
          </svg>
          ユーザー管理
        </NuxtLink>

        <NuxtLink
          to="/admin/devices"
          active-class="bg-gray-900 text-white"
          class="text-gray-300 hover:bg-gray-700 hover:text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors"
        >
          <svg class="text-gray-400 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
          </svg>
          車載端末管理
        </NuxtLink>

        <NuxtLink
          to="/admin/audit"
          active-class="bg-gray-900 text-white"
          class="text-gray-300 hover:bg-gray-700 hover:text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors"
        >
          <svg class="text-gray-400 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          監査ログ
        </NuxtLink>

        <div class="border-t border-gray-700 mt-5 pt-5">
          <NuxtLink
            to="/dashboard"
            class="text-gray-300 hover:bg-gray-700 hover:text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors"
          >
            <svg class="text-gray-400 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            一般画面に戻る
          </NuxtLink>

          <button
            @click="handleLogout"
            class="w-full text-left text-gray-300 hover:bg-gray-700 hover:text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors"
          >
            <svg class="text-gray-400 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            ログアウト
          </button>
        </div>
      </nav>
    </div>

    <!-- メインコンテンツエリア -->
    <div class="ml-64">
      <!-- トップバー -->
      <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center py-4">
            <div>
              <h2 class="text-xl font-semibold text-gray-900">
                {{ pageTitle }}
              </h2>
            </div>
            <div class="flex items-center space-x-4">
              <span v-if="userProfile" class="text-sm text-gray-600">
                {{ userProfile.full_name }}さん（{{ getRoleDisplayName(userProfile.role) }}）
              </span>
            </div>
          </div>
        </div>
      </header>

      <!-- ページコンテンツ -->
      <main class="py-6">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const { logout, getUserProfile } = useAuth()
const route = useRoute()

// ユーザープロファイル
const userProfile = ref(null)

// 初期データ読み込み
onMounted(async () => {
  userProfile.value = await getUserProfile()
})

// ページタイトルの動的設定
const pageTitle = computed(() => {
  const path = route.path
  if (path === '/admin' || path === '/admin/') return 'ダッシュボード'
  if (path.startsWith('/admin/users')) return 'ユーザー管理'
  if (path.startsWith('/admin/devices')) return '車載端末管理'
  if (path.startsWith('/admin/audit')) return '監査ログ'
  return '管理画面'
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

// ログアウト処理
const handleLogout = async () => {
  if (confirm('ログアウトしますか？')) {
    await logout()
  }
}
</script> 