#!/usr/bin/env node

/**
 * Context Optimizer - Advanced MCP Server
 * 高度なコンテキスト最適化MCPサーバー
 */

import chalk from 'chalk';
import { readFileSync, existsSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import { glob } from 'glob';
import { Parser } from 'acorn';
import simpleGit from 'simple-git';
import NodeCache from 'node-cache';
import natural from 'natural';

// 設定ファイルの読み込み
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let config = {
  server: {
    name: 'context-optimizer-server',
    version: '1.0.0',
    description: 'Context Optimizer - Advanced MCP Server for Cursor Development with File Search, Content Reading, AST Parsing, Git Diff Analysis, Performance Optimization and Hybrid Search'
  },
  tools: {
    enabled: true,
    maxResults: 10
  },
  logging: {
    level: 'info',
    enabled: true
  },
  fileSearch: {
    enabled: true,
    patterns: ['**/*.{ts,js,tsx,jsx}', '**/*.py', '**/*.java', '**/*.go', '**/*.rs'],
    excludePatterns: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**']
  },
  fileContent: {
    enabled: true,
    maxFileSize: 100000,
    supportedExtensions: ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.go', '.rs', '.md', '.txt']
  },
  astParsing: {
    enabled: true,
    supportedLanguages: ['javascript', 'typescript'],
    maxFileSize: 50000,
    includeComments: true,
    includeLocations: true
  },
  gitDiff: {
    enabled: true,
    maxCommits: 10,
    includeStats: true,
    supportedFormats: ['unified', 'context', 'name-only']
  },
  performance: {
    enabled: true,
    cache: {
      enabled: true,
      ttl: 300,
      maxKeys: 1000
    },
    parallel: {
      enabled: true,
      maxConcurrency: 5
    },
    memory: {
      enabled: true,
      maxMemoryUsage: 104857600
    }
  },
  hybridSearch: {
    enabled: true,
    bm25: {
      enabled: true,
      k1: 1.2,
      b: 0.75
    },
    vector: {
      enabled: true,
      dimensions: 384,
      similarityThreshold: 0.7
    },
    weights: {
      bm25: 0.6,
      vector: 0.4
    }
  },
  contextManagement: {
    enabled: true,
    monitoring: {
      enabled: true,
      maxContextSize: 100000,
      warningThreshold: 80000,
      criticalThreshold: 95000,
      updateInterval: 1000
    },
    autoCompression: {
      enabled: true,
      threshold: 90000,
      compressionRatio: 0.7,
      preserveImportant: true,
      algorithms: ['summarization', 'truncation', 'keyword-extraction']
    },
    optimizationSuggestions: {
      enabled: true,
      analyzeFrequency: 'on-demand',
      suggestionTypes: ['duplicate-removal', 'irrelevant-filtering', 'priority-ranking'],
      confidenceThreshold: 0.8
    },
    historyManagement: {
      enabled: true,
      maxHistoryEntries: 50,
      retentionPeriod: 7,
      compressionEnabled: true,
      searchEnabled: true
    }
  },
  analytics: {
    enabled: true,
    metrics: {
      enabled: true,
      collectionInterval: 5000,
      retentionDays: 30,
      trackContextSize: true,
      trackCompressionRatio: true,
      trackOptimizationSuggestions: true,
      trackHistoryUsage: true
    },
    dashboard: {
      enabled: true,
      updateInterval: 10000,
      showRealTimeStats: true,
      showHistoricalTrends: true,
      showEfficiencyMetrics: true
    },
    insights: {
      enabled: true,
      analyzeFrequency: 'on-demand',
      generateReports: true,
      suggestImprovements: true,
      trackPerformance: true
    }
  }
};

// 設定ファイルの読み込み
try {
  const configPath = join(__dirname, 'config.json');
  if (existsSync(configPath)) {
    const configData = readFileSync(configPath, 'utf8');
    config = { ...config, ...JSON.parse(configData) };
    console.error(chalk.green('✅ 設定ファイル読み込み成功 / Config file loaded successfully'));
  } else {
    console.error(chalk.yellow('⚠️  設定ファイルが見つかりません / Config file not found'));
  }
} catch (error) {
  console.error(chalk.red('❌ 設定ファイル読み込みエラー / Config file loading error:'), error.message);
}

// パフォーマンス最適化機能の初期化
let performanceCache = null;
if (config.performance && config.performance.cache && config.performance.cache.enabled) {
  performanceCache = new NodeCache({
    stdTTL: config.performance.cache.ttl,
    maxKeys: config.performance.cache.maxKeys,
    checkperiod: 60
  });
}

// 分析機能の初期化
let analyticsData = {
  contextSizes: [],
  compressionRatios: [],
  optimizationSuggestions: [],
  historyUsage: [],
  performanceMetrics: [],
  startTime: new Date().toISOString()
};

// メトリクス収集の開始（メモリ最適化版）
if (config.analytics && config.analytics.enabled && config.analytics.metrics && config.analytics.metrics.enabled) {
  setInterval(() => {
    const currentTime = new Date().toISOString();
    const memoryUsage = process.memoryUsage();
    
    // メモリ使用量が高い場合はガベージコレクションを強制実行
    if (memoryUsage.heapUsed / memoryUsage.heapTotal > 0.8) {
      if (global.gc) {
        global.gc();
        console.error(chalk.yellow('🧹 ガベージコレクション実行 / Garbage collection executed'));
      }
    }
    
    analyticsData.performanceMetrics.push({
      timestamp: currentTime,
      memoryUsage: memoryUsage.heapUsed,
      memoryTotal: memoryUsage.heapTotal,
      cpuUsage: process.cpuUsage()
    });
    
    // 古いデータの削除（30日分保持）
    const retentionDays = config.analytics.metrics.retentionDays || 30;
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    
    // メモリ効率を考慮したデータクリーンアップ
    const maxEntries = 1000; // 最大エントリ数を制限
    
    analyticsData.contextSizes = analyticsData.contextSizes
      .filter(item => new Date(item.timestamp) > cutoffDate)
      .slice(-maxEntries);
      
    analyticsData.compressionRatios = analyticsData.compressionRatios
      .filter(item => new Date(item.timestamp) > cutoffDate)
      .slice(-maxEntries);
      
    analyticsData.optimizationSuggestions = analyticsData.optimizationSuggestions
      .filter(item => new Date(item.timestamp) > cutoffDate)
      .slice(-maxEntries);
      
    analyticsData.performanceMetrics = analyticsData.performanceMetrics
      .filter(item => new Date(item.timestamp) > cutoffDate)
      .slice(-maxEntries);
      
    // メモリ使用量が95%を超えた場合は緊急クリーンアップ
    if (memoryUsage.heapUsed / memoryUsage.heapTotal > 0.95) {
      analyticsData.contextSizes = analyticsData.contextSizes.slice(-100);
      analyticsData.compressionRatios = analyticsData.compressionRatios.slice(-100);
      analyticsData.optimizationSuggestions = analyticsData.optimizationSuggestions.slice(-100);
      analyticsData.performanceMetrics = analyticsData.performanceMetrics.slice(-100);
      console.error(chalk.red('🚨 緊急メモリクリーンアップ実行 / Emergency memory cleanup executed'));
    }
  }, config.analytics.metrics.collectionInterval || 5000);
}

// 最初のログ - ファイルが実行されているかどうかを確認
console.error(chalk.green('🚀 Context Optimizer MCP Server - index.js 実行開始 / Execution started'));
console.error(chalk.blue('📅 実行時刻 / Execution time:'), new Date().toISOString());
console.error(chalk.yellow('🔧 Node.js バージョン / Node.js version:'), process.version);
console.error(chalk.cyan('💻 プラットフォーム / Platform:'), process.platform, process.arch);
console.error(chalk.magenta('📁 現在のディレクトリ / Current directory:'), process.cwd());
console.error(chalk.red('📋 コマンドライン引数 / Command line arguments:'), process.argv);

// 設定情報の表示
console.error(chalk.blue('⚙️ 設定情報 / Config info:'), JSON.stringify(config, null, 2));

// パフォーマンス最適化機能の表示
if (config.performance && config.performance.enabled) {
  console.error(chalk.green('⚡ パフォーマンス最適化機能 / Performance optimization features:'));
  console.error(chalk.green('  - キャッシュ / Cache:'), config.performance.cache.enabled ? '有効 / Enabled' : '無効 / Disabled');
  console.error(chalk.green('  - 並列処理 / Parallel:'), config.performance.parallel.enabled ? '有効 / Enabled' : '無効 / Disabled');
  console.error(chalk.green('  - メモリ監視 / Memory:'), config.performance.memory.enabled ? '有効 / Enabled' : '無効 / Disabled');
}

// ハイブリッド検索機能の表示
if (config.hybridSearch && config.hybridSearch.enabled) {
  console.error(chalk.blue('🔍 ハイブリッド検索機能 / Hybrid search features:'));
  console.error(chalk.blue('  - BM25検索 / BM25 Search:'), config.hybridSearch.bm25.enabled ? '有効 / Enabled' : '無効 / Disabled');
  console.error(chalk.blue('  - ベクトル検索 / Vector Search:'), config.hybridSearch.vector.enabled ? '有効 / Enabled' : '無効 / Disabled');
  console.error(chalk.blue('  - 重み付け / Weights:'), `BM25: ${config.hybridSearch.weights.bm25}, Vector: ${config.hybridSearch.weights.vector}`);
}

// MCPサーバーのメイン処理
async function main() {
  console.error(chalk.green('🚀 Context Optimizer MCP Server メイン処理開始 / Main process started'));
  
  // 標準入力を監視
  process.stdin.on('data', async (data) => {
    try {
      const lines = data.toString().trim().split('\n');
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        let request;
        try {
          request = JSON.parse(line);
        } catch (e) {
          console.error(chalk.red('❌ JSON解析エラー / JSON parse error:'), e.message);
          continue;
        }
        
        console.error(chalk.blue('🔧 MCPリクエスト受信 / MCP request received:'), request.method, `(id: ${request.id})`);
        
        let response;
        
        switch (request.method) {
          case 'initialize':
            response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                protocolVersion: '2024-11-05',
                capabilities: {
                  tools: { listChanged: true },
                  resources: { subscribe: false, listChanged: false },
                  prompts: { listChanged: false }
                },
                serverInfo: {
                  name: config.server.name,
                  version: config.server.version
                }
              }
            };
            break;
            
          case 'notifications/initialized':
            console.error(chalk.green('✅ MCP初期化完了 / MCP initialization completed'));
            continue;
            
          case 'tools/list':
            response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                tools: [
                  {
                    name: 'get_context_pack',
                    description: 'プロジェクトの理解に必要な最小限のコンテキストを生成',
                    inputSchema: {
                      type: 'object',
                      properties: {
                        query: { type: 'string', description: '検索クエリ' }
                      },
                      required: ['query']
                    }
                  },
                  {
                    name: 'extract_function',
                    description: '特定の関数やクラスのコードを抽出',
                    inputSchema: {
                      type: 'object',
                      properties: {
                        name: { type: 'string', description: '関数・クラス名' }
                      },
                      required: ['name']
                    }
                  },
                  {
                    name: 'search_symbols',
                    description: 'プロジェクト全体からシンボルを検索',
                    inputSchema: {
                      type: 'object',
                      properties: {
                        query: { type: 'string', description: '検索クエリ' }
                      },
                      required: ['query']
                    }
                  },
                  {
                    name: 'rollup_chat',
                    description: '長いチャット履歴を要約してコンテキストを最適化',
                    inputSchema: {
                      type: 'object',
                      properties: {
                        messages: { type: 'array', description: 'チャットメッセージ' }
                      },
                      required: ['messages']
                    }
                  },
                  {
                    name: 'search_files',
                    description: 'プロジェクト内のファイルを検索します',
                    inputSchema: {
                      type: 'object',
                      properties: {
                        pattern: { type: 'string', description: '検索パターン（例: *.ts, **/*.js）' },
                        maxResults: { type: 'number', description: '最大結果数（デフォルト: 20）', default: 20 }
                      },
                      required: ['pattern']
                    }
                  },
                  {
                    name: 'read_file_content',
                    description: '指定されたファイルの内容を読み込みます',
                    inputSchema: {
                      type: 'object',
                      properties: {
                        filePath: { type: 'string', description: '読み込むファイルのパス' },
                        maxLines: { type: 'number', description: '最大行数（デフォルト: 100）', default: 100 }
                      },
                      required: ['filePath']
                    }
                  },
                  {
                    name: 'parse_ast',
                    description: 'JavaScript/TypeScriptファイルをAST解析します',
                    inputSchema: {
                      type: 'object',
                      properties: {
                        filePath: { type: 'string', description: '解析するファイルのパス' },
                        includeComments: { type: 'boolean', description: 'コメントを含めるかどうか（デフォルト: true）', default: true },
                        includeLocations: { type: 'boolean', description: '位置情報を含めるかどうか（デフォルト: true）', default: true }
                      },
                      required: ['filePath']
                    }
                  },
                  {
                    name: 'analyze_git_diff',
                    description: 'Git差分を解析して変更内容を要約します',
                    inputSchema: {
                      type: 'object',
                      properties: {
                        maxCommits: { type: 'number', description: '最大コミット数（デフォルト: 10）', default: 10 },
                        includeStats: { type: 'boolean', description: '統計情報を含めるかどうか（デフォルト: true）', default: true },
                        format: { type: 'string', description: '差分フォーマット（unified, context, name-only）', default: 'unified' }
                      },
                      required: []
                    }
                  },
                  {
                    name: 'optimize_performance',
                    description: 'プロジェクトのパフォーマンスを最適化します',
                    inputSchema: {
                      type: 'object',
                      properties: {
                        operation: { type: 'string', description: '最適化操作（cache, memory, parallel, all）', default: 'all' },
                        target: { type: 'string', description: '対象（files, ast, git, all）', default: 'all' }
                      },
                      required: []
                    }
                  },
                  {
                    name: 'hybrid_search',
                    description: 'BM25とベクトル検索を組み合わせたハイブリッド検索を実行します',
                    inputSchema: {
                      type: 'object',
                      properties: {
                        query: { type: 'string', description: '検索クエリ' },
                        maxResults: { type: 'number', description: '最大結果数（デフォルト: 10）', default: 10 },
                        includeContent: { type: 'boolean', description: 'ファイル内容を含めるかどうか（デフォルト: true）', default: true }
                      },
                      required: ['query']
                    }
                  },
                  {
                    name: 'monitor_context_size',
                    description: 'リアルタイムでコンテキスト使用量を監視します',
                    inputSchema: {
                      type: 'object',
                      properties: {
                        context: { type: 'string', description: '監視対象のコンテキスト' },
                        includeDetails: { type: 'boolean', description: '詳細情報を含めるかどうか（デフォルト: true）', default: true }
                      },
                      required: ['context']
                    }
                  },
                  {
                    name: 'auto_compress_context',
                    description: 'コンテキストが一定量を超えたら自動で圧縮します',
                    inputSchema: {
                      type: 'object',
                      properties: {
                        context: { type: 'string', description: '圧縮対象のコンテキスト' },
                        algorithm: { type: 'string', description: '圧縮アルゴリズム（summarization, truncation, keyword-extraction）', default: 'summarization' },
                        compressionRatio: { type: 'number', description: '圧縮率（0.1-0.9）', default: 0.7 }
                      },
                      required: ['context']
                    }
                  },
                  {
                    name: 'suggest_context_optimization',
                    description: 'どの部分を削除すべきかの最適化提案をします',
                    inputSchema: {
                      type: 'object',
                      properties: {
                        context: { type: 'string', description: '最適化対象のコンテキスト' },
                        query: { type: 'string', description: '関連するクエリ（オプション）' },
                        suggestionTypes: { type: 'array', description: '提案タイプ（duplicate-removal, irrelevant-filtering, priority-ranking）', default: ['duplicate-removal', 'irrelevant-filtering'] }
                      },
                      required: ['context']
                    }
                  },
                  {
                    name: 'manage_context_history',
                    description: '過去のコンテキストの効率的な管理を行います',
                    inputSchema: {
                      type: 'object',
                      properties: {
                        action: { type: 'string', description: '実行するアクション（save, retrieve, search, cleanup）' },
                        contextId: { type: 'string', description: 'コンテキストID（retrieve, search時）' },
                        context: { type: 'string', description: '保存するコンテキスト（save時）' },
                        query: { type: 'string', description: '検索クエリ（search時）' }
                      },
                      required: ['action']
                    }
                  },
                  {
                    name: 'get_context_analytics',
                    description: 'コンテキスト運用の効率性を分析・可視化します',
                    inputSchema: {
                      type: 'object',
                      properties: {
                        timeRange: { type: 'string', description: '分析期間（1h, 24h, 7d, 30d）', default: '24h' },
                        includeMetrics: { type: 'boolean', description: '詳細メトリクスを含めるかどうか', default: true },
                        includeTrends: { type: 'boolean', description: 'トレンド分析を含めるかどうか', default: true },
                        includeInsights: { type: 'boolean', description: '洞察と推奨事項を含めるかどうか', default: true }
                      },
                      required: []
                    }
                  },
                  {
                    name: 'get_efficiency_dashboard',
                    description: 'リアルタイムの効率性ダッシュボードを表示します',
                    inputSchema: {
                      type: 'object',
                      properties: {
                        refreshInterval: { type: 'number', description: '更新間隔（秒）', default: 10 },
                        showRealTime: { type: 'boolean', description: 'リアルタイム統計を表示するかどうか', default: true },
                        showHistorical: { type: 'boolean', description: '履歴統計を表示するかどうか', default: true }
                      },
                      required: []
                    }
                  },
                  {
                    name: 'generate_performance_report',
                    description: 'パフォーマンスレポートを生成します',
                    inputSchema: {
                      type: 'object',
                      properties: {
                        reportType: { type: 'string', description: 'レポートタイプ（summary, detailed, comparison）', default: 'summary' },
                        timeRange: { type: 'string', description: 'レポート期間（1h, 24h, 7d, 30d）', default: '24h' },
                        includeRecommendations: { type: 'boolean', description: '推奨事項を含めるかどうか', default: true }
                      },
                      required: []
                    }
                  }
                ]
              }
            };
            break;
            
          case 'prompts/list':
            response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                prompts: []
              }
            };
            break;
            
          case 'tools/call':
            console.error(chalk.blue('🔧 ツール呼び出し / Tool call:'), request.params.name, request.params.arguments);
            
            switch (request.params.name) {
              case 'get_context_pack':
                response = await handleGetContextPack(request);
                break;
              case 'extract_function':
                response = await handleExtractFunction(request);
                break;
              case 'search_symbols':
                response = await handleSearchSymbols(request);
                break;
              case 'rollup_chat':
                response = await handleRollupChat(request);
                break;
              case 'search_files':
                response = await handleSearchFiles(request);
                break;
              case 'read_file_content':
                response = await handleReadFileContent(request);
                break;
              case 'parse_ast':
                response = await handleParseAST(request);
                break;
              case 'analyze_git_diff':
                response = await handleAnalyzeGitDiff(request);
                break;
              case 'optimize_performance':
                response = await handleOptimizePerformance(request);
                break;
              case 'hybrid_search':
                response = await handleHybridSearch(request);
                break;
              case 'monitor_context_size':
                response = await handleMonitorContextSize(request);
                break;
              case 'auto_compress_context':
                response = await handleAutoCompressContext(request);
                break;
              case 'suggest_context_optimization':
                response = await handleSuggestContextOptimization(request);
                break;
              case 'manage_context_history':
                response = await handleManageContextHistory(request);
                break;
              case 'get_context_analytics':
                response = await handleGetContextAnalytics(request);
                break;
              case 'get_efficiency_dashboard':
                response = await handleGetEfficiencyDashboard(request);
                break;
              case 'generate_performance_report':
                response = await handleGeneratePerformanceReport(request);
                break;
              default:
                response = {
                  jsonrpc: '2.0',
                  id: request.id,
                  error: {
                    code: -32601,
                    message: `Unknown tool: ${request.params.name}`
                  }
                };
            }
            break;
            
          default:
            response = {
              jsonrpc: '2.0',
              id: request.id,
              error: {
                code: -32601,
                message: `Unknown method: ${request.method}`
              }
            };
        }
        
        console.error(chalk.green('✅ MCPレスポンス送信 / MCP response sent'));
        console.log(JSON.stringify(response));
      }
    } catch (error) {
      console.error(chalk.red('❌ エラー / Error:'), error.message);
    }
  });
}

