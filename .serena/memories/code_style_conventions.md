# コーディング規約とスタイル

## TypeScript規約
- **型定義**: 関数には常に戻り値の型を明示
- **インターフェース**: オブジェクト構造にはinterfaceを使用
- **型エイリアス**: ユニオン型や複雑な型にはtypeを使用
- **any型禁止**: unknown型または適切な型を使用
- **null/undefined**: オプショナルチェーン演算子(?.)とnull合体演算子(??)を活用

## Vue/Nuxt規約
- **Composition API**: すべてのコンポーネントで`<script setup lang="ts">`形式を使用
- **コンポーネント構成順**: `<template>` → `<script setup>` → `<style scoped>`
- **Props/Emits**: TypeScript型定義で明示的に定義
- **状態管理**: ローカルは`ref/reactive`、共有は`useState`

## ファイル命名規則
- **コンポーネント**: PascalCase.vue (例: `SnowLocationMap.vue`)
- **Composable**: camelCase.ts、`use`プレフィックス (例: `useGeocodingCache.ts`)
- **ユーティリティ**: camelCase.ts (例: `formatters.ts`)
- **定数**: SNAKE_CASE_CAPS

## ディレクトリ構造
```
components/
├── ui/              # 汎用UIコンポーネント
├── feature/         # 機能固有コンポーネント
└── dev-tools/       # 開発・デバッグ用

composables/
├── notifications/   # 通知関連
├── geocoding/      # 地理情報関連
├── forms/          # フォーム関連
└── ui/             # UI状態管理
```

## コメント・ドキュメント
- **TSDoc**: 公開API関数には必須
- **日本語**: コメントとドキュメントは日本語で記述
- **テスト**: describe/it文は日本語で記述

## エラーハンドリング
- **統一ハンドリング**: `useErrorHandler`composableを使用
- **型安全**: エラーオブジェクトの適切な型チェック
- **ユーザーフレンドリー**: エラーメッセージは日本語で分かりやすく

## インポート規則
- **順序**: Node.js組み込み → 外部ライブラリ → プロジェクト内 → 相対パス
- **名前付きエクスポート**: デフォルトエクスポートより優先
- **Composables**: サブディレクトリ経由（例: `~/composables/notifications`）