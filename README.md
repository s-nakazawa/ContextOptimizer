# Context Optimizer

Advanced Model Context Protocol (MCP) server for Cursor development environments with intelligent file search, content reading, AST parsing, Git diff analysis, performance optimization, hybrid search capabilities, real-time context monitoring, auto compression, optimization suggestions, and comprehensive analytics.

**高度なModel Context Protocol (MCP)サーバー - Cursor開発環境向けのインテリジェントなファイル検索、コンテンツ読み込み、AST解析、Git差分分析、パフォーマンス最適化、ハイブリッド検索、リアルタイムコンテキスト監視、自動圧縮、最適化提案、包括的アナリティクス機能を提供**

## 🚀 Features / 機能

### Core Functionality / コア機能
- **File Search**: Intelligent file discovery with blacklist-based filtering
  **ファイル検索**: ブラックリストベースのフィルタリングによるインテリジェントなファイル発見
- **Content Reading**: Efficient file content reading with size limits and extension filtering
  **コンテンツ読み込み**: サイズ制限と拡張子フィルタリング付きの効率的なファイルコンテンツ読み込み
- **AST Parsing**: JavaScript/TypeScript code analysis
  **AST解析**: JavaScript/TypeScriptコード分析
- **Git Diff Analysis**: Comprehensive commit history and diff analysis
  **Git差分分析**: 包括的なコミット履歴と差分分析
- **Performance Optimization**: Caching, parallel processing, and memory management
  **パフォーマンス最適化**: キャッシュ、並列処理、メモリ管理
- **Hybrid Search**: BM25 + Vector search for semantic file discovery
  **ハイブリッド検索**: 意味的ファイル発見のためのBM25 + ベクトル検索

### Configuration Management / 設定管理
- **Blacklist-based Filtering**: Exclude unwanted files instead of maintaining allowlists
  **ブラックリストベースフィルタリング**: 許可リストを維持する代わりに不要なファイルを除外
- **Flexible File Patterns**: Support for all file types by default with configurable exclusions
  **柔軟なファイルパターン**: 設定可能な除外項目でデフォルトですべてのファイルタイプをサポート
- **Smart Extension Filtering**: Automatically exclude binary files and media files
  **スマート拡張子フィルタリング**: バイナリファイルとメディアファイルを自動除外

### Context Management / コンテキスト管理
- **Context Size Monitoring**: Real-time context usage monitoring
  **コンテキストサイズ監視**: リアルタイムコンテキスト使用量監視
- **Automatic Compression**: Auto-compress context when it exceeds thresholds
  **自動圧縮機能**: しきい値を超えた場合の自動コンテキスト圧縮
- **Context Optimization Suggestions**: Intelligent suggestions for context optimization
  **コンテキスト最適化提案**: コンテキスト最適化のためのインテリジェントな提案
- **Context History Management**: Efficient management of past contexts
  **コンテキスト履歴管理**: 過去のコンテキストの効率的な管理

### Analytics & Insights / アナリティクス・洞察
- **Context Analytics**: Comprehensive analysis and visualization of context operations
  **コンテキストアナリティクス**: コンテキスト運用の包括的分析・可視化
- **Efficiency Dashboard**: Real-time efficiency dashboard with performance metrics
  **効率性ダッシュボード**: パフォーマンスメトリクス付きリアルタイム効率性ダッシュボード
- **Performance Reports**: Detailed performance reports with recommendations
  **パフォーマンスレポート**: 推奨事項付き詳細パフォーマンスレポート

## 📦 Installation / インストール

```bash
# Install globally
npm install -g context-optimizer@latest

# Or use npx (recommended)
npx context-optimizer@latest
```

## 🎯 Cursor Integration / Cursor統合

### Setup / セットアップ

1. **Install Context Optimizer** / **Context Optimizerをインストール**
```bash
npm install -g context-optimizer@latest
```

2. **Configure Cursor** / **Cursorを設定**
Create or edit `.cursor/settings.json` in your project root:
プロジェクトルートに`.cursor/settings.json`を作成または編集:

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

