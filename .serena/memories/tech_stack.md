# 技術スタック詳細

## フロントエンド
- **Nuxt 3** (v3.14.159): Vue.jsベースのフレームワーク
- **Vue 3** (latest): プログレッシブJavaScriptフレームワーク
- **TypeScript**: 静的型付けJavaScript
- **Tailwind CSS** (v3.4.14): ユーティリティファーストCSSフレームワーク
- **Leaflet.js** (v1.9.4): インタラクティブ地図ライブラリ
- **nuxt-leaflet** (v0.0.27): NuxtでのLeaflet統合

## バックエンド・データベース
- **Supabase** (v2.9.6): PostgreSQLベースのBaaS
- **@nuxtjs/supabase** (v1.4.6): Nuxt3とSupabaseの統合
- **@supabase/supabase-js** (v2.48.1): Supabaseクライアントライブラリ

## テスト
- **Vitest** (v3.1.3): 高速ユニットテストフレームワーク
- **@vue/test-utils** (v2.4.6): Vue.jsコンポーネントテスト
- **happy-dom** (v17.4.7): DOM環境シミュレーション
- **Playwright** (v1.54.1): E2Eテストフレームワーク
- **@playwright/mcp** (v0.0.29): Playwright MCP統合

## 開発ツール
- **Docker**: コンテナ化環境
- **Autoprefixer** (v10.4.20): CSS前処理
- **PostCSS** (v8.4.49): CSS変換ツール

## 追加サービス
- **Firebase** (v11.2.0): 通知システム（予定）
- **MySQL2** (v3.12.0): データベース接続（開発用）

## 設定ファイル
- **SSR無効化**: クライアントサイドレンダリング
- **Leaflet最適化**: Vite設定でLeaflet統合最適化
- **環境変数**: Supabase接続情報の管理