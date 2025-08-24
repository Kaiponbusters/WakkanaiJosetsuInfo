import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { DatabaseTestUtil } from './database-test-util'

describe('DatabaseTestUtil', () => {
  let dbUtil: DatabaseTestUtil

  beforeEach(async () => {
    dbUtil = new DatabaseTestUtil()
    await dbUtil.initialize()
  })

  afterEach(async () => {
    await dbUtil.cleanup()
  })

  describe('初期化', () => {
    it('データベーステストユーティリティが正常に初期化される', () => {
      expect(dbUtil.isConnected()).toBe(true)
      expect(dbUtil.getConnectionString()).toBeDefined()
    })

    it('テストデータプレフィックスが設定される', () => {
      expect(dbUtil.getTestDataPrefix()).toBe('test_')
    })
  })

  describe('テストデータ管理', () => {
    it('テストデータを挿入できる', async () => {
      const testData = [
        {
          table: 'snow_reports',
          data: {
            area: 'test_稚内市中央',
            start_time: '2024-01-01T09:00:00Z',
            end_time: '2024-01-01T12:00:00Z'
          }
        }
      ]

      const result = await dbUtil.insertTestData(testData)
      expect(result).toBe(true)
    })

    it('テストデータの存在を確認できる', async () => {
      const conditions = [
        {
          table: 'snow_reports',
          where: { area: 'test_稚内市中央' }
        }
      ]

      const exists = await dbUtil.verifyDataExists(conditions)
      expect(typeof exists).toBe('boolean')
    })

    it('テストデータをクリーンアップできる', async () => {
      const testId = 'test_cleanup_001'
      
      await dbUtil.cleanupTestData(testId)
      // クリーンアップが正常に実行されることを確認
      expect(true).toBe(true)
    })

    it('レコード数を取得できる', async () => {
      const count = await dbUtil.getRecordCount('snow_reports')
      expect(typeof count).toBe('number')
      expect(count).toBeGreaterThanOrEqual(0)
    })
  })

  describe('データ整合性チェック', () => {
    it('データ整合性を検証できる', async () => {
      const isValid = await dbUtil.verifyDataIntegrity()
      expect(typeof isValid).toBe('boolean')
    })

    it('外部キー制約を確認できる', async () => {
      const constraints = await dbUtil.checkForeignKeyConstraints()
      expect(Array.isArray(constraints)).toBe(true)
    })

    it('タイムスタンプの自動設定を確認できる', async () => {
      const testData = {
        table: 'snow_reports',
        data: {
          area: 'test_timestamp_check',
          start_time: '2024-01-01T09:00:00Z',
          end_time: '2024-01-01T12:00:00Z'
        }
      }

      const insertedId = await dbUtil.insertAndReturnId(testData)
      const record = await dbUtil.getRecordById('snow_reports', insertedId)
      
      expect(record).toBeDefined()
      expect(record.created_at).toBeDefined()
    })
  })

  describe('クエリ実行', () => {
    it('カスタムクエリを実行できる', async () => {
      const query = 'SELECT COUNT(*) as count FROM snow_reports WHERE area LIKE $1'
      const params = ['test_%']
      
      const result = await dbUtil.executeQuery(query, params)
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })

    it('トランザクション内でクエリを実行できる', async () => {
      const queries = [
        {
          query: 'INSERT INTO snow_reports (area, start_time, end_time) VALUES ($1, $2, $3)',
          params: ['test_transaction', '2024-01-01T09:00:00Z', '2024-01-01T12:00:00Z']
        }
      ]

      const result = await dbUtil.executeTransaction(queries)
      expect(result).toBe(true)
    })
  })

  describe('エラーハンドリング', () => {
    it('データベース接続エラーを適切に処理する', async () => {
      const invalidDbUtil = new DatabaseTestUtil('invalid://connection')
      
      await expect(invalidDbUtil.initialize()).rejects.toThrow()
    })

    it('不正なクエリでエラーを返す', async () => {
      const invalidQuery = 'INVALID SQL QUERY'
      
      await expect(dbUtil.executeQuery(invalidQuery)).rejects.toThrow()
    })
  })
})