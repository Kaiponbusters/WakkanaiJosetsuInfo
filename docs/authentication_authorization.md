# 認証・認可設計概要

本ドキュメントでは、除排雪情報発信システムにおける認証・認可の設計方針をまとめます。

---

## 1. 採用技術

| 区分 | 採用技術 | 理由 |
| ---- | -------- | ---- |
| 認証 | **Supabase Auth（メール + パスワード）** | Nuxt 用モジュールで実装コストが低く、将来の MFA / SSO 拡張が容易 |
| 認可 | **Supabase Row Level Security (RLS) + Postgres 役割** | DB 層で一貫した権限管理が可能、実装漏れを防止 |
| ルートガード | **Nuxt ミドルウェア** | UI 側でのアクセス制御をシンプルに実装 |
| 車載端末 API | **HTTPS + JWT (サービスロール) / API Key** | 端末ごとに短寿命トークンを発行し、TLS で保護 |

---

## 2. 役割（ロール）設計

| ロール | 想定ユーザー | 認証要否 | 権限概要 |
| :--- | :--- | :---: | :--- |
| `anonymous` | 一般住民 | 不要 | 除排雪情報の取得のみ (`SELECT`) |
| `staff` | 市職員・除雪業者 | 必要 | 投稿・編集・削除 (`INSERT/UPDATE/DELETE`) |
| `admin` | システム管理者 | 必要 | ユーザー管理・設定変更・全権限 |
| `vehicle` | 車載端末 | 必要 | 自車位置データの登録 (`INSERT`) のみ |

---

## 3. ユーザー管理

### 3.1 ユーザー登録フロー

| ユーザー種別 | 登録方法 | 承認プロセス |
| :--- | :--- | :--- |
| 市職員・除雪業者 (`staff`) | 管理者による登録 | 即時有効化 |
| システム管理者 (`admin`) | 初期管理者による登録 | 即時有効化 |
| 車載端末 (`vehicle`) | 管理者による登録 | デバイスIDと紐付け |

### 3.2 パスワードポリシー

| 項目 | 要件 |
| :--- | :--- |
| 最小文字数 | 8文字以上 |
| 文字種別 | 英数字混合必須 |
| その他 | 記号の使用を推奨 |
| パスワード履歴 | 直近3回のパスワードは再利用不可 |

### 3.3 アカウントロック

| 項目 | 設定値 |
| :--- | :--- |
| ロック条件 | ログイン失敗5回 |
| ロック期間 | 30分（管理者による手動解除も可能） |
| 通知 | ロック発生時に管理者へメール通知 |

---

## 4. セッション管理

| 項目 | 設定値 | 理由 |
| :--- | :--- | :--- |
| アクセストークン有効期限 | 8時間 | 職員の勤務時間を考慮 |
| リフレッシュトークン有効期限 | 7日間 | 週をまたいでの継続利用を可能に |
| アイドルタイムアウト | 2時間 | セキュリティと利便性のバランス |
| 同時セッション数 | 3セッションまで | 複数デバイスでの利用を考慮 |

---

## 5. DB / RLS 方針

### 5.1 テーブル構成

| テーブル | 用途 | 主なカラム |
| :--- | :--- | :--- |
| `snow_reports` | 除排雪予定・実績 | `id`, `area_id`, `status`, `scheduled_time`, `geom (GeoJSON)`, `created_by`, `updated_by`, `created_at`, `updated_at` |
| `vehicle_locations` | 車両リアルタイム位置 | `id`, `vehicle_id`, `device_id`, `vehicle_type`, `geom (POINT)`, `timestamp` |
| `audit_logs` | 監査ログ | `id`, `user_id`, `action`, `table_name`, `record_id`, `old_data`, `new_data`, `ip_address`, `created_at` |
| `login_attempts` | ログイン試行記録 | `id`, `email`, `ip_address`, `success`, `attempted_at` |

### 5.2 RLS ポリシー概要

```sql
-- snow_reports
CREATE POLICY select_public ON snow_reports
  FOR SELECT USING ( true );

CREATE POLICY modify_staff ON snow_reports
  FOR ALL
  TO staff, admin
  USING ( auth.role() IN ('staff', 'admin') )
  WITH CHECK ( auth.role() IN ('staff', 'admin') );

-- vehicle_locations
CREATE POLICY insert_vehicle ON vehicle_locations
  FOR INSERT
  TO vehicle, admin
  USING ( auth.role() IN ('vehicle', 'admin') )
  WITH CHECK ( 
    auth.role() = 'admin' OR 
    (auth.role() = 'vehicle' AND auth.uid()::text = vehicle_id)
  );

CREATE POLICY select_public_vehicle ON vehicle_locations
  FOR SELECT USING ( true );

-- audit_logs (管理者のみアクセス可能)
CREATE POLICY admin_only ON audit_logs
  FOR ALL
  TO admin
  USING ( auth.role() = 'admin' );
```

> ※ 地区別など更に細分化が必要な場合は `area_id` や `vehicle_id` でフィルタリングする行単位制御を追加します。

---

## 6. Nuxt 側実装

