import { describe, it, expect } from 'vitest'
import { validateRequired, validateTimeRange, validateStringLength } from './validators'

describe('validateRequired', () => {
  it('空文字列の場合はfalseを返す', () => {
    const result = validateRequired('')
    expect(result.isValid).toBe(false)
    expect(result.message).toBe('この項目は必須です')
  })

  it('空白文字のみの場合はfalseを返す', () => {
    const result = validateRequired('   ')
    expect(result.isValid).toBe(false)
    expect(result.message).toBe('この項目は必須です')
  })

  it('有効な値の場合はtrueを返す', () => {
    const result = validateRequired('稚内市')
    expect(result.isValid).toBe(true)
    expect(result.message).toBe('')
  })

  it('nullやundefinedの場合はfalseを返す', () => {
    const nullResult = validateRequired(null as any)
    expect(nullResult.isValid).toBe(false)
    expect(nullResult.message).toBe('この項目は必須です')

    const undefinedResult = validateRequired(undefined as any)
    expect(undefinedResult.isValid).toBe(false)
    expect(undefinedResult.message).toBe('この項目は必須です')
  })
})

describe('validateTimeRange', () => {
  it('開始時間が終了時間より後の場合はfalseを返す', () => {
    const result = validateTimeRange('2024-01-15T20:00', '2024-01-15T18:00')
    expect(result.isValid).toBe(false)
    expect(result.message).toBe('終了時間は開始時間より後にしてください')
  })

  it('開始時間と終了時間が同じ場合はfalseを返す', () => {
    const result = validateTimeRange('2024-01-15T18:00', '2024-01-15T18:00')
    expect(result.isValid).toBe(false)
    expect(result.message).toBe('終了時間は開始時間より後にしてください')
  })

  it('開始時間が終了時間より前の場合はtrueを返す', () => {
    const result = validateTimeRange('2024-01-15T18:00', '2024-01-15T20:00')
    expect(result.isValid).toBe(true)
    expect(result.message).toBe('')
  })

  it('無効な日時フォーマットの場合はfalseを返す', () => {
    const result = validateTimeRange('invalid-date', '2024-01-15T20:00')
    expect(result.isValid).toBe(false)
    expect(result.message).toBe('正しい日時形式で入力してください')
  })

  it('空文字列の場合はfalseを返す', () => {
    const result = validateTimeRange('', '2024-01-15T20:00')
    expect(result.isValid).toBe(false)
    expect(result.message).toBe('正しい日時形式で入力してください')
  })
})

describe('validateStringLength', () => {
  it('最小長未満の場合はfalseを返す', () => {
    const result = validateStringLength('a', { min: 2, max: 10 })
    expect(result.isValid).toBe(false)
    expect(result.message).toBe('2文字以上で入力してください')
  })

  it('最大長超過の場合はfalseを返す', () => {
    const result = validateStringLength('あいうえおかきくけこさしすせそ', { min: 1, max: 10 })
    expect(result.isValid).toBe(false)
    expect(result.message).toBe('10文字以下で入力してください')
  })

  it('範囲内の場合はtrueを返す', () => {
    const result = validateStringLength('稚内市', { min: 2, max: 10 })
    expect(result.isValid).toBe(true)
    expect(result.message).toBe('')
  })

  it('最小長のみ指定の場合', () => {
    const result = validateStringLength('test', { min: 3 })
    expect(result.isValid).toBe(true)
    expect(result.message).toBe('')
  })

  it('最大長のみ指定の場合', () => {
    const result = validateStringLength('test', { max: 5 })
    expect(result.isValid).toBe(true)
    expect(result.message).toBe('')
  })

  it('空文字列は必須チェックに委ねる', () => {
    const result = validateStringLength('', { min: 1, max: 10 })
    expect(result.isValid).toBe(true)
    expect(result.message).toBe('')
  })

  it('日本語文字列の長さを正しくカウント', () => {
    const result = validateStringLength('あいうえお', { min: 3, max: 10 })
    expect(result.isValid).toBe(true)
    expect(result.message).toBe('')
  })
}) 