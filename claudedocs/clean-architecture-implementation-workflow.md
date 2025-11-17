# クリーンアーキテクチャ実装ワークフロー

## 1. 概要

### 1.1 目的
WakkanaiJosetsuInfoプロジェクトをクリーンアーキテクチャの原則に従った構造に段階的に移行する。

### 1.2 現状評価
- **Clean Architecture準拠度**: 4.5/10
- **主な課題**:
  - Repository層が存在しない（直接Supabaseアクセス）
  - Usecase層が存在しない（ビジネスロジックがAPI/Composableに分散）
  - Domain層が弱い（型定義のみ、ビジネスロジックなし）
  - 依存関係が逆転（Presentation → Infrastructure直接依存）
  - フレームワーク強結合（Vue, Nuxt, Supabase）

### 1.3 実装期間（推奨ペース）
- **総期間**: 約3週間（15営業日）
- **Stage 1**: 2-3日（Repository層）
- **Stage 2**: 3-4日（Usecase層）
- **Stage 3**: 2-3日（Domain層強化）
- **調整・テスト**: 2-3日

### 1.4 前提条件
- TypeScriptの基本知識
- Nuxt 3フレームワークの理解
- テスト駆動開発（TDD）の経験
- Gitによるバージョン管理

### 1.5 アプローチ
1. **段階的移行**: 既存機能を壊さずに少しずつリファクタリング
2. **テストファースト**: 各段階でテストを先行して作成
3. **ロールバック可能**: 各段階でGitタグを作成し、問題時に戻れる
4. **並行実行**: 旧実装と新実装を並行稼働させ、段階的に移行

---

## 2. 実装スケジュール（推奨ペース）

### Week 1: Stage 1 - Repository層実装

| 日 | タスク | 成果物 | 推定時間 |
|----|--------|--------|----------|
| Day 1 | Repository インターフェース設計 | `types/repositories/*.ts` | 4h |
| Day 1-2 | Supabase Repository 実装 | `server/repositories/supabase/*.ts` | 8h |
| Day 2 | Repository ユニットテスト | `tests/server/repositories/*.test.ts` | 4h |
| Day 3 | API層のRepository統合 | `server/api/snow/*.ts` 修正 | 4h |
| Day 3 | 統合テスト＆バグ修正 | テスト通過 | 4h |

**Week 1 ロールバックポイント**: `git tag stage-1-complete`

### Week 2: Stage 2 - Usecase層実装

| 日 | タスク | 成果物 | 推定時間 |
|----|--------|--------|----------|
| Day 4 | Usecase設計（Input/Output DTO） | `types/usecases/*.ts` | 4h |
| Day 4-5 | Usecase実装（Snow Report） | `server/usecases/snow/*.ts` | 8h |
| Day 5 | Usecaseユニットテスト | `tests/server/usecases/*.test.ts` | 4h |
| Day 6 | API層のUsecase統合 | `server/api/snow/*.ts` 修正 | 4h |
| Day 6-7 | Composable層のUsecase統合 | `composables/forms/*.ts` 修正 | 6h |
| Day 7 | 統合テスト＆バグ修正 | テスト通過 | 2h |

**Week 2 ロールバックポイント**: `git tag stage-2-complete`

### Week 3: Stage 3 - Domain層強化

| 日 | タスク | 成果物 | 推定時間 |
|----|--------|--------|----------|
| Day 8 | Domain Entity設計 | `types/entities/*.ts` | 4h |
| Day 8-9 | Value Object実装 | `types/value-objects/*.ts` | 6h |
| Day 9 | Domain Entityユニットテスト | `tests/types/entities/*.test.ts` | 4h |
| Day 10 | Usecase層のEntity統合 | `server/usecases/snow/*.ts` 修正 | 4h |
| Day 10-11 | バリデーションロジック移行 | Domain層に移動 | 6h |
| Day 11 | E2Eテスト＆バグ修正 | Playwright全通過 | 4h |

**Week 3 ロールバックポイント**: `git tag stage-3-complete`

### Week 3末: 最終調整

| 日 | タスク | 成果物 | 推定時間 |
|----|--------|--------|----------|
| Day 12-13 | 旧コード削除＆クリーンアップ | 不要コード削除 | 6h |
| Day 13 | パフォーマンステスト | ベンチマーク結果 | 2h |
| Day 14 | ドキュメント更新 | README, 設計書更新 | 4h |
| Day 15 | 最終レビュー＆リリース準備 | リリースノート | 4h |

**最終タグ**: `git tag clean-architecture-v1.0`

---

## 3. Stage 1: Repository層実装

### 3.1 目的
データアクセス層を抽象化し、Infrastructure層（Supabase）への直接依存を排除する。

### 3.2 成果物
1. Repository インターフェース定義
2. Supabase実装クラス
3. Mock実装クラス（テスト用）
4. ユニットテスト
5. API層の統合

### 3.3 詳細タスク分解

#### Task 1.1: Repository インターフェース設計（4時間）

**目標**: データアクセスの契約を定義

**実装チェックリスト**:
- [ ] `types/repositories/ISnowReportRepository.ts` 作成
  ```typescript
  export interface ISnowReportRepository {
    findById(id: number): Promise<SnowReport | null>
    findAll(filters?: SnowReportFilters): Promise<SnowReport[]>
    findByArea(area: string): Promise<SnowReport[]>
    create(data: CreateSnowReportDto): Promise<SnowReport>
    update(id: number, data: UpdateSnowReportDto): Promise<SnowReport>
    delete(id: number): Promise<void>
  }
  ```
- [ ] `types/repositories/dtos/` ディレクトリ作成
- [ ] `CreateSnowReportDto`, `UpdateSnowReportDto`, `SnowReportFilters` 型定義
- [ ] JSDocコメント記述（各メソッドの責務を明記）
- [ ] エラーハンドリング仕様をコメントで明記

**品質基準**:
- [ ] 型安全性: すべての引数・戻り値に型注釈
- [ ] ドキュメント: JSDocで各メソッドの責務を記述
- [ ] 命名規則: 動詞+名詞の明確な命名

#### Task 1.2: Supabase Repository 実装（8時間）

**目標**: Supabaseを使ったRepository具象クラス実装

