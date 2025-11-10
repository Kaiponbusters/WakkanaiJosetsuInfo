# SuperClaude 導入ガイド

## 概要

SuperClaudeは、Claude Code（Cursor）の機能を強化するためのオープンソースの設定フレームワークです。19の専門的なコマンドと9つの認知ロールを提供し、開発ワークフローを効率化し、トークン使用量を最大70%削減することが可能です。

## プロジェクトへの導入状況

このプロジェクトには、SuperClaudeプラグインがプロジェクトローカルプラグインとして導入されています。

### プラグインの場所

```
.claude-plugin/superclaude/
├── agents/          # AIエージェント定義
├── commands/        # コマンド定義
├── hooks/           # セッションフック設定
├── scripts/         # ユーティリティスクリプト
└── skills/          # スキル定義
```

## 使用方法

### 基本的なコマンド

SuperClaudeは以下のコマンドを提供します：

#### `/research` - Deep Research
並列Web検索とエビデンスベースの統合を実行します。

```bash
/research "Nuxt 3の最新機能について"
```

#### `/index-repo` - リポジトリインデックス作成
プロジェクト構造を解析し、94%のトークン削減（58K → 3K）を実現します。

```bash
/index-repo
```

#### `/agent` - エージェント起動
専門的なAIエージェントを起動します。

```bash
/agent deep-research "技術調査を実行"
```

### セッション開始時の自動実行

SessionStartフックにより、新しいセッション開始時に自動的に初期化が実行されます。

## 前提条件

### 必須要件

- **Claude Code（Cursor）**: 最新バージョンがインストールされていること
- **Git**: ユーザー情報が設定されていること

### オプション要件（パフォーマンス向上）

以下のMCPサーバーを導入することで、2-3倍の高速化と30-50%のトークン削減が可能です：

- **Serena**: コード理解（2-3倍高速化）
- **Sequential**: トークン効率的な推論（30-50%削減）
- **Tavily**: Deep Research用のWeb検索
- **Context7**: 公式ドキュメント検索

MCPサーバーの導入方法については、[airis-mcp-gateway](https://github.com/agiletec-inc/airis-mcp-gateway)を参照してください。

## インストールの確認

### プラグインの確認

```bash
# プラグインディレクトリの確認
ls -la .claude-plugin/superclaude/

# コマンドの確認
ls -la .claude-plugin/superclaude/commands/
```

### 動作確認

Claude Code内で以下のコマンドを試して、機能を確認します：

```bash
/research "test query"
/index-repo
```

## トラブルシューティング

### コマンドが認識されない場合

1. **Claude Codeの再起動**: プラグインの変更を反映するために、Claude Codeを再起動してください。

2. **プラグインディレクトリの確認**: `.claude-plugin/superclaude/`ディレクトリが存在することを確認してください。

3. **プロジェクトルートでの実行**: Claude Codeをプロジェクトルートディレクトリから起動していることを確認してください。

### セッション初期化エラー

`hooks/hooks.json`の設定を確認してください。セッション開始時の自動実行を無効化したい場合は、該当ファイルを編集してください。

## 詳細情報

- **公式ドキュメント**: https://superclaude.netlify.app/
- **GitHubリポジトリ**: https://github.com/SuperClaude-Org/SuperClaude_Framework
- **日本語ドキュメント**: https://github.com/SuperClaude-Org/SuperClaude_Framework/blob/main/README-ja.md

## 更新方法

プラグインを更新する場合は、最新のSuperClaudeリポジトリからプラグインディレクトリを再コピーしてください：

```bash
# 最新版を取得
git clone https://github.com/SuperClaude-Org/SuperClaude_Framework.git /tmp/SuperClaude

# プラグインを更新
cp -r /tmp/SuperClaude/plugins/superclaude/* .claude-plugin/superclaude/
```

## 注意事項

- SuperClaudeは開発者のローカル環境で動作する設定フレームワークです
- プロジェクトの依存関係として追加するものではありません
- チーム開発では、各開発者がローカル環境に導入することを推奨します

