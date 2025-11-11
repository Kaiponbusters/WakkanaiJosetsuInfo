# ディレクトリ整理 Phase 1 完了記録

## 実行日時
2025-11-11

## 実行内容

### 目的
Tidy First? の原則に従い、ドキュメントの発見性向上とプロジェクトルートの整理を実施。

### 変更内容

#### 1. ドキュメント統合
- `UML/` → `docs/architecture/` に統合
  - `diagrams/`: Draw.ioファイルと画像（4ファイル）
  - `specifications/`: システム仕様書（5ファイル）
  - `guides/`: Draw.io使用ガイド（2ファイル）

- 既存 `docs/*.md` → `docs/technical/` に整理
  - architecture-evaluation.md
  - bff-phase1-prep.md
  - cross-browser-compatibility.md

#### 2. ドキュメントインデックス作成
- `docs/README.md` 作成
  - 全ドキュメントへのナビゲーション提供
  - `.cursor/rules/` へのリンク（原本として維持）

#### 3. 旧ディレクトリ削除
- `UML/` ディレクトリ削除（空になったため）

### 影響範囲
- ✅ コードへの影響: なし
- ✅ ツール設定への影響: なし（`.cursor`, `.serena`, `.kiro`, `.playwright-mcp` は移動せず）
- ✅ ビルド・テストへの影響: なし

### 最終ディレクトリ構造

```
docs/
├── README.md                    # ドキュメントインデックス
├── architecture/               # アーキテクチャ関連（旧UML/）
│   ├── diagrams/
│   ├── specifications/
│   └── guides/
└── technical/                  # 技術文書（旧docs/*.md）
    ├── architecture-evaluation.md
    ├── bff-phase1-prep.md
    └── cross-browser-compatibility.md

.cursor/rules/                  # 開発ルール（原本、移動なし）
.serena/                        # Serenaツール設定（移動なし）
.kiro/                          # Kiroツール設定（移動なし）
.playwright-mcp/                # Playwrightキャッシュ（移動なし）
```

### 原則の適用
- ✅ **行動の分離**: ドキュメント整理のみ、コード変更なし
- ✅ **段階的な整理**: Phase 1（ドキュメント統合）のみ実施
- ✅ **価値ベース**: ドキュメント発見性の即座の改善
- ✅ **リスク最小化**: ツール設定は一切移動せず

### 次のステップ（Phase 2以降）

Phase 2は**実行しない**ことを推奨：
- テスト構造の変更はCI/CDへの影響が大きい
- 現在のテスト構造で十分機能している
- リスク/リターンのバランスが悪い

### 教訓
1. **ツール依存の考慮**: `.cursor`, `.serena`, `.kiro`, `.playwright-mcp` はツールが直接参照するため移動不可
2. **原本の尊重**: `.cursor/rules/` はCursorの原本なので重複コピー不要
3. **段階的実行**: 小さく始めて価値を確認してから次のステップへ