3. **Restart Cursor** / **Cursorを再起動**
Restart Cursor to recognize the MCP server.
MCPサーバーを認識するためにCursorを再起動してください。

### Usage Examples / 使用例

#### 🔍 **File Discovery** / **ファイル発見**
```
Cursor: "Find all React components in this project"
→ get_context_pack("React components") automatically extracts related files
→ search_files("**/*.{tsx,jsx}") finds component files
→ parse_ast analyzes component structure
```

#### 🐛 **Bug Investigation** / **バグ調査**
```
Cursor: "Investigate this bug"
→ analyze_git_diff shows recent changes
→ extract_function extracts the problematic function
→ parse_ast analyzes dependencies and structure
→ Identifies root cause automatically
```

#### 🚀 **Performance Optimization** / **パフォーマンス最適化**
```
Cursor: "Optimize this code"
→ optimize_performance analyzes current performance
→ get_efficiency_dashboard shows real-time metrics
→ suggest_context_optimization provides optimization suggestions
→ Generates performance report with recommendations
```

#### 📊 **Development Analytics** / **開発アナリティクス**
```
Cursor: "Show development efficiency"
→ get_context_analytics provides comprehensive metrics
→ get_efficiency_dashboard displays real-time dashboard
→ generate_performance_report creates detailed report
→ Shows trends, insights, and recommendations
```

## ⚙️ Configuration / 設定

### Project-Specific Configuration / プロジェクト固有の設定

Create a `.context-optimizer.config` file in your project root:
プロジェクトルートに`.context-optimizer.config`ファイルを作成:

```bash
# Copy the example configuration
# サンプル設定をコピー
cp .context-optimizer.config.example .context-optimizer.config

# Edit the configuration file
# 設定ファイルを編集
nano .context-optimizer.config
```

### Configuration File Priority / 設定ファイルの優先順位

The server looks for configuration files in the following order:
サーバーは以下の順序で設定ファイルを探します:

1. **PROJECT_ROOT/.context-optimizer.config** (project-specific / プロジェクト固有)
2. **package_directory/config.json** (fallback / フォールバック)

### Path Rules / パス規則

- **PROJECT_ROOT**: Must be an absolute path / 絶対パスである必要があります
- **All other paths**: Relative to PROJECT_ROOT / PROJECT_ROOTからの相対パス
- **Path separators**: Use forward slashes (/) / フォワードスラッシュ (/) を使用

### Configuration Help / 設定ヘルプ

```bash
# Show configuration help
# 設定ヘルプを表示
context-optimizer --config-help
```

### Legacy Configuration / 従来の設定

For backward compatibility, you can still use `config.json`:
後方互換性のため、`config.json`も使用できます:

### Blacklist-based Configuration / ブラックリストベース設定

The server now uses a **blacklist-based approach** for better flexibility and maintainability:
サーバーは柔軟性とメンテナンス性を向上させるため、**ブラックリストベースのアプローチ**を使用します:

- **File Search**: All files are included by default, only exclude unwanted directories
  **ファイル検索**: デフォルトですべてのファイルが含まれ、不要なディレクトリのみを除外
- **File Content**: All file extensions are supported by default, only exclude binary/media files
  **ファイルコンテンツ**: デフォルトですべてのファイル拡張子がサポートされ、バイナリ/メディアファイルのみを除外
- **Automatic Support**: New file types and languages are automatically supported
  **自動サポート**: 新しいファイルタイプと言語が自動的にサポートされる

