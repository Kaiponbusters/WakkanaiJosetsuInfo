import { cleanupSnowReports } from '../utils/cleanupApi'

async function globalTeardown() {
  console.log('🧹 テスト終了後にDBをクリーンアップ中...')
  try {
    await cleanupSnowReports()
    console.log('✅ DBクリーンアップ完了')
  } catch (error) {
    console.error('❌ DBクリーンアップ失敗:', error)
  }
}

export default globalTeardown 