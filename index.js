#!/usr/bin/env node

/**
 * Context Optimizer - Advanced MCP Server
 * 高度なコンテキスト最適化MCPサーバー
 */

import chalk from 'chalk';
import { readFileSync, existsSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, extname, resolve } from 'path';
import { glob } from 'glob';
import { Parser } from 'acorn';
import jsx from 'acorn-jsx';
import { simple as walk } from 'acorn-walk';
import { parse } from '@typescript-eslint/parser';
import simpleGit from 'simple-git';
import NodeCache from 'node-cache';
import natural from 'natural';

// コマンドライン引数の処理（設定ファイル読み込み前に実行）
const args = process.argv.slice(2);
if (args.includes('--version') || args.includes('-v')) {
  // 設定ファイルを読み込んでバージョンを取得
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const configPath = join(__dirname, 'config.json');
  
  let version = '1.1.8'; // デフォルトバージョン
  if (existsSync(configPath)) {
    try {
      const configData = JSON.parse(readFileSync(configPath, 'utf8'));
      version = configData.server?.version || version;
    } catch (error) {
      // 設定ファイル読み込みエラーは無視してデフォルトバージョンを使用
    }
  }
  
  console.log(version);
  process.exit(0);
}

if (args.includes('--help') || args.includes('-h')) {
  // 設定ファイルを読み込んでバージョンを取得
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const configPath = join(__dirname, 'config.json');
  
  let version = '1.2.2'; // デフォルトバージョン
  if (existsSync(configPath)) {
    try {
      const configData = JSON.parse(readFileSync(configPath, 'utf8'));
      version = configData.server?.version || version;
    } catch (error) {
      // 設定ファイル読み込みエラーは無視してデフォルトバージョンを使用
    }
  }
  
  console.log(`Context Optimizer MCP Server v${version}
  
Usage: node index.js [options]

Options:
  --version, -v    Show version number
  --help, -h       Show this help message
  --config-help    Show configuration help

Configuration:
  The server looks for configuration files in the following order:
  1. PROJECT_ROOT/.context-optimizer.config (project-specific)
  2. package_directory/config.json (fallback)

  To create a project-specific configuration:
  1. Copy .context-optimizer.config.example to your project root
  2. Rename it to .context-optimizer.config
  3. Update the "project.root" field with your absolute project path

For MCP server usage, run without arguments and connect via Cursor.`);
  process.exit(0);
}

if (args.includes('--config-help')) {
  console.log(`Context Optimizer Configuration Help

Configuration File: .context-optimizer.config

Place this file in your project root directory. The server will automatically
detect and use it for project-specific settings.

Key Configuration Sections:

1. project:
   - name: Your project name
   - root: ABSOLUTE path to your project directory
   - type: Project type (typescript, javascript, python, etc.)
   - framework: Framework used (react, vue, angular, etc.)

2. fileSearch:
   - patterns: File patterns to search (relative to PROJECT_ROOT)
   - excludePatterns: Patterns to exclude (relative to PROJECT_ROOT)
   - maxResults: Maximum number of search results

3. performance:
   - cache: Cache settings (TTL, max keys)
   - parallel: Parallel processing settings
   - memory: Memory usage limits

4. contextManagement:
   - monitoring: Context size monitoring
   - autoCompression: Automatic compression settings
   - optimizationSuggestions: Optimization suggestions

Path Rules:
- PROJECT_ROOT must be an absolute path
- All other paths are relative to PROJECT_ROOT
- Use forward slashes (/) for path separators

Example:
{
  "project": {
    "name": "MyProject",
    "root": "/Users/username/projects/my-project",
    "type": "typescript",
    "framework": "react"
  },
  "fileSearch": {
    "patterns": ["src/**/*.{ts,tsx}", "public/**/*"],
    "excludePatterns": ["**/node_modules/**", "**/dist/**"]
  }
}

For more information, see the README.md file.`);
  process.exit(0);
}

// 設定ファイルの読み込み
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// プロジェクトルートの検証
function isValidProjectRoot(path) {
  try {
    // 必須の指標（package.jsonまたは.gitの存在を必須とする）
    const requiredIndicators = ['package.json', '.git'];
    const hasRequired = requiredIndicators.some(indicator => {
      const fullPath = join(path, indicator);
      return existsSync(fullPath);
    });
    
    if (!hasRequired) {
      console.error(chalk.blue(`🔍 Validating project root: ${path}`));
      console.error(chalk.red(`  ❌ No required indicators found (package.json or .git)`));
      return false;
    }
    
    // その他の指標もチェック
    const otherIndicators = [
      'src',
      'lib',
      'app',
      'components',
      'pages',
      'public',
      'assets',
      'index.js',
      'index.ts',
      'main.js',
      'main.ts'
    ];
    
    const foundRequired = requiredIndicators.filter(indicator => {
      const fullPath = join(path, indicator);
      return existsSync(fullPath);
    });
    
    const foundOther = otherIndicators.filter(indicator => {
      const fullPath = join(path, indicator);
      return existsSync(fullPath);
    });
    
    console.error(chalk.blue(`🔍 Validating project root: ${path}`));
    console.error(chalk.green(`  ✅ Required indicators: ${foundRequired.join(', ')}`));
    console.error(chalk.gray(`  📁 Other indicators: ${foundOther.join(', ') || 'none'}`));
    
    return true; // 必須の指標が存在する場合は有効
  } catch (error) {
    console.error(chalk.red(`❌ Error validating project root ${path}:`), error.message);
    return false;
  }
}

// プロジェクトルートの自動検出
function detectProjectRoot() {
  // 利用可能な環境変数をログに出力
  console.error(chalk.blue('🔍 Available environment variables:'));
  const relevantEnvVars = [
    'CURSOR_WORKSPACE_ROOT',
    'VSCODE_WORKSPACE_FOLDER', 
    'WORKSPACE_FOLDER_PATHS', // Cursorが設定する環境変数
    'PROJECT_ROOT',
    'PWD',
    'CWD',
    'WORKSPACE_ROOT',
    'PROJECT_DIR',
    'CURSOR_PROJECT_ROOT',
    'CURSOR_CURRENT_PROJECT',
    'CURSOR_OPENED_PROJECT',
    'VSCODE_CWD',
    'VSCODE_PID',
    'VSCODE_INJECTION'
  ];
  
  relevantEnvVars.forEach(envVar => {
    const value = process.env[envVar];
    if (value) {
      console.error(chalk.green(`  ${envVar}:`), value);
    } else {
      console.error(chalk.gray(`  ${envVar}:`), chalk.red('(not set)'));
    }
  });
  
  // 全ての環境変数の中で、パス関連のものを表示
  console.error(chalk.blue('🔍 All path-related environment variables:'));
  Object.keys(process.env).forEach(key => {
    if (key.includes('PATH') || key.includes('ROOT') || key.includes('DIR') || key.includes('WORKSPACE') || key.includes('PROJECT')) {
      const value = process.env[key];
      if (value && value.includes('/')) {
        console.error(chalk.cyan(`  ${key}:`), value);
      }
    }
  });
  
  console.error(chalk.blue('🔍 process.cwd():'), process.cwd());
  console.error(chalk.blue('🔍 __dirname:'), __dirname);
  
  // プロジェクトルート検出の優先順位
  const candidates = [
    process.env.CURSOR_WORKSPACE_ROOT,
    process.env.VSCODE_WORKSPACE_FOLDER,
    process.env.WORKSPACE_FOLDER_PATHS, // Cursorが設定する環境変数
    process.env.PROJECT_ROOT,
    process.env.PWD,
    process.cwd()
  ].filter(Boolean);
  
  console.error(chalk.blue('🔍 Project root candidates:'));
  candidates.forEach((candidate, index) => {
    console.error(chalk.cyan(`  ${index + 1}.`), candidate);
  });
  
  // 候補を検証して最初の有効なものを返す
  for (const candidate of candidates) {
    if (isValidProjectRoot(candidate)) {
      console.error(chalk.green(`✅ Valid project root found: ${candidate}`));
      console.error(chalk.yellow('⚠️  Initial PROJECT_ROOT (will be overridden by config):'), candidate);
      return candidate;
    }
  }
  
  // 有効な候補が見つからない場合は、現在の作業ディレクトリからプロジェクトルートを自動検出
  console.error(chalk.yellow('⚠️  No valid project root found in candidates, auto-detecting from current directory...'));
  
  let currentDir = process.cwd();
  let attempts = 0;
  const maxAttempts = 10; // 最大10階層まで遡る
  
  console.error(chalk.blue('🔍 Starting project root detection from:'), currentDir);
  console.error(chalk.blue('🔍 This is the directory where MCP server was started'));
  
  while (attempts < maxAttempts) {
    console.error(chalk.gray(`  Attempt ${attempts + 1}: ${currentDir}`));
    
    // このディレクトリの内容を確認
    try {
      const dirContents = readdirSync(currentDir);
      console.error(chalk.gray(`    Directory contents: ${dirContents.slice(0, 10).join(', ')}${dirContents.length > 10 ? '...' : ''}`));
    } catch (error) {
      console.error(chalk.red(`    Error reading directory: ${error.message}`));
    }
    
    if (isValidProjectRoot(currentDir)) {
      console.error(chalk.green(`✅ Valid project root found: ${currentDir}`));
      console.error(chalk.blue('🎯 This directory contains package.json or .git, indicating it is a project root'));
      console.error(chalk.yellow('⚠️  Initial PROJECT_ROOT (will be overridden by config):'), currentDir);
      return currentDir;
    }
    
    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) {
      console.error(chalk.red('❌ Reached root directory, stopping search'));
      break; // ルートディレクトリに到達
    }
    currentDir = parentDir;
    attempts++;
  }
  
  // 最後の手段としてprocess.cwd()を返す
  const fallbackRoot = process.cwd();
  console.error(chalk.red(`❌ No valid project root found, using fallback: ${fallbackRoot}`));
  console.error(chalk.yellow('⚠️  Initial PROJECT_ROOT (will be overridden by config):'), fallbackRoot);
  return fallbackRoot;
}

