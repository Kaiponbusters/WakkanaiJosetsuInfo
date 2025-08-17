import { describe, it, expect } from 'vitest'
import { formatDateTime, formatDate, parseDate, compareDates } from './formatters'

describe('formatDateTime', () => {
  it('should format a valid ISO string correctly', () => {
    const isoString = '2024-05-15T10:30:00.000Z'
    // 注意: toLocaleStringの結果は実行環境のタイムゾーンに依存します。
    // テストを安定させるためには、タイムゾーンを固定するか、
    // 結果の形式のみを検証するなどの工夫が必要です。
    // ここでは、特定の形式になっているか（'/' と ' ' を含むか）を簡易的にチェックします。
    const formatted = formatDateTime(isoString)
    expect(formatted).toMatch(/\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}/)
  })

  it('should return an empty string for an empty input', () => {
    expect(formatDateTime('')).toBe('')
  })

  it('should handle date strings without T separator', () => {
    const dateString = '2024-05-15 10:30:00'
    const formatted = formatDateTime(dateString)
    expect(formatted).toMatch(/\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}/)
  })
})

describe('formatDate', () => {
  it('should format a valid ISO string to YYYY/MM/DD', () => {
    const isoString = '2024-05-15T10:30:00.000Z'
    const formatted = formatDate(isoString)
    expect(formatted).toBe('2024/05/15')
  })

  it('should handle date part of a datetime string', () => {
    const dateString = '2023-12-25'
    const formatted = formatDate(dateString)
    expect(formatted).toBe('2023/12/25')
  })
})

describe('parseDate', () => {
  it('should convert a valid ISO string to a Date object', () => {
    const isoString = '2023-01-15T14:30:00'
    const date = parseDate(isoString)
    expect(date).toBeInstanceOf(Date)
    expect(date.getFullYear()).toBe(2023)
    expect(date.getMonth()).toBe(0) // 0-indexed (0 = 1月)
    expect(date.getDate()).toBe(15)
    expect(date.getHours()).toBe(14)
    expect(date.getMinutes()).toBe(30)
  })

  it('should return an empty Date object for an empty input', () => {
    const date = parseDate('')
    expect(date).toBeInstanceOf(Date)
    expect(date.getTime()).toBe(0)
  })
})

describe('compareDates', () => {
  it('should compare dates correctly', () => {
    expect(compareDates('2023-01-15T14:30:00', '2023-01-15T14:30:00')).toBe(0)
    expect(compareDates('2023-01-15T14:30:00', '2023-01-15T14:35:00')).toBeLessThan(0)
    expect(compareDates('2023-01-15T14:35:00', '2023-01-15T14:30:00')).toBeGreaterThan(0)
    expect(compareDates('2023-01-15T14:30:00', '2023-01-16T14:30:00')).toBeLessThan(0)
  })
})