```json
{
  "server": {
    "name": "context-optimizer-server",
    "version": "1.2.2",
    "description": "Context Optimizer - Advanced MCP Server for Cursor Development with File Search, Content Reading, AST Parsing, Git Diff Analysis, Performance Optimization and Hybrid Search"
  },
  "project": {
    "name": "YourProjectName",
    "root": "/absolute/path/to/your/project",
    "type": "typescript",
    "framework": "react",
    "autoDetect": true
  },
  "tools": {
    "enabled": true,
    "maxResults": 10
  },
  "fileSearch": {
    "enabled": true,
    "excludePatterns": ["**/node_modules/**", "**/dist/**", "**/build/**", "**/.git/**", "**/coverage/**", "**/tmp/**", "**/temp/**", "**/.cache/**", "**/.vscode/**", "**/.idea/**", "**/vendor/**", "**/target/**", "**/out/**", "**/bin/**", "**/obj/**"]
  },
  "fileContent": {
    "enabled": true,
    "maxFileSize": 100000,
    "excludeExtensions": [".exe", ".dll", ".so", ".dylib", ".bin", ".img", ".iso", ".zip", ".tar", ".gz", ".rar", ".7z", ".mp4", ".avi", ".mov", ".mp3", ".wav", ".flac", ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".svg", ".ico", ".woff", ".woff2", ".ttf", ".eot", ".otf"]
  },
  "astParsing": {
    "enabled": true,
    "supportedLanguages": ["javascript", "typescript"],
    "maxFileSize": 50000,
    "includeComments": true,
    "includeLocations": true
  },
  "gitDiff": {
    "enabled": true,
    "maxCommits": 10,
    "includeStats": true,
    "supportedFormats": ["unified", "context", "name-only"]
  },
  "performance": {
    "enabled": true,
    "cache": {
      "enabled": true,
      "ttl": 300,
      "maxKeys": 1000
    },
    "parallel": {
      "enabled": true,
      "maxConcurrency": 5
    },
    "memory": {
      "enabled": true,
      "maxMemoryUsage": 104857600
    }
  },
  "hybridSearch": {
    "enabled": true,
    "bm25": {
      "enabled": true,
      "k1": 1.2,
      "b": 0.75
    },
    "vector": {
      "enabled": true,
      "dimensions": 384,
      "similarityThreshold": 0.7
    },
    "weights": {
      "bm25": 0.6,
      "vector": 0.4
    }
  },
  "contextManagement": {
    "enabled": true,
    "monitoring": {
      "enabled": true,
      "maxContextSize": 100000,
      "warningThreshold": 80000,
      "criticalThreshold": 95000,
      "updateInterval": 1000
    },
    "autoCompression": {
      "enabled": true,
      "threshold": 90000,
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
      "maxHistoryEntries": 50,
      "retentionPeriod": 7,
      "compressionEnabled": true,
      "searchEnabled": true
    }
  },
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

## 🛠️ Available Tools / 利用可能なツール

### Core Tools / コアツール
- `get_context_pack`: Generate minimal context for project understanding
  **プロジェクト理解のための最小限のコンテキストを生成**
- `extract_function`: Extract specific function or class code
  **特定の関数やクラスのコードを抽出**
- `search_symbols`: Search for symbols across the project
  **プロジェクト全体からシンボルを検索**
- `search_files`: Search for files using glob patterns
  **globパターンを使用してファイルを検索**
- `read_file_content`: Read file content with size limits
  **サイズ制限付きでファイルコンテンツを読み込み**
- `parse_ast`: Parse JavaScript/TypeScript files into AST
  **JavaScript/TypeScriptファイルをASTに解析**
- `analyze_git_diff`: Analyze Git commit history and diffs
  **Gitコミット履歴と差分を解析**
- `optimize_performance`: Optimize project performance
  **プロジェクトのパフォーマンスを最適化**
- `hybrid_search`: Perform hybrid BM25 + Vector search
  **ハイブリッドBM25 + ベクトル検索を実行**

### Context Management Tools / コンテキスト管理ツール
- `monitor_context_size`: Monitor context usage in real-time
  **リアルタイムでコンテキスト使用量を監視**
- `auto_compress_context`: Automatically compress context when it exceeds thresholds
  **コンテキストが一定量を超えたら自動で圧縮**
- `suggest_context_optimization`: Provide optimization suggestions for context
  **どの部分を削除すべきかの最適化提案をします**
- `manage_context_history`: Efficiently manage past contexts
  **過去のコンテキストの効率的な管理を行います**

### Analytics Tools / アナリティクスツール
- `get_context_analytics`: Analyze and visualize context operations
  **コンテキスト運用の効率性を分析・可視化**
- `get_efficiency_dashboard`: Display real-time efficiency dashboard
  **リアルタイムの効率性ダッシュボードを表示**
- `generate_performance_report`: Generate performance reports
  **パフォーマンスレポートを生成**

## 🎯 Benefits for Cursor Users / Cursorユーザーへのメリット

### 🚀 **Enhanced Development Efficiency** / **開発効率の向上**
- **Automatic Context Management**: Long code files are automatically summarized and compressed
  **自動コンテキスト管理**: 長いコードファイルが自動的に要約・圧縮される
- **Intelligent File Discovery**: Semantic search finds relevant files automatically
  **インテリジェントなファイル発見**: 意味的検索で関連ファイルを自動発見
- **Real-time Performance Monitoring**: Track development efficiency in real-time
  **リアルタイムパフォーマンス監視**: 開発効率をリアルタイムで追跡

### 🧠 **Smarter Code Analysis** / **より賢いコード分析**
- **AST-based Analysis**: Deep understanding of code structure and dependencies
  **ASTベースの分析**: コード構造と依存関係の深い理解
- **Git History Integration**: Automatic analysis of recent changes and their impact
  **Git履歴統合**: 最近の変更とその影響の自動分析
- **Performance Optimization**: Automatic suggestions for code optimization
  **パフォーマンス最適化**: コード最適化の自動提案

### 📊 **Data-Driven Development** / **データ駆動開発**
- **Development Analytics**: Comprehensive metrics on development efficiency
  **開発アナリティクス**: 開発効率の包括的なメトリクス
- **Trend Analysis**: Track improvements over time
  **トレンド分析**: 時間経過による改善の追跡
- **Actionable Insights**: Get specific recommendations for improvement
  **実行可能な洞察**: 改善のための具体的な推奨事項を取得

## 🔧 Advanced Features / 高度な機能

### 🎯 **Context Compression Algorithms** / **コンテキスト圧縮アルゴリズム**
- **Summarization**: Extract important lines and functions
  **要約**: 重要な行と関数を抽出
- **Truncation**: Smart word-boundary truncation
  **切り詰め**: スマートな単語境界切り詰め
- **Keyword Extraction**: Extract meaningful keywords
  **キーワード抽出**: 意味のあるキーワードを抽出

### 🧠 **Memory Management** / **メモリ管理**
- **Automatic Garbage Collection**: Triggered at 80% memory usage
  **自動ガベージコレクション**: メモリ使用率80%で実行
- **Emergency Cleanup**: Data reduction at 95% memory usage
  **緊急クリーンアップ**: メモリ使用率95%でデータ削減
- **Data Retention**: Automatic cleanup of old data
  **データ保持**: 古いデータの自動クリーンアップ

### 🔍 **Hybrid Search** / **ハイブリッド検索**
- **BM25 Search**: Traditional keyword-based search
  **BM25検索**: 従来のキーワードベース検索
- **Vector Search**: Semantic similarity search
  **ベクトル検索**: 意味的類似性検索
- **Weighted Combination**: Optimal balance of both approaches
  **重み付き組み合わせ**: 両アプローチの最適なバランス

## 📈 Performance Metrics / パフォーマンスメトリクス

### 🎯 **Efficiency Score** / **効率性スコア**
- **Context Size Optimization**: Monitor and optimize context usage
  **コンテキストサイズ最適化**: コンテキスト使用量の監視・最適化
- **Compression Ratio**: Track compression effectiveness
  **圧縮率**: 圧縮効果の追跡
- **Memory Usage**: Real-time memory monitoring
  **メモリ使用量**: リアルタイムメモリ監視

### 📊 **Analytics Dashboard** / **アナリティクスダッシュボード**
- **Real-time Stats**: Live performance metrics
  **リアルタイム統計**: ライブパフォーマンスメトリクス
- **Historical Trends**: Track improvements over time
  **履歴トレンド**: 時間経過による改善の追跡
- **Recommendations**: Actionable improvement suggestions
  **推奨事項**: 実行可能な改善提案

## 🚀 Getting Started / はじめに

### 1. **Install** / **インストール**
```bash
npm install -g context-optimizer@latest
```

### 2. **Configure Cursor** / **Cursorを設定**
Add MCP server configuration to `.cursor/settings.json`
`.cursor/settings.json`にMCPサーバー設定を追加

### 3. **Restart Cursor** / **Cursorを再起動**
Restart Cursor to activate the MCP server
MCPサーバーを有効にするためにCursorを再起動

### 4. **Start Using** / **使用開始**
Ask Cursor to analyze your code, find files, or optimize performance
Cursorにコード分析、ファイル検索、パフォーマンス最適化を依頼

## 🎯 Real-World Use Cases / 実際の使用例

### 🏗️ **New Feature Development** / **新機能開発**
```
Scenario: Adding authentication to a React app
シナリオ: Reactアプリに認証機能を追加