let PROJECT_ROOT = detectProjectRoot();

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
    excludeExtensions: ['.exe', '.dll', '.so', '.dylib', '.bin', '.img', '.iso', '.zip', '.tar', '.gz', '.rar', '.7z', '.mp4', '.avi', '.mov', '.mp3', '.wav', '.flac', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.otf']
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
function loadConfigFile() {
  // 1. 現在の作業ディレクトリの .context-optimizer.config を優先
  const currentDir = process.cwd();
  const projectConfigPath = join(currentDir, '.context-optimizer.config');
  console.error(chalk.blue('🔍 Looking for config file at:'), projectConfigPath);
  
  if (existsSync(projectConfigPath)) {
    try {
      const configData = readFileSync(projectConfigPath, 'utf8');
      const projectConfig = JSON.parse(configData);
      config = { ...config, ...projectConfig };
      
      console.error(chalk.green('✅ プロジェクト設定ファイル読み込み成功 / Project config file loaded successfully:'));
      console.error(chalk.cyan('📁 ファイル名 / File name:'), projectConfigPath);
      console.error(chalk.blue('📋 設定内容 / Configuration content:'));
      console.error(chalk.gray(JSON.stringify(projectConfig, null, 2)));
      
      // プロジェクトルートを再設定
      if (config.project && config.project.root) {
        const oldRoot = PROJECT_ROOT;
        PROJECT_ROOT = config.project.root;
        console.error(chalk.green('✅ PROJECT_ROOT updated from project config:'));
        console.error(chalk.gray('  Old:'), oldRoot);
        console.error(chalk.green('  New:'), PROJECT_ROOT);
      } else {
        console.error(chalk.yellow('⚠️  No project.root found in project config, keeping:'), PROJECT_ROOT);
      }
      return true;
    } catch (error) {
      console.error(chalk.red('❌ プロジェクト設定ファイル読み込みエラー / Project config file loading error:'), error.message);
    }
  } else {
    console.error(chalk.yellow('⚠️  Project config file not found at:'), projectConfigPath);
  }
  
  // 2. フォールバック: 従来の config.json
  const configPath = join(__dirname, 'config.json');
  if (existsSync(configPath)) {
    try {
      const configData = readFileSync(configPath, 'utf8');
      const defaultConfig = JSON.parse(configData);
      config = { ...config, ...defaultConfig };
      
      console.error(chalk.green('✅ デフォルト設定ファイル読み込み成功 / Default config file loaded successfully'));
      console.error(chalk.cyan('📁 ファイル名 / File name:'), configPath);
      console.error(chalk.blue('📋 設定内容 / Configuration content:'));
      console.error(chalk.gray(JSON.stringify(defaultConfig, null, 2)));
      
      // 設定ファイル読み込み後にプロジェクトルートを再設定
      if (config.project && config.project.root) {
        const oldRoot = PROJECT_ROOT;
        PROJECT_ROOT = config.project.root;
        console.error(chalk.green('✅ PROJECT_ROOT updated from default config:'));
        console.error(chalk.gray('  Old:'), oldRoot);
        console.error(chalk.green('  New:'), PROJECT_ROOT);
      } else {
        console.error(chalk.yellow('⚠️  No project.root found in default config, keeping:'), PROJECT_ROOT);
      }
      return true;
    } catch (error) {
      console.error(chalk.red('❌ デフォルト設定ファイル読み込みエラー / Default config file loading error:'), error.message);
    }
  }
  
  console.error(chalk.yellow('⚠️  設定ファイルが見つかりません / Config file not found'));
  return false;
}

// 最初のコマンドが呼ばれた時点でプロジェクト配下の設定ファイルを読み込む
let configLoaded = false;
function ensureConfigLoaded() {
  if (!configLoaded) {
    console.error(chalk.blue('🔧 Loading configuration on first command...'));
    loadConfigFile();
    configLoaded = true;
  }
}

// 初期設定ファイルの読み込み（フォールバック用）
loadConfigFile();

// 最終的なPROJECT_ROOTを表示
console.error(chalk.cyan('🎯 Final PROJECT_ROOT:'), PROJECT_ROOT);

// パス解決ユーティリティ関数
function resolvePath(relativePath) {
  if (!relativePath) return PROJECT_ROOT;
  
  // 絶対パスの場合はそのまま返す
  if (relativePath.startsWith('/') || relativePath.match(/^[A-Za-z]:/)) {
    return relativePath;
  }
  
  // 相対パスの場合はPROJECT_ROOTを基準に解決
  return resolve(PROJECT_ROOT, relativePath);
}

// インデックスディレクトリの初期化
function ensureIndexDirectory(indexPath) {
  const fullPath = resolvePath(indexPath);
  if (!existsSync(fullPath)) {
    mkdirSync(fullPath, { recursive: true });
    console.error(chalk.green('📁 Created index directory:'), fullPath);
  }
  return fullPath;
}

// BM25検索の実装
class BM25Search {
  constructor(indexPath) {
    this.indexPath = ensureIndexDirectory(indexPath);
    this.indexFile = join(this.indexPath, 'bm25-index.json');
    this.index = this.loadIndex();
  }

  loadIndex() {
    if (existsSync(this.indexFile)) {
      try {
        const data = readFileSync(this.indexFile, 'utf8');
        const index = JSON.parse(data);
        
        // インデックスの整合性チェック
        this.validateIndex(index);
        
        console.error(chalk.green('📖 BM25 index loaded:'), this.indexFile);
        return index;
      } catch (error) {
        console.error(chalk.red('❌ Failed to load BM25 index:'), error.message);
        console.error(chalk.yellow('🔧 Attempting to recover...'));
        
        // リカバリ: バックアップファイルを探す
        const recoveredIndex = this.recoverFromBackup();
        if (recoveredIndex) {
          return recoveredIndex;
        }
      }
    }
    
    console.error(chalk.yellow('📝 BM25 index not found, creating new one'));
    return {
      documents: {},
      termFrequencies: {},
      documentFrequencies: {},
      totalDocuments: 0
    };
  }

  validateIndex(index) {
    try {
      if (!index.documents || !index.documentFrequencies) {
        throw new Error('Invalid index structure');
      }
      
      const docCount = Object.keys(index.documents).length;
      if (index.totalDocuments !== docCount) {
        console.error(chalk.yellow(`⚠️ Document count mismatch: expected ${index.totalDocuments}, found ${docCount}`));
        index.totalDocuments = docCount;
      }
      
      console.error(chalk.green('✅ BM25 index validation passed'));
    } catch (error) {
      console.error(chalk.red('❌ Index validation failed:'), error.message);
      throw error;
    }
  }

  recoverFromBackup() {
    try {
      const backupFile = this.indexFile.replace('.json', '_backup.json');
      if (existsSync(backupFile)) {
        console.error(chalk.yellow('🔄 Attempting to recover from backup...'));
        const data = readFileSync(backupFile, 'utf8');
        const index = JSON.parse(data);
        console.error(chalk.green('✅ Recovered from backup successfully'));
        return index;
      } else {
        console.error(chalk.red('❌ No backup file found'));
        return null;
      }
    } catch (error) {
      console.error(chalk.red('❌ Backup recovery failed:'), error.message);
      return null;
    }
  }

  saveIndex() {
    const startTime = Date.now();
    try {
      // インデックスサイズをチェック
      const indexSize = JSON.stringify(this.index).length;
      const maxSize = 50 * 1024 * 1024; // 50MB制限
      
      console.error(chalk.blue(`💾 Saving BM25 index... (${Math.round(indexSize / 1024)}KB)`));
      
      if (indexSize > maxSize) {
        console.error(chalk.yellow('⚠️ Index too large, compressing...'));
        this.saveIndexCompressed();
      } else {
        // バックアップを作成
        this.createBackup();
        
        writeFileSync(this.indexFile, JSON.stringify(this.index, null, 2));
        
        const duration = Date.now() - startTime;
        console.error(chalk.green(`💾 BM25 index saved: ${this.indexFile} (${duration}ms)`));
        console.error(chalk.blue(`📊 Index stats: ${this.index.totalDocuments} documents, ${Object.keys(this.index.documentFrequencies).length} unique terms`));
      }
    } catch (error) {
      console.error(chalk.red('❌ Failed to save BM25 index:'), error.message);
      console.error(chalk.red('🔧 Error details:'), error.stack);
      
      // フォールバック: 圧縮保存を試行
      try {
        this.saveIndexCompressed();
      } catch (fallbackError) {
        console.error(chalk.red('❌ Fallback save also failed:'), fallbackError.message);
        console.error(chalk.red('🚨 Critical error: Index cannot be saved!'));
      }
    }
  }

  createBackup() {
    try {
      const backupFile = this.indexFile.replace('.json', '_backup.json');
      if (existsSync(this.indexFile)) {
        const data = readFileSync(this.indexFile, 'utf8');
        writeFileSync(backupFile, data);
        console.error(chalk.green('💾 Backup created:'), backupFile);
      }
    } catch (error) {
      console.error(chalk.yellow('⚠️ Failed to create backup:'), error.message);
    }
  }

  saveIndexCompressed() {
    try {
      // ドキュメントを分割して保存
      const documents = this.index.documents;
      const documentIds = Object.keys(documents);
      const batchSize = 100; // 100ドキュメントずつ保存
      
      // メタデータを保存
      const metadata = {
        totalDocuments: this.index.totalDocuments,
        documentFrequencies: this.index.documentFrequencies,
        documentCount: documentIds.length
      };
      
      writeFileSync(this.indexFile, JSON.stringify(metadata, null, 2));
      
      // ドキュメントをバッチで保存
      for (let i = 0; i < documentIds.length; i += batchSize) {
        const batch = documentIds.slice(i, i + batchSize);
        const batchData = {};
        batch.forEach(id => {
          batchData[id] = documents[id];
        });
        
        const batchFile = this.indexFile.replace('.json', `_batch_${Math.floor(i / batchSize)}.json`);
        writeFileSync(batchFile, JSON.stringify(batchData, null, 2));
      }
      
      console.error(chalk.green('💾 BM25 index saved (compressed):'), this.indexFile);
    } catch (error) {
      console.error(chalk.red('❌ Failed to save compressed BM25 index:'), error.message);
      throw error;
    }
  }

  addDocument(docId, content) {
    // コンテンツサイズをチェック（メモリ効率化）
    const maxContentSize = 100000; // 100KB制限
    if (content.length > maxContentSize) {
      console.error(chalk.yellow(`⚠️ Content too large for ${docId}, truncating...`));
      content = content.substring(0, maxContentSize) + '... [TRUNCATED]';
    }

    const tokenizer = new natural.WordTokenizer();
    const tokens = tokenizer.tokenize(content.toLowerCase());
    const termFreq = {};
    
    // 単語頻度を計算（ストップワードを除外）
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should']);
    
    tokens.forEach(token => {
      if (token.length > 2 && !stopWords.has(token)) { // 2文字以下とストップワードを除外
        termFreq[token] = (termFreq[token] || 0) + 1;
      }
    });

    // メモリ効率化: 完全なコンテンツではなく要約を保存
    const summary = content.length > 500 ? content.substring(0, 500) + '...' : content;
    
    this.index.documents[docId] = {
      summary: summary,
      termFreq: termFreq,
      length: tokens.length,
      fullSize: content.length,
      timestamp: Date.now()
    };

    // 文書頻度を更新
    Object.keys(termFreq).forEach(term => {
      if (!this.index.documentFrequencies[term]) {
        this.index.documentFrequencies[term] = 0;
      }
      this.index.documentFrequencies[term]++;
    });

    this.index.totalDocuments++;
    
    // バッチ保存（パフォーマンス向上）
    if (this.index.totalDocuments % 10 === 0) {
      this.saveIndex();
    }
  }

  search(query, k1 = 1.2, b = 0.75) {
    const tokenizer = new natural.WordTokenizer();
    const queryTokens = tokenizer.tokenize(query.toLowerCase());
    const scores = {};

    Object.keys(this.index.documents).forEach(docId => {
      const doc = this.index.documents[docId];
      let score = 0;

      queryTokens.forEach(term => {
        if (doc.termFreq[term]) {
          const tf = doc.termFreq[term];
          const df = this.index.documentFrequencies[term] || 1;
          const idf = Math.log((this.index.totalDocuments - df + 0.5) / (df + 0.5));
          const tfScore = (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (doc.length / this.getAverageDocumentLength())));
          score += idf * tfScore;
        }
      });

      if (score > 0) {
        scores[docId] = score;
      }
    });

    return Object.entries(scores)
      .sort(([,a], [,b]) => b - a)
      .map(([docId, score]) => ({
        docId: docId,
        score: score,
        content: this.index.documents[docId].content
      }));
  }

  getAverageDocumentLength() {
    const lengths = Object.values(this.index.documents).map(doc => doc.length);
    return lengths.reduce((sum, len) => sum + len, 0) / lengths.length || 1;
  }
}