**実装チェックリスト**:
- [ ] `server/repositories/supabase/SnowReportRepository.ts` 作成
- [ ] `ISnowReportRepository` インターフェース実装
- [ ] エラーハンドリング実装
  - [ ] Supabaseエラーを Domain Error に変換
  - [ ] 適切なログ出力
- [ ] トランザクション対応（必要に応じて）
- [ ] ページネーション対応（`findAll`）
- [ ] ソート対応（`findAll`）

**実装例**:
```typescript
// server/repositories/supabase/SnowReportRepository.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ISnowReportRepository } from '~/types/repositories/ISnowReportRepository'

export class SnowReportRepository implements ISnowReportRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: number): Promise<SnowReport | null> {
    const { data, error } = await this.client
      .from('snow_reports')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new RepositoryError(`Failed to find snow report: ${error.message}`)
    }

    return data
  }

  async create(dto: CreateSnowReportDto): Promise<SnowReport> {
    const { data, error } = await this.client
      .from('snow_reports')
      .insert([{
        area: dto.area,
        start_time: dto.startTime,
        end_time: dto.endTime
      }])
      .select()
      .single()

    if (error) {
      throw new RepositoryError(`Failed to create snow report: ${error.message}`)
    }

    return data
  }

  // ... その他のメソッド
}
```

**品質基準**:
- [ ] すべてのインターフェースメソッドを実装
- [ ] エラーハンドリングの統一
- [ ] SQL Injectionなどセキュリティ考慮
- [ ] ログ出力の適切な配置

#### Task 1.3: Repository ユニットテスト（4時間）

**目標**: Repository層の動作保証

**実装チェックリスト**:
- [ ] `tests/server/repositories/SnowReportRepository.test.ts` 作成
- [ ] Mock Supabaseクライアントの作成
- [ ] 正常系テスト
  - [ ] `findById`: データが見つかる場合
  - [ ] `findAll`: 複数データの取得
  - [ ] `create`: 新規作成成功
  - [ ] `update`: 更新成功
  - [ ] `delete`: 削除成功
- [ ] 異常系テスト
  - [ ] `findById`: データが見つからない場合（null返却）
  - [ ] `create`: 制約違反エラー
  - [ ] `update`: 存在しないIDの更新
  - [ ] Supabaseエラーのハンドリング

**テスト例**:
```typescript
// tests/server/repositories/SnowReportRepository.test.ts
import { describe, it, expect, vi } from 'vitest'
import { SnowReportRepository } from '~/server/repositories/supabase/SnowReportRepository'

describe('SnowReportRepository', () => {
  it('findById should return snow report when found', async () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 1, area: '稚内市', start_time: '2024-01-01' },
              error: null
            })
          })
        })
      })
    }

    const repository = new SnowReportRepository(mockClient as any)
    const result = await repository.findById(1)

    expect(result).toEqual({ id: 1, area: '稚内市', start_time: '2024-01-01' })
  })

  it('findById should return null when not found', async () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' }
            })
          })
        })
      })
    }

    const repository = new SnowReportRepository(mockClient as any)
    const result = await repository.findById(999)

    expect(result).toBeNull()
  })

  // ... その他のテスト
})
```

**品質基準**:
- [ ] カバレッジ ≥ 80%
- [ ] すべてのpublicメソッドをテスト
- [ ] エッジケースのテスト
- [ ] テスト実行時間 < 100ms

#### Task 1.4: API層のRepository統合（4時間）

**目標**: 既存APIエンドポイントをRepository経由に変更

**実装チェックリスト**:
- [ ] `server/api/snow/create.ts` 修正
  - [ ] 直接Supabase呼び出しを削除
  - [ ] Repository経由でデータアクセス
- [ ] `server/api/snow/index.ts` 修正（一覧取得）
- [ ] `server/api/snow/[id].ts` 修正（詳細取得、更新、削除）
- [ ] DIコンテナ/Factory導入（Repository注入）
- [ ] エラーハンドリング調整

**修正例**:
```typescript
// server/api/snow/create.ts (修正後)
import { defineEventHandler, readBody, createError } from 'h3'
import { SnowReportRepository } from '~/server/repositories/supabase/SnowReportRepository'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const repository = new SnowReportRepository(supabase)

  const body = await readBody(event)

  // バリデーション
  if (!body.area || !body.start_time || !body.end_time) {
    throw createError({
      statusCode: 400,
      statusMessage: '入力データが不足しています。'
    })
  }

  try {
    const created = await repository.create({
      area: body.area,
      startTime: body.start_time,
      endTime: body.end_time
    })

    return { success: true, data: created }
  } catch (error) {
    console.error('Create API error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'データベースへの登録に失敗しました。'
    })
  }
})
```

**品質基準**:
- [ ] 直接Supabase呼び出しの完全削除
- [ ] Repository経由のデータアクセス
- [ ] エラーハンドリングの統一
- [ ] 既存APIの互換性維持

#### Task 1.5: 統合テスト＆バグ修正（4時間）

**目標**: APIエンドポイントの動作保証

**実装チェックリスト**:
- [ ] API統合テスト作成（`tests/server/api/snow/*.test.ts`）
- [ ] E2Eテスト実行（Playwright）
- [ ] 既存機能の動作確認
- [ ] パフォーマンステスト（レスポンスタイム）
- [ ] バグ修正＆リファクタリング

**品質基準**:
- [ ] すべてのAPIテストが通過
- [ ] E2Eテストが通過
- [ ] レスポンスタイム: 既存と同等以上
- [ ] メモリリーク確認

### 3.4 Stage 1 品質ゲート

**通過条件**:
- [ ] すべてのユニットテスト通過（カバレッジ ≥ 80%）
- [ ] すべての統合テスト通過
- [ ] E2Eテスト通過（既存機能の動作確認）
- [ ] TypeScriptコンパイルエラーなし
- [ ] ESLintエラーなし
- [ ] セルフチェック完了（コード品質、命名規則、ドキュメント）

**ロールバックポイント**:
```bash
git add .
git commit -m "feat: Stage 1 - Repository層実装完了"
git tag stage-1-complete
git push origin stage-1-complete
```

**KPI**:
- [ ] Repository層カバレッジ ≥ 80%
- [ ] API層テスト ≥ 80%
- [ ] TypeScript strict mode エラー 0件
- [ ] パフォーマンス劣化なし（既存比 100%±5%）

