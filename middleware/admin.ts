export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()
  const supabase = useSupabaseClient()

  // ユーザーがログインしていない場合はログインページにリダイレクト
  if (!user.value) {
    return navigateTo('/login')
  }

  // 管理者権限の確認
  return new Promise((resolve) => {
    supabase
      .from('user_profiles')
      .select('role, is_active, locked_until')
      .eq('id', user.value.id)
      .single()
      .then(({ data: profile, error }) => {
        if (error || !profile) {
          console.error('プロファイル取得エラー:', error)
          return navigateTo('/login')
        }

        // アカウントがロックされているかチェック
        if (profile.locked_until && new Date(profile.locked_until) > new Date()) {
          console.warn('アカウントがロックされています')
          return navigateTo('/login?error=account_locked')
        }

        // アカウントが無効化されているかチェック
        if (!profile.is_active) {
          console.warn('アカウントが無効化されています')
          return navigateTo('/login?error=account_disabled')
        }

        // 管理者のみアクセス可能
        if (profile.role !== 'admin') {
          console.warn('管理者権限が必要です')
          return navigateTo('/?error=admin_only')
        }

        resolve(undefined)
      })
  })
}) 