// ベクトル検索の実装（簡易版）
class VectorSearch {
  constructor(indexPath) {
    this.indexPath = ensureIndexDirectory(indexPath);
    this.indexFile = join(this.indexPath, 'vector-index.json');
    this.index = this.loadIndex();
  }

  loadIndex() {
    if (existsSync(this.indexFile)) {
      try {
        const data = readFileSync(this.indexFile, 'utf8');
        return JSON.parse(data);
      } catch (error) {
        console.error(chalk.yellow('⚠️ Failed to load vector index:'), error.message);
      }
    }
    return {
      documents: {},
      vectors: {}
    };
  }

  saveIndex() {
    try {
      // インデックスサイズをチェック
      const indexSize = JSON.stringify(this.index).length;
      const maxSize = 50 * 1024 * 1024; // 50MB制限
      
      if (indexSize > maxSize) {
        console.error(chalk.yellow('⚠️ Vector index too large, compressing...'));
        this.saveIndexCompressed();
      } else {
        writeFileSync(this.indexFile, JSON.stringify(this.index, null, 2));
        console.error(chalk.green('💾 Vector index saved:'), this.indexFile);
      }
    } catch (error) {
      console.error(chalk.red('❌ Failed to save vector index:'), error.message);
      // フォールバック: 圧縮保存を試行
      try {
        this.saveIndexCompressed();
      } catch (fallbackError) {
        console.error(chalk.red('❌ Fallback save also failed:'), fallbackError.message);
      }
    }
  }

  saveIndexCompressed() {
    try {
      // ドキュメントとベクトルを分割して保存
      const documents = this.index.documents;
      const vectors = this.index.vectors;
      const documentIds = Object.keys(documents);
      const batchSize = 50; // ベクトルは重いので50ドキュメントずつ
      
      // メタデータを保存
      const metadata = {
        documentCount: documentIds.length,
        dimensions: 384 // ベクトル次元数
      };
      
      writeFileSync(this.indexFile, JSON.stringify(metadata, null, 2));
      
      // ドキュメントとベクトルをバッチで保存
      for (let i = 0; i < documentIds.length; i += batchSize) {
        const batch = documentIds.slice(i, i + batchSize);
        const batchData = {
          documents: {},
          vectors: {}
        };
        
        batch.forEach(id => {
          batchData.documents[id] = documents[id];
          batchData.vectors[id] = vectors[id];
        });
        
        const batchFile = this.indexFile.replace('.json', `_batch_${Math.floor(i / batchSize)}.json`);
        writeFileSync(batchFile, JSON.stringify(batchData, null, 2));
      }
      
      console.error(chalk.green('💾 Vector index saved (compressed):'), this.indexFile);
    } catch (error) {
      console.error(chalk.red('❌ Failed to save compressed vector index:'), error.message);
      throw error;
    }
  }

  // 簡易的なベクトル化（実際の実装ではより高度な手法を使用）
  vectorize(text) {
    const tokenizer = new natural.WordTokenizer();
    const tokens = tokenizer.tokenize(text.toLowerCase());
    const vector = {};
    tokens.forEach(token => {
      vector[token] = (vector[token] || 0) + 1;
    });
    return vector;
  }

