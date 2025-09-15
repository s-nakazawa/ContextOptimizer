# Context Optimizer

**高度なModel Context Protocol (MCP)サーバー - Cursor開発環境向けのAI外部記憶装置機能、永続化ストレージ、差分インデックス、コンテンツ圧縮、プロンプトパッケージング、Master/Worker AI対応の包括的コンテキスト管理システム**

Advanced Model Context Protocol (MCP) server for Cursor development environments with AI external memory features, persistent storage, differential indexing, content compression, prompt packaging, and comprehensive context management for Master/Worker AI systems.

## 🚀 機能 / Features

### コア機能 / Core Functionality
- **ファイル検索**: ブラックリストベースのフィルタリングによるインテリジェントなファイル発見
  **File Search**: Intelligent file discovery with blacklist-based filtering
- **コンテンツ読み込み**: サイズ制限と拡張子フィルタリング付きの効率的なファイルコンテンツ読み込み
  **Content Reading**: Efficient file content reading with size limits and extension filtering
- **AST解析**: JavaScript/TypeScriptコード分析
  **AST Parsing**: JavaScript/TypeScript code analysis
- **Git差分分析**: 包括的なコミット履歴と差分分析
  **Git Diff Analysis**: Comprehensive commit history and diff analysis
- **パフォーマンス最適化**: キャッシュ、並列処理、メモリ管理
  **Performance Optimization**: Caching, parallel processing, and memory management
- **ハイブリッド検索**: 意味的ファイル発見のためのBM25 + ベクトル検索
  **Hybrid Search**: BM25 + Vector search for semantic file discovery

### 設定管理 / Configuration Management
- **ブラックリストベースフィルタリング**: 許可リストを維持する代わりに不要なファイルを除外
  **Blacklist-based Filtering**: Exclude unwanted files instead of maintaining allowlists
- **柔軟なファイルパターン**: 設定可能な除外項目でデフォルトですべてのファイルタイプをサポート
  **Flexible File Patterns**: Support for all file types by default with configurable exclusions
- **スマート拡張子フィルタリング**: バイナリファイルとメディアファイルを自動除外
  **Smart Extension Filtering**: Automatically exclude binary files and media files

### コンテキスト管理 / Context Management
- **コンテキストサイズ監視**: リアルタイムコンテキスト使用量監視
  **Context Size Monitoring**: Real-time context usage monitoring
- **自動圧縮機能**: しきい値を超えた場合の自動コンテキスト圧縮
  **Automatic Compression**: Auto-compress context when it exceeds thresholds
- **コンテキスト最適化提案**: コンテキスト最適化のためのインテリジェントな提案
  **Context Optimization Suggestions**: Intelligent suggestions for context optimization
- **コンテキスト履歴管理**: 過去のコンテキストの効率的な管理
  **Context History Management**: Efficient management of past contexts

### AI外部記憶装置機能 / AI External Memory Features
- **永続化ストレージ**: JSONベースのローカルストレージでインデックスと履歴を永続化
  **Persistent Storage**: JSON-based local storage for persistent indexes and history
- **差分インデックス**: Gitベースの変更検出による効率的な増分インデックス更新
  **Differential Indexing**: Efficient incremental index updates with Git-based change detection
- **コンテンツ圧縮**: トークン数しきい値に基づく自動要約・圧縮機能
  **Content Compression**: Automatic summarization and compression based on token thresholds
- **プロンプトパッケージング**: Master/Worker AI用の構造化されたコンテキストパッケージ生成
  **Prompt Packaging**: Structured context package generation for Master/Worker AI

### アナリティクス・洞察 / Analytics & Insights
- **コンテキストアナリティクス**: コンテキスト運用の包括的分析・可視化
  **Context Analytics**: Comprehensive analysis and visualization of context operations
- **効率性ダッシュボード**: パフォーマンスメトリクス付きリアルタイム効率性ダッシュボード
  **Efficiency Dashboard**: Real-time efficiency dashboard with performance metrics
- **パフォーマンスレポート**: 推奨事項付き詳細パフォーマンスレポート
  **Performance Reports**: Detailed performance reports with recommendations

## 📦 インストール / Installation