---

## 4. Stage 2: Usecase層実装

### 4.1 目的
ビジネスロジックを集約し、Application層を明確化する。

### 4.2 成果物
1. Usecase インターフェース＆実装
2. Input/Output DTO定義
3. ユニットテスト
4. API層のUsecase統合
5. Composable層のUsecase統合

### 4.3 詳細タスク分解

#### Task 2.1: Usecase設計（Input/Output DTO）（4時間）

**目標**: ビジネスロジックの契約を定義

**実装チェックリスト**:
- [ ] `types/usecases/snow/` ディレクトリ作成
- [ ] `CreateSnowReportUsecase.ts` インターフェース定義
  ```typescript
  export interface CreateSnowReportUsecase {
    execute(input: CreateSnowReportInput): Promise<CreateSnowReportOutput>
  }

  export interface CreateSnowReportInput {
    area: string
    startTime: string
    endTime: string
  }

  export interface CreateSnowReportOutput {
    success: boolean
    snowReport?: SnowReport
    error?: string
  }
  ```
- [ ] `GetSnowReportsUsecase.ts` インターフェース定義
- [ ] `UpdateSnowReportUsecase.ts` インターフェース定義
- [ ] `DeleteSnowReportUsecase.ts` インターフェース定義
- [ ] バリデーションルールの定義

**品質基準**:
- [ ] Input/Output DTOの型安全性
- [ ] JSDocによるユースケース説明
- [ ] ビジネスルールの明文化

#### Task 2.2: Usecase実装（Snow Report）（8時間）

**目標**: ビジネスロジックの具象実装

**実装チェックリスト**:
- [ ] `server/usecases/snow/CreateSnowReportUsecase.ts` 実装
  - [ ] Repositoryへの依存注入
  - [ ] ビジネスルールバリデーション
  - [ ] エラーハンドリング
  - [ ] ログ出力
- [ ] `server/usecases/snow/GetSnowReportsUsecase.ts` 実装
- [ ] `server/usecases/snow/UpdateSnowReportUsecase.ts` 実装
- [ ] `server/usecases/snow/DeleteSnowReportUsecase.ts` 実装

**実装例**:
```typescript
// server/usecases/snow/CreateSnowReportUsecase.ts
import type { ISnowReportRepository } from '~/types/repositories/ISnowReportRepository'
import type { CreateSnowReportInput, CreateSnowReportOutput } from '~/types/usecases/snow/CreateSnowReportUsecase'

export class CreateSnowReportUsecase {
  constructor(
    private readonly repository: ISnowReportRepository
  ) {}

  async execute(input: CreateSnowReportInput): Promise<CreateSnowReportOutput> {
    try {
      // ビジネスルールバリデーション
      this.validateInput(input)

      // Repositoryを使ってデータ作成
      const snowReport = await this.repository.create({
        area: input.area,
        startTime: input.startTime,
        endTime: input.endTime
      })

      return {
        success: true,
        snowReport
      }
    } catch (error) {
      console.error('CreateSnowReportUsecase error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラー'
      }
    }
  }

  private validateInput(input: CreateSnowReportInput): void {
    if (!input.area || input.area.trim().length === 0) {
      throw new Error('地域名は必須です')
    }

    const startTime = new Date(input.startTime)
    const endTime = new Date(input.endTime)

    if (isNaN(startTime.getTime())) {
      throw new Error('開始時間が不正です')
    }

    if (isNaN(endTime.getTime())) {
      throw new Error('終了時間が不正です')
    }

    if (endTime <= startTime) {
      throw new Error('終了時間は開始時間より後である必要があります')
    }
  }
}
```

**品質基準**:
- [ ] Repository依存の注入
- [ ] ビジネスルールの集約
- [ ] 適切なエラーハンドリング
- [ ] ログ出力の統一

#### Task 2.3: Usecaseユニットテスト（4時間）

**目標**: ビジネスロジックの動作保証

**実装チェックリスト**:
- [ ] `tests/server/usecases/snow/CreateSnowReportUsecase.test.ts` 作成
- [ ] Mock Repositoryの作成
- [ ] 正常系テスト
  - [ ] 正常な入力での作成成功
  - [ ] Repository呼び出しの検証
- [ ] 異常系テスト
  - [ ] 空の地域名でエラー
  - [ ] 不正な時間フォーマットでエラー
  - [ ] 終了時間 ≤ 開始時間でエラー
  - [ ] Repository例外のハンドリング

**テスト例**:
```typescript
// tests/server/usecases/snow/CreateSnowReportUsecase.test.ts
import { describe, it, expect, vi } from 'vitest'
import { CreateSnowReportUsecase } from '~/server/usecases/snow/CreateSnowReportUsecase'

describe('CreateSnowReportUsecase', () => {
  it('should create snow report successfully', async () => {
    const mockRepository = {
      create: vi.fn().mockResolvedValue({
        id: 1,
        area: '稚内市',
        start_time: '2024-01-01T10:00:00Z',
        end_time: '2024-01-01T12:00:00Z'
      })
    }

    const usecase = new CreateSnowReportUsecase(mockRepository as any)
    const result = await usecase.execute({
      area: '稚内市',
      startTime: '2024-01-01T10:00:00Z',
      endTime: '2024-01-01T12:00:00Z'
    })

    expect(result.success).toBe(true)
    expect(result.snowReport).toBeDefined()
    expect(mockRepository.create).toHaveBeenCalled()
  })

  it('should fail when area is empty', async () => {
    const mockRepository = { create: vi.fn() }
    const usecase = new CreateSnowReportUsecase(mockRepository as any)

    const result = await usecase.execute({
      area: '',
      startTime: '2024-01-01T10:00:00Z',
      endTime: '2024-01-01T12:00:00Z'
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('地域名は必須')
    expect(mockRepository.create).not.toHaveBeenCalled()
  })

  it('should fail when endTime <= startTime', async () => {
    const mockRepository = { create: vi.fn() }
    const usecase = new CreateSnowReportUsecase(mockRepository as any)

    const result = await usecase.execute({
      area: '稚内市',
      startTime: '2024-01-01T12:00:00Z',
      endTime: '2024-01-01T10:00:00Z'
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('終了時間は開始時間より後')
  })

  // ... その他のテスト
})
```