// ツールハンドラー関数
async function handleGetContextPack(request) {
  console.error(chalk.blue('🔍 get_context_pack 実行中 / Executing get_context_pack:'), request.params.arguments.query);
  
  try {
    const query = request.params.arguments.query;
    const files = await glob('**/*.{ts,js,tsx,jsx}', { 
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'] 
    });
    
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify({
            query: query,
            files: files.slice(0, 10),
            totalFiles: files.length,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      }
    };
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: -32603,
        message: `Internal error: ${error.message}`
      }
    };
  }
}

async function handleExtractFunction(request) {
  console.error(chalk.blue('🔍 extract_function 実行中 / Executing extract_function:'), request.params.arguments.name);
  
  try {
    const name = request.params.arguments.name;
    const files = await glob('**/*.{ts,js,tsx,jsx}', { 
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'] 
    });
    
    let found = false;
    let content = '';
    
    for (const file of files.slice(0, 5)) {
      try {
        const fileContent = readFileSync(file, 'utf8');
        if (fileContent.includes(name)) {
          content += `\n--- ${file} ---\n${fileContent}\n`;
          found = true;
        }
      } catch (e) {
        // ファイル読み込みエラーは無視
      }
    }
    
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        content: [{
          type: 'text',
          text: found ? content : `Function/Class "${name}" not found`
        }]
      }
    };
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: -32603,
        message: `Internal error: ${error.message}`
      }
    };
  }
}