```bash
# グローバルインストール
# Install globally
npm install -g context-optimizer@latest

# またはnpxを使用（推奨）
# Or use npx (recommended)
npx context-optimizer@latest
```

## 🎯 Cursor統合 / Cursor Integration

### セットアップ / Setup

1. **Context Optimizerをインストール** / **Install Context Optimizer**
```bash
npm install -g context-optimizer@latest
```

2. **Cursorを設定** / **Configure Cursor**
プロジェクトルートに`.cursor/settings.json`を作成または編集:
Create or edit `.cursor/settings.json` in your project root:

```json
{
  "mcp": {
    "servers": {
      "context-optimizer": {
        "command": "npx",
        "args": ["context-optimizer@latest"],
        "env": {
          "NODE_ENV": "production"
        }
      }
    }
  }
}
```

3. **Cursorを再起動** / **Restart Cursor**
MCPサーバーを認識するためにCursorを再起動してください。
Restart Cursor to recognize the MCP server.

### 使用例 / Usage Examples

#### 🔍 **ファイル発見** / **File Discovery**
```
Cursor: "このプロジェクトのReactコンポーネントをすべて見つけて"
→ get_context_pack("React components") が関連ファイルを自動抽出
→ search_files("**/*.{tsx,jsx}") がコンポーネントファイルを発見
→ parse_ast がコンポーネント構造を解析
```

#### 🐛 **バグ調査** / **Bug Investigation**
```
Cursor: "このバグを調査して"
→ analyze_git_diff が最近の変更を表示
→ extract_function が問題のある関数を抽出
→ parse_ast が依存関係と構造を解析
→ 根本原因を自動的に特定
```

#### 🚀 **パフォーマンス最適化** / **Performance Optimization**
```
Cursor: "このコードを最適化して"
→ optimize_performance が現在のパフォーマンスを分析
→ get_efficiency_dashboard がリアルタイムメトリクスを表示
→ suggest_context_optimization が最適化提案を提供
→ 推奨事項付きパフォーマンスレポートを生成
```

#### 📊 **開発アナリティクス** / **Development Analytics**
```
Cursor: "開発効率を表示して"
→ get_context_analytics が包括的なメトリクスを提供
→ get_efficiency_dashboard がリアルタイムダッシュボードを表示
→ generate_performance_report が詳細レポートを作成
→ トレンド、洞察、推奨事項を表示
```

#### 🧠 **AI外部記憶装置** / **AI External Memory**
```
Cursor: "React認証機能の実装について教えて"
→ generate_master_package がMaster AI用の包括的パッケージを生成
→ プロジェクト概要、関連ファイル、推奨事項を含む構造化データ
→ 永続化ストレージから履歴とスナップショットを取得
→ トークン数制限内で最適化されたコンテキストを提供
```

#### 🔧 **Worker AI支援** / **Worker AI Support**
```
Cursor: "ログインコンポーネントを作成して"
→ generate_worker_package がWorker AI用のタスク特化パッケージを生成
→ 関連コード、依存関係、実装ヒントを含む
→ コンテンツ圧縮で効率的な情報提供
→ タスク実行に必要な最小限のコンテキストを構造化
```

## ⚙️ 設定 / Configuration

### プロジェクト固有の設定 / Project-Specific Configuration

プロジェクトルートに`.context-optimizer.config`ファイルを作成:
Create a `.context-optimizer.config` file in your project root:

```bash
# サンプル設定をコピー
# Copy the example configuration
cp .context-optimizer.config.example .context-optimizer.config

# 設定ファイルを編集
# Edit the configuration file
nano .context-optimizer.config
```

### 設定ファイルの作成方法 / How to Create Configuration Files

#### 1. **基本設定ファイルの作成** / **Creating Basic Configuration**

プロジェクトルートに`.context-optimizer.config`ファイルを作成:
Create `.context-optimizer.config` file in your project root:

```json
{
  "server": {
    "name": "context-optimizer-server",
    "version": "1.2.2",
    "description": "Context Optimizer - Advanced MCP Server for Cursor Development"
  },
  "project": {
    "name": "あなたのプロジェクト名",
    "root": "/絶対パス/あなたのプロジェクト",
    "type": "typescript",
    "framework": "react",
    "autoDetect": true
  },
  "tools": {
    "enabled": true,
    "maxResults": 50
  },
  "logging": {
    "level": "info",
    "enabled": true
  }
}
```