**品質基準**:
- [ ] カバレッジ ≥ 80%
- [ ] ビジネスルール全パターンのテスト
- [ ] エラーハンドリングの検証

#### Task 2.4: API層のUsecase統合（4時間）

**目標**: APIエンドポイントをUsecase経由に変更

**実装チェックリスト**:
- [ ] `server/api/snow/create.ts` 修正
  - [ ] Usecaseインスタンス生成
  - [ ] Usecase.execute()呼び出し
  - [ ] レスポンス変換
- [ ] `server/api/snow/index.ts` 修正
- [ ] `server/api/snow/[id].ts` 修正
- [ ] Factory/DIコンテナ導入（Usecase + Repository注入）

**修正例**:
```typescript
// server/api/snow/create.ts (Usecase統合後)
import { defineEventHandler, readBody, createError } from 'h3'
import { SnowReportRepository } from '~/server/repositories/supabase/SnowReportRepository'
import { CreateSnowReportUsecase } from '~/server/usecases/snow/CreateSnowReportUsecase'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const repository = new SnowReportRepository(supabase)
  const usecase = new CreateSnowReportUsecase(repository)

  const body = await readBody(event)

  const result = await usecase.execute({
    area: body.area,
    startTime: body.start_time,
    endTime: body.end_time
  })

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error
    })
  }

  return { success: true, data: result.snowReport }
})
```

**品質基準**:
- [ ] ビジネスロジックの完全削除（API層から）
- [ ] Usecase経由のビジネスロジック実行
- [ ] 薄いプレゼンテーション層（入出力変換のみ）

#### Task 2.5: Composable層のUsecase統合（6時間）

**目標**: フロントエンドのビジネスロジックをUsecase経由に変更

**実装チェックリスト**:
- [ ] `composables/forms/useSnowReportForm.ts` 修正
  - [ ] 直接API呼び出しからUsecase呼び出しへ
  - [ ] バリデーションロジックの削除（Usecaseに移譲）
  - [ ] UI関心事とビジネスロジックの分離
- [ ] `composables/snow/useSnowReports.ts` 修正（一覧取得）
- [ ] エラーハンドリングの統一

**修正例**:
```typescript
// composables/forms/useSnowReportForm.ts (Usecase統合後)
export const useSnowReportForm = () => {
  const formData = ref({
    area: '',
    start_time: '',
    end_time: ''
  })

  const isSubmitting = ref(false)
  const errors = ref<string[]>([])

  const submitForm = async () => {
    isSubmitting.value = true
    errors.value = []

    try {
      // Usecase経由でビジネスロジック実行
      const response = await $fetch('/api/snow/create', {
        method: 'POST',
        body: {
          area: formData.value.area,
          start_time: formData.value.start_time,
          end_time: formData.value.end_time
        }
      })

      if (response.success) {
        alert('除雪情報を登録しました')
        // フォームリセット
        formData.value = { area: '', start_time: '', end_time: '' }
      }
    } catch (error: any) {
      // エラーハンドリング
      errors.value = [error.data?.statusMessage || '登録に失敗しました']
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    formData,
    isSubmitting,
    errors,
    submitForm
  }
}
```

**品質基準**:
- [ ] バリデーションロジックの削除（Usecaseに委譲）
- [ ] UI関心事のみ保持（ローディング状態、エラー表示）
- [ ] 薄いプレゼンテーション層

#### Task 2.6: 統合テスト＆バグ修正（2時間）

**目標**: 全体の動作保証

**実装チェックリスト**:
- [ ] E2Eテスト実行（Playwright）
- [ ] API統合テスト
- [ ] フロントエンド動作確認
- [ ] バグ修正＆リファクタリング

**品質基準**:
- [ ] すべてのテスト通過
- [ ] 既存機能の動作確認
- [ ] パフォーマンス確認

### 4.4 Stage 2 品質ゲート

**通過条件**:
- [ ] すべてのユニットテスト通過（カバレッジ ≥ 80%）
- [ ] すべての統合テスト通過
- [ ] E2Eテスト通過
- [ ] TypeScriptコンパイルエラーなし
- [ ] ESLintエラーなし
- [ ] セルフチェック完了

**ロールバックポイント**:
```bash
git add .
git commit -m "feat: Stage 2 - Usecase層実装完了"
git tag stage-2-complete
git push origin stage-2-complete
```

**KPI**:
- [ ] Usecase層カバレッジ ≥ 80%
- [ ] API層のビジネスロジック 0行（すべてUsecase移行）
- [ ] Composable層のビジネスロジック 0行（すべてUsecase移行）
- [ ] TypeScript strict mode エラー 0件

---

## 5. Stage 3: Domain層強化

### 5.1 目的
ビジネスルールをDomain層に集約し、型定義以上の責務を持たせる。

### 5.2 成果物
1. Domain Entity実装
2. Value Object実装
3. Domain Service実装
4. ユニットテスト
5. Usecase層のEntity統合

### 5.3 詳細タスク分解

#### Task 3.1: Domain Entity設計（4時間）

**目標**: ビジネスルールを持つエンティティ設計

**実装チェックリスト**:
- [ ] `types/entities/SnowReportEntity.ts` 作成
  ```typescript
  export class SnowReportEntity {
    private constructor(
      public readonly id: number,
      public readonly area: Area, // Value Object
      public readonly period: Period, // Value Object
      public readonly createdAt: Date
    ) {}

    static create(params: {
      area: string
      startTime: Date
      endTime: Date
    }): SnowReportEntity {
      const area = Area.create(params.area)
      const period = Period.create(params.startTime, params.endTime)

      return new SnowReportEntity(
        0, // IDは永続化時に採番
        area,
        period,
        new Date()
      )
    }

    static reconstruct(params: {
      id: number
      area: string
      startTime: Date
      endTime: Date
      createdAt: Date
    }): SnowReportEntity {
      return new SnowReportEntity(
        params.id,
        Area.create(params.area),
        Period.create(params.startTime, params.endTime),
        params.createdAt
      )
    }

    get isActive(): boolean {
      return this.period.isActive()
    }

    get durationHours(): number {
      return this.period.durationHours
    }
  }
  ```