  cosineSimilarity(vec1, vec2) {
    const keys = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    keys.forEach(key => {
      const val1 = vec1[key] || 0;
      const val2 = vec2[key] || 0;
      dotProduct += val1 * val2;
      norm1 += val1 * val1;
      norm2 += val2 * val2;
    });

    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  addDocument(docId, content) {
    // コンテンツサイズをチェック（メモリ効率化）
    const maxContentSize = 50000; // ベクトルは重いので50KB制限
    if (content.length > maxContentSize) {
      console.error(chalk.yellow(`⚠️ Content too large for vector ${docId}, truncating...`));
      content = content.substring(0, maxContentSize) + '... [TRUNCATED]';
    }

    const vector = this.vectorize(content);
    
    // メモリ効率化: 要約を保存
    const summary = content.length > 200 ? content.substring(0, 200) + '...' : content;
    
    this.index.documents[docId] = summary;
    this.index.vectors[docId] = vector;
    
    // バッチ保存（パフォーマンス向上）
    const docCount = Object.keys(this.index.documents).length;
    if (docCount % 5 === 0) { // ベクトルは重いので5ファイルごと
      this.saveIndex();
    }
  }

  search(query, threshold = 0.7) {
    const queryVector = this.vectorize(query);
    const results = [];

    Object.keys(this.index.vectors).forEach(docId => {
      const similarity = this.cosineSimilarity(queryVector, this.index.vectors[docId]);
      if (similarity >= threshold) {
        results.push({
          docId: docId,
          score: similarity,
          content: this.index.documents[docId]
        });
      }
    });

    return results.sort((a, b) => b.score - a.score);
  }
}

// 自動インデックス作成機能
async function createInitialIndex() {
  if (!config.hybridSearch || !config.hybridSearch.enabled || !config.hybridSearch.autoIndex) {
    return;
  }

  console.error(chalk.blue('🚀 Starting automatic index creation...'));
  
  try {
    // ファイルパターンを取得
    const patterns = config.fileSearch?.patterns || ['**/*.{ts,js,tsx,jsx,md,txt}'];
    const excludePatterns = config.fileSearch?.excludePatterns || ['**/node_modules/**', '**/dist/**', '**/build/**'];
    
    // ファイルを検索
    const files = await glob(patterns, { 
      ignore: excludePatterns,
      cwd: PROJECT_ROOT,
      absolute: true  // 絶対パスで返すように設定
    });
    
    console.error(chalk.green('📁 Found files for indexing:'), files.length);
    console.error(chalk.gray('🔍 PROJECT_ROOT:'), PROJECT_ROOT);
    console.error(chalk.gray('📂 Sample files:'), files.slice(0, 3));
    
    // インデックス作成の進捗を追跡
    let indexedCount = 0;
    const maxFiles = Math.min(files.length, 100); // 最初の100ファイルのみ
    
    for (const file of files.slice(0, maxFiles)) {
      try {
        // ファイルパスの安全性チェック
        if (!file || typeof file !== 'string') {
          console.error(chalk.yellow('⚠️ Invalid file path:'), file);
          continue;
        }
        
        const content = readFileSync(file, 'utf8');
        // 絶対パスから相対パスを作成
        const docId = file.startsWith(PROJECT_ROOT) 
          ? file.substring(PROJECT_ROOT.length + 1)  // +1 for the trailing slash
          : file;
        
        // BM25インデックスに追加
        if (bm25Search) {
          bm25Search.addDocument(docId, content);
        }
        
        // ベクトルインデックスに追加
        if (vectorSearch) {
          vectorSearch.addDocument(docId, content);
        }
        
        indexedCount++;
        
        // 進捗表示（10ファイルごと）
        if (indexedCount % 10 === 0) {
          console.error(chalk.blue(`📊 Indexed ${indexedCount}/${maxFiles} files...`));
        }
        
      } catch (error) {
        console.error(chalk.yellow(`⚠️ Failed to index ${file}:`), error.message);
      }
    }
    
    console.error(chalk.green(`✅ Index creation completed! Indexed ${indexedCount} files.`));
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to create initial index:'), error.message);
  }
}

// インデックス更新機能
async function updateIndex() {
  if (!config.hybridSearch || !config.hybridSearch.enabled) {
    return;
  }

  console.error(chalk.blue('🔄 Updating search index...'));
  
  try {
    // ファイルパターンを取得
    const patterns = config.fileSearch?.patterns || ['**/*.{ts,js,tsx,jsx,md,txt}'];
    const excludePatterns = config.fileSearch?.excludePatterns || ['**/node_modules/**', '**/dist/**', '**/build/**'];
    
    // ファイルを検索
    const files = await glob(patterns, { 
      ignore: excludePatterns,
      cwd: PROJECT_ROOT,
      absolute: true  // 絶対パスで返すように設定
    });
    
    console.error(chalk.green('📁 Found files for indexing:'), files.length);
    console.error(chalk.gray('🔍 PROJECT_ROOT:'), PROJECT_ROOT);
    console.error(chalk.gray('📂 Sample files:'), files.slice(0, 3));
    
    // インデックス更新の進捗を追跡
    let updatedCount = 0;
    const actualMaxFiles = Math.min(files.length, 50); // 更新時は50ファイルまで
    
    for (const file of files.slice(0, actualMaxFiles)) {
      try {
        // ファイルパスの安全性チェック
        if (!file || typeof file !== 'string') {
          console.error(chalk.yellow('⚠️ Invalid file path:'), file);
          continue;
        }
        
        const content = readFileSync(file, 'utf8');
        // 絶対パスから相対パスを作成
        const docId = file.startsWith(PROJECT_ROOT) 
          ? file.substring(PROJECT_ROOT.length + 1)  // +1 for the trailing slash
          : file;
        
        // BM25インデックスに追加/更新
        if (bm25Search) {
          bm25Search.addDocument(docId, content);
        }
        
        // ベクトルインデックスに追加/更新
        if (vectorSearch) {
          vectorSearch.addDocument(docId, content);
        }
        
        updatedCount++;
        
        // 進捗表示（5ファイルごと）
        if (updatedCount % 5 === 0) {
          console.error(chalk.blue(`📊 Updated ${updatedCount}/${maxFiles} files...`));
        }
        
      } catch (error) {
        console.error(chalk.yellow(`⚠️ Failed to update ${file}:`), error.message);
      }
    }
    
    console.error(chalk.green(`✅ Index update completed! Updated ${updatedCount} files.`));
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to update index:'), error.message);
  }
}

// インデックス削除機能
function clearIndex() {
  if (!config.hybridSearch || !config.hybridSearch.enabled) {
    return;
  }

  console.error(chalk.blue('🗑️ Clearing search index...'));
  
  try {
    // BM25インデックスをクリア
    if (bm25Search) {
      bm25Search.index = {
        documents: {},
        termFrequencies: {},
        documentFrequencies: {},
        totalDocuments: 0
      };
      bm25Search.saveIndex();
    }
    
    // ベクトルインデックスをクリア
    if (vectorSearch) {
      vectorSearch.index = {
        documents: {},
        vectors: {}
      };
      vectorSearch.saveIndex();
    }
    
    console.error(chalk.green('✅ Index cleared successfully!'));
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to clear index:'), error.message);
  }
}

// ハイブリッド検索インスタンスの初期化
let bm25Search = null;
let vectorSearch = null;

// パフォーマンス監視
const performanceMonitor = {
  startTime: Date.now(),
  operationCounts: {},
  memoryUsage: process.memoryUsage(),
  operationTimes: {},
  
  recordOperation(operation, startTime = null) {
    this.operationCounts[operation] = (this.operationCounts[operation] || 0) + 1;
    
    if (startTime) {
      const duration = Date.now() - startTime;
      if (!this.operationTimes[operation]) {
        this.operationTimes[operation] = [];
      }
      this.operationTimes[operation].push(duration);
      
      // 最新10回の実行時間のみ保持
      if (this.operationTimes[operation].length > 10) {
        this.operationTimes[operation] = this.operationTimes[operation].slice(-10);
      }
    }
  },
  
  getStats() {
    const uptime = Date.now() - this.startTime;
    const currentMemory = process.memoryUsage();
    
    // 平均実行時間を計算
    const avgTimes = {};
    Object.keys(this.operationTimes).forEach(operation => {
      const times = this.operationTimes[operation];
      avgTimes[operation] = times.reduce((a, b) => a + b, 0) / times.length;
    });
    
    return {
      uptime: uptime,
      operations: this.operationCounts,
      averageTimes: avgTimes,
      memoryUsage: {
        rss: Math.round(currentMemory.rss / 1024 / 1024), // MB
        heapUsed: Math.round(currentMemory.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(currentMemory.heapTotal / 1024 / 1024), // MB
        external: Math.round(currentMemory.external / 1024 / 1024) // MB
      },
      memoryGrowth: {
        rss: Math.round((currentMemory.rss - this.memoryUsage.rss) / 1024 / 1024), // MB
        heapUsed: Math.round((currentMemory.heapUsed - this.memoryUsage.heapUsed) / 1024 / 1024) // MB
      }
    };
  },
  
  logPerformanceStats() {
    const stats = this.getStats();
    console.error(chalk.blue('📊 Performance Stats:'));
    console.error(chalk.blue(`⏱️  Uptime: ${Math.round(stats.uptime / 1000)}s`));
    console.error(chalk.blue(`💾 Memory: ${stats.memoryUsage.heapUsed}MB used / ${stats.memoryUsage.heapTotal}MB total`));
    console.error(chalk.blue(`📈 Memory Growth: +${stats.memoryGrowth.heapUsed}MB`));
    
    if (Object.keys(stats.operations).length > 0) {
      console.error(chalk.blue('🔧 Operations:'));
      Object.keys(stats.operations).forEach(op => {
        const count = stats.operations[op];
        const avgTime = stats.averageTimes[op] ? `${Math.round(stats.averageTimes[op])}ms` : 'N/A';
        console.error(chalk.blue(`  ${op}: ${count} times (avg: ${avgTime})`));
      });
    }
  }
};

if (config.hybridSearch && config.hybridSearch.enabled) {
  if (config.hybridSearch.bm25 && config.hybridSearch.bm25.enabled) {
    bm25Search = new BM25Search(config.hybridSearch.bm25.indexPath);
    console.error(chalk.green('🔍 BM25 search initialized:'), resolvePath(config.hybridSearch.bm25.indexPath));
  }
  
  if (config.hybridSearch.vector && config.hybridSearch.vector.enabled) {
    vectorSearch = new VectorSearch(config.hybridSearch.vector.indexPath);
    console.error(chalk.green('🔍 Vector search initialized:'), resolvePath(config.hybridSearch.vector.indexPath));
  }
  
  // 自動インデックス作成を実行
  createInitialIndex().catch(error => {
    console.error(chalk.red('❌ Auto index creation failed:'), error.message);
  });
}

// 最終的な統合された設定を表示
console.error(chalk.magenta('🔧 Final integrated configuration:'));
console.error(chalk.gray(JSON.stringify(config, null, 2)));

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

// メモリクリーンアップの状態管理 - 一時的にコメントアウト
/*
let memoryCleanupState = {
  lastCleanupTime: 0,
  cleanupCount: 0,
  lastMemoryUsage: 0
};
*/

// メトリクス収集の開始（メモリ最適化版）- 一時的にコメントアウト
/*
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
      
    // メモリ使用量が70%を超えた場合は緊急クリーンアップ（閾値を下げて早期対応）
    if (memoryUsage.heapUsed / memoryUsage.heapTotal > 0.70) {
      const now = Date.now();
      const timeSinceLastCleanup = now - memoryCleanupState.lastCleanupTime;
      
      // 15秒以内の連続クリーンアップは抑制（間隔を短く）
      if (timeSinceLastCleanup > 15000) {
        const beforeCleanup = {
          contextSizes: analyticsData.contextSizes.length,
          compressionRatios: analyticsData.compressionRatios.length,
          optimizationSuggestions: analyticsData.optimizationSuggestions.length,
          performanceMetrics: analyticsData.performanceMetrics.length,
          memoryUsage: memoryUsage.heapUsed
        };
        
        // より積極的なデータクリーンアップ実行（配列を大幅に削減）
        const beforeSizes = {
          contextSizes: analyticsData.contextSizes.length,
          compressionRatios: analyticsData.compressionRatios.length,
          optimizationSuggestions: analyticsData.optimizationSuggestions.length,
          performanceMetrics: analyticsData.performanceMetrics.length
        };
        
        analyticsData.contextSizes = analyticsData.contextSizes.slice(-5);
        analyticsData.compressionRatios = analyticsData.compressionRatios.slice(-5);
        analyticsData.optimizationSuggestions = analyticsData.optimizationSuggestions.slice(-5);
        analyticsData.performanceMetrics = analyticsData.performanceMetrics.slice(-5);
        
        // ガベージコレクションを強制実行（複数回）
        let gcExecuted = false;
        if (global.gc) {
          global.gc();
          global.gc(); // 2回実行でより確実に
          gcExecuted = true;
        }
        
        // キャッシュのクリア
        let cacheCleared = false;
        if (performanceCache) {
          performanceCache.flushAll();
          cacheCleared = true;
        }
        
        // グローバルコンテキスト履歴のクリア
        let contextHistoryCleared = false;
        if (global.contextHistory) {
          global.contextHistory.clear();
          contextHistoryCleared = true;
        }
        
        // 追加のメモリクリーンアップ
        if (global.gc) {
          setTimeout(() => global.gc(), 100); // 非同期で追加実行
        }
        
        // クリーンアップ後のメモリ使用量を取得
        const afterMemoryUsage = process.memoryUsage();
        
        // クリーンアップ成果の計算
        const cleanupResults = {
          contextSizesRemoved: beforeSizes.contextSizes - analyticsData.contextSizes.length,
          compressionRatiosRemoved: beforeSizes.compressionRatios - analyticsData.compressionRatios.length,
          optimizationSuggestionsRemoved: beforeSizes.optimizationSuggestions - analyticsData.optimizationSuggestions.length,
          performanceMetricsRemoved: beforeSizes.performanceMetrics - analyticsData.performanceMetrics.length,
          memoryFreed: beforeCleanup.memoryUsage - afterMemoryUsage.heapUsed,
          memoryUsageBefore: Math.round((beforeCleanup.memoryUsage / memoryUsage.heapTotal) * 100),
          memoryUsageAfter: Math.round((afterMemoryUsage.heapUsed / afterMemoryUsage.heapTotal) * 100),
          cacheCleared: cacheCleared ? 'Yes' : 'No',
          contextHistoryCleared: contextHistoryCleared ? 'Yes' : 'No',
          garbageCollectionExecuted: gcExecuted ? 'Yes' : 'No'
        };
        
        // 状態更新
        memoryCleanupState.lastCleanupTime = now;
        memoryCleanupState.cleanupCount++;
        memoryCleanupState.lastMemoryUsage = afterMemoryUsage.heapUsed;
        
        // MCP専用ログ出力（stderrのみ、通常ターミナルには表示しない）
        console.error(chalk.red('🚨 緊急メモリクリーンアップ完了 / Emergency memory cleanup completed'));
        console.error(chalk.yellow(`📊 クリーンアップ成果 / Cleanup Results:`));
        console.error(chalk.yellow(`   - Context Sizes: ${cleanupResults.contextSizesRemoved}件削除`));
        console.error(chalk.yellow(`   - Compression Ratios: ${cleanupResults.compressionRatiosRemoved}件削除`));
        console.error(chalk.yellow(`   - Optimization Suggestions: ${cleanupResults.optimizationSuggestionsRemoved}件削除`));
        console.error(chalk.yellow(`   - Performance Metrics: ${cleanupResults.performanceMetricsRemoved}件削除`));
        console.error(chalk.yellow(`   - メモリ解放: ${Math.round(cleanupResults.memoryFreed / 1024 / 1024)}MB`));
        console.error(chalk.yellow(`   - メモリ使用率: ${cleanupResults.memoryUsageBefore}% → ${cleanupResults.memoryUsageAfter}%`));
        console.error(chalk.yellow(`   - キャッシュクリア: ${cleanupResults.cacheCleared}`));
        console.error(chalk.yellow(`   - コンテキスト履歴クリア: ${cleanupResults.contextHistoryCleared}`));
        console.error(chalk.yellow(`   - ガベージコレクション: ${cleanupResults.garbageCollectionExecuted}`));
        console.error(chalk.yellow(`   - クリーンアップ回数: ${memoryCleanupState.cleanupCount}回目`));
      }
    }
  }, config.analytics.metrics.collectionInterval || 10000); // 10秒間隔に変更
}
*/


// MCP専用ログ - ファイルが実行されているかどうかを確認（stderrのみ）
if (config.logging && config.logging.enabled && config.logging.level === 'debug') {
  console.error(chalk.green('🚀 Context Optimizer MCP Server - index.js 実行開始 / Execution started'));
  console.error(chalk.blue('📅 実行時刻 / Execution time:'), new Date().toISOString());
  console.error(chalk.yellow('🔧 Node.js バージョン / Node.js version:'), process.version);
  console.error(chalk.cyan('💻 プラットフォーム / Platform:'), process.platform, process.arch);
  console.error(chalk.magenta('📁 現在のディレクトリ / Current directory:'), process.cwd());
  console.error(chalk.red('📋 コマンドライン引数 / Command line arguments:'), process.argv);
}

// 設定情報の表示（MCP専用ログ、デバッグモードのみ）
if (config.logging && config.logging.enabled && config.logging.level === 'debug') {
  console.error(chalk.blue('⚙️ 設定情報 / Config info:'), JSON.stringify(config, null, 2));
}

// パフォーマンス最適化機能の表示（デバッグモードのみ）
if (config.logging && config.logging.enabled && config.logging.level === 'debug' && config.performance && config.performance.enabled) {
  console.error(chalk.green('⚡ パフォーマンス最適化機能 / Performance optimization features:'));
  console.error(chalk.green('  - キャッシュ / Cache:'), config.performance.cache.enabled ? '有効 / Enabled' : '無効 / Disabled');
  console.error(chalk.green('  - 並列処理 / Parallel:'), config.performance.parallel.enabled ? '有効 / Enabled' : '無効 / Disabled');
  console.error(chalk.green('  - メモリ監視 / Memory:'), config.performance.memory.enabled ? '有効 / Enabled' : '無効 / Disabled');
}

// ハイブリッド検索機能の表示（デバッグモードのみ）
if (config.logging && config.logging.enabled && config.logging.level === 'debug' && config.hybridSearch && config.hybridSearch.enabled) {
  console.error(chalk.blue('🔍 ハイブリッド検索機能 / Hybrid search features:'));
  console.error(chalk.blue('  - BM25検索 / BM25 Search:'), config.hybridSearch.bm25.enabled ? '有効 / Enabled' : '無効 / Disabled');
  console.error(chalk.blue('  - ベクトル検索 / Vector Search:'), config.hybridSearch.vector.enabled ? '有効 / Enabled' : '無効 / Disabled');
  console.error(chalk.blue('  - 重み付け / Weights:'), `BM25: ${config.hybridSearch.weights.bm25}, Vector: ${config.hybridSearch.weights.vector}`);
}

// MCPサーバーのメイン処理
async function main() {
  if (config.logging && config.logging.enabled && config.logging.level === 'debug') {
    console.error(chalk.green('🚀 Context Optimizer MCP Server メイン処理開始 / Main process started'));
  }
  
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
                  version: config.server.version,
                  description: config.server.description
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
                    name: 'create_index',
                    description: '検索用のインデックスを手動で作成します',
                    inputSchema: {
                      type: 'object',
                      properties: {
                        maxFiles: { type: 'number', description: '最大インデックスファイル数（デフォルト: 100）', default: 100 },
                        force: { type: 'boolean', description: '既存のインデックスを上書きするかどうか（デフォルト: false）', default: false }
                      },
                      required: []
                    }
                  },
                  {
                    name: 'update_index',
                    description: '既存のインデックスを更新します',
                    inputSchema: {
                      type: 'object',
                      properties: {
                        maxFiles: { type: 'number', description: '最大更新ファイル数（デフォルト: 50）', default: 50 }
                      },
                      required: []
                    }
                  },
                  {
                    name: 'clear_index',
                    description: '検索インデックスをクリアします',
                    inputSchema: {
                      type: 'object',
                      properties: {},
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
            
            // ツール機能が無効化されているかチェック
            if (!config.tools || !config.tools.enabled) {
              response = {
                jsonrpc: '2.0',
                id: request.id,
                error: {
                  code: -32601,
                  message: 'Tools are disabled in configuration'
                }
              };
              break;
            }
            
            // ツール起動ログ（stderrに出力してJSONレスポンスを汚染しない）
            const toolStartTime = Date.now();
            console.error(chalk.cyan(`[TOOL] ${request.params.name} started`));
            
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
              case 'create_index':
                response = await handleCreateIndex(request);
                break;
              case 'update_index':
                response = await handleUpdateIndex(request);
                break;
              case 'clear_index':
                response = await handleClearIndex(request);
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
            
            // ツール成果ログ
            const toolEndTime = Date.now();
            const executionTime = toolEndTime - toolStartTime;
            
            if (response.result) {
              // 成功時の成果ログ
              const result = response.result;
              let resultsLog = '';
              
              switch (request.params.name) {
                case 'get_context_pack':
                  resultsLog = `Found ${result.files?.length || 0} relevant files, ${result.functions?.length || 0} functions`;
                  break;
                case 'extract_function':
                  resultsLog = `Extracted ${result.functions?.length || 0} functions, ${result.classes?.length || 0} classes`;
                  break;
                case 'search_symbols':
                  resultsLog = `Found ${result.symbols?.length || 0} symbols across ${result.files?.length || 0} files`;
                  break;
                case 'rollup_chat':
                  resultsLog = `Summarized ${result.originalLength || 0} chars to ${result.summarizedLength || 0} chars (${result.compressionRatio || 0}% reduction)`;
                  break;
                case 'search_files':
                  resultsLog = `Found ${result.files?.length || 0} files matching pattern`;
                  break;
                case 'read_file_content':
                  resultsLog = `Read ${result.lines?.length || 0} lines from ${result.filePath || 'file'}`;
                  break;
                case 'parse_ast':
                  resultsLog = `Parsed AST: ${result.functions?.length || 0} functions, ${result.variables?.length || 0} variables, ${result.imports?.length || 0} imports`;
                  break;
                case 'analyze_git_diff':
                  resultsLog = `Analyzed ${result.commits?.length || 0} commits, ${result.filesChanged || 0} files changed`;
                  break;
                case 'optimize_performance':
                  resultsLog = `Performance optimized: ${result.cacheHitRate || 0}% cache hit rate, ${result.memorySaved || 0}MB memory saved`;
                  break;
                case 'create_index':
                  resultsLog = `Index created: ${result.indexedFiles || 0} files indexed`;
                  break;
                case 'update_index':
                  resultsLog = `Index updated: ${result.updatedFiles || 0} files updated`;
                  break;
                case 'clear_index':
                  resultsLog = `Index cleared: ${result.clearedIndexes || 0} indexes cleared`;
                  break;
                case 'hybrid_search':
                  resultsLog = `Hybrid search: ${result.results?.length || 0} results found with ${result.bm25Score || 0} BM25 score`;
                  break;
                case 'monitor_context_size':
                  resultsLog = `Context size: ${result.currentSize || 0} chars (${result.status || 'normal'})`;
                  break;
                case 'auto_compress_context':
                  resultsLog = `Compressed from ${result.originalSize || 0} to ${result.compressedSize || 0} chars (${result.compressionRatio || 0}% reduction)`;
                  break;
                case 'suggest_context_optimization':
                  resultsLog = `Generated ${result.suggestions?.length || 0} optimization suggestions, potential ${result.potentialSavings || 0}% savings`;
                  break;
                case 'manage_context_history':
                  resultsLog = `History ${result.action || 'processed'}: ${result.entries?.length || 0} entries managed`;
                  break;
                case 'get_context_analytics':
                  resultsLog = `Analytics: ${result.totalOperations || 0} operations, ${result.avgEfficiency || 0}% efficiency score`;
                  break;
                case 'get_efficiency_dashboard':
                  resultsLog = `Dashboard: ${result.efficiencyScore || 0}% efficiency, ${result.memoryUsage || 0}MB memory usage`;
                  break;
                case 'generate_performance_report':
                  resultsLog = `Report generated: ${result.reportType || 'summary'} report with ${result.recommendations?.length || 0} recommendations`;
                  break;
                default:
                  resultsLog = `Tool executed successfully`;
              }
              
              console.error(chalk.green(`[TOOL] ${request.params.name} Results: ${resultsLog} (${executionTime}ms)`));
            } else if (response.error) {
              // エラー時のログ（stderrに出力してJSONレスポンスを汚染しない）
              console.error(chalk.red(`[TOOL] ${request.params.name} Error: ${response.error.message} (${executionTime}ms)`));
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
  // 最初のコマンドが呼ばれた時点でプロジェクト配下の設定ファイルを読み込む
  ensureConfigLoaded();
  
  // ツール呼び出しリクエストの詳細ログ出力
  console.error(chalk.magenta('🔍 Tool call request details:'));
  console.error(chalk.cyan('  Request ID:'), request.id);
  console.error(chalk.cyan('  Method:'), request.method);
  console.error(chalk.cyan('  Params:'), JSON.stringify(request.params, null, 2));
  
  if (request.meta) {
    console.error(chalk.cyan('  Meta:'), JSON.stringify(request.meta, null, 2));
  }
  
  if (request.context) {
    console.error(chalk.cyan('  Context:'), JSON.stringify(request.context, null, 2));
  }
  
  // ツール呼び出し時の作業ディレクトリと環境変数を確認
  console.error(chalk.blue('🔍 Tool call context:'));
  console.error(chalk.cyan('  Current working directory:'), process.cwd());
  console.error(chalk.cyan('  Environment variables:'));
  Object.keys(process.env).forEach(key => {
    if (key.includes('PATH') || key.includes('ROOT') || key.includes('DIR') || 
        key.includes('WORKSPACE') || key.includes('PROJECT') || key.includes('CURSOR')) {
      const value = process.env[key];
      if (value && value.includes('/')) {
        console.error(chalk.gray(`    ${key}:`), value);
      }
    }
  });
  
  // ツール呼び出し時に渡される情報からプロジェクト情報を検出
  console.error(chalk.blue('🔍 Project detection from tool call:'));
  
  // 1. リクエストパラメータからプロジェクト情報を検出
  if (request.params && request.params.arguments) {
    const args = request.params.arguments;
    if (args.projectRoot || args.projectPath || args.workspaceRoot) {
      console.error(chalk.green('  ✅ Project root found in request params:'));
      console.error(chalk.gray('    projectRoot:'), args.projectRoot);
      console.error(chalk.gray('    projectPath:'), args.projectPath);
      console.error(chalk.gray('    workspaceRoot:'), args.workspaceRoot);
    }
  }
  
  // 2. メタデータからプロジェクト情報を検出
  if (request.meta) {
    if (request.meta.projectRoot || request.meta.projectPath || request.meta.workspaceRoot) {
      console.error(chalk.green('  ✅ Project root found in request meta:'));
      console.error(chalk.gray('    projectRoot:'), request.meta.projectRoot);
      console.error(chalk.gray('    projectPath:'), request.meta.projectPath);
      console.error(chalk.gray('    workspaceRoot:'), request.meta.workspaceRoot);
    }
  }
  
  // 3. コンテキストからプロジェクト情報を検出
  if (request.context) {
    if (request.context.projectRoot || request.context.projectPath || request.context.workspaceRoot) {
      console.error(chalk.green('  ✅ Project root found in request context:'));
      console.error(chalk.gray('    projectRoot:'), request.context.projectRoot);
      console.error(chalk.gray('    projectPath:'), request.context.projectPath);
      console.error(chalk.gray('    workspaceRoot:'), request.context.workspaceRoot);
    }
  }
  
  // 4. 現在の作業ディレクトリがプロジェクトルートかどうか確認
  const currentCwd = process.cwd();
  if (isValidProjectRoot(currentCwd)) {
    console.error(chalk.green('  ✅ Current working directory is a valid project root:'), currentCwd);
  } else {
    console.error(chalk.yellow('  ⚠️  Current working directory is not a valid project root:'), currentCwd);
  }
  
  console.error(chalk.blue('🔍 get_context_pack 実行中 / Executing get_context_pack:'), request.params.arguments.query);
  
  try {
    // ファイル検索機能が無効化されているかチェック
    if (!config.fileSearch || !config.fileSearch.enabled) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: 'File search is disabled in configuration'
        }
      };
    }
    
    const query = request.params.arguments.query;
    // 設定ファイルから除外パターンを取得（全ファイルを対象にする）
    const excludePatterns = config.fileSearch?.excludePatterns || ['**/node_modules/**', '**/dist/**', '**/build/**'];
    const maxResults = config.tools?.maxResults || 10;
    
    // プロジェクトルートを基準にファイル検索
    console.error(chalk.blue('🔍 Searching in project root:'), PROJECT_ROOT);
    
    const files = await glob('**/*', { 
      ignore: excludePatterns,
      cwd: PROJECT_ROOT,
      absolute: true  // 絶対パスで返すように設定
    });
    
    console.error(chalk.green('📁 Found files:'), files.length);
    
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify({
            query: query,
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

async function handleExtractFunction(request) {
  console.error(chalk.blue('🔍 extract_function 実行中 / Executing extract_function:'), request.params.arguments.name);
  
  try {
    // ファイル検索機能が無効化されているかチェック
    if (!config.fileSearch || !config.fileSearch.enabled) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: 'File search is disabled in configuration'
        }
      };
    }
    
    const name = request.params.arguments.name;
    // 設定ファイルから除外パターンを取得（全ファイルを対象にする）
    const excludePatterns = config.fileSearch?.excludePatterns || ['**/node_modules/**', '**/dist/**', '**/build/**'];
    const maxResults = config.tools?.maxResults || 10;
    
    console.error(chalk.blue('🔍 Extract function search in:'), PROJECT_ROOT);
    
    const files = await glob('**/*', { 
      ignore: excludePatterns,
      cwd: PROJECT_ROOT,
      absolute: true  // 絶対パスで返すように設定
    });
    
    console.error(chalk.green('📁 Found files:'), files.length);
    
    let found = false;
    let content = '';
    
    for (const file of files.slice(0, maxResults)) {
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
    // ファイル検索機能が無効化されているかチェック
    if (!config.fileSearch || !config.fileSearch.enabled) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: 'File search is disabled in configuration'
        }
      };
    }
    
    const query = request.params.arguments.query;
    // 設定ファイルから除外パターンを取得（全ファイルを対象にする）
    const excludePatterns = config.fileSearch?.excludePatterns || ['**/node_modules/**', '**/dist/**', '**/build/**'];
    const maxResults = config.tools?.maxResults || 10;
    
    console.error(chalk.blue('🔍 Search symbols in:'), PROJECT_ROOT);
    
    const files = await glob('**/*', { 
      ignore: excludePatterns,
      cwd: PROJECT_ROOT,
      absolute: true  // 絶対パスで返すように設定
    });
    
    console.error(chalk.green('📁 Found files:'), files.length);
    
    const results = [];
    for (const file of files.slice(0, maxResults)) {
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
    // ファイル検索機能が無効化されているかチェック
    if (!config.fileSearch || !config.fileSearch.enabled) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: 'File search is disabled in configuration'
        }
      };
    }
    
    const pattern = request.params.arguments.pattern;
    const maxResults = request.params.arguments.maxResults || 20;
    
    // 設定ファイルから除外パターンを取得
    const excludePatterns = config.fileSearch?.excludePatterns || ['**/node_modules/**', '**/dist/**', '**/build/**'];
    
    // プロジェクトルートを基準にファイル検索
    console.error(chalk.blue('🔍 Searching pattern:'), pattern, 'in:', PROJECT_ROOT);
    
    const files = await glob(pattern, { 
      ignore: excludePatterns,
      cwd: PROJECT_ROOT,
      absolute: true  // 絶対パスで返すように設定
    });
    
    console.error(chalk.green('📁 Found files:'), files.length);
    
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
    
    // ファイルサイズチェック
    const stats = statSync(filePath);
    const maxFileSize = config.fileContent?.maxFileSize || 100000;
    
    if (stats.size > maxFileSize) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32602,
          message: `File too large: ${filePath} (${stats.size} bytes > ${maxFileSize} bytes)`
        }
      };
    }
    
    // 拡張子チェック（除外拡張子のみチェック）
    const fileExt = extname(filePath);
    const excludeExtensions = config.fileContent?.excludeExtensions || ['.exe', '.dll', '.so', '.dylib', '.bin', '.img', '.iso', '.zip', '.tar', '.gz', '.rar', '.7z', '.mp4', '.avi', '.mov', '.mp3', '.wav', '.flac', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.otf'];
    
    if (excludeExtensions.includes(fileExt)) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32602,
          message: `Excluded file extension: ${fileExt}. Excluded extensions: ${excludeExtensions.join(', ')}`
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
    // AST解析機能が無効化されているかチェック
    if (!config.astParsing || !config.astParsing.enabled) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: 'AST parsing is disabled in configuration'
        }
      };
    }
    
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
    
    // ファイル拡張子に応じて適切なパーサーを選択
    let ast;
    
    if (ext === '.ts' || ext === '.tsx') {
      // TypeScriptファイルの解析
      try {
        // TypeScript用のパーサー設定を修正（最初からTypeScriptパーサーを使用）
        ast = parse(parseContent, {
          ecmaVersion: 2022,
          sourceType: 'module',
          loc: includeLocations,
          range: includeLocations,
          allowHashBang: true,
          allowImportExportEverywhere: true,
          allowAwaitOutsideFunction: true,
          allowReturnOutsideFunction: true,
          allowSuperOutsideMethod: true,
          allowUndeclaredExports: true,
          parserOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            ecmaFeatures: {
              jsx: ext === '.tsx',
              globalReturn: true,
              impliedStrict: false
            },
            project: undefined, // プロジェクト設定を無効化
            createDefaultProgram: true, // デフォルトプログラムを作成
            jsxPragma: 'React', // JSXプラグマを明示的に設定
            jsxFragmentName: 'Fragment', // Fragment名を設定
            useJSXTextNode: true, // JSXテキストノードを使用
            allowJs: true, // JavaScriptファイルも許可
            skipLibCheck: true // ライブラリチェックをスキップ
          },
          plugins: [
            'typescript',
            ext === '.tsx' ? 'jsx' : null
          ].filter(Boolean)
        });
        console.error(chalk.green('✅ TypeScriptファイルをTypeScriptパーサーで解析成功'));
      } catch (tsError) {
        // TypeScript解析に失敗した場合はJavaScriptとして解析を試行
        console.error(chalk.yellow('⚠️ TypeScript解析に失敗、JavaScriptとして解析を試行:'), tsError.message);
        console.error(chalk.gray('📁 ファイル:'), filePath);
        console.error(chalk.gray('🔍 エラー詳細:'), tsError);
        
        try {
          // TypeScript構文を簡略化してJavaScriptとして解析
          let simplifiedContent = parseContent;
          
          // 基本的なTypeScript構文を除去
          simplifiedContent = simplifiedContent
            .replace(/:\s*[A-Za-z_$][A-Za-z0-9_$<>\[\]|,\s]*/g, '') // 型注釈を除去
            .replace(/<[A-Za-z_$][A-Za-z0-9_$<>\[\]|,\s]*>/g, '') // ジェネリクスを除去
            .replace(/as\s+[A-Za-z_$][A-Za-z0-9_$<>\[\]|,\s]*/g, '') // as キャストを除去
            .replace(/interface\s+[A-Za-z_$][A-Za-z0-9_$]*\s*{[^}]*}/g, '') // interfaceを除去
            .replace(/type\s+[A-Za-z_$][A-Za-z0-9_$]*\s*=[^;]+;/g, '') // typeを除去
            .replace(/enum\s+[A-Za-z_$][A-Za-z0-9_$]*\s*{[^}]*}/g, ''); // enumを除去
          
          const parser = Parser.extend(jsx());
          ast = parser.parse(simplifiedContent, {
            ecmaVersion: 2022,
            sourceType: 'module',
            locations: includeLocations,
            ranges: includeLocations,
            allowHashBang: true,
            allowImportExportEverywhere: true,
            allowAwaitOutsideFunction: true,
            allowReturnOutsideFunction: true,
            allowSuperOutsideMethod: true,
            allowUndeclaredExports: true,
            plugins: {
              jsx: ext === '.tsx'
            },
            jsx: ext === '.tsx' // JSXサポートを明示的に有効化
          });
          console.error(chalk.green('✅ TypeScriptファイルを簡略化してJavaScriptとして解析成功'));
        } catch (jsError) {
          console.error(chalk.red('❌ JavaScript解析も失敗:'), jsError.message);
          throw new Error(`Both TypeScript and JavaScript parsing failed: ${jsError.message}`);
        }
      }
    } else {
      // JavaScript/JSXファイルの解析
      try {
        const parser = Parser.extend(jsx());
        ast = parser.parse(parseContent, {
          ecmaVersion: 2022,
          sourceType: 'module',
          locations: includeLocations,
          ranges: includeLocations,
          allowHashBang: true,
          allowImportExportEverywhere: true,
          allowAwaitOutsideFunction: true,
          allowReturnOutsideFunction: true,
          allowSuperOutsideMethod: true,
          allowUndeclaredExports: true,
          plugins: {
            jsx: ext === '.jsx'
          }
        });
      } catch (jsError) {
        console.error(chalk.red('❌ JavaScript解析に失敗:'), jsError.message);
        throw new Error(`JavaScript parsing failed: ${jsError.message}`);
      }
    }
    
    const astStats = {
      functions: 0,
      variables: 0,
      classes: 0,
      imports: 0,
      exports: 0
    };
    
    function analyzeNode(node) {
      // null チェックを追加
      if (!node || typeof node !== 'object') {
        return;
      }
      
      // 関数の解析
      if (node.type === 'FunctionDeclaration') astStats.functions++;
      if (node.type === 'FunctionExpression') astStats.functions++;
      if (node.type === 'ArrowFunctionExpression') astStats.functions++;
      
      // 変数の解析
      if (node.type === 'VariableDeclaration') astStats.variables++;
      if (node.type === 'VariableDeclarator') astStats.variables++;
      
      // クラスの解析
      if (node.type === 'ClassDeclaration') astStats.classes++;
      if (node.type === 'ClassExpression') astStats.classes++;
      
      // インポート/エクスポートの解析
      if (node.type === 'ImportDeclaration') astStats.imports++;
      if (node.type === 'ExportNamedDeclaration') astStats.exports++;
      if (node.type === 'ExportDefaultDeclaration') astStats.exports++;
      if (node.type === 'ExportAllDeclaration') astStats.exports++;
      
      // TypeScriptの解析
      if (node.type === 'TSInterfaceDeclaration') astStats.classes++;
      if (node.type === 'TSTypeAliasDeclaration') astStats.variables++;
      if (node.type === 'TSEnumDeclaration') astStats.classes++;
      if (node.type === 'TSModuleDeclaration') astStats.classes++;
      
      // JSXの解析
      if (node.type === 'JSXElement') astStats.functions++;
      if (node.type === 'JSXFragment') astStats.functions++;
      
      // 子ノードの再帰的解析（安全な方法で）
      for (const key in node) {
        try {
          const value = node[key];
          if (value && typeof value === 'object') {
            if (Array.isArray(value)) {
              value.forEach(childNode => {
                if (childNode && typeof childNode === 'object') {
                  analyzeNode(childNode);
                }
              });
            } else if (value.type) {
              analyzeNode(value);
            }
          }
        } catch (error) {
          // 個別のノード解析エラーは無視して続行
          console.error(chalk.yellow('⚠️ Node analysis warning:'), error.message);
        }
      }
    }
    
    try {
      // ASTが有効かチェック
      if (!ast || typeof ast !== 'object') {
        throw new Error('Invalid AST structure');
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
    } catch (parseError) {
      console.error(chalk.red('❌ AST解析エラー / AST parsing error:'), parseError.message);
      
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          content: [{
            type: 'text',
            text: JSON.stringify({
              filePath: filePath,
              error: parseError.message,
              errorType: parseError.name,
              statistics: astStats,
              timestamp: new Date().toISOString()
            }, null, 2)
          }]
        }
      };
    }
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
    // Git差分解析機能が無効化されているかチェック
    if (!config.gitDiff || !config.gitDiff.enabled) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: 'Git diff analysis is disabled in configuration'
        }
      };
    }
    
    const maxCommits = request.params.arguments.maxCommits || 10;
    const includeStats = request.params.arguments.includeStats !== false;
    const format = request.params.arguments.format || 'unified';
    
    // プロジェクトルートでGitを実行
    console.error(chalk.blue('🔍 Git analysis in project root:'), PROJECT_ROOT);
    const git = simpleGit(PROJECT_ROOT);
    
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

