/**
 * テストデータ生成ユーティリティ
 * 一意性を保証するためのヘルパー関数群
 */

/**
 * ユニークなIDを生成（簡易UUID）
 */
export function generateUniqueId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * テスト用の除雪情報データを生成
 */
export interface TestSnowData {
  area: string
  startTime: string
  endTime: string
  notes?: string
}

export function generateSnowReportData(testName: string, index: number = 0): TestSnowData {
  const uniqueId = generateUniqueId()
  const timestamp = new Date().toISOString().slice(0, 16) // YYYY-MM-DDTHH:mm
  
  return {
    area: `${testName}_地域_${uniqueId}${index > 0 ? `_${index}` : ''}`,
    startTime: timestamp,
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16), // 2時間後
    notes: `${testName}用テストデータ_${uniqueId}`
  }
}

/**
 * 複数のテストデータを生成
 */
export function generateMultipleSnowReportData(testName: string, count: number): TestSnowData[] {
  return Array.from({ length: count }, (_, index) => 
    generateSnowReportData(testName, index + 1)
  )
}

/**
 * 無効なテストデータを生成（バリデーションテスト用）
 */
export function generateInvalidSnowReportData(testName: string): {
  emptyArea: TestSnowData
  invalidTimeRange: TestSnowData
} {
  const baseData = generateSnowReportData(testName)
  
  return {
    emptyArea: {
      ...baseData,
      area: ''
    },
    invalidTimeRange: {
      ...baseData,
      startTime: '2024-01-15T20:00',
      endTime: '2024-01-15T18:00' // 終了時刻が開始時刻より前
    }
  }
}

/**
 * データ属性用のセレクタヘルパー
 */
export function getTestId(testId: string): string {
  return `[data-testid="${testId}"]`
}

/**
 * ユニークなテキストを含む要素のセレクタ
 */
export function getByUniqueText(text: string): string {
  return `text="${text}"`
}

/**
 * ロール + ユニークな名前でのセレクタ
 */
export function getByRoleAndName(role: string, name: string): string {
  return `[role="${role}"][name*="${name}"], [role="${role}"][aria-label*="${name}"]`
} 