- [ ] エンティティの不変性保証（private constructor）
- [ ] ファクトリーメソッド実装（create, reconstruct）
- [ ] ビジネスルールメソッド実装（isActive, durationHours）

**品質基準**:
- [ ] 不変性の保証
- [ ] ビジネスルールの明文化
- [ ] Value Objectへの委譲

#### Task 3.2: Value Object実装（6時間）

**目標**: ドメイン概念の明示化

**実装チェックリスト**:
- [ ] `types/value-objects/Area.ts` 実装
  ```typescript
  export class Area {
    private constructor(public readonly value: string) {}

    static create(value: string): Area {
      if (!value || value.trim().length === 0) {
        throw new Error('地域名は必須です')
      }

      if (value.length > 50) {
        throw new Error('地域名は50文字以内です')
      }

      return new Area(value.trim())
    }

    equals(other: Area): boolean {
      return this.value === other.value
    }
  }
  ```
- [ ] `types/value-objects/Period.ts` 実装
  ```typescript
  export class Period {
    private constructor(
      public readonly startTime: Date,
      public readonly endTime: Date
    ) {}

    static create(startTime: Date, endTime: Date): Period {
      if (!(startTime instanceof Date) || isNaN(startTime.getTime())) {
        throw new Error('開始時間が不正です')
      }

      if (!(endTime instanceof Date) || isNaN(endTime.getTime())) {
        throw new Error('終了時間が不正です')
      }

      if (endTime <= startTime) {
        throw new Error('終了時間は開始時間より後である必要があります')
      }

      return new Period(startTime, endTime)
    }

    get durationHours(): number {
      const diff = this.endTime.getTime() - this.startTime.getTime()
      return diff / (1000 * 60 * 60)
    }

    isActive(): boolean {
      const now = new Date()
      return this.startTime <= now && now <= this.endTime
    }

    equals(other: Period): boolean {
      return this.startTime.getTime() === other.startTime.getTime() &&
             this.endTime.getTime() === other.endTime.getTime()
    }
  }
  ```

**品質基準**:
- [ ] 不変性の保証
- [ ] バリデーションロジックの集約
- [ ] equals()メソッドの実装

#### Task 3.3: Domain Entityユニットテスト（4時間）

**目標**: Domain層の動作保証

**実装チェックリスト**:
- [ ] `tests/types/entities/SnowReportEntity.test.ts` 作成
- [ ] `tests/types/value-objects/Area.test.ts` 作成
- [ ] `tests/types/value-objects/Period.test.ts` 作成
- [ ] 正常系テスト
  - [ ] Entity生成成功
  - [ ] Value Object生成成功
  - [ ] ビジネスルールメソッドの検証
- [ ] 異常系テスト
  - [ ] 不正な値での生成失敗
  - [ ] バリデーションエラーの検証

**テスト例**:
```typescript
// tests/types/value-objects/Period.test.ts
import { describe, it, expect } from 'vitest'
import { Period } from '~/types/value-objects/Period'

describe('Period', () => {
  it('should create period successfully', () => {
    const start = new Date('2024-01-01T10:00:00Z')
    const end = new Date('2024-01-01T12:00:00Z')

    const period = Period.create(start, end)

    expect(period.startTime).toEqual(start)
    expect(period.endTime).toEqual(end)
  })

  it('should throw error when endTime <= startTime', () => {
    const start = new Date('2024-01-01T12:00:00Z')
    const end = new Date('2024-01-01T10:00:00Z')

    expect(() => Period.create(start, end))
      .toThrow('終了時間は開始時間より後である必要があります')
  })

  it('should calculate duration in hours', () => {
    const start = new Date('2024-01-01T10:00:00Z')
    const end = new Date('2024-01-01T12:00:00Z')

    const period = Period.create(start, end)

    expect(period.durationHours).toBe(2)
  })

  it('should check if period is active', () => {
    const now = new Date()
    const past = new Date(now.getTime() - 1000 * 60 * 60) // 1時間前
    const future = new Date(now.getTime() + 1000 * 60 * 60) // 1時間後

    const activePeriod = Period.create(past, future)
    const inactivePeriod = Period.create(
      new Date(past.getTime() - 1000 * 60 * 60 * 2),
      past
    )

    expect(activePeriod.isActive()).toBe(true)
    expect(inactivePeriod.isActive()).toBe(false)
  })
})
```

**品質基準**:
- [ ] カバレッジ ≥ 90%（Domain層は高品質要求）
- [ ] すべてのビジネスルールをテスト
- [ ] エッジケースの網羅

#### Task 3.4: Usecase層のEntity統合（4時間）

**目標**: UsecaseでEntityを使用

**実装チェックリスト**:
- [ ] `server/usecases/snow/CreateSnowReportUsecase.ts` 修正
  - [ ] SnowReportEntity.create()を使用
  - [ ] バリデーションロジックをEntity/Value Objectに委譲
- [ ] Repository層のDTO変換調整
  - [ ] Entity ⇔ DTO変換ロジック
- [ ] その他Usecaseの修正

**修正例**:
```typescript
// server/usecases/snow/CreateSnowReportUsecase.ts (Entity統合後)
import { SnowReportEntity } from '~/types/entities/SnowReportEntity'

export class CreateSnowReportUsecase {
  constructor(
    private readonly repository: ISnowReportRepository
  ) {}

  async execute(input: CreateSnowReportInput): Promise<CreateSnowReportOutput> {
    try {
      // Entityを生成（バリデーション含む）
      const entity = SnowReportEntity.create({
        area: input.area,
        startTime: new Date(input.startTime),
        endTime: new Date(input.endTime)
      })

      // Repositoryに永続化
      const created = await this.repository.create({
        area: entity.area.value,
        startTime: entity.period.startTime.toISOString(),
        endTime: entity.period.endTime.toISOString()
      })

      return {
        success: true,
        snowReport: created
      }
    } catch (error) {
      console.error('CreateSnowReportUsecase error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラー'
      }
    }
  }
}
```

**品質基準**:
- [ ] バリデーションロジックの完全削除（Usecaseから）
- [ ] Entity/Value Objectへの委譲
- [ ] 薄いApplication層

#### Task 3.5: バリデーションロジック移行（6時間）

**目標**: すべてのバリデーションをDomain層に集約

