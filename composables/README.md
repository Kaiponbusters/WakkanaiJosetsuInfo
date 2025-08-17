# Composables ディレクトリ構造ガイド

## 概要

このディレクトリには、Nuxt 3アプリケーションで使用するComposable関数が機能別に整理されています。
各サブディレクトリは特定の機能領域に関連するComposableをグループ化し、開発効率と保守性を向上させています。

## ディレクトリ構造

```
composables/
├── notifications/          # 通知関連のComposable
├── geocoding/              # 地理情報・地図関連のComposable
├── forms/                  # フォーム関連のComposable
├── ui/                     # UI状態管理関連のComposable
├── useErrorHandler.ts      # 共通エラーハンドリング
└── README.md              # このファイル
```

## 各ディレクトリの詳細

### 📢 notifications/
通知システムに関連するComposableを含みます。

**含まれるファイル:**
- `useNotificationManager.ts` - 通知の作成・管理
- `useNotificationHistoryService.ts` - 通知履歴の管理
- `useNotificationStorage.ts` - 通知データの永続化
- `useNotificationErrorHandler.ts` - 通知関連エラー処理
- `useNotificationLogger.ts` - 通知ログ機能
- 各ファイルに対応するテストファイル（`.test.ts`）

### 🗺️ geocoding/
地理情報の取得・キャッシュ・地図表示に関連するComposableを含みます。

**含まれるファイル:**
- `useGeocodingService.ts` - 住所から座標への変換サービス
- `useGeocodingCache.ts` - ジオコーディング結果のキャッシュ
- `useLeafletMap.ts` - Leaflet地図コンポーネントの管理
- 各ファイルに対応するテストファイル（`.test.ts`）

### 📝 forms/
フォーム関連の状態管理とバリデーションを行うComposableを含みます。

**含まれるファイル:**
- `useSnowReportForm.ts` - 除雪報告フォームの管理

### 🎨 ui/
UI状態の管理に関連するComposableを含みます。

**含まれるファイル:**
- `useLoadingState.ts` - ローディング状態の管理

### 🔧 共通ユーティリティ
- `useErrorHandler.ts` - アプリケーション全体で使用される共通エラーハンドリング

## Import方法

### 基本的なImport方法

各サブディレクトリには`index.ts`ファイルが配置されており、そのディレクトリ内のすべてのComposableをre-exportしています。

```typescript
// ✅ 推奨: サブディレクトリからのImport
import { useNotificationManager } from '~/composables/notifications'
import { useGeocodingService } from '~/composables/geocoding'
import { useSnowReportForm } from '~/composables/forms'
import { useLoadingState } from '~/composables/ui'

// ✅ 共通ユーティリティ
import { useErrorHandler } from '~/composables/useErrorHandler'
```

### 複数のComposableを同時にImport

```typescript
// 通知関連の複数Composableを同時にImport
import { 
  useNotificationManager, 
  useNotificationHistoryService,
  useNotificationStorage 
} from '~/composables/notifications'

// 地理情報関連の複数Composableを同時にImport
import { 
  useGeocodingService, 
  useGeocodingCache,
  useLeafletMap 
} from '~/composables/geocoding'
```

### 直接ファイルからのImport（非推奨）

```typescript
// ❌ 非推奨: 直接ファイルパスを指定
import { useNotificationManager } from '~/composables/notifications/useNotificationManager'

// ✅ 推奨: サブディレクトリのindex.tsを経由
import { useNotificationManager } from '~/composables/notifications'
```

## 開発ガイドライン

### 新しいComposableの追加

1. **適切なサブディレクトリを選択**
   - 通知関連 → `notifications/`
   - 地理情報関連 → `geocoding/`
   - フォーム関連 → `forms/`
   - UI状態管理 → `ui/`
   - 全体で使用される共通機能 → ルートディレクトリ

2. **ファイル命名規則**
   - Composableファイル: `use[機能名].ts`
   - テストファイル: `use[機能名].test.ts`

3. **テストファイルの作成**
   - 新しいComposableには必ずテストファイルを作成
   - テストカバレッジ80%以上を維持

4. **index.tsの更新**
   - 新しいComposableを追加した際は、該当サブディレクトリの`index.ts`にexportを追加

### コード品質

- **TypeScript**: 型安全性を重視し、`any`型の使用は禁止
- **エラーハンドリング**: 非同期処理には必ずtry-catch文を使用
- **テスト**: describe/it文は日本語で記述
- **コメント**: 日本語でわかりやすく記述

## 移行履歴

このディレクトリ構造は、以前の単一ディレクトリ構造から機能別に整理されました。

**移行前（18ファイルが混在）:**
```
composables/
├── useNotificationManager.ts
├── useGeocodingService.ts
├── useSnowReportForm.ts
└── ... (その他15ファイル)
```

**移行後（機能別に整理）:**
```
composables/
├── notifications/ (9ファイル)
├── geocoding/ (6ファイル)
├── forms/ (2ファイル)
├── ui/ (2ファイル)
└── useErrorHandler.ts
```

この整理により、開発効率と保守性が大幅に向上しました。