# 開発に必要なコマンド一覧

## 基本開発コマンド

### 開発サーバー
```bash
# 開発サーバー起動（http://localhost:3000）
npm run dev

# 本番用ビルド
npm run build

# ビルドプレビュー
npm run preview

# 静的サイト生成
npm run generate

# 本番サーバー起動
npm start
```

## テストコマンド

### ユニットテスト
```bash
# Vitestによるユニットテスト実行
npm run test

# カバレッジレポート付きテスト
npm run coverage
```

### E2Eテスト（Playwright）
```bash
# E2Eテスト実行
npm run test:e2e

# E2EテストUIモード
npm run test:e2e:ui

# E2Eテストデバッグモード
npm run test:e2e:debug

# E2Eテストヘッドフルモード
npm run test:e2e:headed

# E2Eテストレポート表示
npm run test:e2e:report
```

## 開発環境管理

### 依存関係管理
```bash
# 依存関係インストール
npm install

# 依存関係の脆弱性チェック
npm audit

# 依存関係の更新
npm update

# package-lock.jsonの再生成
npm ci
```

### Docker環境
```bash
# Docker環境起動
cd docker && docker-compose up -d

# Docker環境停止
cd docker && docker-compose down

# Docker環境リビルド
cd docker && docker-compose up -d --build
```

## コード品質管理

### TypeScript
```bash
# TypeScriptコンパイルチェック
npx tsc --noEmit

# TypeScript設定の確認
npx tsc --showConfig
```

### リンティング・フォーマット
```bash
# ESLint実行（Nuxtに内蔵）
npm run lint

# Prettierフォーマット（必要に応じて設定）
npx prettier --write .
```

## Git・バージョン管理

### コミット・ブランチ管理
```bash
# 新機能ブランチ作成
git checkout -b feat/feature-name

# バグ修正ブランチ作成
git checkout -b fix/bug-name

# GitHub CLI使用でPR作成
gh pr create --title "タイトル" --body "説明"

# コミット（Conventional Commits形式）
git commit -m "feat(scope): 機能追加の説明 [refs #Issue番号]"
```

## Windows特有のコマンド

### PowerShellコマンド
```powershell
# ディレクトリ一覧
Get-ChildItem -Force

# ファイル検索
Get-ChildItem -Recurse -Filter "*.vue"

# プロセス確認
Get-Process | Where-Object {$_.ProcessName -like "*node*"}

# ポート確認
netstat -ano | findstr :3000
```

### システムユーティリティ
```bash
# ファイル検索（Windows）
where node
where npm

# 環境変数確認
echo $env:NODE_ENV

# PowerShellバージョン確認
$PSVersionTable
```

## デバッグコマンド

### ログ・デバッグ
```bash
# デバッグモードで開発サーバー起動
DEBUG=nuxt:* npm run dev

# Nodeデバッグモード
node --inspect npm run dev

# メモリ使用量確認
node --trace-gc npm run build
```

## ブラウザ互換性

### Browserslist更新
```bash
# ブラウザデータベース更新
npx update-browserslist-db@latest
```

## タスク完了時の推奨コマンド順序

1. **TypeScriptチェック**: `npx tsc --noEmit`
2. **ユニットテスト**: `npm run test`
3. **E2Eテスト**: `npm run test:e2e`
4. **ビルド確認**: `npm run build`
5. **コミット**: Conventional Commits形式
6. **PR作成**: `gh pr create`