Cursor: "Add authentication to this React app"
→ get_context_pack("authentication") extracts related files
→ search_symbols("auth") finds existing auth code
→ parse_ast analyzes current structure
→ Suggests implementation approach
```

### 🐛 **Bug Fixing** / **バグ修正**
```
Scenario: Investigating a performance issue
シナリオ: パフォーマンス問題の調査

Cursor: "This app is slow, investigate"
→ analyze_git_diff shows recent changes
→ extract_function extracts performance-critical functions
→ optimize_performance analyzes bottlenecks
→ Provides specific optimization recommendations
```

### 🔄 **Code Refactoring** / **コードリファクタリング**
```
Scenario: Refactoring a large component
シナリオ: 大きなコンポーネントのリファクタリング

Cursor: "Refactor this large component"
→ get_context_pack("component refactoring") finds related files
→ parse_ast analyzes dependencies
→ suggest_context_optimization provides refactoring suggestions
→ Creates refactoring plan with step-by-step recommendations
```

### 📊 **Performance Monitoring** / **パフォーマンス監視**
```
Scenario: Monitoring development efficiency
シナリオ: 開発効率の監視

Cursor: "Show me development efficiency metrics"
→ get_efficiency_dashboard displays real-time metrics
→ get_context_analytics shows usage patterns
→ generate_performance_report creates comprehensive report
→ Identifies areas for improvement
```

## 🔧 Troubleshooting / トラブルシューティング

### Common Issues / よくある問題

#### **MCP Server Not Recognized** / **MCPサーバーが認識されない**
```bash
# Solution: Restart Cursor after configuration
# 解決策: 設定後にCursorを再起動
```

#### **High Memory Usage** / **メモリ使用量が高い**
```bash
# Solution: Enable automatic garbage collection
# 解決策: 自動ガベージコレクションを有効化
# The server automatically triggers GC at 80% memory usage
# サーバーは80%のメモリ使用率で自動的にGCを実行
```

#### **Slow File Search** / **ファイル検索が遅い**
```bash
# Solution: Optimize exclude patterns
# 解決策: 除外パターンを最適化
# Add more specific exclude patterns in config.json
# config.jsonにより具体的な除外パターンを追加
```

## 🤝 Contributing / 貢献

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.
貢献を歓迎します！詳細は[貢献ガイド](CONTRIBUTING.md)をご覧ください。

## 📄 License / ライセンス

MIT License - see [LICENSE](LICENSE) for details.
MITライセンス - 詳細は[LICENSE](LICENSE)をご覧ください。

## 🔗 Links / リンク

- **GitHub Repository**: [https://github.com/s-nakazawa/ContextOptimizer-](https://github.com/s-nakazawa/ContextOptimizer-)
- **npm Package**: [https://www.npmjs.com/package/context-optimizer](https://www.npmjs.com/package/context-optimizer)
- **Documentation**: [https://github.com/s-nakazawa/ContextOptimizer-/blob/main/README.md](https://github.com/s-nakazawa/ContextOptimizer-/blob/main/README.md)

---

**Made with ❤️ for the Cursor development community**
**Cursor開発コミュニティのために❤️で作られました**