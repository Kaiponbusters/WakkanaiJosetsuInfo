interface CreateUserData {
  email: string
  password: string
  full_name: string
  role: 'admin' | 'staff'
  department?: string
}

interface UpdateUserData {
  full_name?: string
  role?: 'admin' | 'staff'
  department?: string
  is_active?: boolean
}

interface UserProfile {
  id: string
  email: string
  full_name: string
  role: string
  department: string
  is_active: boolean
  last_login: string
  failed_login_count: number
  locked_until: string | null
  created_at: string
  updated_at: string
}

export const useUserManagement = () => {
  const supabase = useSupabaseClient()
  const { validatePassword } = useAuth()

  // ユーザー一覧取得
  const getUsers = async (params: {
    page?: number
    limit?: number
    search?: string
    role?: string
    is_active?: boolean
  } = {}) => {
    try {
      const { page = 1, limit = 20, search, role, is_active } = params
      const offset = (page - 1) * limit

      let query = supabase
        .from('user_profiles')
        .select(`
          *,
          auth.users!inner(email)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      // フィルタリング
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,auth.users.email.ilike.%${search}%`)
      }

      if (role) {
        query = query.eq('role', role)
      }

      if (is_active !== undefined) {
        query = query.eq('is_active', is_active)
      }

      const { data, error, count } = await query

      if (error) throw error

      // データ整形
      const users = data?.map(user => ({
        ...user,
        email: user.auth?.users?.email || ''
      })) || []

      return {
        users,
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit)
      }
    } catch (error) {
      console.error('ユーザー一覧取得エラー:', error)
      throw error
    }
  }

  // 単一ユーザー取得
  const getUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          auth.users!inner(email)
        `)
        .eq('id', userId)
        .single()

      if (error) throw error

      return {
        ...data,
        email: data.auth?.users?.email || ''
      }
    } catch (error) {
      console.error('ユーザー取得エラー:', error)
      throw error
    }
  }

  // ユーザー作成
  const createUser = async (userData: CreateUserData) => {
    try {
      // パスワードバリデーション
      const passwordValidation = validatePassword(userData.password)
      if (!passwordValidation.isValid) {
        throw new Error(`パスワードエラー: ${passwordValidation.errors.join(', ')}`)
      }

      // 1. Supabase Authでユーザー作成
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true // メール確認をスキップ
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('ユーザー作成に失敗しました')

      // 2. ユーザープロファイル作成
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          role: userData.role,
          full_name: userData.full_name,
          department: userData.department || null,
          is_active: true
        })

      if (profileError) {
        // プロファイル作成に失敗した場合、認証ユーザーを削除
        await supabase.auth.admin.deleteUser(authData.user.id)
        throw profileError
      }

      return {
        id: authData.user.id,
        email: userData.email,
        ...userData
      }
    } catch (error) {
      console.error('ユーザー作成エラー:', error)
      throw error
    }
  }

  // ユーザー更新
  const updateUser = async (userId: string, userData: UpdateUserData) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          ...userData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('ユーザー更新エラー:', error)
      throw error
    }
  }

  // ユーザー削除（論理削除）
  const deleteUser = async (userId: string) => {
    try {
      // ユーザープロファイルを無効化
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (profileError) throw profileError

      // 認証ユーザーも削除（物理削除）
      const { error: authError } = await supabase.auth.admin.deleteUser(userId)
      if (authError) {
        console.error('認証ユーザー削除エラー:', authError)
        // プロファイルの無効化は成功しているので、エラーを投げない
      }

      return { success: true }
    } catch (error) {
      console.error('ユーザー削除エラー:', error)
      throw error
    }
  }

  // パスワードリセット
  const resetPassword = async (userId: string, newPassword: string) => {
    try {
      // パスワードバリデーション
      const passwordValidation = validatePassword(newPassword)
      if (!passwordValidation.isValid) {
        throw new Error(`パスワードエラー: ${passwordValidation.errors.join(', ')}`)
      }

      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword
      })

      if (error) throw error

      // ログイン失敗回数をリセット
      await supabase
        .from('user_profiles')
        .update({
          failed_login_count: 0,
          locked_until: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      return { success: true }
    } catch (error) {
      console.error('パスワードリセットエラー:', error)
      throw error
    }
  }

  // アカウントロック解除
  const unlockAccount = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          failed_login_count: 0,
          locked_until: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('アカウントロック解除エラー:', error)
      throw error
    }
  }

  // アカウント有効化/無効化
  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('ユーザー状態変更エラー:', error)
      throw error
    }
  }

  // メールアドレス変更
  const updateEmail = async (userId: string, newEmail: string) => {
    try {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        email: newEmail
      })

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('メールアドレス変更エラー:', error)
      throw error
    }
  }

  // ユーザー統計取得
  const getUserStats = async () => {
    try {
      const [
        { count: totalUsers },
        { count: activeUsers },
        { count: adminUsers },
        { count: staffUsers },
        { count: lockedUsers }
      ] = await Promise.all([
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('role', 'staff'),
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }).not('locked_until', 'is', null)
      ])

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        inactiveUsers: (totalUsers || 0) - (activeUsers || 0),
        adminUsers: adminUsers || 0,
        staffUsers: staffUsers || 0,
        lockedUsers: lockedUsers || 0
      }
    } catch (error) {
      console.error('ユーザー統計取得エラー:', error)
      throw error
    }
  }

  // ログイン履歴取得
  const getLoginHistory = async (userId: string, limit: number = 10) => {
    try {
      const { data, error } = await supabase
        .from('login_attempts')
        .select('*')
        .eq('email', 
          // まずユーザーのメールアドレスを取得する必要がある
          await getUser(userId).then(user => user.email)
        )
        .order('attempted_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('ログイン履歴取得エラー:', error)
      throw error
    }
  }

  return {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
    unlockAccount,
    toggleUserStatus,
    updateEmail,
    getUserStats,
    getLoginHistory
  }
} 