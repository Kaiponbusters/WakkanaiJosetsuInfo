<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          稚内市除排雪情報システム
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          ログインしてください
        </p>
      </div>

      <!-- エラーメッセージ表示 -->
      <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded-md p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-red-800">{{ errorMessage }}</p>
          </div>
        </div>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="email" class="sr-only">メールアドレス</label>
            <input
              id="email"
              v-model="credentials.email"
              name="email"
              type="email"
              autocomplete="email"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="メールアドレス"
              :disabled="isLoading"
            />
          </div>
          <div>
            <label for="password" class="sr-only">パスワード</label>
            <input
              id="password"
              v-model="credentials.password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="パスワード"
              :disabled="isLoading"
            />
          </div>
        </div>

        <!-- パスワードバリデーションエラー -->
        <div v-if="passwordErrors.length > 0" class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <ul class="text-sm text-yellow-800">
                <li v-for="error in passwordErrors" :key="error">• {{ error }}</li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="isLoading || !isFormValid"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isLoading" class="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg class="h-5 w-5 text-indigo-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            {{ isLoading ? 'ログイン中...' : 'ログイン' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
const { login, validatePassword } = useAuth()
const router = useRouter()
const route = useRoute()

// ページタイトル設定
useHead({
  title: 'ログイン - 稚内市除排雪情報システム'
})

// フォームデータ
const credentials = ref({
  email: '',
  password: ''
})

const isLoading = ref(false)
const errorMessage = ref('')

// URLパラメータからエラーメッセージを設定
onMounted(() => {
  const error = route.query.error as string
  switch (error) {
    case 'account_locked':
      errorMessage.value = 'アカウントがロックされています。30分後に再試行してください。'
      break
    case 'account_disabled':
      errorMessage.value = 'アカウントが無効化されています。管理者にお問い合わせください。'
      break
    case 'insufficient_permissions':
      errorMessage.value = '権限が不足しています。'
      break
  }
})

// パスワードバリデーション
const passwordValidation = computed(() => {
  if (!credentials.value.password) return { isValid: true, errors: [] }
  return validatePassword(credentials.value.password)
})

const passwordErrors = computed(() => passwordValidation.value.errors)

// フォームバリデーション
const isFormValid = computed(() => {
  return credentials.value.email.length > 0 && 
         credentials.value.password.length > 0 && 
         passwordValidation.value.isValid
})

// ログイン処理
const handleLogin = async () => {
  if (isLoading.value || !isFormValid.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const result = await login(credentials.value)
    
    if (result.success) {
      // ログイン成功：ダッシュボードにリダイレクト
      await router.push('/dashboard')
    } else {
      errorMessage.value = result.error || 'ログインに失敗しました'
    }
  } catch (error) {
    console.error('ログインエラー:', error)
    errorMessage.value = 'システムエラーが発生しました'
  } finally {
    isLoading.value = false
  }
}

// 認証済みユーザーはダッシュボードにリダイレクト
const user = useSupabaseUser()
watchEffect(() => {
  if (user.value) {
    router.push('/dashboard')
  }
})
</script> 