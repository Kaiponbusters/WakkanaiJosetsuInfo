# 環境設定手順

このドキュメントでは、除排雪情報システムの環境設定手順を説明します。

---

## 1. 必要な環境変数

プロジェクトルートに `.env` ファイルを作成し、以下の変数を設定してください：

```env
# Supabase設定
# Supabaseプロジェクトの設定画面から取得してください
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# JWT認証設定
# 64文字以上のランダムな文字列を生成してください
# 例: openssl rand -hex 64
JWT_SECRET=your_strong_jwt_secret_key_here_minimum_64_characters_recommended

# 開発環境設定
NODE_ENV=development

# アプリケーション設定
APP_URL=http://localhost:3000
```

---

## 2. Supabase設定の取得方法

### 2.1 Supabaseプロジェクト作成
1. [Supabase](https://supabase.com/) にアクセス
2. 「New Project」でプロジェクトを作成
3. データベースパスワードを設定

### 2.2 API キーの取得
1. Supabaseダッシュボード → Settings → API
2. 以下の値をコピー：
   - `Project URL` → `SUPABASE_URL`
   - `anon public` → `SUPABASE_KEY`
   - `service_role` → `SUPABASE_SERVICE_KEY`

⚠️ **重要**: `service_role` キーは絶対にクライアントサイドで使用しないでください

---

## 3. JWT秘密鍵の生成

### Windows (PowerShell)
```powershell
# ランダムな64文字の文字列を生成
-join ((1..64) | ForEach {'{0:X}' -f (Get-Random -Max 16)})
```

### macOS/Linux
```bash
# OpenSSLを使用してランダムな64文字の16進数文字列を生成
openssl rand -hex 64
```

### オンラインツール（開発環境のみ）
- [Random.org](https://www.random.org/passwords/)
- [LastPass Password Generator](https://www.lastpass.com/password-generator)

⚠️ **セキュリティ**: 本番環境では必ず安全な方法で生成してください

---

## 4. データベース設定

### 4.1 スキーマの適用
1. Supabaseダッシュボード → SQL Editor
2. `server/db/schema.sql` の内容を貼り付けて実行
3. エラーがないことを確認

### 4.2 RLS (Row Level Security) の確認
スキーマ適用後、以下を確認：
- テーブルでRLSが有効になっている
- ポリシーが正しく作成されている

### 4.3 認証設定
1. Supabaseダッシュボード → Authentication → Settings
2. 以下を設定：
   - Site URL: `http://localhost:3000` （開発環境）
   - Email confirmations: 必要に応じて無効化

---

## 5. 初期管理者アカウントの作成

### 5.1 Supabase Authでユーザー作成
```sql
-- Supabase SQL Editorで実行
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@example.com',  -- 管理者メールアドレスに変更
  NOW(),
  NOW(),
  NOW()
);
```

### 5.2 ユーザープロファイルの作成
```sql
-- 上で作成したユーザーのIDを確認
SELECT id, email FROM auth.users WHERE email = 'admin@example.com';

-- ユーザープロファイルを作成（上で取得したIDを使用）
INSERT INTO user_profiles (id, role, full_name, department, is_active)
VALUES (
  'ここに上で取得したuser_id',  -- UUIDを入力
  'admin',
  '管理者',
  'システム管理部',
  true
);
```

### 5.3 パスワード設定
1. Supabaseダッシュボード → Authentication → Users
2. 作成したユーザーをクリック
3. 「Send reset password email」でパスワード設定

---

## 6. テスト用アカウントの作成

```sql
-- スタッフアカウント例
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'staff@example.com',
  NOW(),
  NOW(),
  NOW()
);

-- スタッフプロファイル
INSERT INTO user_profiles (id, role, full_name, department, is_active)
VALUES (
  '上で作成したスタッフのuser_id',
  'staff',
  'テスト職員',
  '除雪作業部',
  true
);
```

---

## 7. 動作確認

### 7.1 開発サーバーの起動
```bash
npm run dev
```

### 7.2 確認項目
- [ ] ログインページ（`/login`）が表示される
- [ ] 管理者アカウントでログインできる
- [ ] ダッシュボード（`/dashboard`）にアクセスできる
- [ ] 認証が必要なページが保護されている

---

## 8. トラブルシューティング

### よくある問題

#### 環境変数が読み込まれない
- `.env` ファイルがプロジェクトルートにあるか確認
- サーバーを再起動

#### Supabase接続エラー
- URLとキーが正しいか確認
- Supabaseプロジェクトが稼働中か確認

#### 認証エラー
- RLSポリシーが正しく設定されているか確認
- ユーザープロファイルが作成されているか確認

#### JWT関連エラー
- JWT_SECRET が設定されているか確認
- 文字列が十分に長い（推奨64文字以上）か確認

---

## 9. セキュリティチェックリスト

### 開発環境
- [ ] `.env` ファイルを `.gitignore` に追加済み
- [ ] テスト用のメールアドレスを使用
- [ ] 強固なJWT秘密鍵を設定

### 本番環境（将来）
- [ ] 実際のメールアドレスを使用
- [ ] 暗号学的に安全なJWT秘密鍵
- [ ] HTTPS必須
- [ ] Supabaseのセキュリティ設定確認

---

**最終更新：2024年12月** 