# コードベース構造詳細

## ルートディレクトリ構成
```
WakkanaiJosetsuSystem/
├── app.vue                    # アプリケーションエントリーポイント
├── nuxt.config.ts            # Nuxt設定ファイル
├── package.json              # 依存関係とスクリプト定義
├── tsconfig.json             # TypeScript設定
├── tailwind.config.js        # TailwindCSS設定
├── vitest.config.ts          # Vitestテスト設定
├── playwright.config.ts      # Playwright E2E設定
└── TODO.md                   # プロジェクト管理TODO
```

## 主要ディレクトリ

### 🖼️ components/ - Vueコンポーネント
```
components/
├── ui/                       # 汎用UIコンポーネント
│   ├── AreaNameDisplay.vue   # 地域名表示
│   ├── InformationIcon.vue   # 情報アイコン
│   └── MainNavigation.vue    # メインナビゲーション
├── feature/                  # 機能固有コンポーネント
│   ├── snow/                 # 除雪機能関連
│   │   ├── SnowLocationMap.vue      # 地図表示
│   │   └── SnowReportForm.vue       # 報告フォーム
│   ├── NotificationHistory.vue      # 通知履歴
│   ├── NotificationSettings.vue     # 通知設定
│   └── NotificationToast.vue        # トースト通知
└── dev-tools/                # 開発・デバッグ用
    └── GeocodingCacheTest.vue # ジオコーディングテスト
```

### 🔧 composables/ - Vue Composition API
```
composables/
├── notifications/            # 通知関連（9ファイル）
│   ├── useNotificationManager.ts       # 通知管理
│   ├── useNotificationHistoryService.ts # 履歴サービス
│   ├── useNotificationStorage.ts       # ストレージ管理
│   └── ...（その他6ファイル）
├── geocoding/               # 地理情報関連（6ファイル）
│   ├── useGeocodingService.ts   # ジオコーディングAPI
│   ├── useGeocodingCache.ts     # キャッシュ管理
│   ├── useLeafletMap.ts         # 地図操作
│   └── index.ts                 # re-export
├── forms/                   # フォーム関連（2ファイル）
│   ├── useSnowReportForm.ts     # 除雪報告フォーム
│   └── index.ts
├── ui/                      # UI状態管理（2ファイル）
│   ├── useLoadingState.ts       # ローディング状態
│   └── index.ts
└── useErrorHandler.ts       # 共通エラーハンドリング
```

### 📄 pages/ - ページコンポーネント
```
pages/
├── index.vue                # ホームページ
├── josetsu.vue             # 除雪情報メインページ
├── create.vue              # 除雪情報作成
├── snowlist.vue            # 除雪情報一覧（管理画面）
├── notifications.vue       # 通知設定ページ
└── cache-test.vue          # キャッシュテストページ
```

### 🗄️ server/ - サーバーサイド
```
server/
├── api/                    # APIエンドポイント
│   ├── snow/               # 除雪情報API
│   │   ├── create.ts       # 作成API
│   │   ├── update.ts       # 更新API
│   │   └── delete.ts       # 削除API
│   └── test/               # テスト用API
├── db/                     # データベース
│   └── schema.sql          # Supabaseスキーマ
└── types/                  # サーバー側型定義
    └── snow.ts             # 除雪情報型
```

### 🧪 tests/ - テストファイル
```
tests/
├── unit/                   # ユニットテスト
│   ├── components/         # コンポーネントテスト
│   ├── composables/        # Composableテスト
│   └── utils/              # ユーティリティテスト
├── playwright/             # E2Eテスト
│   ├── specs/              # テストスペック
│   ├── fixtures/           # テストフィクスチャ
│   └── utils/              # テストユーティリティ
└── e2e/                    # E2E統合テスト
```

### 🛠️ utils/ - ユーティリティ
```
utils/
├── formatters.ts           # データフォーマット関数
├── validators.ts           # バリデーション関数
├── notificationUtils.ts    # 通知ユーティリティ
├── TokenBucketRateLimiter.ts # レート制限
└── apiMonitor.ts           # API監視
```

## 設定ファイル詳細

### Nuxt設定（nuxt.config.ts）
- SSR無効化（`ssr: false`）
- Supabase統合設定
- Leaflet最適化設定
- TailwindCSS統合

### テスト設定
- **Vitest**: ユニットテスト、happy-dom環境
- **Playwright**: E2Eテスト、クロスブラウザサポート

### Docker設定
```
docker/
├── Dockerfile              # アプリケーションイメージ
└── docker-compose.yml      # 開発環境定義
```

## API設計
- RESTful API設計
- エンドポイント: `/api/snow/*`
- Supabaseを通じたデータ永続化
- 認証認可機能（実装予定）

## 状態管理戦略
- **ローカル状態**: `ref/reactive`
- **共有状態**: Nuxtの`useState`
- **キャッシュ**: localStorage + composables
- **リアルタイム**: Supabase Realtime

## セキュリティ考慮事項
- 環境変数による機密情報管理
- API認証（実装予定）
- XSS対策（Vue.jsビルトイン）
- CSRF対策（Nuxtビルトイン）