async function handleCreateIndex(request) {
  console.error(chalk.blue('🔍 create_index 実行中 / Executing create_index'));
  
  try {
    const maxFiles = request.params.arguments.maxFiles || 100;
    const force = request.params.arguments.force || false;
    
    if (!config.hybridSearch || !config.hybridSearch.enabled) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: 'Hybrid search is disabled in configuration'
        }
      };
    }
    
    // 強制作成でない場合は既存のインデックスをチェック
    if (!force) {
      const bm25Empty = !bm25Search || Object.keys(bm25Search.index.documents).length === 0;
      const vectorEmpty = !vectorSearch || Object.keys(vectorSearch.index.documents).length === 0;
      
      if (!bm25Empty || !vectorEmpty) {
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            content: [{
              type: 'text',
              text: JSON.stringify({
                message: 'Index already exists. Use force: true to overwrite.',
                bm25Documents: bm25Search ? Object.keys(bm25Search.index.documents).length : 0,
                vectorDocuments: vectorSearch ? Object.keys(vectorSearch.index.documents).length : 0,
                timestamp: new Date().toISOString()
              }, null, 2)
            }]
          }
        };
      }
    }
    
    console.error(chalk.blue('🚀 Creating index manually...'));
    
    // ファイルパターンを取得
    const patterns = config.fileSearch?.patterns || ['**/*.{ts,js,tsx,jsx,md,txt}'];
    const excludePatterns = config.fileSearch?.excludePatterns || ['**/node_modules/**', '**/dist/**', '**/build/**'];
    
    // ファイルを検索
    const files = await glob(patterns, { 
      ignore: excludePatterns,
      cwd: PROJECT_ROOT,
      absolute: true  // 絶対パスで返すように設定
    });
    
    console.error(chalk.green('📁 Found files for indexing:'), files.length);
    console.error(chalk.gray('🔍 PROJECT_ROOT:'), PROJECT_ROOT);
    console.error(chalk.gray('📂 Sample files:'), files.slice(0, 3));
    
    // インデックス作成の進捗を追跡
    let indexedCount = 0;
    const actualMaxFiles = Math.min(files.length, maxFiles);
    
    for (const file of files.slice(0, actualMaxFiles)) {
      try {
        // ファイルパスの安全性チェック
        if (!file || typeof file !== 'string') {
          console.error(chalk.yellow('⚠️ Invalid file path:'), file);
          continue;
        }
        
        const content = readFileSync(file, 'utf8');
        // 絶対パスから相対パスを作成
        const docId = file.startsWith(PROJECT_ROOT) 
          ? file.substring(PROJECT_ROOT.length + 1)  // +1 for the trailing slash
          : file;
        
        // BM25インデックスに追加
        if (bm25Search) {
          bm25Search.addDocument(docId, content);
        }
        
        // ベクトルインデックスに追加
        if (vectorSearch) {
          vectorSearch.addDocument(docId, content);
        }
        
        indexedCount++;
        
        // 進捗表示（10ファイルごと）
        if (indexedCount % 10 === 0) {
          console.error(chalk.blue(`📊 Indexed ${indexedCount}/${actualMaxFiles} files...`));
        }
        
      } catch (error) {
        console.error(chalk.yellow(`⚠️ Failed to index ${file}:`), error.message);
      }
    }
    
    const result = {
      indexedFiles: indexedCount,
      totalFiles: files.length,
      maxFiles: actualMaxFiles,
      bm25Enabled: config.hybridSearch.bm25?.enabled || false,
      vectorEnabled: config.hybridSearch.vector?.enabled || false,
      timestamp: new Date().toISOString()
    };
    
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