**実装チェックリスト**:
- [ ] `utils/validators.ts` 見直し
  - [ ] Domain関心事 → Entity/Value Objectに移行
  - [ ] UI関心事 → そのまま保持
- [ ] Usecase層のバリデーション削除
- [ ] API層のバリデーション削除
- [ ] Composable層のバリデーション削除

**品質基準**:
- [ ] Domain層に100%バリデーション集約
- [ ] 重複バリデーションの削除
- [ ] 一貫したエラーメッセージ

#### Task 3.6: E2Eテスト＆バグ修正（4時間）

**目標**: 全体の動作保証

**実装チェックリスト**:
- [ ] E2Eテスト実行（Playwright）
- [ ] すべての層の統合確認
- [ ] パフォーマンステスト
- [ ] バグ修正＆リファクタリング

**品質基準**:
- [ ] すべてのテスト通過
- [ ] 既存機能の完全動作
- [ ] パフォーマンス維持

### 5.4 Stage 3 品質ゲート

**通過条件**:
- [ ] すべてのユニットテスト通過（カバレッジ ≥ 90%）
- [ ] すべての統合テスト通過
- [ ] E2Eテスト通過
- [ ] TypeScriptコンパイルエラーなし
- [ ] ESLintエラーなし
- [ ] セルフチェック完了

**ロールバックポイント**:
```bash
git add .
git commit -m "feat: Stage 3 - Domain層強化完了"
git tag stage-3-complete
git push origin stage-3-complete
```

**KPI**:
- [ ] Domain層カバレッジ ≥ 90%
- [ ] バリデーションロジックの100% Domain層集約
- [ ] Usecase層のバリデーション 0行
- [ ] TypeScript strict mode エラー 0件

---

## 6. リスク管理

### 6.1 リスク評価

| リスク | 発生確率 | 影響度 | 優先度 | 対策 |
|--------|----------|--------|--------|------|
| 既存機能の破壊 | 中 | 高 | 🔴 | テストファースト、段階的移行 |
| パフォーマンス劣化 | 低 | 中 | 🟡 | ベンチマーク、最適化 |
| スケジュール遅延 | 中 | 中 | 🟡 | バッファ確保、優先度調整 |
| TypeScriptエラー増加 | 中 | 低 | 🟢 | strict mode段階適用 |
| テストメンテナンスコスト | 低 | 低 | 🟢 | テスト設計の見直し |

### 6.2 対策

#### リスク1: 既存機能の破壊
**対策**:
- テストファースト開発（実装前にテスト作成）
- 段階的移行（一度にすべて変更しない）
- E2Eテストの充実（ユーザー視点の動作保証）
- ロールバックポイントの設定（各Stageでタグ作成）

**検知方法**:
- CI/CDでの自動テスト実行
- 手動動作確認（各Stage完了時）
- ユーザーフィードバック（可能なら）

#### リスク2: パフォーマンス劣化
**対策**:
- ベンチマークテストの実施（各Stage前後）
- レスポンスタイム計測
- N+1クエリのチェック
- 必要に応じた最適化

**許容範囲**:
- レスポンスタイム: 既存比 ±10%
- メモリ使用量: 既存比 +20%以内

#### リスク3: スケジュール遅延
**対策**:
- 各Stageに20%のバッファ確保
- 優先度の高いStageから実施（Stage 1 > Stage 2 > Stage 3）
- 必要に応じてStage 3を後回し

**エスカレーション基準**:
- 1Stage遅延が2日以上の場合、スコープ見直し
- 全体で1週間以上遅延の場合、Stage 3の延期検討

### 6.3 ロールバック戦略

#### ロールバックトリガー
- クリティカルバグの発生（データ損失、セキュリティ脆弱性）
- パフォーマンス劣化が20%以上
- E2Eテストの50%以上が失敗
- スケジュール遅延が2週間以上

#### ロールバック手順

**Stage 1でのロールバック**:
```bash
git checkout main
git revert <commit-hash-range>
# または
git reset --hard <previous-tag>
git push origin main --force  # 注意: 慎重に実施
```

**Stage 2でのロールバック**:
- Stage 2のみロールバック: `git revert` でStage 2のコミットを打ち消し
- Stage 1に戻る: `git reset --hard stage-1-complete`

**Stage 3でのロールバック**:
- Stage 3のみロールバック: `git revert` でStage 3のコミットを打ち消し
- Stage 2に戻る: `git reset --hard stage-2-complete`

**データベースロールバック**:
- マイグレーションがある場合は、ロールバックスクリプト実行
- Supabaseの場合、スナップショットから復元

#### ロールバック後の対応
1. 問題の根本原因分析
2. 修正計画の立案
3. 再実施のタイミング決定
4. テスト強化

---

## 7. 成功基準とKPI

### 7.1 Stage別成功基準

#### Stage 1: Repository層
- [ ] Repository層カバレッジ ≥ 80%
- [ ] API層テストカバレッジ ≥ 80%
- [ ] 直接Supabase呼び出し 0件（API層から）
- [ ] TypeScript strict mode エラー 0件
- [ ] パフォーマンス劣化なし（既存比 100%±5%）

#### Stage 2: Usecase層
- [ ] Usecase層カバレッジ ≥ 80%
- [ ] API層のビジネスロジック 0行
- [ ] Composable層のビジネスロジック 0行
- [ ] TypeScript strict mode エラー 0件
- [ ] E2Eテスト通過率 100%

#### Stage 3: Domain層
- [ ] Domain層カバレッジ ≥ 90%
- [ ] バリデーションロジックの100% Domain層集約
- [ ] Usecase層のバリデーション 0行
- [ ] TypeScript strict mode エラー 0件
- [ ] ドキュメント更新完了

### 7.2 プロジェクト全体KPI

**品質指標**:
- [ ] 総合テストカバレッジ ≥ 85%
- [ ] TypeScript strict mode エラー 0件
- [ ] ESLintエラー 0件
- [ ] E2Eテスト通過率 100%

**アーキテクチャ指標**:
- [ ] Clean Architecture準拠度: 4.5/10 → 8.5/10
- [ ] Repository層の完全実装
- [ ] Usecase層の完全実装
- [ ] Domain層の強化（Entity, Value Object）