#### 2. **ファイル検索設定** / **File Search Configuration**

```json
{
  "fileSearch": {
    "enabled": true,
    "patterns": [
      "**/*.{ts,tsx,js,jsx}",
      "**/*.{py,java,go,rs}",
      "**/*.{md,txt,json,yaml,yml}",
      "**/*.{sql,css,html}"
    ],
    "excludePatterns": [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.git/**",
      "**/coverage/**",
      "**/tmp/**",
      "**/temp/**",
      "**/.cache/**",
      "**/.vscode/**",
      "**/.idea/**",
      "**/vendor/**",
      "**/target/**",
      "**/out/**",
      "**/bin/**",
      "**/obj/**",
      "**/*.log",
      "**/*.backup"
    ],
    "maxResults": 100,
    "budgetTokens": 10000
  }
}
```

#### 3. **ファイルコンテンツ設定** / **File Content Configuration**

```json
{
  "fileContent": {
    "enabled": true,
    "maxFileSize": 200000,
    "excludeExtensions": [
      ".exe", ".dll", ".so", ".dylib", ".bin", ".img", ".iso",
      ".zip", ".tar", ".gz", ".rar", ".7z",
      ".mp4", ".avi", ".mov", ".mp3", ".wav", ".flac",
      ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".svg",
      ".ico", ".woff", ".woff2", ".ttf", ".eot", ".otf"
    ]
  }
}
```

#### 4. **AST解析設定** / **AST Parsing Configuration**

```json
{
  "astParsing": {
    "enabled": true,
    "supportedLanguages": ["javascript", "typescript"],
    "maxFileSize": 100000,
    "includeComments": true,
    "includeLocations": true
  }
}
```

#### 5. **Git差分分析設定** / **Git Diff Analysis Configuration**

```json
{
  "gitDiff": {
    "enabled": true,
    "maxCommits": 10,
    "includeStats": true,
    "supportedFormats": ["unified", "context", "name-only"]
  }
}
```

#### 6. **パフォーマンス設定** / **Performance Configuration**

```json
{
  "performance": {
    "enabled": true,
    "cache": {
      "enabled": true,
      "ttl": 600,
      "maxKeys": 2000
    },
    "parallel": {
      "enabled": true,
      "maxConcurrency": 8
    },
    "memory": {
      "enabled": true,
      "maxMemoryUsage": 209715200
    }
  }
}
```

#### 7. **ハイブリッド検索設定** / **Hybrid Search Configuration**

```json
{
  "hybridSearch": {
    "enabled": true,
    "bm25": {
      "enabled": true,
      "k1": 1.2,
      "b": 0.75,
      "indexPath": "search-index"
    },
    "vector": {
      "enabled": true,
      "dimensions": 384,
      "similarityThreshold": 0.7,
      "indexPath": "vector-index"
    },
    "weights": {
      "bm25": 0.6,
      "vector": 0.4
    },
    "autoIndex": true,
    "indexUpdateInterval": 300000
  }
}
```

#### 8. **コンテキスト管理設定** / **Context Management Configuration**

```json
{
  "contextManagement": {
    "enabled": true,
    "monitoring": {
      "enabled": true,
      "maxContextSize": 200000,
      "warningThreshold": 150000,
      "criticalThreshold": 180000,
      "updateInterval": 1000
    },
    "autoCompression": {
      "enabled": true,
      "threshold": 150000,
      "compressionRatio": 0.7,
      "preserveImportant": true,
      "algorithms": ["summarization", "truncation", "keyword-extraction"]
    },
    "optimizationSuggestions": {
      "enabled": true,
      "analyzeFrequency": "on-demand",
      "suggestionTypes": ["duplicate-removal", "irrelevant-filtering", "priority-ranking"],
      "confidenceThreshold": 0.8
    },
    "historyManagement": {
      "enabled": true,
      "maxHistoryEntries": 100,
      "retentionPeriod": 7,
      "compressionEnabled": true,
      "searchEnabled": true
    }
  }
}
```

#### 9. **アナリティクス設定** / **Analytics Configuration**

