export default defineNuxtRouteMiddleware(async (to) => {
  // 管理者用ページへのアクセスをチェック
  if (to.path.startsWith('/admin')) {
    const user = await supabase.auth.getUser()
    
    // ユーザーが認証されていない場合はログインページへリダイレクト
    if (!user.data.user) {
      return navigateTo('/roguin')
    }
  }
})