**パフォーマンス指標**:
- [ ] APIレスポンスタイム: 既存比 100%±10%
- [ ] フロントエンドレンダリング時間: 既存比 100%±10%
- [ ] メモリ使用量: 既存比 +20%以内

**メンテナンス性指標**:
- [ ] 循環的複雑度: 平均 ≤ 10
- [ ] 関数あたりの平均行数: ≤ 30行
- [ ] ファイルあたりの平均行数: ≤ 300行

---

## 8. 付録

### 8.1 ディレクトリ構造（目標）

```
WakkanaiJosetsuInfo/
├── types/                       # Domain層
│   ├── entities/                # エンティティ
│   │   └── SnowReportEntity.ts
│   ├── value-objects/           # 値オブジェクト
│   │   ├── Area.ts
│   │   └── Period.ts
│   └── repositories/            # Repositoryインターフェース
│       ├── ISnowReportRepository.ts
│       └── dtos/
│           ├── CreateSnowReportDto.ts
│           └── UpdateSnowReportDto.ts
├── server/                      # Application & Infrastructure層
│   ├── usecases/                # Application層 - ビジネスロジック
│   │   └── snow/
│   │       ├── CreateSnowReportUsecase.ts
│   │       ├── GetSnowReportsUsecase.ts
│   │       ├── UpdateSnowReportUsecase.ts
│   │       └── DeleteSnowReportUsecase.ts
│   ├── repositories/            # Infrastructure層 - データアクセス
│   │   └── supabase/
│   │       └── SnowReportRepository.ts
│   └── api/                     # Presentation層 - API
│       └── snow/
│           ├── index.ts
│           ├── create.ts
│           └── [id].ts
├── composables/                 # Presentation層 - フロントエンド
│   └── forms/
│       └── useSnowReportForm.ts
├── pages/                       # Presentation層 - ページ
│   └── josetsu.vue
├── components/                  # Presentation層 - コンポーネント
│   └── feature/
│       └── snow/
│           └── SnowReportForm.vue
└── tests/                       # テスト
    ├── types/
    │   ├── entities/
    │   └── value-objects/
    ├── server/
    │   ├── usecases/
    │   ├── repositories/
    │   └── api/
    └── e2e/
        └── snow-report.spec.ts
```

### 8.2 依存関係図

```
┌─────────────────────────────────────────┐
│        Presentation Layer               │
│  (pages, components, composables, API)  │
└──────────────┬──────────────────────────┘
               │ depends on
               ▼
┌─────────────────────────────────────────┐
│        Application Layer                │
│           (Usecases)                    │
└──────────────┬──────────────────────────┘
               │ depends on
               ▼
┌─────────────────────────────────────────┐
│          Domain Layer                   │
│  (Entities, Value Objects, Interfaces)  │
└─────────────────────────────────────────┘
               ▲
               │ implements
               │
┌──────────────┴──────────────────────────┐
│      Infrastructure Layer               │
│       (Repositories - Supabase)         │
└─────────────────────────────────────────┘
```

**依存関係ルール**:
1. 外側の層は内側の層に依存できる
2. 内側の層は外側の層に依存してはいけない
3. Infrastructure層はDomain層のインターフェースを実装する
4. Presentation層はApplication層（Usecase）経由でDomain層にアクセスする

### 8.3 実装例集

#### Repository実装例
```typescript
// server/repositories/supabase/SnowReportRepository.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ISnowReportRepository } from '~/types/repositories/ISnowReportRepository'
import type { SnowReport } from '~/types/snow'

export class SnowReportRepository implements ISnowReportRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: number): Promise<SnowReport | null> {
    const { data, error } = await this.client
      .from('snow_reports')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new RepositoryError(`Failed to find snow report: ${error.message}`)
    }

    return data
  }

  async findAll(filters?: SnowReportFilters): Promise<SnowReport[]> {
    let query = this.client.from('snow_reports').select('*')

    if (filters?.area) {
      query = query.eq('area', filters.area)
    }

    if (filters?.startDate) {
      query = query.gte('start_time', filters.startDate)
    }

    if (filters?.endDate) {
      query = query.lte('end_time', filters.endDate)
    }

    const { data, error } = await query.order('start_time', { ascending: false })

    if (error) {
      throw new RepositoryError(`Failed to find snow reports: ${error.message}`)
    }

    return data || []
  }

  async create(dto: CreateSnowReportDto): Promise<SnowReport> {
    const { data, error } = await this.client
      .from('snow_reports')
      .insert([{
        area: dto.area,
        start_time: dto.startTime,
        end_time: dto.endTime
      }])
      .select()
      .single()

    if (error) {
      throw new RepositoryError(`Failed to create snow report: ${error.message}`)
    }

    return data
  }

  async update(id: number, dto: UpdateSnowReportDto): Promise<SnowReport> {
    const { data, error } = await this.client
      .from('snow_reports')
      .update({
        area: dto.area,
        start_time: dto.startTime,
        end_time: dto.endTime
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new RepositoryError(`Failed to update snow report: ${error.message}`)
    }

    return data
  }

  async delete(id: number): Promise<void> {
    const { error } = await this.client
      .from('snow_reports')
      .delete()
      .eq('id', id)

    if (error) {
      throw new RepositoryError(`Failed to delete snow report: ${error.message}`)
    }
  }
}
```

#### Usecase実装例
```typescript
// server/usecases/snow/GetSnowReportsUsecase.ts
import type { ISnowReportRepository } from '~/types/repositories/ISnowReportRepository'
import type { GetSnowReportsInput, GetSnowReportsOutput } from '~/types/usecases/snow/GetSnowReportsUsecase'

export class GetSnowReportsUsecase {
  constructor(
    private readonly repository: ISnowReportRepository
  ) {}

  async execute(input: GetSnowReportsInput): Promise<GetSnowReportsOutput> {
    try {
      const filters = {
        area: input.area,
        startDate: input.startDate,
        endDate: input.endDate
      }

      const snowReports = await this.repository.findAll(filters)

      // ビジネスロジック: 進行中の除雪を優先表示
      const sorted = this.sortByStatus(snowReports)

      return {
        success: true,
        snowReports: sorted,
        totalCount: sorted.length
      }
    } catch (error) {
      console.error('GetSnowReportsUsecase error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラー',
        snowReports: [],
        totalCount: 0
      }
    }
  }

  private sortByStatus(reports: SnowReport[]): SnowReport[] {
    const now = new Date()

    return reports.sort((a, b) => {
      const aActive = new Date(a.start_time) <= now && now <= new Date(a.end_time)
      const bActive = new Date(b.start_time) <= now && now <= new Date(b.end_time)

      if (aActive && !bActive) return -1
      if (!aActive && bActive) return 1

      return new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    })
  }
}
```