1. `@nuxtjs/supabase` モジュールでクライアント初期化。
2. `/create`, `/update` など職員専用ページに `middleware/auth.ts` を設定。
3. `useSupabaseUser()` で取得したユーザーの `role` メタデータを確認し、`staff` 以外は `/login` へリダイレクト。
4. 一般住民向けページ(`/`, `/snowlist`) は認証不要とし、パブリックに公開。
5. ログイン失敗回数のチェックとアカウントロック処理を実装。

---

## 7. 車載端末 API

### 7.1 基本仕様

| 項目 | 内容 |
| --- | --- |
| エンドポイント | `POST /api/vehicle/locations` |
| 認証方式 | HTTPS + `Authorization: Bearer {JWT}` |
| データ形式 | `{ device_id, vehicle_type, lat, lng, timestamp }` (JSON) |

### 7.2 トークン管理

| 項目 | 設定値 |
| :--- | :--- |
| トークン有効期限 | 24時間 |
| 更新方式 | 自動更新（有効期限の1時間前に新トークン発行） |
| 更新エンドポイント | `POST /api/vehicle/refresh-token` |

### 7.3 デバイス識別

| 項目 | 内容 |
| :--- | :--- |
| デバイスID | ハードウェア固有ID（IMEI等）をハッシュ化して使用 |
| 車両種別 | `snow_plow`（除雪車）、`salt_spreader`（融雪剤散布車）等 |
| 登録方法 | 管理者がデバイスIDと車両情報を事前登録 |

### 7.4 セキュリティ対策

- TLS 1.3 必須
- IP アドレス制限（許可リスト方式）
- レート制限（1分間に60リクエストまで）
- 異常検知（不正な位置情報、時系列の矛盾等）

---

## 8. 監査ログ

### 8.1 記録対象

| 操作 | 記録内容 |
| :--- | :--- |
| ログイン/ログアウト | ユーザーID、IPアドレス、成功/失敗、時刻 |
| データ登録/更新/削除 | ユーザーID、操作内容、変更前後のデータ、時刻 |
| 権限変更 | 管理者ID、対象ユーザー、変更内容、時刻 |
| アカウントロック | 対象ユーザー、理由、時刻 |

### 8.2 保存期間とアーカイブ

| 項目 | 設定値 |
| :--- | :--- |
| オンライン保存期間 | 1週間 |
| アーカイブ方式 | 1週間経過後、圧縮してオブジェクトストレージへ移動 |
| アーカイブ保存期間 | 1年間（法的要件に応じて延長可能） |

---

## 9. 将来拡張

1. **多要素認証 (MFA)**：Supabase の TOTP/SMS を段階的に導入可能。
2. **自治体 SSO 連携**：OpenID Connect / SAML を `external_identities` で統合。
3. **LINE 通知**：Supabase Edge Function から LINE Messaging API を呼び出し、投稿トリガーで自動通知。
4. **Granular RLS**：地区別アクセス制御が必要になった場合は `area_id` を用いた行単位ポリシーを追加。
5. **生体認証**：スマートフォンアプリ展開時に TouchID/FaceID 対応。

---

## 10. 実装ステップ

1. Supabase プロジェクトで Auth を有効化し、カスタムロール (`staff`, `admin`, `vehicle`) を作成。
2. `snow_reports`, `vehicle_locations`, `audit_logs`, `login_attempts` テーブルを作成し、RLS ポリシーを適用。
3. 監査ログ記録用のデータベーストリガーを実装。
4. Nuxt プロジェクトに Supabase を導入し、環境変数 (`NUXT_PUBLIC_SUPABASE_URL` 等) を設定。
5. ログイン UI（メール + パスワード）を実装し、パスワードポリシーとアカウントロック機能を追加。
6. 職員専用ダッシュボードとユーザー管理画面を作成。
7. 車載端末向け API エンドポイントをサーバーミドル層 (`server/api/vehicle/`) に実装。
8. トークン自動更新機能とデバイス認証を実装。
9. (任意) LINE 通知用 Edge Function の雛形を作成。
10. Vitest・Playwright で認証／RLS のテストを追加し、CI に Supabase CLI を組み込み。

---

## 11. メリット

- Supabase 標準機能のみで完結し、コード量・運用コストが低い。
- 住民は認証不要で UX がシンプル。
- RLS により DB 層で強固なアクセス制御を実現。
- 監査ログにより、コンプライアンス要件に対応。
- 将来的な SSO / MFA / 外部システム連携を阻害しない柔軟な構成。

## 12. リスク・注意点

| リスク | 対策 |
| --- | --- |
| 車載端末 JWT の漏洩 | ・24時間の短寿命トークン <br>・デバイスID検証 <br>・IP 制限と TLS 1.3 必須 |
| RLS 設定ミス | ・権限レビュー手順の整備 <br>・自動テストで RLS ポリシーを検証 <br>・ステージング環境での事前検証 |
| リアルタイム位置情報のプライバシー | ・位置情報を集約して精度を落とす <br>・公開範囲/遅延のチューニング <br>・車両IDの匿名化 |
| パスワード漏洩 | ・bcrypt によるハッシュ化 <br>・パスワードポリシーの強制 <br>・定期的なセキュリティ監査 |
| 監査ログの改ざん | ・書き込み専用の権限設定 <br>・定期的なバックアップ <br>・ハッシュチェーンによる完全性確保 | 