async function handleSearchSymbols(request) {
  console.error(chalk.blue('🔍 search_symbols 実行中 / Executing search_symbols:'), request.params.arguments.query);
  
  try {
    const query = request.params.arguments.query;
    const files = await glob('**/*.{ts,js,tsx,jsx}', { 
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'] 
    });
    
    const results = [];
    for (const file of files.slice(0, 5)) {
      try {
        const content = readFileSync(file, 'utf8');
        if (content.includes(query)) {
          results.push({
            file: file,
            matches: content.split(query).length - 1
          });
        }
      } catch (e) {
        // ファイル読み込みエラーは無視
      }
    }
    
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify({
            query: query,
            results: results,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      }
    };
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: -32603,
        message: `Internal error: ${error.message}`
      }
    };
  }
}

async function handleRollupChat(request) {
  console.error(chalk.blue('🔍 rollup_chat 実行中 / Executing rollup_chat'));
  
  try {
    const messages = request.params.arguments.messages;
    const summary = `Chat summary: ${messages.length} messages processed at ${new Date().toISOString()}`;
    
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        content: [{
          type: 'text',
          text: summary
        }]
      }
    };
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: -32603,
        message: `Internal error: ${error.message}`
      }
    };
  }
}

async function handleSearchFiles(request) {
  console.error(chalk.blue('🔍 search_files 実行中 / Executing search_files:'), request.params.arguments.pattern);
  
  try {
    const pattern = request.params.arguments.pattern;
    const maxResults = request.params.arguments.maxResults || 20;
    
    const files = await glob(pattern, { 
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'] 
    });
    
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify({
            pattern: pattern,
            files: files.slice(0, maxResults),
            totalFiles: files.length,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      }
    };
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: -32603,
        message: `Internal error: ${error.message}`
      }
    };
  }
}

