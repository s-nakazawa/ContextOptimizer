/**
 * Differential Indexer for ContextOptimizer
 * 差分インデクサー - 増分インデックス機能
 * 
 * Features:
 * - Git-based change detection
 * - File modification time tracking
 * - Incremental indexing for performance
 * - Smart dependency resolution
 */

import { statSync, readFileSync, existsSync } from 'fs';
import { join, relative, extname } from 'path';
import simpleGit from 'simple-git';
import { glob } from 'glob';
import { Parser } from 'acorn';
import jsx from 'acorn-jsx';
import { simple as walk } from 'acorn-walk';
import natural from 'natural';
import PersistentStorage from '../storage/persistent-storage.js';

export class DifferentialIndexer {
  constructor(config = {}) {
    this.config = {
      projectRoot: config.projectRoot || process.cwd(),
      gitEnabled: config.gitEnabled !== false,
      filePatterns: config.filePatterns || [
        '**/*.{ts,tsx,js,jsx}',
        '**/*.{py,java,go,rs}',
        '**/*.{md,txt,json,yaml,yml}',
        '**/*.{sql,css,html}'
      ],
      excludePatterns: config.excludePatterns || [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.git/**',
        '**/coverage/**',
        '**/tmp/**',
        '**/temp/**',
        '**/.cache/**',
        '**/.vscode/**',
        '**/.idea/**',
        '**/vendor/**',
        '**/target/**',
        '**/out/**',
        '**/bin/**',
        '**/obj/**',
        '**/*.log',
        '**/*.backup'
      ],
      maxFileSize: config.maxFileSize || 200000,
      tokenThreshold: config.tokenThreshold || 1000,
      ...config
    };

    this.storage = new PersistentStorage({
      storagePath: join(this.config.projectRoot, '.context-optimizer', 'storage'),
      ...config.storage
    });

    this.git = this.config.gitEnabled ? simpleGit(this.config.projectRoot) : null;
    this.bm25Index = new Map();
    this.vectorIndex = new Map();
    
    this.initializeIndexer();
  }

  /**
   * Initialize the differential indexer
   * 差分インデクサーを初期化
   */
  async initializeIndexer() {
    try {
      console.log('🚀 Initializing Differential Indexer...');
      
      // Load existing indexes
      await this.loadExistingIndexes();
      
      // Perform initial scan if needed
      if (this.storage.indexData.files.size === 0) {
        console.log('📁 No existing index found, performing full scan...');
        await this.performFullIndexing();
      } else {
        console.log(`📖 Loaded existing index with ${this.storage.indexData.files.size} files`);
        await this.performIncrementalIndexing();
      }
      
      console.log('✅ Differential Indexer initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Differential Indexer:', error);
      throw error;
    }
  }

