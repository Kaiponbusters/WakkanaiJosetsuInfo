interface LoginCredentials {
  email: string
  password: string
}

interface LoginResult {
  success: boolean
  error?: string
  user?: any
}

interface PasswordValidation {
  isValid: boolean
  errors: string[]
}

export const useAuth = () => {
  const user = useSupabaseUser()
  const supabase = useSupabaseClient()
  const router = useRouter()

  // パスワードバリデーション
  const validatePassword = (password: string): PasswordValidation => {
    const errors: string[] = []
    
    if (password.length < 8) {
      errors.push('パスワードは8文字以上である必要があります')
    }
    
    if (!/[a-zA-Z]/.test(password)) {
      errors.push('パスワードには英字を含める必要があります')
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('パスワードには数字を含める必要があります')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // ログイン試行を記録
  const recordLoginAttempt = async (email: string, success: boolean, failureReason?: string) => {
    try {
      await supabase.from('login_attempts').insert({
        email,
        ip_address: await getClientIP(),
        user_agent: navigator.userAgent,
        success,
        failure_reason: failureReason
      })
    } catch (error) {
      console.error('ログイン試行記録エラー:', error)
    }
  }

  // クライアントIPアドレス取得（簡易版）
  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('/api/client-ip')
      const data = await response.json()
      return data.ip || '127.0.0.1'
    } catch {
      return '127.0.0.1'
    }
  }

  // アカウントロック状態の確認
  const checkAccountLock = async (email: string): Promise<boolean> => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return false

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('locked_until, failed_login_count')
        .eq('id', user.user.id)
        .single()

      if (profile?.locked_until && new Date(profile.locked_until) > new Date()) {
        return true
      }

      return false
    } catch {
      return false
    }
  }

  // ログイン失敗回数の更新
  const updateFailedLoginCount = async (userId: string, increment: boolean = true) => {
    try {
      if (increment) {
        // 失敗回数を増加
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('failed_login_count')
          .eq('id', userId)
          .single()

        const newCount = (profile?.failed_login_count || 0) + 1
        const shouldLock = newCount >= 5

        await supabase
          .from('user_profiles')
          .update({
            failed_login_count: newCount,
            locked_until: shouldLock ? new Date(Date.now() + 30 * 60 * 1000).toISOString() : null // 30分ロック
          })
          .eq('id', userId)
      } else {
        // 成功時はカウントをリセット
        await supabase
          .from('user_profiles')
          .update({
            failed_login_count: 0,
            locked_until: null,
            last_login: new Date().toISOString()
          })
          .eq('id', userId)
      }
    } catch (error) {
      console.error('ログイン失敗回数更新エラー:', error)
    }
  }

  // ログイン処理
  const login = async (credentials: LoginCredentials): Promise<LoginResult> => {
    try {
      // アカウントロック確認
      const isLocked = await checkAccountLock(credentials.email)
      if (isLocked) {
        await recordLoginAttempt(credentials.email, false, 'account_locked')
        return {
          success: false,
          error: 'アカウントがロックされています。30分後に再試行してください。'
        }
      }

      // Supabase Auth でログイン
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      if (error) {
        await recordLoginAttempt(credentials.email, false, error.message)
        
        // ユーザーが存在する場合、失敗回数を更新
        if (data?.user?.id) {
          await updateFailedLoginCount(data.user.id, true)
        }

        return {
          success: false,
          error: 'メールアドレスまたはパスワードが正しくありません'
        }
      }

      if (data.user) {
        // ログイン成功
        await recordLoginAttempt(credentials.email, true)
        await updateFailedLoginCount(data.user.id, false)

        return {
          success: true,
          user: data.user
        }
      }

      return {
        success: false,
        error: 'ログインに失敗しました'
      }
    } catch (error) {
      console.error('ログインエラー:', error)
      await recordLoginAttempt(credentials.email, false, 'system_error')
      
      return {
        success: false,
        error: 'システムエラーが発生しました'
      }
    }
  }

  // ログアウト処理
  const logout = async () => {
    try {
      await supabase.auth.signOut()
      await router.push('/')
    } catch (error) {
      console.error('ログアウトエラー:', error)
    }
  }

  // ユーザープロファイル取得
  const getUserProfile = async () => {
    if (!user.value) return null

    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.value.id)
        .single()

      if (error) {
        console.error('プロファイル取得エラー:', error)
        return null
      }

      return profile
    } catch (error) {
      console.error('プロファイル取得エラー:', error)
      return null
    }
  }

  // 権限チェック
  const hasRole = async (requiredRoles: string[]): Promise<boolean> => {
    const profile = await getUserProfile()
    if (!profile) return false

    return requiredRoles.includes(profile.role) && profile.is_active
  }

  // 管理者権限チェック
  const isAdmin = () => hasRole(['admin'])

  // スタッフ権限チェック
  const isStaff = () => hasRole(['staff', 'admin'])

  return {
    user: readonly(user),
    validatePassword,
    login,
    logout,
    getUserProfile,
    hasRole,
    isAdmin,
    isStaff
  }
} 