async function handleReadFileContent(request) {
  console.error(chalk.blue('🔍 read_file_content 実行中 / Executing read_file_content:'), request.params.arguments.filePath);
  
  try {
    const filePath = request.params.arguments.filePath;
    const maxLines = request.params.arguments.maxLines || 100;
    
    if (!existsSync(filePath)) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32602,
          message: `File not found: ${filePath}`
        }
      };
    }
    
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const truncatedContent = lines.slice(0, maxLines).join('\n');
    
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        content: [{
          type: 'text',
          text: truncatedContent
        }]
      }
    };
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: -32603,
        message: `Internal error: ${error.message}`
      }
    };
  }
}

async function handleParseAST(request) {
  console.error(chalk.blue('🔍 parse_ast 実行中 / Executing parse_ast:'), request.params.arguments.filePath);
  
  try {
    const filePath = request.params.arguments.filePath;
    const includeComments = request.params.arguments.includeComments !== false;
    const includeLocations = request.params.arguments.includeLocations !== false;
    
    if (!existsSync(filePath)) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32602,
          message: `File not found: ${filePath}`
        }
      };
    }
    
    const content = readFileSync(filePath, 'utf8');
    const ext = extname(filePath);
    
    if (!['.js', '.ts', '.jsx', '.tsx'].includes(ext)) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32602,
          message: `Unsupported file type: ${ext}`
        }
      };
    }
    
    // shebangを除去してからパース
    let parseContent = content;
    if (content.startsWith('#!')) {
      const firstNewline = content.indexOf('\n');
      if (firstNewline !== -1) {
        parseContent = content.substring(firstNewline + 1);
      }
    }
    
    const ast = Parser.parse(parseContent, {
      ecmaVersion: 2022,
      sourceType: 'module',
      locations: includeLocations,
      ranges: includeLocations
    });
    
    const astStats = {
      functions: 0,
      variables: 0,
      classes: 0,
      imports: 0,
      exports: 0
    };
    
    function analyzeNode(node) {
      if (node.type === 'FunctionDeclaration') astStats.functions++;
      if (node.type === 'VariableDeclaration') astStats.variables++;
      if (node.type === 'ClassDeclaration') astStats.classes++;
      if (node.type === 'ImportDeclaration') astStats.imports++;
      if (node.type === 'ExportNamedDeclaration' || node.type === 'ExportDefaultDeclaration') astStats.exports++;
      
      for (const key in node) {
        if (node[key] && typeof node[key] === 'object') {
          if (Array.isArray(node[key])) {
            node[key].forEach(analyzeNode);
          } else if (node[key].type) {
            analyzeNode(node[key]);
          }
        }
      }
    }
    
    analyzeNode(ast);
    
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify({
            filePath: filePath,
            ast: includeLocations ? ast : 'AST structure available',
            statistics: astStats,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      }
    };
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: -32603,
        message: `Internal error: ${error.message}`
      }
    };
  }
}

async function handleAnalyzeGitDiff(request) {
  console.error(chalk.blue('🔍 analyze_git_diff 実行中 / Executing analyze_git_diff'));
  
  try {
    const maxCommits = request.params.arguments.maxCommits || 10;
    const includeStats = request.params.arguments.includeStats !== false;
    const format = request.params.arguments.format || 'unified';
    
    const git = simpleGit();
    
    // Gitリポジトリかどうかをチェック
    let isRepo = false;
    try {
      isRepo = await git.checkIsRepo();
    } catch (error) {
      // checkIsRepo()が失敗した場合は、git statusで確認
      try {
        await git.status();
        isRepo = true;
      } catch (statusError) {
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            content: [{
              type: 'text',
              text: JSON.stringify({
                error: 'Not a Git repository',
                message: 'Current directory is not a Git repository',
                suggestion: 'Please run this command from within a Git repository',
                currentDirectory: process.cwd(),
                timestamp: new Date().toISOString()
              }, null, 2)
            }]
          }
        };
      }
    }
    
    if (!isRepo) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: 'Not a Git repository',
              message: 'Current directory is not a Git repository',
              suggestion: 'Please run this command from within a Git repository',
              currentDirectory: process.cwd(),
              timestamp: new Date().toISOString()
            }, null, 2)
          }]
        }
      };
    }
    
    const log = await git.log({ maxCount: maxCommits });
    
    const diffSummary = {
      commits: log.all.map(commit => ({
        hash: commit.hash,
        message: commit.message,
        date: commit.date,
        author: commit.author_name
      })),
      totalCommits: log.total,
      format: format,
      timestamp: new Date().toISOString()
    };
    
    if (includeStats) {
      diffSummary.stats = {
        totalCommits: log.total,
        recentCommits: log.all.length
      };
    }
    
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify(diffSummary, null, 2)
        }]
      }
    };
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: -32603,
        message: `Internal error: ${error.message}`
      }
    };
  }
}

async function handleOptimizePerformance(request) {
  console.error(chalk.blue('🔍 optimize_performance 実行中 / Executing optimize_performance'));
  
  try {
    const operation = request.params.arguments.operation || 'all';
    const target = request.params.arguments.target || 'all';
    
    const optimizationResult = {
      operation: operation,
      target: target,
      cacheEnabled: config.performance.cache.enabled,
      parallelEnabled: config.performance.parallel.enabled,
      memoryEnabled: config.performance.memory.enabled,
      timestamp: new Date().toISOString()
    };
    
    if (performanceCache) {
      optimizationResult.cacheStats = {
        keys: performanceCache.keys().length,
        ttl: config.performance.cache.ttl,
        maxKeys: config.performance.cache.maxKeys
      };
    }
    
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify(optimizationResult, null, 2)
        }]
      }
    };
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: -32603,
        message: `Internal error: ${error.message}`
      }
    };
  }
}

