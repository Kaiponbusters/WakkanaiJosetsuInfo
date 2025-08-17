import { cleanupSnowReports } from '../utils/cleanupApi'

async function globalSetup() {
  console.log('🧹 テスト開始前にDBをクリーンアップ中...')
  try {
    await cleanupSnowReports()
    console.log('✅ DBクリーンアップ完了')
  } catch (error) {
    console.error('❌ DBクリーンアップ失敗:', error)
  }
}

export default globalSetup 