```json
{
  "analytics": {
    "enabled": true,
    "metrics": {
      "enabled": true,
      "collectionInterval": 5000,
      "retentionDays": 30,
      "trackContextSize": true,
      "trackCompressionRatio": true,
      "trackOptimizationSuggestions": true,
      "trackHistoryUsage": true
    },
    "dashboard": {
      "enabled": true,
      "updateInterval": 10000,
      "showRealTimeStats": true,
      "showHistoricalTrends": true,
      "showEfficiencyMetrics": true
    },
    "insights": {
      "enabled": true,
      "analyzeFrequency": "on-demand",
      "generateReports": true,
      "suggestImprovements": true,
      "trackPerformance": true
    }
  }
}
```

### 設定ファイルの優先順位 / Configuration File Priority

サーバーは以下の順序で設定ファイルを探します:
The server looks for configuration files in the following order:

1. **PROJECT_ROOT/.context-optimizer.config** (プロジェクト固有 / project-specific)
2. **package_directory/config.json** (フォールバック / fallback)

### パス規則 / Path Rules

- **PROJECT_ROOT**: 絶対パスである必要があります / Must be an absolute path
- **その他のパス**: PROJECT_ROOTからの相対パス / Relative to PROJECT_ROOT
- **パス区切り文字**: フォワードスラッシュ (/) を使用 / Use forward slashes (/)

### 設定ヘルプ / Configuration Help

```bash
# 設定ヘルプを表示
# Show configuration help
context-optimizer --config-help
```

### ブラックリストベース設定 / Blacklist-based Configuration

サーバーは柔軟性とメンテナンス性を向上させるため、**ブラックリストベースのアプローチ**を使用します:
The server now uses a **blacklist-based approach** for better flexibility and maintainability:

- **ファイル検索**: デフォルトですべてのファイルが含まれ、不要なディレクトリのみを除外
  **File Search**: All files are included by default, only exclude unwanted directories
- **ファイルコンテンツ**: デフォルトですべてのファイル拡張子がサポートされ、バイナリ/メディアファイルのみを除外
  **File Content**: All file extensions are supported by default, only exclude binary/media files
- **自動サポート**: 新しいファイルタイプと言語が自動的にサポートされる
  **Automatic Support**: New file types and languages are automatically supported

## 🛠️ 利用可能なツール / Available Tools

### コアツール / Core Tools
- `get_context_pack`: プロジェクト理解のための最小限のコンテキストを生成
  **Generate minimal context for project understanding**
- `extract_function`: 特定の関数やクラスのコードを抽出
  **Extract specific function or class code**
- `search_symbols`: プロジェクト全体からシンボルを検索
  **Search for symbols across the project**
- `search_files`: globパターンを使用してファイルを検索
  **Search for files using glob patterns**
- `read_file_content`: サイズ制限付きでファイルコンテンツを読み込み
  **Read file content with size limits**
- `parse_ast`: JavaScript/TypeScriptファイルをASTに解析
  **Parse JavaScript/TypeScript files into AST**
- `analyze_git_diff`: Gitコミット履歴と差分を解析
  **Analyze Git commit history and diffs**
- `optimize_performance`: プロジェクトのパフォーマンスを最適化
  **Optimize project performance**
- `hybrid_search`: ハイブリッドBM25 + ベクトル検索を実行
  **Perform hybrid BM25 + Vector search**

### AI外部記憶装置ツール / AI External Memory Tools
- `generate_master_package`: Master AI用のコンテキストパッケージを生成
  **Generate context package for Master AI**
- `generate_worker_package`: Worker AI用のコンテキストパッケージを生成
  **Generate context package for Worker AI**

### コンテキスト管理ツール / Context Management Tools
- `monitor_context_size`: リアルタイムでコンテキスト使用量を監視
  **Monitor context usage in real-time**
- `auto_compress_context`: コンテキストが一定量を超えたら自動で圧縮
  **Automatically compress context when it exceeds thresholds**
- `suggest_context_optimization`: どの部分を削除すべきかの最適化提案をします
  **Provide optimization suggestions for context**
- `manage_context_history`: 過去のコンテキストの効率的な管理を行います
  **Efficiently manage past contexts**

