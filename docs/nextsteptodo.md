# 次のステップ ToDo

認証認可システムの基盤実装が完了しました。次のステップとして以下の作業を順次実施してください。

---

## 優先度：高（即座に実施が必要）

### 1. 環境変数の設定
**期限：次回開発セッション開始前**

- [ ] `.env`ファイルの作成と以下の変数設定
  ```env
  # Supabase設定
  SUPABASE_URL=your_supabase_project_url
  SUPABASE_KEY=your_supabase_anon_key
  SUPABASE_SERVICE_KEY=your_supabase_service_role_key
  
  # JWT認証設定
  JWT_SECRET=your_strong_jwt_secret_key_here
  ```
- [ ] Supabaseプロジェクトでの設定確認
- [ ] 本番・ステージング環境での環境変数設定

### 2. データベース初期設定
**期限：環境変数設定後すぐ**

- [ ] Supabaseでスキーマの適用（`server/db/schema.sql`を実行）
- [ ] RLSポリシーが正しく適用されているか確認
- [ ] 初期管理者アカウントの作成
  - [ ] 管理者用メールアドレスでSupabase Authにユーザー作成
  - [ ] `user_profiles`テーブルに管理者プロファイル追加
- [ ] テスト用スタッフアカウントの作成

---

## 優先度：中（1週間以内）

### 3. 管理画面の実装
**担当機能：ユーザー管理・システム管理**

- [ ] `pages/admin/index.vue`：管理ダッシュボード
- [ ] `pages/admin/users.vue`：ユーザー管理画面
  - [ ] ユーザー一覧表示
  - [ ] 新規ユーザー登録フォーム
  - [ ] ユーザー情報編集機能
  - [ ] アカウント有効化/無効化
  - [ ] パスワードリセット機能
- [ ] `pages/admin/devices.vue`：車載端末デバイス管理
  - [ ] デバイス登録フォーム
  - [ ] デバイス一覧・状態表示
  - [ ] デバイス有効化/無効化
- [ ] `pages/admin/audit.vue`：監査ログ閲覧
  - [ ] ログ検索・フィルタリング機能
  - [ ] CSV エクスポート機能

### 4. ユーザー管理用Composablesの実装

- [ ] `composables/useUserManagement.ts`
  - [ ] ユーザー作成・更新・削除機能
  - [ ] パスワードリセット機能
  - [ ] アカウントロック解除機能
- [ ] `composables/useDeviceManagement.ts`
  - [ ] デバイス登録・管理機能
  - [ ] JWT トークン生成機能
- [ ] `composables/useAuditLog.ts`
  - [ ] 監査ログ検索機能
  - [ ] ログエクスポート機能

### 5. 車載端末トークン管理APIの完成

- [ ] `server/api/vehicle/refresh-token.post.ts`：トークン更新API
- [ ] `server/api/vehicle/register.post.ts`：デバイス登録API
- [ ] トークン自動更新スケジューラの実装
- [ ] 期限切れトークンのクリーンアップ機能

---

## 優先度：中（2週間以内）

### 6. 既存機能の認証対応

- [ ] `components/feature/snow/SnowReportForm.vue`の更新
  - [ ] 投稿者情報の自動設定
  - [ ] 権限チェックの追加
- [ ] `pages/snowlist.vue`の更新
  - [ ] 認証済みユーザーには編集・削除ボタン表示
  - [ ] 権限ベースの機能制限
- [ ] `server/api/snow/`各APIの更新
  - [ ] 認証チェックの追加
  - [ ] 作成者・更新者情報の記録

### 7. エラーハンドリングとユーザビリティ向上

- [ ] `components/ui/ErrorMessage.vue`：共通エラー表示コンポーネント
- [ ] `components/ui/LoadingSpinner.vue`：ローディング表示コンポーネント
- [ ] `components/ui/ConfirmDialog.vue`：確認ダイアログコンポーネント
- [ ] 各ページでの適切なエラーメッセージ表示
- [ ] ネットワークエラー時の再試行機能

---

## 優先度：低（1ヶ月以内）

### 8. テスト実装

- [ ] `tests/unit/composables/useAuth.test.ts`
- [ ] `tests/unit/middleware/auth.test.ts`
- [ ] `tests/playwright/auth-flow.spec.ts`
- [ ] `tests/playwright/admin-features.spec.ts`
- [ ] RLSポリシーのテスト
- [ ] 車載端末APIのテスト

### 9. パフォーマンス最適化

- [ ] データベースインデックスの最適化
- [ ] 不要な監査ログの自動削除機能
- [ ] 車両位置データの定期クリーンアップ
- [ ] キャッシュ戦略の実装

### 10. ドキュメント整備

- [ ] API仕様書の作成
- [ ] ユーザーマニュアルの作成
- [ ] 運用手順書の作成
- [ ] セキュリティガイドラインの策定

---

## 将来的な機能拡張（必要に応じて）

### 11. 高度な認証機能

- [ ] 多要素認証（MFA）の実装
- [ ] 自治体SSOとの連携
- [ ] パスワード強度チェックの強化
- [ ] セッション管理の高度化

### 12. 通知機能

- [ ] LINE通知機能の実装
- [ ] メール通知機能
- [ ] プッシュ通知対応

### 13. 分析・レポート機能

- [ ] ダッシュボードの分析機能強化
- [ ] 除排雪活動レポート生成
- [ ] 車両稼働状況の統計機能

---

## 注意事項

### セキュリティ
- 本番環境でのJWT秘密鍵は十分に強固なものを使用
- Supabaseサービスロールキーの適切な管理
- 定期的なセキュリティ監査の実施

### 運用
- 監査ログの定期的なアーカイブ
- 車両位置データの保持期間管理
- バックアップとリストア手順の確立

### 開発
- 各機能実装後のテスト実施
- コードレビューの徹底
- ドキュメントの随時更新

---
**次回レビュー予定：環境設定完了後** 