  /**
   * Load existing indexes from storage
   * ストレージから既存のインデックスを読み込み
   */
  async loadExistingIndexes() {
    try {
      // Load BM25 index
      const bm25Path = join(this.config.projectRoot, 'search-index', 'bm25-index.json');
      if (existsSync(bm25Path)) {
        const bm25Data = JSON.parse(readFileSync(bm25Path, 'utf8'));
        this.bm25Index = new Map(bm25Data.documents || []);
        console.log(`📚 Loaded BM25 index: ${this.bm25Index.size} documents`);
      }

      // Load vector index
      const vectorPath = join(this.config.projectRoot, 'vector-index', 'vector-index.json');
      if (existsSync(vectorPath)) {
        const vectorData = JSON.parse(readFileSync(vectorPath, 'utf8'));
        this.vectorIndex = new Map(vectorData.vectors || []);
        console.log(`🧠 Loaded vector index: ${this.vectorIndex.size} vectors`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load existing indexes:', error.message);
    }
  }

  /**
   * Perform full indexing of all files
   * すべてのファイルの完全インデックスを実行
   */
  async performFullIndexing() {
    try {
      console.log('🔄 Starting full indexing...');
      
      const allFiles = await this.discoverFiles();
      console.log(`📁 Found ${allFiles.length} files to index`);
      
      let indexedCount = 0;
      let skippedCount = 0;
      
      for (const filePath of allFiles) {
        try {
          const success = await this.indexFile(filePath);
          if (success) {
            indexedCount++;
          } else {
            skippedCount++;
          }
        } catch (error) {
          console.warn(`⚠️ Failed to index ${filePath}:`, error.message);
          skippedCount++;
        }
      }
      
      // Save all data
      this.storage.saveAll();
      this.saveIndexes();
      
      console.log(`✅ Full indexing completed: ${indexedCount} indexed, ${skippedCount} skipped`);
      return { indexed: indexedCount, skipped: skippedCount };
    } catch (error) {
      console.error('❌ Full indexing failed:', error);
      throw error;
    }
  }

  /**
   * Perform incremental indexing of changed files
   * 変更されたファイルの増分インデックスを実行
   */
  async performIncrementalIndexing() {
    try {
      console.log('🔄 Starting incremental indexing...');
      
      const changedFiles = await this.detectChangedFiles();
      console.log(`📝 Found ${changedFiles.length} changed files`);
      
      if (changedFiles.length === 0) {
        console.log('✨ No changes detected, index is up to date');
        return { indexed: 0, skipped: 0 };
      }
      
      let indexedCount = 0;
      let skippedCount = 0;
      
      for (const filePath of changedFiles) {
        try {
          const success = await this.indexFile(filePath);
          if (success) {
            indexedCount++;
          } else {
            skippedCount++;
          }
        } catch (error) {
          console.warn(`⚠️ Failed to index ${filePath}:`, error.message);
          skippedCount++;
        }
      }
      
      // Save all data
      this.storage.saveAll();
      this.saveIndexes();
      
      console.log(`✅ Incremental indexing completed: ${indexedCount} indexed, ${skippedCount} skipped`);
      return { indexed: indexedCount, skipped: skippedCount };
    } catch (error) {
      console.error('❌ Incremental indexing failed:', error);
      throw error;
    }
  }

  /**
   * Detect files that have changed since last indexing
   * 最後のインデックス以降に変更されたファイルを検出
   */
  async detectChangedFiles() {
    const changedFiles = new Set();
    
    try {
      // Method 1: Git-based detection (if available)
      if (this.git) {
        const gitChangedFiles = await this.detectGitChanges();
        gitChangedFiles.forEach(file => changedFiles.add(file));
      }
      
      // Method 2: File modification time detection
      const allFiles = await this.discoverFiles();
      const fileStats = {};
      
      for (const filePath of allFiles) {
        try {
          const stats = statSync(filePath);
          fileStats[filePath] = stats;
          
          if (this.storage.needsReindexing(filePath, stats)) {
            changedFiles.add(filePath);
          }
        } catch (error) {
          // File might not exist anymore
          console.warn(`⚠️ Could not stat ${filePath}:`, error.message);
        }
      }
      
      // Method 3: Check for deleted files
      const indexedFiles = Array.from(this.storage.indexData.files.keys());
      for (const indexedFile of indexedFiles) {
        if (!existsSync(indexedFile)) {
          console.log(`🗑️ File deleted: ${indexedFile}`);
          this.storage.indexData.files.delete(indexedFile);
          this.bm25Index.delete(indexedFile);
          this.vectorIndex.delete(indexedFile);
        }
      }
      
      return Array.from(changedFiles);
    } catch (error) {
      console.error('❌ Failed to detect changed files:', error);
      return [];
    }
  }

  /**
   * Detect changes using Git
   * Gitを使用して変更を検出
   */
  async detectGitChanges() {
    try {
      if (!this.git) return [];
      
      // Get files changed in the last commit
      const log = await this.git.log({ maxCount: 1 });
      if (log.latest) {
        const diff = await this.git.diff(['--name-only', log.latest.hash]);
        const changedFiles = diff.split('\n')
          .filter(file => file.trim())
          .map(file => join(this.config.projectRoot, file));
        
        console.log(`🔍 Git detected ${changedFiles.length} changed files`);
        return changedFiles;
      }
      
      return [];
    } catch (error) {
      console.warn('⚠️ Git change detection failed:', error.message);
      return [];
    }
  }

  /**
   * Discover all files matching the patterns
   * パターンに一致するすべてのファイルを発見
   */
  async discoverFiles() {
    try {
      const allFiles = [];
      
      for (const pattern of this.config.filePatterns) {
        const files = await glob(pattern, {
          cwd: this.config.projectRoot,
          absolute: true,
          ignore: this.config.excludePatterns
        });
        allFiles.push(...files);
      }
      
      // Remove duplicates and filter by size
      const uniqueFiles = [...new Set(allFiles)].filter(filePath => {
        try {
          const stats = statSync(filePath);
          return stats.size <= this.config.maxFileSize;
        } catch (error) {
          return false;
        }
      });
      
      return uniqueFiles;
    } catch (error) {
      console.error('❌ Failed to discover files:', error);
      return [];
    }
  }

  /**
   * Index a single file
   * 単一ファイルをインデックス
   */
  async indexFile(filePath) {
    try {
      const stats = statSync(filePath);
      
      // Skip if file is too large
      if (stats.size > this.config.maxFileSize) {
        console.log(`⏭️ Skipping large file: ${filePath} (${stats.size} bytes)`);
        return false;
      }
      
      const content = readFileSync(filePath, 'utf8');
      const relativePath = relative(this.config.projectRoot, filePath);
      
      // Extract metadata
      const metadata = await this.extractFileMetadata(filePath, content, stats);
      
      // Add to storage
      this.storage.addFileMetadata(filePath, metadata);
      
      // Update BM25 index
      await this.updateBM25Index(filePath, content, metadata);
      
      // Update vector index
      await this.updateVectorIndex(filePath, content, metadata);
      
      console.log(`📄 Indexed: ${relativePath} (${metadata.tokens} tokens)`);
      return true;
    } catch (error) {
      console.warn(`⚠️ Failed to index ${filePath}:`, error.message);
      return false;
    }
  }

  /**
   * Extract metadata from file content
   * ファイルコンテンツからメタデータを抽出
   */
  async extractFileMetadata(filePath, content, stats) {
    const ext = extname(filePath).toLowerCase();
    const tokens = this.estimateTokenCount(content);
    
    const metadata = {
      size: stats.size,
      tokens,
      lastModified: stats.mtime.toISOString(),
      extension: ext,
      importance: this.determineImportance(filePath, content),
      tags: this.extractTags(filePath, content),
      compressed: tokens > this.config.tokenThreshold
    };
    
    // Extract AST information for supported languages
    if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
      try {
        const astInfo = await this.extractASTInfo(content);
        metadata.astInfo = astInfo;
      } catch (error) {
        console.warn(`⚠️ Failed to extract AST for ${filePath}:`, error.message);
      }
    }
    
    return metadata;
  }

  /**
   * Determine file importance based on path and content
   * パスとコンテンツに基づいてファイルの重要度を決定
   */
  determineImportance(filePath, content) {
    const path = filePath.toLowerCase();
    
    // Core files
    if (path.includes('core') || path.includes('main') || path.includes('index')) {
      return 'core';
    }
    
    // Test files
    if (path.includes('test') || path.includes('spec') || path.includes('__tests__')) {
      return 'test';
    }
    
    // Utility files
    if (path.includes('util') || path.includes('helper') || path.includes('common')) {
      return 'utility';
    }
    
    // Configuration files
    if (path.includes('config') || path.includes('.env') || path.includes('package.json')) {
      return 'config';
    }
    
    return 'normal';
  }

  /**
   * Extract tags from file content
   * ファイルコンテンツからタグを抽出
   */
  extractTags(filePath, content) {
    const tags = [];
    const path = filePath.toLowerCase();
    
    // Language tags
    const ext = extname(filePath).toLowerCase();
    if (['.ts', '.tsx'].includes(ext)) tags.push('typescript');
    if (['.js', '.jsx'].includes(ext)) tags.push('javascript');
    if (['.py'].includes(ext)) tags.push('python');
    if (['.java'].includes(ext)) tags.push('java');
    if (['.go'].includes(ext)) tags.push('golang');
    if (['.rs'].includes(ext)) tags.push('rust');
    
    // Framework tags
    if (content.includes('react') || content.includes('React')) tags.push('react');
    if (content.includes('vue') || content.includes('Vue')) tags.push('vue');
    if (content.includes('angular') || content.includes('Angular')) tags.push('angular');
    if (content.includes('express') || content.includes('Express')) tags.push('express');
    if (content.includes('next') || content.includes('Next')) tags.push('nextjs');
    
    // Content tags
    if (content.includes('test') || content.includes('describe') || content.includes('it(')) {
      tags.push('testing');
    }
    if (content.includes('async') || content.includes('await') || content.includes('Promise')) {
      tags.push('async');
    }
    if (content.includes('class ') || content.includes('interface ')) {
      tags.push('oop');
    }
    
    return [...new Set(tags)];
  }

  /**
   * Extract AST information for JavaScript/TypeScript files
   * JavaScript/TypeScriptファイルのAST情報を抽出
   */
  async extractASTInfo(content) {
    try {
      const parser = Parser.extend(jsx());
      const ast = parser.parse(content, {
        ecmaVersion: 2022,
        sourceType: 'module',
        allowHashBang: true
      });
      
      const astInfo = {
        functions: [],
        classes: [],
        imports: [],
        exports: [],
        variables: []
      };
      
      walk(ast, {
        FunctionDeclaration: (node) => {
          astInfo.functions.push({
            name: node.id?.name || 'anonymous',
            params: node.params.length,
            line: node.loc?.start.line
          });
        },
        ClassDeclaration: (node) => {
          astInfo.classes.push({
            name: node.id?.name,
            line: node.loc?.start.line
          });
        },
        ImportDeclaration: (node) => {
          astInfo.imports.push({
            source: node.source.value,
            specifiers: node.specifiers.length
          });
        },
        ExportDeclaration: (node) => {
          astInfo.exports.push({
            type: node.type,
            line: node.loc?.start.line
          });
        },
        VariableDeclarator: (node) => {
          if (node.id.type === 'Identifier') {
            astInfo.variables.push({
              name: node.id.name,
              type: node.init?.type || 'unknown'
            });
          }
        }
      });
      
      return astInfo;
    } catch (error) {
      console.warn('⚠️ AST parsing failed:', error.message);
      return null;
    }
  }

  /**
   * Update BM25 index for a file
   * ファイルのBM25インデックスを更新
   */
  async updateBM25Index(filePath, content, metadata) {
    try {
      // Simple tokenization and term extraction
      const tokens = natural.WordTokenizer().tokenize(content.toLowerCase());
      const terms = tokens.filter(token => token.length > 2);
      
      // Count term frequencies
      const termFreq = new Map();
      terms.forEach(term => {
        termFreq.set(term, (termFreq.get(term) || 0) + 1);
      });
      
      this.bm25Index.set(filePath, {
        terms: Array.from(termFreq.entries()),
        metadata,
        indexedAt: new Date().toISOString()
      });
    } catch (error) {
      console.warn(`⚠️ Failed to update BM25 index for ${filePath}:`, error.message);
    }
  }

  /**
   * Update vector index for a file
   * ファイルのベクトルインデックスを更新
   */
  async updateVectorIndex(filePath, content, metadata) {
    try {
      // Simple text embedding simulation (in real implementation, use actual embedding model)
      const tokens = natural.WordTokenizer().tokenize(content.toLowerCase());
      const terms = tokens.filter(token => token.length > 2);
      
      // Create a simple vector representation
      const vector = this.createSimpleVector(terms, metadata);
      
      this.vectorIndex.set(filePath, {
        vector,
        metadata,
        indexedAt: new Date().toISOString()
      });
    } catch (error) {
      console.warn(`⚠️ Failed to update vector index for ${filePath}:`, error.message);
    }
  }

  /**
   * Create a simple vector representation
   * シンプルなベクトル表現を作成
   */
  createSimpleVector(terms, metadata) {
    // This is a simplified vector representation
    // In a real implementation, you would use an actual embedding model
    const vector = new Array(384).fill(0);
    
    // Simple hash-based vector generation
    terms.forEach(term => {
      const hash = this.simpleHash(term);
      const index = hash % 384;
      vector[index] += 1;
    });
    
    // Normalize vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= magnitude;
      }
    }
    
