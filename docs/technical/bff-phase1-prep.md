# BFF強化フェーズ1 準備レポート

本ドキュメントは、BFF（Backend for Frontend）強化に先立ち実施した現状調査の要約である。Nuxt サーバー API 層の責務を再定義し、ドメインルールとバリデーションを集約するための前提情報を整理した。

## 1. サーバーAPI層の現状把握
- 対象ファイル: `server/api/snow/{create,update,delete}.ts`
  - いずれも `serverSupabaseClient` を即時取得し、`snow_reports` テーブルへ直接アクセス。
  - リクエストボディの必須項目チェック（空判定）のみ実装。値フォーマットや業務ルールは未定義。
  - 認証フローは `create.ts` でコメントアウトされたまま放置。権限判定・監査ログは実装されていない。
  - エラーハンドリングは `createError/sendError` による基本通知のみで、エラーコード体系やクライアント向け整形が不統一。
- テスト用エンドポイント: `server/api/test/cleanup.ts`
  - Supabase クライアントを直接呼び出し、データ削除を行う暫定実装。BFF 強化後は統一したリポジトリ層経由に統合する必要がある。

## 2. ドメインルール／バリデーションの散在状況
- フォーム系: `composables/forms/useSnowReportForm.ts`
  - 必須項目チェック、文字列長、時間範囲などの業務バリデーションがフロント側に集中。
  - バリデーションヘルパーは `utils/validators.ts` にまとまっているが、サーバー側から再利用できる形ではない。
- ジオコーディング: `composables/geocoding/useGeocodingService.ts`
  - クエリチェック、レート制限、キャッシュ制御がクライアントのコンテキストで実行されている。BFF 側に移せば API 制限の一元監視が可能。
- 通知系: `composables/notifications/useNotificationManager.ts`, `useNotificationPipeline.ts`, `useNotificationStorage.ts`
  - 購読エリア検証、通知フィルタリング、再試行ポリシーなど高度なロジックが UI 層に常駐。BFF 側でトリガー発火と配信制御を担う案を検討する必要あり。
- まとめ: 現状ではフロントエンドがドメインルールを抱え込んでおり、BFF が単なるパススルーになっている。ルール移譲と共通バリデーションスキーマ（例: zod）導入が必須。

## 3. Supabase 直接利用箇所
- ページ: `pages/josetsu.vue`, `pages/snowlist.vue`
  - `useSupabaseClient()` を用いて `snow_reports` を直接読み取り。BFF を介さないため、認可やレスポンス整形が分散。
- Composables: `composables/notifications/useRealtimeListener.ts`
  - リアルタイムチャンネル購読をクライアントで実施。イベント変換や再接続ロジックが UI サイドに存在。
- サーバーAPI以外の Supabase 利用は上記の通り限定的だが、BFF 強化と合わせて読み取り系 API も統一する方針を検討する。

## 4. テスト資産のBFFカバレッジ
- E2E: `tests/playwright/specs/snow-crud-integration.spec.ts` を含む Playwright シナリオは UI 経由で BFF を間接的に行使するだけで、サーバー API 単体の回帰保証にはならない。
- 単体／統合: `tests/unit` や `tests/utils/database-test-util.ts` はモックベースで Supabase を直接モックしており、BFF のルール追加時に壊れた場合の検出が困難。
- 現状、`server/api` 配下のハンドラを直接ターゲットとするテストは存在しない。BFF 強化後に Supertest 等で API レベルのユニットテスト／契約テストを整備する必要がある。

## 5. 課題と次のアクション
1. **責務分担表の設計**
   - クライアント・BFF・Supabase の役割をマトリクス化し、移譲対象ルールをリストアップする。
2. **共通バリデーション層の導入準備**
   - `utils/validators.ts` を共有可能なモジュール（例: `server/validation/`）へ移植する設計案を立案。
3. **データアクセス抽象化**
   - Supabase 呼び出しを `server/repositories/` に閉じ込め、BFF からはリポジトリ経由で操作する構造を検討。
4. **テスト戦略の刷新**
   - API 層のユニットテストテンプレートを作成し、Playwright 依存から脱却。
5. **リアルタイム設計の再整理**
   - `useRealtimeListener` が担うイベント整形・再接続ロジックをサーバー側に移し、クライアントには最小限の購読 API を提供する。

以上の調査結果を踏まえ、フェーズ2では BFF の基盤設計（責務分担表、共通モジュール配置、抽象化インターフェース）を具体化する。