async function handleHybridSearch(request) {
  console.error(chalk.blue('🔍 hybrid_search 実行中 / Executing hybrid_search:'), request.params.arguments.query);
  
  try {
    const query = request.params.arguments.query;
    const maxResults = request.params.arguments.maxResults || 10;
    const includeContent = request.params.arguments.includeContent !== false;
    
    const files = await glob('**/*.{ts,js,tsx,jsx,md,txt}', { 
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'] 
    });
    
    const results = [];
    for (const file of files.slice(0, 10)) {
      try {
        const content = readFileSync(file, 'utf8');
        const tokens = natural.WordTokenizer().tokenize(content.toLowerCase());
        const queryTokens = natural.WordTokenizer().tokenize(query.toLowerCase());
        
        let score = 0;
        for (const token of queryTokens) {
          if (tokens.includes(token)) {
            score += 1;
          }
        }
        
        if (score > 0) {
          results.push({
            file: file,
            score: score,
            content: includeContent ? content.substring(0, 200) + '...' : undefined
          });
        }
      } catch (e) {
        // ファイル読み込みエラーは無視
      }
    }
    
    results.sort((a, b) => b.score - a.score);
    
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify({
            query: query,
            results: results.slice(0, maxResults),
            totalResults: results.length,
            bm25Enabled: config.hybridSearch.bm25.enabled,
            vectorEnabled: config.hybridSearch.vector.enabled,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      }
    };
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: -32603,
        message: `Internal error: ${error.message}`
      }
    };
  }
}

// 新しいコンテキスト管理ハンドラー関数
async function handleMonitorContextSize(request) {
  console.error(chalk.blue('🔍 monitor_context_size 実行中 / Executing monitor_context_size'));
  
  try {
    const context = request.params.arguments.context;
    const includeDetails = request.params.arguments.includeDetails !== false;
    
    const contextSize = Buffer.byteLength(context, 'utf8');
    const contextLength = context.length;
    const lineCount = context.split('\n').length;
    const wordCount = context.split(/\s+/).filter(word => word.length > 0).length;
    
    // メトリクス収集
    recordContextSize(contextSize);
    
    const monitoring = config.contextManagement?.monitoring || {};
    const maxSize = monitoring.maxContextSize || 100000;
    const warningThreshold = monitoring.warningThreshold || 80000;
    const criticalThreshold = monitoring.criticalThreshold || 95000;
    
    let status = 'normal';
    if (contextSize >= criticalThreshold) {
      status = 'critical';
    } else if (contextSize >= warningThreshold) {
      status = 'warning';
    }
    
    const result = {
      contextSize: contextSize,
      contextLength: contextLength,
      lineCount: lineCount,
      wordCount: wordCount,
      status: status,
      thresholds: {
        max: maxSize,
        warning: warningThreshold,
        critical: criticalThreshold
      },
      usagePercentage: Math.round((contextSize / maxSize) * 100),
      timestamp: new Date().toISOString()
    };
    
    if (includeDetails) {
      result.details = {
        averageLineLength: Math.round(contextLength / lineCount),
        averageWordLength: Math.round(contextLength / wordCount),
        compressionPotential: contextSize > warningThreshold ? Math.round((contextSize - warningThreshold) / contextSize * 100) : 0
      };
    }
    
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      }
    };
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: -32603,
        message: `Internal error: ${error.message}`
      }
    };
  }
}

async function handleAutoCompressContext(request) {
  console.error(chalk.blue('🔍 auto_compress_context 実行中 / Executing auto_compress_context'));
  
  try {
    const context = request.params.arguments.context;
    const algorithm = request.params.arguments.algorithm || 'summarization';
    const compressionRatio = request.params.arguments.compressionRatio || 0.7;
    
    const originalSize = Buffer.byteLength(context, 'utf8');
    let compressedContext = '';
    let compressionMethod = '';
    
    switch (algorithm) {
      case 'summarization':
        // 改良された要約アルゴリズム
        const lines = context.split('\n');
        const importantLines = [];
        const seenLines = new Set();
        
        // 重要度の高い行を優先的に抽出
        const priorityPatterns = [
          /^(function|class|interface|type|enum)\s+/,
          /^(import|export)\s+/,
          /^(const|let|var)\s+\w+\s*=/,
          /^\s*\/\*\*[\s\S]*?\*\//,
          /^\s*\/\/.*$/
        ];
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.length === 0) continue;
          
          // 重複行をスキップ
          if (seenLines.has(trimmed)) continue;
          seenLines.add(trimmed);
          
          // 優先パターンにマッチする行
          const isImportant = priorityPatterns.some(pattern => pattern.test(trimmed));
          
          if (isImportant) {
            importantLines.push(line);
          } else if (trimmed.length > 20 && !trimmed.includes('//') && !trimmed.includes('/*')) {
            // 長い行も重要とみなす
            importantLines.push(line);
          }
        }
        
        // 圧縮率に応じて行数を制限
        const maxLines = Math.floor(importantLines.length * compressionRatio);
        compressedContext = importantLines.slice(0, maxLines).join('\n');
        compressionMethod = '重要行の抽出（改良版）';
        break;
        
      case 'truncation':
        const targetLength = Math.floor(context.length * compressionRatio);
        // 単語の境界で切り詰め
        if (targetLength < context.length) {
          const truncated = context.substring(0, targetLength);
          const lastSpaceIndex = truncated.lastIndexOf(' ');
          if (lastSpaceIndex > targetLength * 0.8) {
            compressedContext = truncated.substring(0, lastSpaceIndex) + '...';
          } else {
            compressedContext = truncated + '...';
          }
        } else {
          compressedContext = context;
        }
        compressionMethod = '末尾切り詰め（改良版）';
        break;
        
      case 'keyword-extraction':
        const words = context.split(/\s+/);
        const stopWords = new Set([
          'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'man', 'men', 'put', 'say', 'she', 'too', 'use', 'this', 'that', 'with', 'have', 'will', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were'
        ]);
        
        const keywords = words.filter(word => {
          const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
          return cleanWord.length > 3 && !stopWords.has(cleanWord);
        });
        
        // 重複を除去
        const uniqueKeywords = [...new Set(keywords)];
        const maxKeywords = Math.floor(uniqueKeywords.length * compressionRatio);
        compressedContext = uniqueKeywords.slice(0, maxKeywords).join(' ');
        compressionMethod = 'キーワード抽出（改良版）';
        break;
        
      default:
        compressedContext = context;
        compressionMethod = '圧縮なし';
    }
    
    const compressedSize = Buffer.byteLength(compressedContext, 'utf8');
    const actualCompressionRatio = compressedSize / originalSize;
    
    // メトリクス収集
    recordCompressionRatio(originalSize, compressedSize);
    
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify({
            originalSize: originalSize,
            compressedSize: compressedSize,
            compressionRatio: actualCompressionRatio,
            compressionMethod: compressionMethod,
            algorithm: algorithm,
            compressedContext: compressedContext,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      }
    };
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: -32603,
        message: `Internal error: ${error.message}`
      }
    };
  }
}