async function handleUpdateIndex(request) {
  console.error(chalk.blue('🔍 update_index 実行中 / Executing update_index'));
  
  try {
    const maxFiles = request.params.arguments.maxFiles || 50;
    
    if (!config.hybridSearch || !config.hybridSearch.enabled) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: 'Hybrid search is disabled in configuration'
        }
      };
    }
    
    await updateIndex();
    
    const result = {
      updatedFiles: maxFiles,
      bm25Enabled: config.hybridSearch.bm25?.enabled || false,
      vectorEnabled: config.hybridSearch.vector?.enabled || false,
      timestamp: new Date().toISOString()
    };
    
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

async function handleClearIndex(request) {
  console.error(chalk.blue('🔍 clear_index 実行中 / Executing clear_index'));
  
  try {
    if (!config.hybridSearch || !config.hybridSearch.enabled) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: 'Hybrid search is disabled in configuration'
        }
      };
    }
    
    clearIndex();
    
    const result = {
      clearedIndexes: 2, // BM25とVector
      bm25Enabled: config.hybridSearch.bm25?.enabled || false,
      vectorEnabled: config.hybridSearch.vector?.enabled || false,
      timestamp: new Date().toISOString()
    };
    
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

async function handleHybridSearch(request) {
  const startTime = Date.now();
  performanceMonitor.recordOperation('hybrid_search', startTime);
  
  console.error(chalk.blue('🔍 hybrid_search 実行中 / Executing hybrid_search:'), request.params.arguments.query);
  
  try {
    // ハイブリッド検索機能が無効化されているかチェック
    if (!config.hybridSearch || !config.hybridSearch.enabled) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: 'Hybrid search is disabled in configuration'
        }
      };
    }
    
    const query = request.params.arguments.query;
    const maxResults = request.params.arguments.maxResults || 10;
    const includeContent = request.params.arguments.includeContent !== false;
    
    console.error(chalk.blue('🔍 Hybrid search query:'), query);
    
    // インデックスが空の場合は自動でインデックスを作成
    const bm25Empty = !bm25Search || Object.keys(bm25Search.index.documents).length === 0;
    const vectorEmpty = !vectorSearch || Object.keys(vectorSearch.index.documents).length === 0;
    
    if (bm25Empty || vectorEmpty) {
      console.error(chalk.blue('🔄 Index is empty, creating index automatically...'));
      await updateIndex();
    }
    
    // ハイブリッド検索の実行
    const results = [];
    
    // BM25検索
    if (bm25Search && config.hybridSearch.bm25.enabled) {
      const bm25Results = bm25Search.search(query, config.hybridSearch.bm25.k1, config.hybridSearch.bm25.b);
      console.error(chalk.green('🔍 BM25 results:'), bm25Results.length);
      
      bm25Results.forEach(result => {
        results.push({
          file: result.docId,
          score: result.score * config.hybridSearch.weights.bm25,
          method: 'BM25',
          content: includeContent ? result.content.substring(0, 200) + '...' : undefined
        });
      });
    }
    
    // ベクトル検索
    if (vectorSearch && config.hybridSearch.vector.enabled) {
      const vectorResults = vectorSearch.search(query, config.hybridSearch.vector.similarityThreshold);
      console.error(chalk.green('🔍 Vector results:'), vectorResults.length);
      
      vectorResults.forEach(result => {
        results.push({
          file: result.docId,
          score: result.score * config.hybridSearch.weights.vector,
          method: 'Vector',
          content: includeContent ? result.content.substring(0, 200) + '...' : undefined
        });
      });
    }
    
    // 結果を統合してスコアでソート
    const combinedResults = {};
    results.forEach(result => {
      if (!combinedResults[result.file]) {
        combinedResults[result.file] = {
          file: result.file,
          score: 0,
          methods: [],
          content: result.content
        };
      }
      combinedResults[result.file].score += result.score;
      combinedResults[result.file].methods.push(result.method);
    });
    
    const finalResults = Object.values(combinedResults)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
    
    console.error(chalk.green('📊 Final hybrid search results:'), finalResults.length);
    
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify({
            query: query,
            results: finalResults,
            totalResults: finalResults.length,
            bm25Enabled: config.hybridSearch.bm25.enabled,
            vectorEnabled: config.hybridSearch.vector.enabled,
            bm25Weight: config.hybridSearch.weights.bm25,
            vectorWeight: config.hybridSearch.weights.vector,
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
    // コンテキスト管理機能が無効化されているかチェック
    if (!config.contextManagement || !config.contextManagement.enabled) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: 'Context management is disabled in configuration'
        }
      };
    }
    
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
    // コンテキスト管理機能が無効化されているかチェック
    if (!config.contextManagement || !config.contextManagement.enabled) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: 'Context management is disabled in configuration'
        }
      };
    }
    
    const context = request.params.arguments.context;
    const algorithm = request.params.arguments.algorithm || 'summarization';
    const compressionRatio = request.params.arguments.compressionRatio || 0.7;
    
    const originalSize = Buffer.byteLength(context, 'utf8');
    let compressedContext = '';
    let compressionMethod = '';
    
    // 言語自動検出
    const detectedLanguage = detectLanguage(context);
    console.error(`[DEBUG] 検出された言語=${detectedLanguage}`);
    
    switch (algorithm) {
      case 'summarization':
        // 多言語対応の要約アルゴリズム
        const summarySentences = splitByLanguage(context, detectedLanguage);
        const importantSentences = [];
        const seenSentences = new Set();
        
        // デバッグ情報
        console.error(`[DEBUG] 元の文数=${summarySentences.length}`);
        
        // 言語別重要キーワード
        const importantKeywords = getImportantKeywords(detectedLanguage);
        
        for (const sentence of summarySentences) {
          const trimmed = sentence.trim();
          if (trimmed.length === 0) continue;
          
          // 重複文をスキップ
          if (seenSentences.has(trimmed)) continue;
          seenSentences.add(trimmed);
          
          // 重要度スコア計算
          let importanceScore = 0;
          
          // 1. 文の長さスコア（長い文ほど重要）
          if (trimmed.length > 50) importanceScore += 3;
          else if (trimmed.length > 30) importanceScore += 2;
          else if (trimmed.length > 15) importanceScore += 1;
          
          // 2. キーワード含有スコア
          const keywordCount = importantKeywords.filter(keyword => 
            trimmed.toLowerCase().includes(keyword.toLowerCase())
          ).length;
          importanceScore += keywordCount * 2;
          
          // 3. 技術用語スコア
          if (trimmed.includes('MCP') || trimmed.includes('Cursor') || trimmed.includes('AST')) {
            importanceScore += 3;
          }
          
          // 4. 動詞・形容詞スコア
          if (trimmed.includes('する') || trimmed.includes('なる') || trimmed.includes('提供') || 
              trimmed.includes('生成') || trimmed.includes('実行') || trimmed.includes('分析')) {
            importanceScore += 1;
          }
          
          // 重要度が閾値以上の文を抽出
          if (importanceScore >= 2) {
            importantSentences.push({
              sentence: trimmed,
              score: importanceScore
            });
          }
        }
        
        // デバッグ情報
        console.error(`[DEBUG] 重要文数=${importantSentences.length}`);
        
        // フォールバック：重要文が少なすぎる場合
        if (importantSentences.length < 3) {
          console.error(`[DEBUG] 重要文不足、フォールバック実行`);
          importantSentences.length = 0;
          for (const sentence of summarySentences) {
            const trimmed = sentence.trim();
            if (trimmed.length > 10) {
              importantSentences.push({
                sentence: trimmed,
                score: 1
              });
            }
          }
        }
        
        // スコア順でソート
        importantSentences.sort((a, b) => b.score - a.score);
        
        // 圧縮率に応じて文数を制限
        const maxSentences = Math.floor(importantSentences.length * compressionRatio);
        const selectedSentences = importantSentences.slice(0, maxSentences);
        compressedContext = selectedSentences.map(s => s.sentence).join('。') + '。';
        
        // デバッグ情報
        console.error(`[DEBUG] 最終文数=${selectedSentences.length}, 圧縮後=${maxSentences}`);
        console.error(`[DEBUG] 抽出された文=${selectedSentences.slice(0, 3).map(s => s.sentence).join(' | ')}`);
        
        compressionMethod = '重要文の抽出（日本語対応版）';
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
        // 多言語対応のキーワード抽出
        const keywordSentences = splitByLanguage(context, detectedLanguage);
        const allWords = [];
        
        // 各文から単語を抽出
        keywordSentences.forEach(sentence => {
          if (sentence.trim().length > 0) {
            const words = sentence.trim().split(/\s+/);
            allWords.push(...words);
          }
        });
        
        // デバッグ情報
        console.error(`[DEBUG] 元の単語数=${allWords.length}`);
        
        // 言語別ストップワード
        const stopWords = getStopWords(detectedLanguage);
        
        // キーワード抽出（より緩い条件）
        let keywords = allWords.filter(word => {
          const cleanWord = word.replace(/[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '');
          return cleanWord.length >= 2 && !stopWords.has(cleanWord);
        });
        
        // デバッグ情報
        console.error(`[DEBUG] フィルタ後単語数=${keywords.length}`);
        
        // フォールバック：キーワードが少なすぎる場合
        if (keywords.length < 5) {
          console.error(`[DEBUG] キーワード不足、フォールバック実行`);
          keywords = allWords.filter(word => {
            const cleanWord = word.replace(/[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '');
            return cleanWord.length >= 2;
          });
        }
        
        // 重複を除去
        const uniqueKeywords = [...new Set(keywords)];
        const maxKeywords = Math.floor(uniqueKeywords.length * compressionRatio);
        compressedContext = uniqueKeywords.slice(0, maxKeywords).join(' ');
        
        // デバッグ情報
        console.error(`[DEBUG] 最終キーワード数=${uniqueKeywords.length}, 圧縮後=${maxKeywords}`);
        console.error(`[DEBUG] 抽出されたキーワード=${uniqueKeywords.slice(0, 10).join(', ')}`);
        
        compressionMethod = 'キーワード抽出（超改良版）';
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
    // コンテキスト管理機能が無効化されているかチェック
    if (!config.contextManagement || !config.contextManagement.enabled) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: 'Context management is disabled in configuration'
        }
      };
    }
    
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
    // コンテキスト管理機能が無効化されているかチェック
    if (!config.contextManagement || !config.contextManagement.enabled) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: 'Context management is disabled in configuration'
        }
      };
    }
    
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

