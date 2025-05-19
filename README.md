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
├── pages/            # アプリケーションのページ
├── plugins/          # Nuxtプラグイン
├── public/           # `public`ディレクトリに配置される静的ファイル
├── server/           # サーバーサイドロジック (APIエンドポイントなど)
│   ├── api/
│   └── db/           # Supabaseのスキーマ定義など (現状未使用)
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

## ❤️ コントリビューション

本プロジェクトへのコントリビューションを歓迎します！Issueの作成やプルリクエストはいつでもお気軽にどうぞ。

## 📜 ライセンス

本プロジェクトは [MIT License](LICENSE) の下で公開されています。(LICENSEファイルはまだ作成されていませんが、必要であれば追加してください)

# コンポーネント詳細

## CautionaryInformationDisplay.vue

- **役割**: 注意情報を表示するコンポーネント。
- **親コンポーネント**: PageBody.vue（他のコンポーネントから使用される）
- **子コンポーネント**: なし

### 関数

- **なし**: このコンポーネントには関数が定義されていません。

## AreaMapDisplay.vue

- **役割**: 地図を表示するコンポーネント。
- **親コンポーネント**: PageBody.vue（他のコンポーネントから使用される）
- **子コンポーネント**: なし

### 関数

- **mapSrc**: 緯度と経度を基に地図のURLを生成する計算プロパティ。
  - **動作**: `https://static-maps.yandex.ru/` を使用して地図のURLを生成し、地図画像を表示します。

## AreaNameDisplay.vue

- **役割**: 地域名を表示するコンポーネント。
- **親コンポーネント**: PageBody.vue（他のコンポーネントから使用される）
- **子コンポーネント**: なし

### 関数

- **なし**: このコンポーネントには関数が定義されていません。

## HeaderButton.vue

- **役割**: ヘッダーボタンを表示し、クリック時にナビゲートするコンポーネント。
- **親コンポーネント**: PageBody.vue（他のコンポーネントから使用される）
- **子コンポーネント**: なし

### 関数

- **navigate**: クリック時に指定されたルートにナビゲートする関数。
  - **動作**: `vue-router` を使用して指定されたルートに遷移します。

## InformationIcon.vue

- **役割**: 各画面のアイコンとヘッダアイコンを表示するコンポーネント。
- **親コンポーネント**: PageHeader.vue
- **子コンポーネント**: なし

### 関数

- **getIconPath(iconName)**: アイコン名を受け取り、対応するアイコン画像のパスを返す関数。
  - **動作**: `~/assets/img/` フォルダからアイコン画像を読み込み、パスを返します。

## PageBody.vue

- **役割**: ページの情報表示部分を表示するコンポーネント。
- **親コンポーネント**: なし（ページコンポーネントから直接使用される）
- **子コンポーネント**: なし

### 関数

- **formatDate(date)**: 日付を受け取り、フォーマットされた日付文字列を返す関数。
  - **動作**: 日付を特定のフォーマット（例：YYYY/MM/DD）に変換して表示します。

- **getRegionInfo(regionId)**: 地域IDを受け取り、対応する地域情報を返す関数。
  - **動作**: 地域IDに基づいて地域情報を取得し、表示します。

## PageHeader.vue

- **役割**: メニューヘッダーを表示するコンポーネント。
- **親コンポーネント**: なし（ページコンポーネントから直接使用される）
- **子コンポーネント**: InformationIcon.vue

### 関数

- **toggleMenu()**: メニューの表示/非表示を切り替える関数。
  - **動作**: メニューの表示状態をトグルし、ユーザーがメニューを開閉できるようにします。

- **selectMenuItem(item)**: メニュー項目を選択する関数。
  - **動作**: 選択されたメニュー項目に基づいて、対応するページや情報を表示します。