#### Domain Entity実装例
```typescript
// types/entities/SnowReportEntity.ts
import { Area } from '~/types/value-objects/Area'
import { Period } from '~/types/value-objects/Period'

export class SnowReportEntity {
  private constructor(
    public readonly id: number,
    public readonly area: Area,
    public readonly period: Period,
    public readonly createdAt: Date
  ) {}

  /**
   * 新規エンティティを生成
   */
  static create(params: {
    area: string
    startTime: Date
    endTime: Date
  }): SnowReportEntity {
    const area = Area.create(params.area)
    const period = Period.create(params.startTime, params.endTime)

    return new SnowReportEntity(
      0, // IDは永続化時に採番
      area,
      period,
      new Date()
    )
  }

  /**
   * 既存エンティティを再構築（DBから取得時）
   */
  static reconstruct(params: {
    id: number
    area: string
    startTime: Date
    endTime: Date
    createdAt: Date
  }): SnowReportEntity {
    return new SnowReportEntity(
      params.id,
      Area.create(params.area),
      Period.create(params.startTime, params.endTime),
      params.createdAt
    )
  }

  /**
   * 除雪が進行中かどうか
   */
  get isActive(): boolean {
    return this.period.isActive()
  }

  /**
   * 除雪作業時間（時間）
   */
  get durationHours(): number {
    return this.period.durationHours
  }

  /**
   * 除雪作業が完了しているか
   */
  get isCompleted(): boolean {
    const now = new Date()
    return this.period.endTime < now
  }

  /**
   * エンティティの等価性チェック
   */
  equals(other: SnowReportEntity): boolean {
    return this.id === other.id &&
           this.area.equals(other.area) &&
           this.period.equals(other.period)
  }

  /**
   * プリミティブオブジェクトへの変換（永続化用）
   */
  toPrimitives(): {
    id: number
    area: string
    start_time: string
    end_time: string
    created_at: string
  } {
    return {
      id: this.id,
      area: this.area.value,
      start_time: this.period.startTime.toISOString(),
      end_time: this.period.endTime.toISOString(),
      created_at: this.createdAt.toISOString()
    }
  }
}
```

### 8.4 参考資料

#### クリーンアーキテクチャ
- [Clean Architecture（Robert C. Martin）](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [実践クリーンアーキテクチャ](https://nrslib.com/clean-architecture/)

#### Domain-Driven Design (DDD)
- [ドメイン駆動設計入門（成瀬允宣）](https://www.shoeisha.co.jp/book/detail/9784798150727)
- [エリック・エヴァンスのドメイン駆動設計](https://www.shoeisha.co.jp/book/detail/9784798121963)

#### TypeScript
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [TypeScript公式ドキュメント](https://www.typescriptlang.org/docs/)

#### Nuxt 3
- [Nuxt 3公式ドキュメント](https://nuxt.com/docs)
- [Nuxt 3でのクリーンアーキテクチャ実装](https://zenn.dev/topics/nuxt3)

#### テスト
- [Vitest公式ドキュメント](https://vitest.dev/)
- [Playwright公式ドキュメント](https://playwright.dev/)

### 8.5 よくある質問

**Q1: Nuxt 3のauto-importとクリーンアーキテクチャの相性は？**
A: auto-importは維持できます。composables/、utils/、types/配下は自動インポート対象のまま、クリーンアーキテクチャの各層に配置できます。server/配下はauto-importされませんが、明示的インポートで問題ありません。

**Q2: Repositoryパターンは必須？**
A: Supabaseへの直接依存を排除するために必須です。将来的にデータソースを変更する可能性がある場合、Repositoryパターンは大きなメリットをもたらします。

**Q3: Value Objectは本当に必要？**
A: 小規模プロジェクトでは過剰に感じるかもしれませんが、バリデーションロジックの集約、型安全性の向上、ビジネスルールの明示化というメリットがあります。Area、Periodなどの重要な概念は Value Object化を推奨します。

**Q4: テストカバレッジ80%は現実的？**
A: TDD（テストファースト）で実装すれば達成可能です。むしろ、テストなしで実装してから後からテストを書くほうが大変です。

**Q5: パフォーマンスが心配です**
A: クリーンアーキテクチャ自体はパフォーマンスを劣化させません。適切な設計（N+1クエリの回避、キャッシュ戦略）により、むしろ改善することもあります。各Stage完了時にベンチマークを実施してください。

**Q6: スケジュール通りに終わらない場合は？**
A: Stage 1, 2は必須ですが、Stage 3は延期可能です。まずはRepository層とUsecase層の実装を優先してください。Domain層の強化は後からでも可能です。

**Q7: 既存のcomposablesはどうすればいい？**
A: notifications/のように、infrastructure/、services/に分けて整理されているものはそのまま維持できます。ただし、forms/配下のビジネスロジックはUsecase層に移行してください。

**Q8: Nuxt serverディレクトリの制約は？**
A: Nuxt 3のserver/ディレクトリは、api/、middleware/、plugins/などの規約がありますが、usecases/、repositories/などのカスタムディレクトリも配置可能です。

**Q9: DIコンテナは導入すべき？**
A: 初期段階では不要です。Factory関数やシンプルなコンストラクタ注入で十分です。プロジェクトが大規模化したらTSyringeなどのDIコンテナ導入を検討してください。

**Q10: この実装で本当にクリーンアーキテクチャ？**
A: 100%教科書的なクリーンアーキテクチャではありませんが、Nuxt 3フレームワークの制約を考慮した実用的なアプローチです。依存関係の逆転、関心の分離、テスタビリティといった本質的な原則は守られています。

---

**ドキュメント作成日**: 2025-11-17
**対象プロジェクト**: WakkanaiJosetsuInfo
**対象バージョン**: Phase 2++（TypeScriptエラー18件の状態から）
**想定開発者**: ソロ開発者

