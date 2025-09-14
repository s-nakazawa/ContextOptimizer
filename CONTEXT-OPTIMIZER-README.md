# Context Optimizer MCP Server 🚀

**Context Optimizer MCP Server** は、Cursor開発環境向けの高度なMCPサーバーです。
ファイル検索、コンテキスト読み込み、AST解析、Git差分分析、パフォーマンス最適化、ハイブリッド検索などの機能を提供します。

## 📁 設定ファイル一覧

### 1. `context-optimizer-config.json` ⚙️
- **用途**: メイン設定ファイル
- **内容**: サーバー設定、プロジェクト設定、検索設定、パフォーマンス設定など
- **使用方法**: このファイルを `config.json` にコピーして使用

### 2. `context-optimizer-env-example.txt` 🌍
- **用途**: 環境変数設定の例
- **内容**: プロジェクト設定、MCP設定、検索設定、パフォーマンス設定など
- **使用方法**: このファイルを `.env` にコピーして使用

### 3. `context-optimizer-cursor-settings-example.json` 🎯
- **用途**: Cursor設定ファイルの例
- **内容**: MCPサーバー設定、環境変数設定
- **使用方法**: このファイルを `.cursor/settings.json` にコピーして使用

## 🚀 セットアップ手順

### 1. 設定ファイルの準備
```bash
# メイン設定ファイルをコピー
cp context-optimizer-config.json config.json

# 環境変数ファイルをコピー
cp context-optimizer-env-example.txt .env
```

### 2. プロジェクト設定の更新
`config.json` の `project.root` を実際のプロジェクトパスに変更：
```json
{
  "project": {
    "name": "YourProjectName",
    "root": "/path/to/your/project",
    "type": "typescript",
    "framework": "hono"
  }
}
```

### 3. Cursor設定の更新
`.cursor/settings.json` に以下を追加：
```json
{
  "mcp": {
    "servers": {
      "context-optimizer-mcp-server": {
        "command": "node",
        "args": ["/path/to/context-optimizer/index.js"],
        "env": {
          "PROJECT_ROOT": "/path/to/your/project"
        }
      }
    }
  }
}
```

### 4. 環境変数の設定
```bash
export PROJECT_ROOT="/path/to/your/project"
export PROJECT_NAME="YourProjectName"
```

## 🔧 主要機能

- **ファイル検索**: プロジェクト内のファイルを効率的に検索
- **コンテキストパック生成**: プロジェクト理解に必要な最小限のコンテキストを生成
- **シンボル検索**: 関数、クラス、変数などのシンボルを検索
- **AST解析**: JavaScript/TypeScriptファイルの構文解析
- **Git差分分析**: コミット履歴と変更内容の分析
- **ハイブリッド検索**: BM25とベクトル検索を組み合わせた高度な検索
- **パフォーマンス最適化**: キャッシュ、並列処理、メモリ管理
- **コンテキスト管理**: リアルタイム監視、自動圧縮、最適化提案

## 📊 パフォーマンス設定

- **キャッシュ**: TTL 600秒、最大2000キー
- **並列処理**: 最大8並列
- **メモリ管理**: 最大200MB使用
- **検索結果**: 最大100件
- **ファイルサイズ**: 最大200KB

## 🎯 プロジェクト対応

- **TypeScript**: 完全対応
- **JavaScript**: 完全対応
- **Python**: 基本対応
- **Java**: 基本対応
- **Go**: 基本対応
- **Rust**: 基本対応

## 🔍 トラブルシューティング

### 問題: ファイルが見つからない
**解決策**: `project.root` の設定を確認し、正しいパスを指定

### 問題: 検索結果が0件
**解決策**: `fileSearch.patterns` と `fileSearch.excludePatterns` を確認

### 問題: ハイブリッド検索が動作しない
**解決策**: `hybridSearch.autoIndex` を `true` に設定

## 📝 バージョン情報

- **現在のバージョン**: 1.2.1
- **サーバー名**: context-optimizer-mcp-server
- **対応プロトコル**: MCP 2024-11-05

## 🤝 サポート

問題が発生した場合は、設定ファイルの内容とエラーメッセージを確認してください。
Context Optimizer MCP Serverは継続的に改善されています。

---

**Context Optimizer MCP Server** - より効率的な開発環境を提供します 🚀✨
