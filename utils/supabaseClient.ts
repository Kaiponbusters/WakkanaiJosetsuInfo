import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Supabaseクライアントの設定モジュール
 * @module supabaseClient
 */

/**
 * SupabaseのプロジェクトURL
 * @constant
 */
const supabaseUrl = 'https://vgnghdkwnewwfdojxwaw.supabase.co'

/**
 * Supabaseの匿名認証キー
 * @constant
 */
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnbmdoZGt3bmV3d2Zkb2p4d2F3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwNDcyMzUsImV4cCI6MjA1MzYyMzIzNX0.P_oCv0YBjjuVYxbpIbJKhz6VVdprxYCDiYZjcU6xUkE'

/**
 * 設定されたSupabaseクライアントインスタンス
 * @const
 */
export const supabase = createClient(supabaseUrl, supabaseKey)
function createClient(supabaseUrl: string, supabaseKey: string) {
    return createSupabaseClient(supabaseUrl, supabaseKey)
}