### アナリティクスツール / Analytics Tools
- `get_context_analytics`: コンテキスト運用の効率性を分析・可視化
  **Analyze and visualize context operations**
- `get_efficiency_dashboard`: リアルタイムの効率性ダッシュボードを表示
  **Display real-time efficiency dashboard**
- `generate_performance_report`: パフォーマンスレポートを生成
  **Generate performance reports**

## 🎯 Cursorユーザーへのメリット / Benefits for Cursor Users

### 🚀 **開発効率の向上** / **Enhanced Development Efficiency**
- **自動コンテキスト管理**: 長いコードファイルが自動的に要約・圧縮される
  **Automatic Context Management**: Long code files are automatically summarized and compressed
- **インテリジェントなファイル発見**: 意味的検索で関連ファイルを自動発見
  **Intelligent File Discovery**: Semantic search finds relevant files automatically
- **リアルタイムパフォーマンス監視**: 開発効率をリアルタイムで追跡
  **Real-time Performance Monitoring**: Track development efficiency in real-time

### 🧠 **より賢いコード分析** / **Smarter Code Analysis**
- **ASTベースの分析**: コード構造と依存関係の深い理解
  **AST-based Analysis**: Deep understanding of code structure and dependencies
- **Git履歴統合**: 最近の変更とその影響の自動分析
  **Git History Integration**: Automatic analysis of recent changes and their impact
- **パフォーマンス最適化**: コード最適化の自動提案
  **Performance Optimization**: Automatic suggestions for code optimization

### 📊 **データ駆動開発** / **Data-Driven Development**
- **開発アナリティクス**: 開発効率の包括的なメトリクス
  **Development Analytics**: Comprehensive metrics on development efficiency
- **トレンド分析**: 時間経過による改善の追跡
  **Trend Analysis**: Track improvements over time
- **実行可能な洞察**: 改善のための具体的な推奨事項を取得
  **Actionable Insights**: Get specific recommendations for improvement

## 🔧 高度な機能 / Advanced Features

### 🎯 **コンテキスト圧縮アルゴリズム** / **Context Compression Algorithms**
- **要約**: 重要な行と関数を抽出
  **Summarization**: Extract important lines and functions
- **切り詰め**: スマートな単語境界切り詰め
  **Truncation**: Smart word-boundary truncation
- **キーワード抽出**: 意味のあるキーワードを抽出
  **Keyword Extraction**: Extract meaningful keywords

### 🧠 **メモリ管理** / **Memory Management**
- **自動ガベージコレクション**: メモリ使用率80%で実行
  **Automatic Garbage Collection**: Triggered at 80% memory usage
- **緊急クリーンアップ**: メモリ使用率95%でデータ削減
  **Emergency Cleanup**: Data reduction at 95% memory usage
- **データ保持**: 古いデータの自動クリーンアップ
  **Data Retention**: Automatic cleanup of old data

### 🔍 **ハイブリッド検索** / **Hybrid Search**
- **BM25検索**: 従来のキーワードベース検索
  **BM25 Search**: Traditional keyword-based search
- **ベクトル検索**: 意味的類似性検索
  **Vector Search**: Semantic similarity search
- **重み付き組み合わせ**: 両アプローチの最適なバランス
  **Weighted Combination**: Optimal balance of both approaches

## 📈 パフォーマンスメトリクス / Performance Metrics

### 🎯 **効率性スコア** / **Efficiency Score**
- **コンテキストサイズ最適化**: コンテキスト使用量の監視・最適化
  **Context Size Optimization**: Monitor and optimize context usage
- **圧縮率**: 圧縮効果の追跡
  **Compression Ratio**: Track compression effectiveness
- **メモリ使用量**: リアルタイムメモリ監視
  **Memory Usage**: Real-time memory monitoring

### 📊 **アナリティクスダッシュボード** / **Analytics Dashboard**
- **リアルタイム統計**: ライブパフォーマンスメトリクス
  **Real-time Stats**: Live performance metrics
- **履歴トレンド**: 時間経過による改善の追跡
  **Historical Trends**: Track improvements over time
- **推奨事項**: 実行可能な改善提案
  **Recommendations**: Actionable improvement suggestions

