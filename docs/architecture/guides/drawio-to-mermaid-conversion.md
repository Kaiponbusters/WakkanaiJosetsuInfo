# Draw.io から Mermaid への変換ガイド

## 変換概要

`Fullsystem.drawio` ファイルを Mermaid 形式に変換しました。これにより、バージョン管理が容易になり、Markdown ファイル内での直接表示が可能になります。

## 変換方法

### 手動変換プロセス
1. **構造分析**: drawio ファイルの XML 構造を解析
2. **ノード抽出**: 各 mxCell の value, style, geometry を特定
3. **エッジ抽出**: source/target 関係と接続ラベルを特定
4. **サブグラフ変換**: swimlane を subgraph に変換
5. **スタイル適用**: fillColor/strokeColor を classDef に変換

### 抽出した構造

#### ノード（要素）
```xml
<!-- 例: フロントエンド層のSPAアプリケーション -->
<mxCell id="FE1" value="SPA Application&lt;br/&gt;Nuxt 3 + Vue 3" 
        style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e1f5fe;strokeColor=#01579b;" 
        parent="frontend-container" vertex="1">
    <mxGeometry x="20" y="40" width="120" height="60" as="geometry"/>
</mxCell>
```

#### エッジ（接続）
```xml
<!-- 例: フロントエンドからデータアクセス層への直接アクセス -->
<mxCell id="edge-FE-DA1" value="" 
        style="endArrow=classic;html=1;rounded=0;" 
        edge="1" parent="1" source="FE1" target="DA1">
```

## 変換結果の差異

### 削除された要素
- **API Gateway層**: drawio では削除済み
- **DA4 (ファイルストレージ)**: drawio では削除済み
- **EXT2 (Firebase FCM)**: drawio では削除済み

### 追加された要素
- **BL5 (除雪情報参照)**: 新たに追加されたビジネスロジック

### 新しい接続関係
- **DA1 ↔ DB1**: 双方向データアクセス
- **FE1 ↔ DA1**: フロントエンドからの直接アクセス（読み取り用）

## Mermaid 記法のポイント

### サブグラフ（レイヤー）
```mermaid
subgraph "フロントエンド層"
    FE1[SPA Application<br/>Nuxt 3 + Vue 3]
    FE2[UIコンポーネント<br/>Tailwind CSS]
end
```

### 双方向接続
```mermaid
%% 双方向データアクセス
DA1 --> DB1
DB1 --> DA1
```

### スタイル定義
```mermaid
classDef frontend fill:#e1f5fe,stroke:#01579b
class FE1,FE2,FE3,FE4 frontend
```

### データベース表現
```mermaid
DB1[(PostgreSQL<br/>Supabase Managed)]  %% シリンダー形状
```

## ファイル構成

### 生成されたファイル
- `Fullsystem-updated.md`: 最新状態を反映した Mermaid 図
- `drawio-to-mermaid-conversion.md`: この変換ガイド

### 既存ファイル
- `Fullsystem.drawio`: 元の draw.io ファイル（編集可能）
- `Fullsystem.md`: 元の Mermaid ファイル（更新対象）

## 今後のメンテナンス

### 推奨ワークフロー
1. **Draw.io での編集**: 視覚的な編集には `Fullsystem.drawio` を使用
2. **Mermaid への反映**: 変更後、このガイドに従って手動で Mermaid を更新
3. **バージョン管理**: Git で Mermaid ファイルの差分を追跡

### 自動化の可能性
- **FlowForge**: Python ライブラリによる自動変換（要検証）
- **カスタムスクリプト**: XML パースによる変換スクリプトの開発

## 検証方法

### Mermaid 記法の確認
```bash
# Mermaid CLI での検証（要インストール）
mmdc -i Fullsystem-updated.md -o output.png
```

### ブラウザでの確認
- GitHub/GitLab での Markdown レンダリング
- Mermaid Live Editor (https://mermaid.live/) での確認

## トラブルシューティング

### よくある問題
1. **日本語文字化け**: UTF-8 エンコーディングを確認
2. **接続線の表示**: `-->` 記法の前後スペースを確認
3. **スタイル適用**: `classDef` と `class` の対応を確認

### デバッグ手順
1. Mermaid Live Editor でシンタックス確認
2. サブグラフ単位での分割テスト
3. 接続関係の段階的追加

この変換により、システム構成図の保守性と可読性が向上し、開発チーム全体での共有が容易になります。
