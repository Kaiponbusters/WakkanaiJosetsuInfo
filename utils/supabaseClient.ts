import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { useRuntimeConfig } from '#imports'

/**
 * Supabaseクライアントの設定モジュール
 * @module supabaseClient
 */

/**
 * Nuxt.js環境でSupabaseクライアントを作成する関数
 * 環境変数から設定を取得して初期化します
 */
function createClient() {
  const config = useRuntimeConfig()
  const supabaseUrl = config.public.SUPABASE_URL
  const supabaseKey = config.public.SUPABASE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL または Key が設定されていません。.env ファイルを確認してください。')
  }
  
  return createSupabaseClient(supabaseUrl, supabaseKey)
}

/**
 * 設定されたSupabaseクライアントインスタンス
 * @const
 */
export const supabase = createClient()
