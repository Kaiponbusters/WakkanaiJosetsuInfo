# ディレクトリ整理 Phase 2 実行計画

## 策定日時
2025-11-11

## 分析結果サマリー

### 包括的分析の実施
- **プロジェクト構造**: 全ディレクトリの詳細分析完了
- **Nuxt 3ベストプラクティス**: Context7から公式ドキュメント取得・照合
- **既存メモリ**: Phase 1完了記録、コードベース構造を参照
- **複雑性スコア**: 0.8（高複雑性）→ Serena MCP使用推奨

### 特定された問題点

#### 🔴 変更が必要（2件）

**1. types/の分割問題**
- **現状**: server/types/snow.ts（サーバー側）、types/（クライアント側）に分散
- **問題**: Nuxt 3では型定義は自動的にクライアント/サーバーで分離されるため、明示的な分割は不要かつ複雑性を増す
- **影響**: 型定義の発見性低下、保守コスト増加

**2. providers/の単独配置**
- **現状**: providers/NominatimProvider.ts（1ファイルのみ）
- **問題**: 単一ファイルのためにディレクトリ作成、地理情報関連なのにcomposables/geocoding/から分離
- **影響**: ドメイン凝集度の低下、発見性の問題

#### ✅ 変更不要（適切に配置）

- **utils/**: 純粋関数、状態なし → 適切
- **composables/**: Composition API、状態管理 → 適切
- **constants/**: 将来の拡張性考慮 → 適切
- **assets/とpublic/**: Nuxt 3ベストプラクティス準拠 → 適切
- **tests/**: CI/CD影響大、現状で良好 → Phase 1の教訓により変更しない

## Phase 2: コードディレクトリの最適化

### 基本方針（Phase 1の教訓を適用）

1. ✅ **行動の分離**: ディレクトリ整理のみ、コード変更最小化
2. ✅ **段階的な整理**: 2つの変更のみ実施
3. ✅ **価値ベース**: コードベースの明確性と発見性の向上
4. ✅ **リスク最小化**: 影響範囲の小さい変更から着手

### 変更1: types/の統合

#### Before
```
types/
├── notification.ts
└── assets.d.ts

server/
└── types/
    └── snow.ts
```

#### After
```
types/
├── notification.ts
├── snow.ts          # ← 移動
└── assets.d.ts

server/types/        # ← ディレクトリ削除
```

#### 期待される効果
- 型定義の一元管理
- Nuxt 3ベストプラクティス準拠
- 発見性の向上

#### 影響範囲
- server/api/snow/*.ts: インポートパス変更
- tests/unit/providers/: 型インポート変更
- **推定**: 5-10ファイル
- **リスク**: 低（型定義のみ、LSP追跡容易）

### 変更2: NominatimProviderの移動

#### Before
```
providers/
└── NominatimProvider.ts

composables/
└── geocoding/
    ├── useGeocodingService.ts
    ├── useGeocodingCache.ts
    ├── useLeafletMap.ts
    └── index.ts
```

#### After
```
providers/           # ← ディレクトリ削除

composables/
└── geocoding/
    ├── useGeocodingService.ts
    ├── useGeocodingCache.ts
    ├── useLeafletMap.ts
    ├── nominatim.ts         # ← 移動（NominatimProvider）
    └── index.ts             # ← 更新（nominatimをexport）
```

#### 期待される効果
- 地理情報関連コードの一元管理
- ドメイン凝集度の向上
- 不要なディレクトリ削除

#### 影響範囲
- composables/geocoding/useGeocodingService.ts: インポートパス変更
- tests/unit/providers/NominatimProvider.test.ts: インポートパス変更
- tests/unit/composables/geocoding/: テストインポート調整
- **推定**: 3-5ファイル
- **リスク**: 低（単一クラス、参照箇所限定的）

## 段階的実行計画

### Step 1: types/の統合（所要時間: 15-30分）

1. **準備**: git statusで現在の状態確認
2. **コピー**: server/types/snow.ts → types/snow.ts
3. **参照特定**: Serena MCP `find_referencing_symbols` で参照箇所を特定
4. **一括更新**: インポートパスを一括更新
   ```typescript
   // Before
   import type { SnowReport } from '~/server/types/snow'
   
   // After
   import type { SnowReport } from '~/types/snow'
   ```
5. **検証ゲート**:
   - ✅ npm run build（型エラーなし）
   - ✅ vitest run（全テストパス）
   - ✅ Serena MCPで未解決参照なし
6. **クリーンアップ**: server/types/snow.ts削除 → server/types/ディレクトリ削除
7. **コミット**: `git commit -m "refactor: types/を統合、server/types/を削除"`

### Step 2: NominatimProviderの移動（所要時間: 10-20分）

1. **準備**: git statusで状態確認
2. **コピー**: providers/NominatimProvider.ts → composables/geocoding/nominatim.ts
3. **index.ts更新**: composables/geocoding/index.tsにexport追加
   ```typescript
   export { NominatimProvider } from './nominatim'
   ```
4. **参照特定**: Serena MCP `find_referencing_symbols`
5. **一括更新**: インポートパスを一括更新
   ```typescript
   // Before
   import { NominatimProvider } from '~/providers/NominatimProvider'
   
   // After
   import { NominatimProvider } from '~/composables/geocoding/nominatim'
   // または
   import { NominatimProvider } from '~/composables/geocoding'
   ```
6. **検証ゲート**:
   - ✅ npm run build（ビルドエラーなし）
   - ✅ vitest run（全テストパス）
   - ✅ Serena MCPで未解決参照なし
7. **クリーンアップ**: providers/NominatimProvider.ts削除 → providers/ディレクトリ削除
8. **コミット**: `git commit -m "refactor: NominatimProviderをcomposables/geocoding/に移動"`

### Step 3: 最終検証（所要時間: 5-10分）

1. **フルビルド**: npm run build
2. **全テスト実行**: npm run test
3. **E2Eテスト**: 必要に応じて手動テスト
4. **git履歴確認**: git log --oneline -5

## リスク管理

### 検証ゲート（各Step後に必須実行）

1. ✅ **TypeScript型チェック**: npm run build
2. ✅ **ユニットテスト**: vitest run
3. ✅ **インポート整合性**: Serena MCP `find_referencing_symbols`
4. ✅ **Git履歴**: git status（意図しない変更なし）

### ロールバック戦略

- **各Step後にcommit**: 問題発生時は前のコミットにrevert
- **ファイル削除は最後**: コピー完了・検証通過後のみ削除
- **ビルドエラー時**: 即座にロールバック、原因調査

### リスクレベル評価

```
Step 1 (types/統合):
  影響ファイル: 5-10ファイル
  リスクレベル: 🟢 低（型定義のみ、LSP追跡容易）
  所要時間: 15-30分

Step 2 (NominatimProvider移動):
  影響ファイル: 3-5ファイル
  リスクレベル: 🟢 低（単一クラス、参照箇所限定的）
  所要時間: 10-20分

Phase 2合計:
  影響ファイル: 8-15ファイル
  リスクレベル: 🟢 低
  所要時間: 25-50分
```

## Phase 2完了後の最終構造

### コアディレクトリ構成

```
WakkanaiJosetsuSystem/
├── components/          # Vueコンポーネント
│   ├── ui/              # 汎用UIコンポーネント（3ファイル）
│   ├── feature/         # 機能固有コンポーネント
│   │   ├── snow/        # 除雪機能（3ファイル）
│   │   └── ...          # 通知機能（3ファイル）
│   └── dev-tools/       # 開発ツール（1ファイル）
│
├── composables/         # Vue Composition API
│   ├── notifications/   # 通知管理（9ファイル）
│   ├── geocoding/       # 地理情報（6ファイル）✨
│   │   ├── useGeocodingService.ts
│   │   ├── useGeocodingCache.ts
│   │   ├── useLeafletMap.ts
│   │   ├── nominatim.ts     # ✨ 新規（移動）
│   │   └── index.ts         # ✨ 更新
│   ├── forms/           # フォーム管理（2ファイル）
│   └── ui/              # UI状態管理（2ファイル）
│
├── pages/               # ページコンポーネント（6ファイル）
├── layouts/             # レイアウト（1ファイル）
├── middleware/          # ミドルウェア（1ファイル）
│
├── server/              # サーバーサイド
│   ├── api/             # APIエンドポイント
│   │   ├── snow/        # 除雪API（3ファイル）
│   │   └── test/        # テスト用（1ファイル）
│   └── db/              # データベース（1ファイル）
│   ❌ types/           # ✨ 削除（types/に統合）
│
├── types/               # 型定義（一元管理）✨
│   ├── notification.ts
│   ├── snow.ts          # ✨ 新規（移動）
│   └── assets.d.ts
│
├── utils/               # ユーティリティ（5ファイル）
├── constants/           # 定数（1ファイル）
❌ providers/           # ✨ 削除（composables/geocoding/に統合）
│
├── assets/              # ビルド処理対象
│   ├── css/
│   └── img/
├── public/              # 静的ファイル
│   ├── favicon.ico
│   ├── robots.txt
│   └── sw.js
│
├── tests/               # テスト（変更なし）
│   ├── unit/            # ユニットテスト
│   ├── playwright/      # Playwrightテスト
│   ├── e2e/             # E2E統合テスト
│   ├── config/          # テスト設定
│   ├── integration/     # 統合テスト
│   └── utils/           # テストユーティリティ
│
└── docs/                # ドキュメント（Phase 1で整理済み）
    ├── README.md
    ├── architecture/
    └── technical/
```

### 改善効果のまとめ

#### ✨ Phase 2で実現される改善

1. **型定義の一元管理**
   - Before: types/とserver/types/に分散
   - After: types/に統合
   - 効果: 発見性向上、保守性向上

2. **地理情報コードの凝集**
   - Before: providers/とcomposables/geocoding/に分散
   - After: composables/geocoding/に統合
   - 効果: ドメイン凝集度向上、関連コードの発見性向上

3. **不要なディレクトリ削除**
   - 削除: server/types/, providers/
   - 効果: プロジェクト構造の簡素化

4. **Nuxt 3ベストプラクティス準拠**
   - 型定義の配置
   - Composablesのドメイン分割
   - 効果: 公式推奨パターンに準拠、チーム理解の容易性

#### 📊 Phase 1 + Phase 2の総合効果

**Phase 1（完了済み）**:
- ✅ ドキュメントの統合（UML/ → docs/architecture/）
- ✅ ドキュメントインデックス作成
- ✅ プロジェクトルートの整理

**Phase 2（本計画）**:
- ✅ types/の統合
- ✅ composables/geocoding/の統合
- ✅ 不要ディレクトリ削除

**総合的な改善**:
- 📁 整理されたディレクトリ構造
- 🔍 発見性の向上
- 🏗️ Nuxt 3ベストプラクティス準拠
- 🔒 互換性維持（コード変更最小化）

## 次のステップ

### Phase 2実行の前提条件

1. ✅ **git状態確認**: コミットされていない変更がないこと
2. ✅ **ブランチ作成**: `git checkout -b refactor/phase2-directory-restructure`
3. ✅ **バックアップ**: 必要に応じて現在の状態をバックアップ

### Phase 2実行後

1. **検証完了後**: Pull Request作成
2. **コードレビュー**: チームメンバーによるレビュー
3. **マージ**: main/masterブランチへのマージ

### Phase 3以降の検討事項（将来）

現時点では**Phase 3は不要**と判断：

- ✅ components/: 適切に階層化
- ✅ composables/: ドメイン分割済み
- ✅ utils/: 役割明確
- ✅ tests/: CI/CD影響考慮し変更しない

将来的な検討事項（必要に応じて）:
- `shared/`ディレクトリの導入（Nuxt 3.13+）
- `modules/`ディレクトリでのローカルモジュール化
- レイヤー（Layers）の活用

## 参考資料

- Nuxt 3公式ドキュメント: https://nuxt.com/docs/guide/directory-structure
- Phase 1完了記録: .serena/memories/directory_restructuring_phase1.md
- コードベース構造: .serena/memories/codebase_structure.md
- Tidy First?: Kent Beck（段階的整理の原則）