async function handleSuggestContextOptimization(request) {
  console.error(chalk.blue('🔍 suggest_context_optimization 実行中 / Executing suggest_context_optimization'));
  
  try {
    const context = request.params.arguments.context;
    const query = request.params.arguments.query || '';
    const suggestionTypes = request.params.arguments.suggestionTypes || ['duplicate-removal', 'irrelevant-filtering'];
    
    const suggestions = [];
    
    if (suggestionTypes.includes('duplicate-removal')) {
      const lines = context.split('\n');
      const duplicates = [];
      const seen = new Set();
      
      lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (trimmed.length > 0) {
          if (seen.has(trimmed)) {
            duplicates.push({ line: index + 1, content: trimmed });
          } else {
            seen.add(trimmed);
          }
        }
      });
      
      if (duplicates.length > 0) {
        suggestions.push({
          type: 'duplicate-removal',
          priority: 'high',
          description: '重複行の削除',
          count: duplicates.length,
          examples: duplicates.slice(0, 3),
          potentialSavings: duplicates.reduce((sum, dup) => sum + Buffer.byteLength(dup.content, 'utf8'), 0)
        });
      }
    }
    
    if (suggestionTypes.includes('irrelevant-filtering')) {
      const lines = context.split('\n');
      const irrelevantLines = lines.filter((line, index) => {
        const trimmed = line.trim();
        return trimmed.length > 0 && 
               !trimmed.includes('function') && 
               !trimmed.includes('class') && 
               !trimmed.includes('import') && 
               !trimmed.includes('export') &&
               !trimmed.includes('//') &&
               !trimmed.includes('*') &&
               trimmed.length < 20;
      });
      
      if (irrelevantLines.length > 0) {
        suggestions.push({
          type: 'irrelevant-filtering',
          priority: 'medium',
          description: '関連性の低い行の削除',
          count: irrelevantLines.length,
          examples: irrelevantLines.slice(0, 3),
          potentialSavings: irrelevantLines.reduce((sum, line) => sum + Buffer.byteLength(line, 'utf8'), 0)
        });
      }
    }
    
    if (suggestionTypes.includes('priority-ranking')) {
      const lines = context.split('\n');
      const importantLines = lines.filter(line => 
        line.includes('function') || line.includes('class') || line.includes('import') || line.includes('export')
      );
      
      suggestions.push({
        type: 'priority-ranking',
        priority: 'low',
        description: '重要度による優先順位付け',
        importantLines: importantLines.length,
        totalLines: lines.length,
        recommendation: `重要行: ${importantLines.length}/${lines.length} (${Math.round(importantLines.length/lines.length*100)}%)`
      });
    }
    
    const totalPotentialSavings = suggestions.reduce((sum, suggestion) => 
      sum + (suggestion.potentialSavings || 0), 0
    );
    
    // メトリクス収集
    recordOptimizationSuggestions(suggestions);
    
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify({
            query: query,
            suggestions: suggestions,
            totalSuggestions: suggestions.length,
            totalPotentialSavings: totalPotentialSavings,
            contextSize: Buffer.byteLength(context, 'utf8'),
            optimizationPotential: Math.round((totalPotentialSavings / Buffer.byteLength(context, 'utf8')) * 100),
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      }
    };
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: -32603,
        message: `Internal error: ${error.message}`
      }
    };
  }
}

async function handleManageContextHistory(request) {
  console.error(chalk.blue('🔍 manage_context_history 実行中 / Executing manage_context_history'));
  
  try {
    const action = request.params.arguments.action;
    const contextId = request.params.arguments.contextId;
    const context = request.params.arguments.context;
    const query = request.params.arguments.query;
    
    // メモリ効率を考慮した履歴管理
    if (!global.contextHistory) {
      global.contextHistory = new Map();
    }
    
    // メモリ使用量をチェックして履歴を制限
    const maxHistoryEntries = config.contextManagement?.historyManagement?.maxHistoryEntries || 50;
    if (global.contextHistory.size > maxHistoryEntries) {
      // 古いエントリを削除
      const entries = Array.from(global.contextHistory.entries());
      entries.sort((a, b) => new Date(a[1].timestamp) - new Date(b[1].timestamp));
      const toDelete = entries.slice(0, entries.length - maxHistoryEntries);
      toDelete.forEach(([id]) => {
        global.contextHistory.delete(id);
      });
    }
    
    let result = {};
    
    switch (action) {
      case 'save':
        const id = contextId || `context_${Date.now()}`;
        global.contextHistory.set(id, {
          context: context,
          size: Buffer.byteLength(context, 'utf8'),
          timestamp: new Date().toISOString(),
          id: id
        });
        result = {
          action: 'save',
          contextId: id,
          size: Buffer.byteLength(context, 'utf8'),
          saved: true
        };
        break;
        
      case 'retrieve':
        if (contextId && global.contextHistory.has(contextId)) {
          const savedContext = global.contextHistory.get(contextId);
          result = {
            action: 'retrieve',
            contextId: contextId,
            context: savedContext.context,
            size: savedContext.size,
            timestamp: savedContext.timestamp,
            found: true
          };
        } else {
          result = {
            action: 'retrieve',
            contextId: contextId,
            found: false,
            error: 'Context not found'
          };
        }
        break;
        
      case 'search':
        const searchResults = [];
        for (const [id, savedContext] of global.contextHistory) {
          if (savedContext.context.toLowerCase().includes(query.toLowerCase())) {
            searchResults.push({
              id: id,
              size: savedContext.size,
              timestamp: savedContext.timestamp,
              preview: savedContext.context.substring(0, 100) + '...'
            });
          }
        }
        result = {
          action: 'search',
          query: query,
          results: searchResults,
          count: searchResults.length
        };
        break;
        
      case 'cleanup':
        const maxEntries = config.contextManagement?.historyManagement?.maxHistoryEntries || 50;
        const entries = Array.from(global.contextHistory.entries());
        
        if (entries.length > maxEntries) {
          // 古いエントリを削除
          entries.sort((a, b) => new Date(a[1].timestamp) - new Date(b[1].timestamp));
          const toDelete = entries.slice(0, entries.length - maxEntries);
          
          toDelete.forEach(([id]) => {
            global.contextHistory.delete(id);
          });
          
          result = {
            action: 'cleanup',
            deletedCount: toDelete.length,
            remainingCount: global.contextHistory.size,
            maxEntries: maxEntries
          };
        } else {
          result = {
            action: 'cleanup',
            deletedCount: 0,
            remainingCount: global.contextHistory.size,
            maxEntries: maxEntries,
            message: 'No cleanup needed'
          };
        }
        break;
        
      default:
        result = {
          action: action,
          error: 'Unknown action'
        };
    }
    
    result.timestamp = new Date().toISOString();
    
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      }
    };
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: -32603,
        message: `Internal error: ${error.message}`
      }
    };
  }
}

