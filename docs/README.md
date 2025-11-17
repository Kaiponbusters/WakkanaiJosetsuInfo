# プロジェクトドキュメント

わっかない除雪情報マップのドキュメントハブです。

## 📐 アーキテクチャ

### システム図
- [システム全体図](./architecture/diagrams/Fullsystem.drawio) - Draw.io形式
- [システム全体図（画像）](./architecture/diagrams/Fullsystem.png)
- [ユースケース図](./architecture/diagrams/UseCase.drawio) - Draw.io形式
- [システム構成図](./architecture/diagrams/SystemKousei.drawio) - Draw.io形式

### 仕様書
- [システム全体仕様（最新版）](./architecture/specifications/Fullsystem-updated.md)
- [ユースケース仕様](./architecture/specifications/UseCase.md)
- [システム構成仕様](./architecture/specifications/SystemKousei.md)
- [システム設計](./architecture/specifications/Systemsekkei.md)
- [システム概要](./architecture/specifications/System.md)

### ガイド
- [Draw.io使用ガイド](./architecture/guides/draw-io-usage-guide.md)
- [Draw.io → Mermaid変換ガイド](./architecture/guides/drawio-to-mermaid-conversion.md)

## 🛠️ 開発ガイド

開発ルールとベストプラクティスは [`.cursor/rules/`](../.cursor/rules/) に格納されています：

### スタイルガイド
- [Vue/Nuxtスタイルガイド](../.cursor/rules/vue-nuxt-style-guide.mdc)
- [TypeScriptガイド](../.cursor/rules/typescript-guide.mdc)
- [Tailwindルール](../.cursor/rules/tailwind-rule.mdc)

### ワークフロー
- [コミットルール](../.cursor/rules/commit-rule.mdc)
- [PRサイズ管理](../.cursor/rules/pr-size-management.mdc)
- [コンフリクト防止](../.cursor/rules/conflict-prevention.mdc)

### ベストプラクティス
- [デザインパターン](../.cursor/rules/design-patterns.mdc)
- [プロジェクト構造](../.cursor/rules/project-structure.mdc)
- [技術ガイド](../.cursor/rules/tech-guides.mdc)

## 📚 技術文書

- [アーキテクチャ評価](./technical/architecture-evaluation.md)
- [BFF Phase 1 準備](./technical/bff-phase1-prep.md)
- [クロスブラウザ互換性](./technical/cross-browser-compatibility.md)

## 🗂️ その他のドキュメント

- [プロジェクト概要とTODO](../TODO.md)
- [卒論ポスター内容](../卒論ポスター内容.md)
- [ポスタードラフト](../poster_draft.md)

---

## 📖 ドキュメント構成の原則

このプロジェクトでは、ドキュメントを以下のように整理しています：

- **architecture/**: システム設計・構成に関するドキュメント（UML図、仕様書）
- **technical/**: 技術的な評価・調査・設計文書
- **.cursor/rules/**: 開発ルールとガイドライン（Cursor用、原本）
- **プロジェクトルート**: プロジェクト全体に関わる文書（README、TODO等）

新しいドキュメントを追加する際は、この分類に従って適切な場所に配置してください。
