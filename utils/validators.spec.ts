import { describe, it, expect } from 'vitest'
import { validateRequired, validateTimeRange } from './validators'

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