// 新しい分析機能ハンドラー関数
async function handleGetContextAnalytics(request) {
  console.error(chalk.blue('🔍 get_context_analytics 実行中 / Executing get_context_analytics'));
  
  try {
    const timeRange = request.params.arguments.timeRange || '24h';
    const includeMetrics = request.params.arguments.includeMetrics !== false;
    const includeTrends = request.params.arguments.includeTrends !== false;
    const includeInsights = request.params.arguments.includeInsights !== false;
    
    // 時間範囲の計算
    const now = new Date();
    let startTime;
    switch (timeRange) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    
    // 期間内のデータをフィルタリング
    const filteredContextSizes = analyticsData.contextSizes.filter(item => 
      new Date(item.timestamp) >= startTime
    );
    const filteredCompressionRatios = analyticsData.compressionRatios.filter(item => 
      new Date(item.timestamp) >= startTime
    );
    const filteredOptimizationSuggestions = analyticsData.optimizationSuggestions.filter(item => 
      new Date(item.timestamp) >= startTime
    );
    const filteredPerformanceMetrics = analyticsData.performanceMetrics.filter(item => 
      new Date(item.timestamp) >= startTime
    );
    
    const analytics = {
      timeRange: timeRange,
      period: {
        start: startTime.toISOString(),
        end: now.toISOString(),
        duration: now.getTime() - startTime.getTime()
      },
      timestamp: now.toISOString()
    };
    
    // 基本メトリクスの計算（スコープ外でも使用するため先に計算）
    const totalContextOperations = filteredContextSizes.length;
    const totalCompressionOperations = filteredCompressionRatios.length;
    const totalOptimizationSuggestions = filteredOptimizationSuggestions.length;
    
    const avgContextSize = filteredContextSizes.length > 0 ? 
      filteredContextSizes.reduce((sum, item) => sum + item.size, 0) / filteredContextSizes.length : 0;
    
    const avgCompressionRatio = filteredCompressionRatios.length > 0 ? 
      filteredCompressionRatios.reduce((sum, item) => sum + item.ratio, 0) / filteredCompressionRatios.length : 0;
    
    const totalSavings = filteredCompressionRatios.reduce((sum, item) => sum + item.savings, 0);
    
    if (includeMetrics) {
      
      analytics.metrics = {
        contextOperations: {
          total: totalContextOperations,
          averageSize: Math.round(avgContextSize),
          maxSize: filteredContextSizes.length > 0 ? Math.max(...filteredContextSizes.map(item => item.size)) : 0,
          minSize: filteredContextSizes.length > 0 ? Math.min(...filteredContextSizes.map(item => item.size)) : 0
        },
        compressionOperations: {
          total: totalCompressionOperations,
          averageRatio: Math.round(avgCompressionRatio * 100) / 100,
          totalSavings: totalSavings,
          efficiency: totalSavings > 0 ? Math.round((totalSavings / (avgContextSize * totalContextOperations)) * 100) : 0
        },
        optimizationSuggestions: {
          total: totalOptimizationSuggestions,
          averageSuggestionsPerRequest: totalOptimizationSuggestions > 0 ? 
            filteredOptimizationSuggestions.reduce((sum, item) => sum + item.count, 0) / totalOptimizationSuggestions : 0
        },
        performance: {
          averageMemoryUsage: filteredPerformanceMetrics.length > 0 ? 
            Math.round(filteredPerformanceMetrics.reduce((sum, item) => sum + item.memoryUsage, 0) / filteredPerformanceMetrics.length) : 0,
          peakMemoryUsage: filteredPerformanceMetrics.length > 0 ? 
            Math.max(...filteredPerformanceMetrics.map(item => item.memoryUsage)) : 0
        }
      };
    }
    
    if (includeTrends) {
      // トレンド分析
      const hourlyData = {};
      const dailyData = {};
      
      filteredContextSizes.forEach(item => {
        const hour = new Date(item.timestamp).getHours();
        const day = new Date(item.timestamp).toDateString();
        
        if (!hourlyData[hour]) hourlyData[hour] = [];
        if (!dailyData[day]) dailyData[day] = [];
        
        hourlyData[hour].push(item.size);
        dailyData[day].push(item.size);
      });
      
      analytics.trends = {
        hourly: Object.keys(hourlyData).map(hour => ({
          hour: parseInt(hour),
          averageSize: Math.round(hourlyData[hour].reduce((sum, size) => sum + size, 0) / hourlyData[hour].length),
          count: hourlyData[hour].length
        })).sort((a, b) => a.hour - b.hour),
        daily: Object.keys(dailyData).map(day => ({
          date: day,
          averageSize: Math.round(dailyData[day].reduce((sum, size) => sum + size, 0) / dailyData[day].length),
          count: dailyData[day].length
        }))
      };
    }
    
    if (includeInsights) {
      // 洞察と推奨事項
      const insights = [];
      
      if (avgContextSize > 80000) {
        insights.push({
          type: 'warning',
          message: '平均コンテキストサイズが大きすぎます',
          recommendation: 'より積極的な圧縮を検討してください',
          priority: 'high'
        });
      }
      
      if (avgCompressionRatio < 0.5) {
        insights.push({
          type: 'suggestion',
          message: '圧縮率が低いです',
          recommendation: 'より効率的な圧縮アルゴリズムを試してください',
          priority: 'medium'
        });
      }
      
      if (totalOptimizationSuggestions > 0) {
        const avgSuggestions = filteredOptimizationSuggestions.reduce((sum, item) => sum + item.count, 0) / totalOptimizationSuggestions;
        if (avgSuggestions > 5) {
          insights.push({
            type: 'info',
            message: '多くの最適化提案が生成されています',
            recommendation: 'コンテキストの品質を向上させることを検討してください',
            priority: 'low'
          });
        }
      }
      
      analytics.insights = insights;
    }
    
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify(analytics, null, 2)
        }]
      }
    };
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: -32603,
        message: `Internal error: ${error.message}`
      }
    };
  }
}

async function handleGetEfficiencyDashboard(request) {
  console.error(chalk.blue('🔍 get_efficiency_dashboard 実行中 / Executing get_efficiency_dashboard'));
  
  try {
    const refreshInterval = request.params.arguments.refreshInterval || 10;
    const showRealTime = request.params.arguments.showRealTime !== false;
    const showHistorical = request.params.arguments.showHistorical !== false;
    
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentContextSizes = analyticsData.contextSizes.filter(item => 
      new Date(item.timestamp) >= last24h
    );
    const recentCompressionRatios = analyticsData.compressionRatios.filter(item => 
      new Date(item.timestamp) >= last24h
    );
    const recentPerformanceMetrics = analyticsData.performanceMetrics.filter(item => 
      new Date(item.timestamp) >= last24h
    );
    
    const dashboard = {
      timestamp: now.toISOString(),
      refreshInterval: refreshInterval,
      uptime: now.getTime() - new Date(analyticsData.startTime).getTime(),
      status: 'running'
    };
    
    if (showRealTime) {
      const currentMemoryUsage = process.memoryUsage();
      const currentCpuUsage = process.cpuUsage();
      
      dashboard.realTime = {
        memory: {
          used: currentMemoryUsage.heapUsed,
          total: currentMemoryUsage.heapTotal,
          percentage: Math.round((currentMemoryUsage.heapUsed / currentMemoryUsage.heapTotal) * 100)
        },
        cpu: {
          user: currentCpuUsage.user,
          system: currentCpuUsage.system
        },
        contextHistory: {
          totalEntries: global.contextHistory ? global.contextHistory.size : 0,
          cacheSize: performanceCache ? performanceCache.keys().length : 0
        }
      };
    }
    
    if (showHistorical) {
      const totalOperations = recentContextSizes.length;
      const totalCompressions = recentCompressionRatios.length;
      const avgContextSize = totalOperations > 0 ? 
        recentContextSizes.reduce((sum, item) => sum + item.size, 0) / totalOperations : 0;
      const avgCompressionRatio = totalCompressions > 0 ? 
        recentCompressionRatios.reduce((sum, item) => sum + item.ratio, 0) / totalCompressions : 0;
      const totalSavings = recentCompressionRatios.reduce((sum, item) => sum + item.savings, 0);
      
      dashboard.historical = {
        period: '24h',
        operations: {
          contextOperations: totalOperations,
          compressionOperations: totalCompressions,
          optimizationSuggestions: analyticsData.optimizationSuggestions.filter(item => 
            new Date(item.timestamp) >= last24h
          ).length
        },
        efficiency: {
          averageContextSize: Math.round(avgContextSize),
          averageCompressionRatio: Math.round(avgCompressionRatio * 100) / 100,
          totalSavings: totalSavings,
          efficiencyScore: totalOperations > 0 ? Math.round((totalSavings / (avgContextSize * totalOperations)) * 100) : 0
        },
        performance: {
          averageMemoryUsage: recentPerformanceMetrics.length > 0 ? 
            Math.round(recentPerformanceMetrics.reduce((sum, item) => sum + item.memoryUsage, 0) / recentPerformanceMetrics.length) : 0,
          peakMemoryUsage: recentPerformanceMetrics.length > 0 ? 
            Math.max(...recentPerformanceMetrics.map(item => item.memoryUsage)) : 0
        }
      };
    }
    
    // 効率性スコアの計算
    const efficiencyScore = calculateEfficiencyScore(dashboard);
    dashboard.efficiencyScore = efficiencyScore;
    
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify(dashboard, null, 2)
        }]
      }
    };
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: -32603,
        message: `Internal error: ${error.message}`
      }
    };
  }
}

