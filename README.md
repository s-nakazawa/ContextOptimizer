# Context Optimizer

**Context Optimizer** is an advanced Model Context Protocol (MCP) server designed for Cursor development environments. It provides intelligent context optimization through file search, content reading, AST parsing, Git diff analysis, performance optimization, and hybrid search capabilities.

## Features

### 🔍 **File Search**
- Pattern-based file discovery
- Support for multiple file types (TypeScript, JavaScript, Python, Java, Go, Rust)
- Configurable exclude patterns

### 📖 **Content Reading**
- File content reading with size limits
- Support for various file extensions
- Line-based content truncation

### 🌳 **AST Parsing**
- JavaScript/TypeScript code analysis
- Function, variable, class, import/export detection
- Configurable comment and location inclusion

### 📊 **Git Diff Analysis**
- Recent commit history analysis
- Change statistics and summaries
- Multiple diff formats support

### ⚡ **Performance Optimization**
- Caching with TTL and key limits
- Parallel processing configuration
- Memory usage monitoring

### 🔍 **Hybrid Search**
- BM25 and vector search combination
- Natural language processing
- Configurable weights and thresholds

### 📊 **Context Management**
- **Real-time Context Monitoring**: Monitor context usage in real-time
- **Auto Compression**: Automatically compress context when it exceeds limits
- **Optimization Suggestions**: Intelligent suggestions for context optimization
- **Context History Management**: Efficient management of past contexts

### 📈 **Analytics & Insights**
- **Context Analytics**: Comprehensive analysis of context usage efficiency
- **Efficiency Dashboard**: Real-time dashboard showing performance metrics
- **Performance Reports**: Detailed reports with recommendations
- **Usage Metrics**: Automatic collection and analysis of usage patterns

## Installation

```bash
npm install -g context-optimizer
```

## Usage

### Command Line

```bash
npx context-optimizer@1.0.0
```

### Cursor Integration

Add to your Cursor MCP configuration:

```json
{
  "mcpServers": {
    "context-optimizer": {
      "command": "npx",
      "args": ["context-optimizer@1.0.0"]
    }
  }
}
```

## Available Tools

1. **get_context_pack** - Generate minimal context for project understanding
2. **extract_function** - Extract specific functions or classes
3. **search_symbols** - Search symbols across the project
4. **rollup_chat** - Summarize long chat histories
5. **search_files** - Search files by pattern
6. **read_file_content** - Read file contents
7. **parse_ast** - Parse JavaScript/TypeScript files
8. **analyze_git_diff** - Analyze Git differences
9. **optimize_performance** - Optimize project performance
10. **hybrid_search** - Execute hybrid search queries
11. **monitor_context_size** - Monitor context usage in real-time
12. **auto_compress_context** - Automatically compress context
13. **suggest_context_optimization** - Get optimization suggestions
14. **manage_context_history** - Manage context history efficiently
15. **get_context_analytics** - Analyze context usage efficiency
16. **get_efficiency_dashboard** - View real-time efficiency dashboard
17. **generate_performance_report** - Generate detailed performance reports

## Configuration

The server uses a `config.json` file for configuration:

```json
{
  "server": {
    "name": "context-optimizer-server",
    "version": "1.0.0",
    "description": "Context Optimizer - Advanced MCP Server for Cursor Development"
  },
  "fileSearch": {
    "enabled": true,
    "patterns": ["**/*.{ts,js,tsx,jsx}", "**/*.py", "**/*.java", "**/*.go", "**/*.rs"],
    "excludePatterns": ["**/node_modules/**", "**/dist/**", "**/build/**", "**/.git/**"]
  },
  "performance": {
    "enabled": true,
    "cache": {
      "enabled": true,
      "ttl": 300,
      "maxKeys": 1000
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

## Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
git clone https://github.com/charu/context-optimizer.git
cd context-optimizer
npm install
```

### Testing

```bash
npm test
```

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on GitHub.

---

**Context Optimizer** - Making Cursor development more efficient through intelligent context optimization.
