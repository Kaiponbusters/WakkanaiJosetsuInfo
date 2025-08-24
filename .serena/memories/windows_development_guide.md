# Windows環境での開発ガイド

## Windows特有の開発環境

### PowerShell 7 コマンド
```powershell
# ディレクトリ操作
Get-ChildItem                    # ls相当（ディレクトリ一覧）
Get-ChildItem -Force             # 隠しファイル含む一覧
Get-ChildItem -Recurse           # 再帰的検索
Set-Location                     # cd相当（ディレクトリ移動）

# ファイル操作
Get-Content filename.txt         # cat相当（ファイル内容表示）
Select-String "pattern" *.js     # grep相当（パターン検索）
Copy-Item source dest            # cp相当（ファイルコピー）
Remove-Item filename             # rm相当（ファイル削除）

# プロセス管理
Get-Process                      # ps相当（プロセス一覧）
Get-Process | Where-Object {$_.ProcessName -like "*node*"}  # Node.jsプロセス検索
Stop-Process -Name "node"        # プロセス停止
```

### 環境変数管理
```powershell
# 環境変数確認
$env:NODE_ENV                    # 特定の環境変数
Get-ChildItem env:               # 全環境変数

# 環境変数設定（セッション用）
$env:NODE_ENV = "development"

# 環境変数設定（永続化）
[Environment]::SetEnvironmentVariable("NODE_ENV", "development", "User")
```

### ネットワーク・ポート管理
```powershell
# ポート使用状況確認
netstat -ano | findstr :3000
Get-NetTCPConnection -LocalPort 3000

# プロセスIDからプロセス名確認
Get-Process -Id 1234

# ファイアウォール確認
Get-NetFirewallRule -DisplayName "*Node*"
```

## パス・ファイル操作

### パス表記
```powershell
# Windows絶対パス
C:\WakkanaiJosetsuSystem\components\ui\AreaNameDisplay.vue

# PowerShell相対パス
.\components\ui\AreaNameDisplay.vue

# Unix式パス（Git Bashなど）
./components/ui/AreaNameDisplay.vue
```

### ファイル検索
```powershell
# 特定の拡張子のファイル検索
Get-ChildItem -Recurse -Filter "*.vue"
Get-ChildItem -Recurse -Include "*.ts","*.vue"

# ファイル名パターン検索
Get-ChildItem -Recurse | Where-Object {$_.Name -match "use.*\.ts$"}

# ファイル内容検索
Select-String -Path "*.vue" -Pattern "Leaflet"
```

## Git操作（Windows）

### 改行コード設定
```bash
# 改行コードの自動変換設定
git config --global core.autocrlf true

# 改行コード確認
git config --get core.autocrlf
```

### 権限・パフォーマンス設定
```bash
# ファイル権限変更の無視
git config --global core.filemode false

# 長いパス名対応
git config --global core.longpaths true

# パフォーマンス改善
git config --global core.preloadindex true
git config --global core.fscache true
```

## Node.js・npm（Windows）

### Node.js管理
```powershell
# Node.jsバージョン確認
node --version
npm --version

# npm設定確認
npm config list

# npm cache管理
npm cache verify
npm cache clean --force
```

### Windows固有のトラブルシューティング
```powershell
# npm権限エラー対処
npm config set registry https://registry.npmjs.org/

# パス長制限対処
npm config set scripts-prepend-node-path auto

# Windows Defender除外設定（推奨）
# node_modules ディレクトリをスキャン対象から除外
```

## 開発ツール（Windows）

### VSCode・Cursor設定
```json
// settings.json（Windows用設定）
{
  "terminal.integrated.defaultProfile.windows": "PowerShell",
  "files.eol": "\n",
  "git.autofetch": true,
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

### Docker（Windows）
```powershell
# Docker Desktop確認
docker version
docker-compose version

# WSL2統合確認
wsl --list --verbose

# Dockerコンテナ操作
docker ps                        # 稼働中コンテナ
docker images                    # イメージ一覧
docker system prune              # 不要なコンテナ・イメージ削除
```

## パフォーマンス最適化

### Windows特有の最適化
```powershell
# ファイル監視設定（Nuxt開発時）
# nuxt.config.ts内のwatchオプション設定済み

# メモリ使用量確認
Get-Process -Name "node" | Select-Object WorkingSet,VirtualMemorySize

# ディスク使用量確認
Get-ChildItem -Path . -Recurse | Measure-Object -Property Length -Sum
```

### Windows Defenderスキャン除外
```
推奨除外パス：
- C:\WakkanaiJosetsuSystem\node_modules
- C:\Users\{username}\.npm
- C:\Users\{username}\.cache
```

## デバッグ・ログ

### PowerShellデバッグ
```powershell
# デバッグ情報有効化
$DebugPreference = "Continue"

# 詳細ログ
$VerbosePreference = "Continue"

# エラー処理
$ErrorActionPreference = "Stop"
```

### Windows Event Log
```powershell
# アプリケーションログ確認
Get-EventLog -LogName Application -Source "Node.js" -Newest 10

# カスタムログ作成（管理者権限必要）
New-EventLog -LogName "WakkanaiJosetsu" -Source "SnowApp"
```

## セキュリティ考慮事項

### 実行ポリシー
```powershell
# 現在の実行ポリシー確認
Get-ExecutionPolicy

# 開発用実行ポリシー設定（管理者権限必要）
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### ファイアウォール設定
```powershell
# 開発サーバー用ポート許可
New-NetFirewallRule -DisplayName "Nuxt Dev Server" -Direction Inbound -Protocol TCP -LocalPort 3000
```

## よくあるWindows固有の問題

### 1. パス長制限
- **問題**: 260文字のパス長制限
- **対処**: `git config --global core.longpaths true`

### 2. 改行コード問題
- **問題**: CRLF vs LF の差異
- **対処**: `.gitattributes` ファイルで統一

### 3. ファイルロック
- **問題**: プロセスがファイルをロック
- **対処**: プロセス終了後に操作

### 4. 権限エラー
- **問題**: 管理者権限不足
- **対処**: PowerShellを管理者として実行

## 推奨Windows開発環境

### 必須ツール
- PowerShell 7
- Windows Terminal
- Git for Windows
- Node.js LTS
- Visual Studio Code または Cursor
- Docker Desktop

### 便利ツール
- Windows Subsystem for Linux (WSL2)
- PowerToys（ファイル名一括変更など）
- Everything（高速ファイル検索）