## 🚀 はじめに / Getting Started

### 1. **インストール** / **Install**
```bash
npm install -g context-optimizer@latest
```

### 2. **Cursorを設定** / **Configure Cursor**
`.cursor/settings.json`にMCPサーバー設定を追加
Add MCP server configuration to `.cursor/settings.json`

### 3. **Cursorを再起動** / **Restart Cursor**
MCPサーバーを有効にするためにCursorを再起動
Restart Cursor to activate the MCP server

### 4. **使用開始** / **Start Using**
Cursorにコード分析、ファイル検索、パフォーマンス最適化を依頼
Ask Cursor to analyze your code, find files, or optimize performance

## 🎯 実際の使用例 / Real-World Use Cases

### 🏗️ **新機能開発** / **New Feature Development**
```
シナリオ: Reactアプリに認証機能を追加
Scenario: Adding authentication to a React app

Cursor: "このReactアプリに認証機能を追加して"
→ get_context_pack("authentication") が関連ファイルを抽出
→ search_symbols("auth") が既存の認証コードを発見
→ parse_ast が現在の構造を解析
→ 実装アプローチを提案
```

### 🐛 **バグ修正** / **Bug Fixing**
```
シナリオ: パフォーマンス問題の調査
Scenario: Investigating a performance issue

Cursor: "このアプリが遅い、調査して"
→ analyze_git_diff が最近の変更を表示
→ extract_function がパフォーマンスクリティカルな関数を抽出
→ optimize_performance がボトルネックを分析
→ 具体的な最適化推奨事項を提供
```

### 🔄 **コードリファクタリング** / **Code Refactoring**
```
シナリオ: 大きなコンポーネントのリファクタリング
Scenario: Refactoring a large component

Cursor: "この大きなコンポーネントをリファクタリングして"
→ get_context_pack("component refactoring") が関連ファイルを発見
→ parse_ast が依存関係を解析
→ suggest_context_optimization がリファクタリング提案を提供
→ ステップバイステップの推奨事項付きリファクタリングプランを作成
```

### 📊 **パフォーマンス監視** / **Performance Monitoring**
```
シナリオ: 開発効率の監視
Scenario: Monitoring development efficiency

Cursor: "開発効率メトリクスを表示して"
→ get_efficiency_dashboard がリアルタイムメトリクスを表示
→ get_context_analytics が使用パターンを表示
→ generate_performance_report が包括的なレポートを作成
→ 改善領域を特定
```

## 🔧 トラブルシューティング / Troubleshooting

### よくある問題 / Common Issues

#### **MCPサーバーが認識されない** / **MCP Server Not Recognized**
```bash
# 解決策: 設定後にCursorを再起動
# Solution: Restart Cursor after configuration
```

#### **メモリ使用量が高い** / **High Memory Usage**
```bash
# 解決策: 自動ガベージコレクションを有効化
# Solution: Enable automatic garbage collection
# サーバーは80%のメモリ使用率で自動的にGCを実行
# The server automatically triggers GC at 80% memory usage
```

#### **ファイル検索が遅い** / **Slow File Search**
```bash
# 解決策: 除外パターンを最適化
# Solution: Optimize exclude patterns
# config.jsonにより具体的な除外パターンを追加
# Add more specific exclude patterns in config.json
```

## 🤝 貢献 / Contributing

貢献を歓迎します！詳細は[貢献ガイド](CONTRIBUTING.md)をご覧ください。
We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 ライセンス / License

MITライセンス - 詳細は[LICENSE](LICENSE)をご覧ください。
MIT License - see [LICENSE](LICENSE) for details.

## 🔗 リンク / Links

- **GitHub Repository**: [https://github.com/s-nakazawa/ContextOptimizer-](https://github.com/s-nakazawa/ContextOptimizer-)
- **npm Package**: [https://www.npmjs.com/package/context-optimizer](https://www.npmjs.com/package/context-optimizer)
- **Documentation**: [https://github.com/s-nakazawa/ContextOptimizer-/blob/main/README.md](https://github.com/s-nakazawa/ContextOptimizer-/blob/main/README.md)

---

**Cursor開発コミュニティのために❤️で作られました**
**Made with ❤️ for the Cursor development community**