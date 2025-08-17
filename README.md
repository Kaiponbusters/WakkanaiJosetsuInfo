# わっかない除雪情報マップ (Wakkanai Josetsu Info)

「わっかない除雪情報マップ」は、北海道稚内市の除雪作業状況をリアルタイムで提供することを目的としたウェブアプリケーションです。
住民や訪問者は、このアプリケーションを通じて最新の除雪情報を地図上で確認できます。

## ✨ 主な機能

*   **除雪情報のリアルタイム表示**: 最新の除雪作業状況を地図上に表示します。
*   **地域ごとの情報**: 稚内市内の各地域における除雪開始・終了時間を確認できます。
*   **履歴表示**: 過去の除雪作業履歴を日付ごとに確認できます。
*   **情報管理機能**: 管理者向けの機能として、除雪情報の新規登録、編集、削除が可能です。( `/snowlist` )
*   **座標キャッシュテスト**: 地図表示機能の座標キャッシュシステムをテストするページです。( `/cache-test` )

## 🛠️ 技術スタック

本プロジェクトは以下の技術を使用して開発されています。

*   **フロントエンド**:
    *   [Nuxt 3](https://nuxt.com/): Vue.jsベースのフレームワーク
    *   [Vue 3](https://vuejs.org/): プログレッシブJavaScriptフレームワーク
    *   [Tailwind CSS](https://tailwindcss.com/): ユーティリティファーストのCSSフレームワーク
    *   [Leaflet.js](https://leafletjs.com/): モバイルフレンドリーなインタラクティブマップライブラリ
    *   [TypeScript](https://www.typescriptlang.org/): JavaScriptに静的型付けを追加
*   **バックエンド/データベース**:
    *   [Supabase](https://supabase.io/): オープンソースのFirebase代替 (PostgreSQLベース)
*   **テスト**:
    *   [Vitest](https://vitest.dev/): Viteベースの高速なユニットテストフレームワーク
*   **開発ツール**:
    *   [Docker](https://www.docker.com/): コンテナ化プラットフォーム
    *   [Node.js](https://nodejs.org/)
    *   [npm](https://www.npmjs.com/)

## 🚀 セットアップ手順

### 必要なもの

*   Node.js (推奨バージョン: 18.x 以上)
*   npm (Node.jsに同梱)
*   Docker (任意ですが、`docker-compose.yml` を使用する場合に必要)
*   Supabaseアカウント (データベースとAPIキー取得のため)

### 1. リポジトリのクローン

```bash
git clone https://github.com/Kaiponbusters/WakkanaiJosetsuInfo.git
cd WakkanaiJosetsuInfo
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

プロジェクトルートに `.env` ファイルを作成し、Supabaseから取得した情報を設定します。

```env
# .env ファイルの例
SUPABASE_URL="YOUR_SUPABASE_URL"
SUPABASE_KEY="YOUR_SUPABASE_ANON_KEY"
```

*   `SUPABASE_URL`: SupabaseプロジェクトのURL (例: `https://xxxxxx.supabase.co`)
*   `SUPABASE_KEY`: Supabaseプロジェクトの `anon` (public) キー

これらのキーは、Supabaseプロジェクトのダッシュボード > Settings > API で確認できます。

### 4. 開発サーバーの起動

```bash
npm run dev
```

アプリケーションは `http://localhost:3000` で起動します。

### 5. ビルド

本番用にアプリケーションをビルドする場合：

```bash
npm run build
```

ビルドされたファイルは `.output` ディレクトリに生成されます。

### 6. テストの実行

ユニットテストを実行する場合：

```bash
npm run test
```

## 📁 ディレクトリ構成の概要

主要なディレクトリとファイルは以下の通りです。

```
WakkanaiJosetsuInfo/
├── .nuxt/            # Nuxt.jsが生成するビルドディレクトリ
├── .output/          # ビルド成果物
├── assets/           # CSS、画像などの静的アセット
│   └── css/
│       └── main.css  # メインのCSSファイル
├── components/       # Vueコンポーネント
├── composables/      # Nuxt 3のコンポーザブル (再利用可能な関数)
├── layouts/          # ページレイアウト
├── middleware/       # ルートミドルウェア
├── pages/            # アプリケーションのページ
├── plugins/          # Nuxtプラグイン
├── public/           # `public`ディレクトリに配置される静的ファイル
├── server/           # サーバーサイドロジック (APIエンドポイントなど)
│   ├── api/
│   └── db/           # Supabaseのスキーマ定義など
├── utils/            # ユーティリティ関数
├── .env              # 環境変数ファイル (Git管理外)
├── nuxt.config.ts    # Nuxt.jsの設定ファイル
├── package.json      # プロジェクトの依存関係とスクリプト
├── README.md         # このファイル
└── tsconfig.json     # TypeScriptの設定ファイル
```

## 🔗 APIエンドポイント

現在、以下のサーバーAPIエンドポイントが実装されています。

*   `POST /api/snow/create`: 新しい除雪情報を登録
*   `POST /api/snow/update`: 既存の除雪情報を更新
*   `POST /api/snow/delete`: 除雪情報を削除

これらのAPIは、主に管理者向けの除雪情報管理機能 (`/snowlist` ページ) から利用されます。

## 🗂️ 主要コンポーネント

### SnowLocationMap.vue
- **役割**: Leaflet.jsを使用してインタラクティブな地図を表示するコンポーネント
- **機能**: 
  - 地域名から座標を取得して地図を表示
  - OpenStreetMapタイルを使用
  - マーカーで除雪地点を表示

### SnowReportForm.vue
- **役割**: 除雪情報の新規登録フォームを提供するコンポーネント
- **機能**:
  - 地域名、開始時間、終了時間の入力
  - バリデーション機能
  - 登録APIへのデータ送信

### GeocodingCacheTest.vue
- **役割**: 座標キャッシュ機能のテスト用コンポーネント
- **機能**:
  - 地域名から座標を取得してキャッシュ
  - キャッシュヒット率の表示
  - キャッシュクリア機能

### InformationIcon.vue
- **役割**: ページヘッダーにアイコンとタイトルを表示するコンポーネント
- **機能**:
  - ルートに応じたアイコンの動的表示
  - ページタイトルの表示

### AreaNameDisplay.vue
- **役割**: 地域名を統一されたスタイルで表示するコンポーネント
- **機能**:
  - 地域名の表示
  - 背景色とスタイルの統一

## 🛡️ コンポーザブル

### useGeocodingCache
- 地域名から座標を取得し、キャッシュ管理を行う
- ローカルストレージを使用したキャッシュの永続化
- キャッシュ統計情報の提供

### useGeocodingApi
- Nominatim APIへのレート制限付きリクエスト管理
- リトライ機能と指数バックオフ
- リクエストの重複防止

### useErrorHandler
- 統一されたエラーハンドリング
- ユーザーフレンドリーなエラーメッセージの表示
- エラーログの管理

## ❤️ コントリビューション

本プロジェクトに対してのコントリビューションはいつでも募集しています！
お気軽にIssueやPull Requestを作成してください！

## CodeRabbit
![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/Kaiponbusters/WakkanaiJosetsuInfo?utm_source=oss&utm_medium=github&utm_campaign=Kaiponbusters%2FWakkanaiJosetsuInfo&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)