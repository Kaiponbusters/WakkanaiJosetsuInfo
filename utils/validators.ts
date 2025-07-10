/**
 * バリデーション結果の型定義
 */
export interface ValidationResult {
  isValid: boolean
  message: string
}

/**
 * バリデーションエラーメッセージ定数
 */
const VALIDATION_MESSAGES = {
  REQUIRED: 'この項目は必須です',
  INVALID_TIME_RANGE: '終了時間は開始時間より後にしてください',
  INVALID_DATE_FORMAT: '正しい日時形式で入力してください'
} as const

/**
 * 成功結果を返すヘルパー関数
 */
function createSuccessResult(): ValidationResult {
  return {
    isValid: true,
    message: ''
  }
}

/**
 * エラー結果を返すヘルパー関数
 */
function createErrorResult(message: string): ValidationResult {
  return {
    isValid: false,
    message
  }
}

/**
 * 値が有効な文字列かどうかをチェックする型ガード
 * @param value - チェックする値
 * @returns 有効な文字列の場合true
 */
function isValidString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== ''
}

/**
 * 日時文字列が有効かどうかをチェック
 * @param dateString - チェックする日時文字列
 * @returns 有効な日時の場合true
 */
function isValidDate(dateString: string): boolean {
  if (!dateString.trim()) return false
  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

/**
 * 複数の日時文字列をDateオブジェクトに変換
 * @param dateStrings - 日時文字列の配列
 * @returns 変換されたDateオブジェクトの配列、または無効な場合はnull
 */
function parseDates(...dateStrings: string[]): Date[] | null {
  if (!dateStrings.every(isValidDate)) {
    return null
  }
  
  return dateStrings.map(str => new Date(str))
}

/**
 * 必須項目のバリデーション
 * @param value - チェックする値
 * @returns バリデーション結果
 */
export function validateRequired(value: string | null | undefined): ValidationResult {
  if (!isValidString(value)) {
    return createErrorResult(VALIDATION_MESSAGES.REQUIRED)
  }
  
  return createSuccessResult()
}

/**
 * 時間範囲のバリデーション
 * @param startTime - 開始時間
 * @param endTime - 終了時間
 * @returns バリデーション結果
 */
export function validateTimeRange(startTime: string, endTime: string): ValidationResult {
  // Extract Method: 日付変換とフォーマットチェックを分離
  const dates = parseDates(startTime, endTime)
  if (!dates) {
    return createErrorResult(VALIDATION_MESSAGES.INVALID_DATE_FORMAT)
  }
  
  const [start, end] = dates
  
  // Guard Clause: 時間範囲の妥当性チェック
  if (start >= end) {
    return createErrorResult(VALIDATION_MESSAGES.INVALID_TIME_RANGE)
  }
  
  return createSuccessResult()
} 