// 多言語対応ヘルパー関数
function detectLanguage(text) {
  const sample = text.substring(0, 1000); // 最初の1000文字で判定
  
  // 文字コードパターンで言語判定（改良版）
  const patterns = {
    'japanese': /[\u3040-\u309F\u30A0-\u30FF]/g, // ひらがな・カタカナ
    'chinese': /[\u4E00-\u9FFF]/g, // 漢字
    'korean': /[\uAC00-\uD7AF]/g, // ハングル
    'arabic': /[\u0600-\u06FF]/g, // アラビア文字
    'cyrillic': /[\u0400-\u04FF]/g, // キリル文字
    'latin': /[a-zA-Z]/g // ラテン文字
  };
  
  const scores = {};
  for (const [lang, pattern] of Object.entries(patterns)) {
    scores[lang] = (sample.match(pattern) || []).length;
  }
  
  // 日本語の特別判定（ひらがな・カタカナがある場合は日本語優先）
  if (scores.japanese > 0) {
    return 'japanese';
  }
  
  // 韓国語の特別判定（ハングルがある場合は韓国語優先）
  if (scores.korean > 0) {
    return 'korean';
  }
  
  // 中国語の特別判定（漢字のみの場合は中国語）
  if (scores.chinese > 0 && scores.japanese === 0 && scores.korean === 0) {
    return 'chinese';
  }
  
  // 英語の特別判定（ラテン文字のみの場合は英語）
  if (scores.latin > 0 && scores.chinese === 0 && scores.japanese === 0 && scores.korean === 0) {
    return 'english';
  }
  
  // 最も多い文字コードの言語を選択
  const detectedLang = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
  
  // デフォルトは英語
  return scores[detectedLang] > 0 ? detectedLang : 'english';
}

