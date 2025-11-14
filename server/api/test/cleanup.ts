import { serverSupabaseClient } from '#supabase/server'
import { defineEventHandler, createError } from 'h3'

export default defineEventHandler(async (event) => {
  // テスト環境以外では403
  if (process.env.NODE_ENV !== 'test' && process.env.NUXT_PUBLIC_TEST_API !== 'enabled') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const client = await serverSupabaseClient(event)
  // snow_reportsテーブルの全データ削除
  const { error } = await client.from('snow_reports').delete().neq('id', '')
  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
  return { success: true }
}) 