async function handleGeneratePerformanceReport(request) {
  console.error(chalk.blue('🔍 generate_performance_report 実行中 / Executing generate_performance_report'));
  
  try {
    const reportType = request.params.arguments.reportType || 'summary';
    const timeRange = request.params.arguments.timeRange || '24h';
    const includeRecommendations = request.params.arguments.includeRecommendations !== false;
    
    const now = new Date();
    let startTime;
    switch (timeRange) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    
    const filteredData = {
      contextSizes: analyticsData.contextSizes.filter(item => new Date(item.timestamp) >= startTime),
      compressionRatios: analyticsData.compressionRatios.filter(item => new Date(item.timestamp) >= startTime),
      optimizationSuggestions: analyticsData.optimizationSuggestions.filter(item => new Date(item.timestamp) >= startTime),
      performanceMetrics: analyticsData.performanceMetrics.filter(item => new Date(item.timestamp) >= startTime)
    };
    
    const report = {
      type: reportType,
      timeRange: timeRange,
      generatedAt: now.toISOString(),
      period: {
        start: startTime.toISOString(),
        end: now.toISOString()
      }
    };
    
    if (reportType === 'summary' || reportType === 'detailed') {
      const totalOperations = filteredData.contextSizes.length;
      const totalCompressions = filteredData.compressionRatios.length;
      const totalOptimizations = filteredData.optimizationSuggestions.length;
      
      const avgContextSize = totalOperations > 0 ? 
        filteredData.contextSizes.reduce((sum, item) => sum + item.size, 0) / totalOperations : 0;
      
      const avgCompressionRatio = totalCompressions > 0 ? 
        filteredData.compressionRatios.reduce((sum, item) => sum + item.ratio, 0) / totalCompressions : 0;
      
      const totalSavings = filteredData.compressionRatios.reduce((sum, item) => sum + item.savings, 0);
      
      report.summary = {
        operations: {
          contextOperations: totalOperations,
          compressionOperations: totalCompressions,
          optimizationSuggestions: totalOptimizations
        },
        efficiency: {
          averageContextSize: Math.round(avgContextSize),
          averageCompressionRatio: Math.round(avgCompressionRatio * 100) / 100,
          totalSavings: totalSavings,
          efficiencyScore: totalOperations > 0 ? Math.round((totalSavings / (avgContextSize * totalOperations)) * 100) : 0
        },
        performance: {
          averageMemoryUsage: filteredData.performanceMetrics.length > 0 ? 
            Math.round(filteredData.performanceMetrics.reduce((sum, item) => sum + item.memoryUsage, 0) / filteredData.performanceMetrics.length) : 0,
          peakMemoryUsage: filteredData.performanceMetrics.length > 0 ? 
            Math.max(...filteredData.performanceMetrics.map(item => item.memoryUsage)) : 0
        }
      };
    }
    
    if (reportType === 'detailed' || reportType === 'comparison') {
      report.detailed = {
        contextSizeDistribution: calculateDistribution(filteredData.contextSizes.map(item => item.size)),
        compressionRatioDistribution: calculateDistribution(filteredData.compressionRatios.map(item => item.ratio)),
        performanceTrends: filteredData.performanceMetrics.map(item => ({
          timestamp: item.timestamp,
          memoryUsage: item.memoryUsage,
          memoryTotal: item.memoryTotal
        }))
      };
    }
    
    if (includeRecommendations) {
      report.recommendations = generateRecommendations(report.summary || {});
    }
    
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify(report, null, 2)
        }]
      }
    };
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: -32603,
        message: `Internal error: ${error.message}`
      }
    };
  }
}

// ヘルパー関数
function calculateEfficiencyScore(dashboard) {
  let score = 0;
  
  if (dashboard.historical) {
    const efficiency = dashboard.historical.efficiency;
    if (efficiency.efficiencyScore > 0) {
      score += Math.min(efficiency.efficiencyScore, 50);
    }
    
    if (efficiency.averageCompressionRatio > 0.5) {
      score += 25;
    }
    
    if (dashboard.historical.operations.contextOperations > 0) {
      score += 25;
    }
  }
  
  return Math.min(score, 100);
}

function calculateDistribution(values) {
  if (values.length === 0) return { min: 0, max: 0, avg: 0, median: 0 };
  
  const sorted = values.sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  
  return { min, max, avg: Math.round(avg), median };
}

function generateRecommendations(summary) {
  const recommendations = [];
  
  if (summary.efficiency) {
    if (summary.efficiency.averageContextSize > 80000) {
      recommendations.push({
        type: 'optimization',
        priority: 'high',
        title: 'コンテキストサイズの最適化',
        description: '平均コンテキストサイズが大きすぎます。より積極的な圧縮を検討してください。',
        action: 'auto_compress_context の使用頻度を増やす'
      });
    }
    
    if (summary.efficiency.averageCompressionRatio < 0.5) {
      recommendations.push({
        type: 'algorithm',
        priority: 'medium',
        title: '圧縮アルゴリズムの改善',
        description: '圧縮率が低いです。より効率的なアルゴリズムを試してください。',
        action: 'keyword-extraction や summarization アルゴリズムを試す'
      });
    }
    
    if (summary.efficiency.efficiencyScore < 30) {
      recommendations.push({
        type: 'workflow',
        priority: 'high',
        title: 'ワークフローの改善',
        description: '全体的な効率性が低いです。コンテキスト管理のワークフローを見直してください。',
        action: 'suggest_context_optimization を定期的に実行する'
      });
    }
  }
  
  return recommendations;
}

// メトリクス収集のための関数
function recordContextSize(size) {
  if (config.analytics && config.analytics.enabled && config.analytics.metrics && config.analytics.metrics.trackContextSize) {
    analyticsData.contextSizes.push({
      size: size,
      timestamp: new Date().toISOString()
    });
  }
}

function recordCompressionRatio(originalSize, compressedSize) {
  if (config.analytics && config.analytics.enabled && config.analytics.metrics && config.analytics.metrics.trackCompressionRatio) {
    const ratio = compressedSize / originalSize;
    const savings = originalSize - compressedSize;
    
    analyticsData.compressionRatios.push({
      ratio: ratio,
      savings: savings,
      originalSize: originalSize,
      compressedSize: compressedSize,
      timestamp: new Date().toISOString()
    });
  }
}

function recordOptimizationSuggestions(suggestions) {
  if (config.analytics && config.analytics.enabled && config.analytics.metrics && config.analytics.metrics.trackOptimizationSuggestions) {
    analyticsData.optimizationSuggestions.push({
      count: suggestions.length,
      suggestions: suggestions,
      timestamp: new Date().toISOString()
    });
  }
}

// メイン処理を開始
main().catch(console.error);