    return vector;
  }

  /**
   * Simple hash function
   * シンプルなハッシュ関数
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Estimate token count for content
   * コンテンツのトークン数を推定
   */
  estimateTokenCount(content) {
    // Simple token estimation: ~4 characters per token
    return Math.ceil(content.length / 4);
  }

  /**
   * Save indexes to disk
   * インデックスをディスクに保存
   */
  saveIndexes() {
    try {
      // Save BM25 index
      const bm25Path = join(this.config.projectRoot, 'search-index');
      if (!existsSync(bm25Path)) {
        require('fs').mkdirSync(bm25Path, { recursive: true });
      }
      
      const bm25Data = {
        documents: Array.from(this.bm25Index.entries()),
        lastUpdate: new Date().toISOString(),
        version: '1.0.0'
      };
      
      require('fs').writeFileSync(
        join(bm25Path, 'bm25-index.json'),
        JSON.stringify(bm25Data, null, 2)
      );
      
      // Save vector index
      const vectorPath = join(this.config.projectRoot, 'vector-index');
      if (!existsSync(vectorPath)) {
        require('fs').mkdirSync(vectorPath, { recursive: true });
      }
      
      const vectorData = {
        vectors: Array.from(this.vectorIndex.entries()),
        lastUpdate: new Date().toISOString(),
        version: '1.0.0'
      };
      
      require('fs').writeFileSync(
        join(vectorPath, 'vector-index.json'),
        JSON.stringify(vectorData, null, 2)
      );
      
      console.log('💾 Indexes saved to disk');
    } catch (error) {
      console.error('❌ Failed to save indexes:', error);
    }
  }

  /**
   * Get indexing statistics
   * インデックス統計を取得
   */
  getIndexingStats() {
    return {
      totalFiles: this.storage.indexData.files.size,
      bm25Documents: this.bm25Index.size,
      vectorDocuments: this.vectorIndex.size,
      lastUpdate: this.storage.indexData.lastUpdate,
      storageStats: this.storage.getStorageStats()
    };
  }

  /**
   * Close the indexer and save all data
   * インデクサーを閉じてすべてのデータを保存
   */
  close() {
    this.saveIndexes();
    this.storage.close();
    console.log('🔒 Differential Indexer closed');
  }
}

export default DifferentialIndexer;