function splitByLanguage(text, language) {
  const splitPatterns = {
    'japanese': /[。、！？\n]/,
    'chinese': /[。，！？\n]/,
    'korean': /[。，！？\n]/,
    'arabic': /[.،!؟\n]/,
    'cyrillic': /[.，!？\n]/,
    'latin': /[.!?,\n]/,
    'english': /[.!?,\n]/
  };
  
  const pattern = splitPatterns[language] || splitPatterns['english'];
  return text.split(pattern);
}

function getStopWords(language) {
  const stopWordsDict = {
    'japanese': ['は', 'が', 'を', 'に', 'で', 'と', 'の', 'も', 'から', 'まで', 'より'],
    'chinese': ['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这'],
    'korean': ['은', '는', '이', '가', '을', '를', '에', '에서', '로', '으로', '와', '과', '의', '도', '만', '부터', '까지', '보다', '처럼', '같이'],
    'arabic': ['في', 'من', 'إلى', 'على', 'أن', 'هذا', 'هذه', 'التي', 'الذي', 'كان', 'يكون', 'له', 'لها', 'لهما', 'لهم', 'لهن'],
    'cyrillic': ['в', 'на', 'с', 'по', 'для', 'от', 'до', 'из', 'к', 'у', 'о', 'об', 'за', 'при', 'через', 'между', 'над', 'под'],
    'latin': ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'al', 'del', 'los', 'las'],
    'english': ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once']
  };
  
  return new Set(stopWordsDict[language] || stopWordsDict['english']);
}

function getImportantKeywords(language) {
  const keywordsDict = {
    'japanese': [
      'プロジェクト', '機能', 'システム', '開発', '設計', '実装', '最適化', 'パフォーマンス',
      'コンテキスト', '管理', '分析', '監視', '圧縮', '提案', '履歴', '効率性',
      'MCP', 'サーバー', 'Cursor', 'ファイル', '検索', '解析', '差分', 'ハイブリッド'
    ],
    'chinese': [
      '项目', '功能', '系统', '开发', '设计', '实现', '优化', '性能',
      '上下文', '管理', '分析', '监控', '压缩', '建议', '历史', '效率',
      'MCP', '服务器', 'Cursor', '文件', '搜索', '解析', '差异', '混合'
    ],
    'korean': [
      '프로젝트', '기능', '시스템', '개발', '설계', '구현', '최적화', '성능',
      '컨텍스트', '관리', '분석', '모니터링', '압축', '제안', '히스토리', '효율성',
      'MCP', '서버', 'Cursor', '파일', '검색', '분석', '차이', '하이브리드'
    ],
    'arabic': [
      'مشروع', 'وظيفة', 'نظام', 'تطوير', 'تصميم', 'تنفيذ', 'تحسين', 'أداء',
      'سياق', 'إدارة', 'تحليل', 'مراقبة', 'ضغط', 'اقتراح', 'تاريخ', 'كفاءة',
      'MCP', 'خادم', 'Cursor', 'ملف', 'بحث', 'تحليل', 'فرق', 'مختلط'
    ],
    'cyrillic': [
      'проект', 'функция', 'система', 'разработка', 'дизайн', 'реализация', 'оптимизация', 'производительность',
      'контекст', 'управление', 'анализ', 'мониторинг', 'сжатие', 'предложение', 'история', 'эффективность',
      'MCP', 'сервер', 'Cursor', 'файл', 'поиск', 'анализ', 'разница', 'гибридный'
    ],
    'latin': [
      'proyecto', 'función', 'sistema', 'desarrollo', 'diseño', 'implementación', 'optimización', 'rendimiento',
      'contexto', 'gestión', 'análisis', 'monitoreo', 'compresión', 'sugerencia', 'historial', 'eficiencia',
      'MCP', 'servidor', 'Cursor', 'archivo', 'búsqueda', 'análisis', 'diferencia', 'híbrido'
    ],
    'english': [
      'project', 'function', 'system', 'development', 'design', 'implementation', 'optimization', 'performance',
      'context', 'management', 'analysis', 'monitoring', 'compression', 'suggestion', 'history', 'efficiency',
      'MCP', 'server', 'Cursor', 'file', 'search', 'analysis', 'difference', 'hybrid'
    ]
  };
  
  return keywordsDict[language] || keywordsDict['english'];
}

// 多言語対応関数をエクスポート（テスト用）
// ES Module対応のため、export文に変更
export {
  detectLanguage,
  splitByLanguage,
  getStopWords,
  getImportantKeywords
};

// メイン処理を開始
main().catch(console.error);
