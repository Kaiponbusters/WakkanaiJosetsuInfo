# Design Document

## Overview

composablesディレクトリを機能別にサブディレクトリに整理し、開発効率と保守性を向上させる設計です。現在18個のファイルが混在している状況を、論理的なグループに分けて整理します。

## Architecture

### 現在の構造分析

composablesディレクトリは既に機能別に整理されており、以下の構造になっています：

**通知関連 (8ファイル)**
- useNotificationManager.ts / .test.ts
- useNotificationHistoryService.ts / .test.ts  
- useNotificationStorage.ts / .test.ts
- useNotificationErrorHandler.ts
- useNotificationLogger.ts

**地理情報関連 (5ファイル)**
- useGeocodingService.ts / .test.ts
- useGeocodingCache.ts / .test.ts
- useLeafletMap.ts

**フォーム関連 (1ファイル)**
- useSnowReportForm.ts

**UI関連 (1ファイル)**
- useLoadingState.ts

**共通ユーティリティ (1ファイル)**
- useErrorHandler.ts（ルートレベル）

**ドキュメント (3ファイル)**
- README.md
- IMPORT_GUIDE.md
- STRUCTURE_REPORT.md

### 新しいディレクトリ構造

```
composables/
├── notifications/
│   ├── index.ts
│   ├── useNotificationManager.ts
│   ├── useNotificationManager.test.ts
│   ├── useNotificationHistoryService.ts
│   ├── useNotificationHistoryService.test.ts
│   ├── useNotificationStorage.ts
│   ├── useNotificationStorage.test.ts
│   ├── useNotificationErrorHandler.ts
│   └── useNotificationLogger.ts
├── geocoding/
│   ├── index.ts
│   ├── useGeocodingService.ts
│   ├── useGeocodingService.test.ts
│   ├── useGeocodingCache.ts
│   └── useLeafletMap.ts
├── forms/
│   ├── index.ts
│   └── useSnowReportForm.ts
├── ui/
│   ├── index.ts
│   └── useLoadingState.ts
└── useErrorHandler.ts (ルートに残す - 全体で使用される共通ユーティリティ)
```

## Components and Interfaces

### 1. ディレクトリ移行コンポーネント

**FileOrganizer**
- 責任: ファイルの移動とディレクトリ作成
- メソッド:
  - `createDirectoryStructure()`: 新しいディレクトリ構造を作成
  - `moveFiles()`: ファイルを適切なディレクトリに移動
  - `cleanupOldFiles()`: 不要なファイル（.backup、重複ファイル）を整理

### 2. Import更新コンポーネント

**ImportUpdater**
- 責任: 既存のimport文の自動更新
- メソッド:
  - `findImportReferences()`: 全ファイルからimport文を検索
  - `updateImportPaths()`: 新しいパスに更新
  - `validateImports()`: TypeScript型チェック

### 3. Index生成コンポーネント

**IndexGenerator**
- 責任: 各サブディレクトリのindex.tsファイル生成
- メソッド:
  - `generateIndexFiles()`: re-exportを含むindex.tsを生成
  - `updateExports()`: 新しいcomposableが追加された際の更新

## Data Models

### FileMapping
```typescript
interface FileMapping {
  originalPath: string
  newPath: string
  category: 'notifications' | 'geocoding' | 'forms' | 'ui' | 'root'
  hasTest: boolean
}
```

### ImportReference
```typescript
interface ImportReference {
  filePath: string
  lineNumber: number
  originalImport: string
  newImport: string
  composableName: string
}
```

## Error Handling

### 移行エラー処理
- ファイル移動失敗時のロールバック機能
- import更新失敗時の詳細エラーレポート
- TypeScript型チェックエラーの検出と報告

### バリデーション
- 移行前後のファイル整合性チェック
- テスト実行による動作確認
- import文の構文チェック

## Performance Considerations

### インポート最適化
- 各サブディレクトリのindex.tsファイルによる統一されたエクスポート
- Tree-shakingを考慮した個別ファイルからの直接インポートも可能
- 循環依存の回避

### 開発体験の向上
- IDEでの自動補完とナビゲーションの改善
- ファイル検索時間の短縮
- 機能別のコードレビューの効率化

## Testing Strategy

### 移行プロセステスト
1. **ファイル移動テスト**: 全ファイルが正しいディレクトリに移動されることを確認
2. **Import更新テスト**: 全import文が正しく更新されることを確認
3. **Index生成テスト**: 各index.tsファイルが正しく生成されることを確認

### 既存機能テスト
1. **既存テストの実行**: 移行後も全テストが通ることを確認
2. **型チェック**: TypeScriptコンパイルエラーがないことを確認
3. **実行時テスト**: アプリケーションが正常に動作することを確認

### 段階的移行戦略
1. **Phase 1**: 通知関連ファイルの移行
2. **Phase 2**: 地理情報関連ファイルの移行  
3. **Phase 3**: フォーム・UI関連ファイルの移行
4. **Phase 4**: 不要ファイルの整理とindex.ts生成

各フェーズ後にテスト実行とバリデーションを行い、問題があれば次のフェーズに進む前に修正します。