/**
 * Prompt Packager for ContextOptimizer
 * プロンプトパッケージャー - Master/Worker用の整形出力
 * 
 * Features:
 * - Context package generation for Master/Worker AI
 * - Token-aware content selection
 * - Priority-based information ranking
 * - Structured output format
 */

import { readFileSync, existsSync } from 'fs';
import { join, relative } from 'path';
import PersistentStorage from '../storage/persistent-storage.js';
import ContentCompressor from '../compression/content-compressor.js';

export class PromptPackager {
  constructor(config = {}) {
    this.config = {
      projectRoot: config.projectRoot || process.cwd(),
      maxTokens: config.maxTokens || 8000,
      maxFiles: config.maxFiles || 20,
      maxHistoryEntries: config.maxHistoryEntries || 10,
      priorityWeights: config.priorityWeights || {
        core: 1.0,
        config: 0.9,
        utility: 0.7,
        normal: 0.5,
        test: 0.3
      },
      includeTypes: config.includeTypes || ['code', 'documentation', 'history'],
      ...config
    };

    this.storage = new PersistentStorage({
      storagePath: join(this.config.projectRoot, '.context-optimizer', 'storage'),
      ...config.storage
    });

    this.compressor = new ContentCompressor({
      tokenThreshold: config.compressionThreshold || 1000,
      compressionRatio: config.compressionRatio || 0.7,
      ...config.compression
    });

    this.tokenEstimator = this.createTokenEstimator();
  }

  /**
   * Generate context package for Master AI
   * Master AI用のコンテキストパッケージを生成
   */
  async generateMasterPackage(query, options = {}) {
    try {
      console.log(`🎯 Generating Master AI package for: "${query}"`);
      
      const packageConfig = {
        maxTokens: options.maxTokens || this.config.maxTokens,
        includeHistory: options.includeHistory !== false,
        includeSnapshots: options.includeSnapshots !== false,
        compressionLevel: options.compressionLevel || 'balanced',
        ...options
      };

      // Search for relevant files and information
      const searchResults = await this.searchRelevantContent(query, packageConfig);
      
      // Generate structured package
      const package = {
        type: 'master',
        query: query,
        timestamp: new Date().toISOString(),
        summary: await this.generateSummary(query, searchResults),
        code_snippets: await this.extractCodeSnippets(searchResults, packageConfig),
        related_history: packageConfig.includeHistory ? 
          await this.getRelevantHistory(query, packageConfig) : [],
        snapshots: packageConfig.includeSnapshots ? 
          await this.getRelevantSnapshots(query, packageConfig) : [],
        metadata: {
          totalTokens: 0,
          filesIncluded: 0,
          compressionRatio: 1.0,
          generationTime: Date.now()
        }
      };

      // Calculate token count and optimize if needed
      package.metadata.totalTokens = this.estimatePackageTokens(package);
      
      if (package.metadata.totalTokens > packageConfig.maxTokens) {
        package = await this.optimizePackage(package, packageConfig);
      }

      console.log(`✅ Master package generated: ${package.metadata.totalTokens} tokens, ${package.metadata.filesIncluded} files`);
      return package;
    } catch (error) {
      console.error('❌ Failed to generate Master package:', error);
      throw error;
    }
  }

  /**
   * Generate context package for Worker AI
   * Worker AI用のコンテキストパッケージを生成
   */
  async generateWorkerPackage(taskDescription, options = {}) {
    try {
      console.log(`🔧 Generating Worker AI package for: "${taskDescription}"`);
      
      const packageConfig = {
        maxTokens: options.maxTokens || Math.floor(this.config.maxTokens * 0.8),
        focusOnCode: options.focusOnCode !== false,
        includeDependencies: options.includeDependencies !== false,
        compressionLevel: options.compressionLevel || 'aggressive',
        ...options
      };

      // Search for task-specific content
      const searchResults = await this.searchRelevantContent(taskDescription, packageConfig);
      
      // Generate structured package
      const package = {
        type: 'worker',
        task: taskDescription,
        timestamp: new Date().toISOString(),
        summary: await this.generateTaskSummary(taskDescription, searchResults),
        code_snippets: await this.extractCodeSnippets(searchResults, packageConfig),
        dependencies: packageConfig.includeDependencies ? 
          await this.extractDependencies(searchResults) : [],
        related_files: await this.getRelatedFiles(searchResults, packageConfig),
        metadata: {
          totalTokens: 0,
          filesIncluded: 0,
          compressionRatio: 1.0,
          generationTime: Date.now()
        }
      };

      // Calculate token count and optimize if needed
      package.metadata.totalTokens = this.estimatePackageTokens(package);
      
      if (package.metadata.totalTokens > packageConfig.maxTokens) {
        package = await this.optimizePackage(package, packageConfig);
      }

      console.log(`✅ Worker package generated: ${package.metadata.totalTokens} tokens, ${package.metadata.filesIncluded} files`);
      return package;
    } catch (error) {
      console.error('❌ Failed to generate Worker package:', error);
      throw error;
    }
  }

  /**
   * Search for content relevant to the query
   * クエリに関連するコンテンツを検索
   */
  async searchRelevantContent(query, config) {
    try {
      const results = {
        files: [],
        history: [],
        snapshots: []
      };

      // Search indexed files
      const indexedFiles = Array.from(this.storage.indexData.files.values());
      const relevantFiles = this.rankFilesByRelevance(query, indexedFiles);
      
      // Select top files based on priority and token budget
      let tokenBudget = config.maxTokens * 0.6; // Reserve 60% for files
      for (const file of relevantFiles) {
        if (tokenBudget <= 0 || results.files.length >= config.maxFiles) break;
        
        const fileTokens = file.tokens || 0;
        if (fileTokens <= tokenBudget) {
          results.files.push(file);
          tokenBudget -= fileTokens;
        }
      }

      return results;
    } catch (error) {
      console.error('❌ Failed to search relevant content:', error);
      return { files: [], history: [], snapshots: [] };
    }
  }

  /**
   * Rank files by relevance to query
   * クエリとの関連性でファイルをランク付け
   */
  rankFilesByRelevance(query, files) {
    const queryWords = query.toLowerCase().split(/\s+/);
    
    return files
      .map(file => {
        let score = 0;
        
        // Path relevance
        const path = file.path.toLowerCase();
        queryWords.forEach(word => {
          if (path.includes(word)) score += 2;
        });
        
        // Tag relevance
        if (file.tags) {
          file.tags.forEach(tag => {
            if (queryWords.some(word => tag.toLowerCase().includes(word))) {
              score += 1;
            }
          });
        }
        
        // Importance weight
        const importance = file.importance || 'normal';
        const weight = this.config.priorityWeights[importance] || 0.5;
        score *= weight;
        
        return { ...file, relevanceScore: score };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Generate summary for Master AI
   * Master AI用の要約を生成
   */
  async generateSummary(query, searchResults) {
    try {
      const summary = {
        query: query,
        project_overview: await this.getProjectOverview(),
        relevant_files: searchResults.files.slice(0, 5).map(file => ({
          path: relative(this.config.projectRoot, file.path),
          importance: file.importance,
          tokens: file.tokens,
          summary: file.summary || 'No summary available'
        })),
        key_insights: await this.extractKeyInsights(query, searchResults),
        recommendations: await this.generateRecommendations(query, searchResults)
      };

      return summary;
    } catch (error) {
      console.error('❌ Failed to generate summary:', error);
      return { query, error: error.message };
    }
  }

  /**
   * Generate task summary for Worker AI
   * Worker AI用のタスク要約を生成
   */
  async generateTaskSummary(taskDescription, searchResults) {
    try {
      const summary = {
        task: taskDescription,
        relevant_code_files: searchResults.files
          .filter(file => ['core', 'utility'].includes(file.importance))
          .slice(0, 3)
          .map(file => ({
            path: relative(this.config.projectRoot, file.path),
            importance: file.importance,
            functions: file.astInfo?.functions?.length || 0,
            classes: file.astInfo?.classes?.length || 0
          })),
        dependencies: await this.extractDependencies(searchResults),
        implementation_hints: await this.generateImplementationHints(taskDescription, searchResults)
      };

      return summary;
    } catch (error) {
      console.error('❌ Failed to generate task summary:', error);
      return { task: taskDescription, error: error.message };
    }
  }

  /**
   * Extract code snippets from search results
   * 検索結果からコードスニペットを抽出
   */
  async extractCodeSnippets(searchResults, config) {
    try {
      const snippets = [];
      
      for (const file of searchResults.files.slice(0, config.maxFiles || 10)) {
        try {
          if (!existsSync(file.path)) continue;
          
          const content = readFileSync(file.path, 'utf8');
          const compressed = this.compressor.compressContent(content, file);
          
          snippets.push({
            path: relative(this.config.projectRoot, file.path),
            importance: file.importance,
            tokens: compressed.tokens,
            content: compressed.compressedContent,
            summary: compressed.summary,
            compressed: compressed.compressed,
            compressionRatio: compressed.compressionRatio
          });
        } catch (error) {
          console.warn(`⚠️ Failed to extract snippet from ${file.path}:`, error.message);
        }
      }
      
      return snippets;
    } catch (error) {
      console.error('❌ Failed to extract code snippets:', error);
      return [];
    }
  }

  /**
   * Get relevant history entries
   * 関連する履歴エントリを取得
   */
  async getRelevantHistory(query, config) {
    try {
      const historyEntries = this.storage.historyData.entries
        .slice(0, config.maxHistoryEntries || 10)
        .map(entry => ({
          id: entry.id,
          timestamp: entry.timestamp,
          contextSize: entry.contextSize,
          compressed: entry.compressed,
          summary: entry.summary,
          tags: entry.tags
        }));

      return historyEntries;
    } catch (error) {
      console.error('❌ Failed to get relevant history:', error);
      return [];
    }
  }

  /**
   * Get relevant snapshots
   * 関連するスナップショットを取得
   */
  async getRelevantSnapshots(query, config) {
    try {
      const snapshots = this.storage.snapshotsData.snapshots
        .slice(0, 3)
        .map(snapshot => ({
          id: snapshot.id,
          timestamp: snapshot.timestamp,
          description: snapshot.description,
          stats: snapshot.stats
        }));

      return snapshots;
    } catch (error) {
      console.error('❌ Failed to get relevant snapshots:', error);
      return [];
    }
  }

  /**
   * Extract dependencies from search results
   * 検索結果から依存関係を抽出
   */
  async extractDependencies(searchResults) {
    try {
      const dependencies = new Set();
      
      for (const file of searchResults.files) {
        if (file.astInfo?.imports) {
          file.astInfo.imports.forEach(imp => {
            dependencies.add(imp.source);
          });
        }
      }
      
      return Array.from(dependencies).slice(0, 10);
    } catch (error) {
      console.error('❌ Failed to extract dependencies:', error);
      return [];
    }
  }

  /**
   * Get related files
   * 関連ファイルを取得
   */
  async getRelatedFiles(searchResults, config) {
    try {
      return searchResults.files
        .slice(0, config.maxFiles || 10)
        .map(file => ({
          path: relative(this.config.projectRoot, file.path),
          importance: file.importance,
          size: file.size,
          tokens: file.tokens,
          tags: file.tags
        }));
    } catch (error) {
      console.error('❌ Failed to get related files:', error);
      return [];
    }
  }

  /**
   * Get project overview
   * プロジェクト概要を取得
   */
  async getProjectOverview() {
    try {
      const stats = this.storage.getStorageStats();
      const files = Array.from(this.storage.indexData.files.values());
      
      const overview = {
        totalFiles: stats.index.totalFiles,
        languages: this.extractLanguages(files),
        frameworks: this.extractFrameworks(files),
        lastUpdate: stats.index.lastUpdate,
        compressionStats: stats.history.compressionStats
      };

      return overview;
    } catch (error) {
      console.error('❌ Failed to get project overview:', error);
      return { error: error.message };
    }
  }

  /**
   * Extract languages from files
   * ファイルから言語を抽出
   */
  extractLanguages(files) {
    const languages = new Map();
    
    files.forEach(file => {
      if (file.tags) {
        file.tags.forEach(tag => {
          if (['typescript', 'javascript', 'python', 'java', 'golang', 'rust'].includes(tag)) {
            languages.set(tag, (languages.get(tag) || 0) + 1);
          }
        });
      }
    });
    
    return Array.from(languages.entries()).map(([lang, count]) => ({ language: lang, files: count }));
  }

  /**
   * Extract frameworks from files
   * ファイルからフレームワークを抽出
   */
  extractFrameworks(files) {
    const frameworks = new Set();
    
    files.forEach(file => {
      if (file.tags) {
        file.tags.forEach(tag => {
          if (['react', 'vue', 'angular', 'express', 'nextjs'].includes(tag)) {
            frameworks.add(tag);
          }
        });
      }
    });
    
    return Array.from(frameworks);
  }

  /**
   * Extract key insights
   * 重要な洞察を抽出
   */
  async extractKeyInsights(query, searchResults) {
    try {
      const insights = [];
      
      // Analyze file patterns
      const coreFiles = searchResults.files.filter(f => f.importance === 'core');
      if (coreFiles.length > 0) {
        insights.push(`Found ${coreFiles.length} core files that are critical to the project structure`);
      }
      
      // Analyze compression stats
      const compressionStats = this.storage.getCompressionStats();
      if (compressionStats.totalCompressed > 0) {
        insights.push(`Project has ${compressionStats.totalCompressed} compressed files with ${(compressionStats.averageCompressionRatio * 100).toFixed(1)}% average compression`);
      }
      
      return insights;
    } catch (error) {
      console.error('❌ Failed to extract key insights:', error);
      return [];
    }
  }

  /**
   * Generate recommendations
   * 推奨事項を生成
   */
  async generateRecommendations(query, searchResults) {
    try {
      const recommendations = [];
      
      // File organization recommendations
      const testFiles = searchResults.files.filter(f => f.importance === 'test');
      if (testFiles.length === 0) {
        recommendations.push('Consider adding test files to improve code quality');
      }
      
      // Documentation recommendations
      const docFiles = searchResults.files.filter(f => f.tags?.includes('documentation'));
      if (docFiles.length === 0) {
        recommendations.push('Consider adding documentation files (README.md, docs/)');
      }
      
      return recommendations;
    } catch (error) {
      console.error('❌ Failed to generate recommendations:', error);
      return [];
    }
  }

  /**
   * Generate implementation hints
   * 実装のヒントを生成
   */
  async generateImplementationHints(taskDescription, searchResults) {
    try {
      const hints = [];
      
      // Analyze existing patterns
      const coreFiles = searchResults.files.filter(f => f.importance === 'core');
      if (coreFiles.length > 0) {
        hints.push('Follow existing patterns in core files');
      }
      
      // Check for similar functionality
      const utilityFiles = searchResults.files.filter(f => f.importance === 'utility');
      if (utilityFiles.length > 0) {
        hints.push('Reuse utility functions where possible');
      }
      
      return hints;
    } catch (error) {
      console.error('❌ Failed to generate implementation hints:', error);
      return [];
    }
  }

  /**
   * Optimize package to fit token limits
   * トークン制限に合わせてパッケージを最適化
   */
  async optimizePackage(package, config) {
    try {
      console.log(`🔧 Optimizing package: ${package.metadata.totalTokens} -> ${config.maxTokens} tokens`);
      
      // Sort code snippets by importance and token count
      package.code_snippets.sort((a, b) => {
        const aImportance = this.config.priorityWeights[a.importance] || 0.5;
        const bImportance = this.config.priorityWeights[b.importance] || 0.5;
        return bImportance - aImportance;
      });
      
      // Remove less important snippets
      let currentTokens = this.estimatePackageTokens(package);
      while (currentTokens > config.maxTokens && package.code_snippets.length > 1) {
        const removed = package.code_snippets.pop();
        currentTokens -= removed.tokens;
      }
      
      // Compress remaining snippets if still over limit
      if (currentTokens > config.maxTokens) {
        for (const snippet of package.code_snippets) {
          if (currentTokens <= config.maxTokens) break;
          
          const compressed = this.compressor.compressContent(snippet.content, {
            importance: snippet.importance
          });
          
          if (compressed.compressed) {
            snippet.content = compressed.compressedContent;
            snippet.compressed = true;
            snippet.compressionRatio = compressed.compressionRatio;
            currentTokens = this.estimatePackageTokens(package);
          }
        }
      }
      
      package.metadata.totalTokens = currentTokens;
      package.metadata.compressionRatio = currentTokens / this.estimatePackageTokens(package);
      
      return package;
    } catch (error) {
      console.error('❌ Failed to optimize package:', error);
      return package;
    }
  }

  /**
   * Estimate total tokens in package
   * パッケージの総トークン数を推定
   */
  estimatePackageTokens(package) {
    let tokens = 0;
    
    // Estimate tokens for each component
    if (package.summary) {
      tokens += this.tokenEstimator(package.summary);
    }
    
    if (package.code_snippets) {
      package.code_snippets.forEach(snippet => {
        tokens += snippet.tokens || this.tokenEstimator(snippet.content);
      });
    }
    
    if (package.related_history) {
      package.related_history.forEach(entry => {
        tokens += this.tokenEstimator(entry.summary || '');
      });
    }
    
    if (package.snapshots) {
      package.snapshots.forEach(snapshot => {
        tokens += this.tokenEstimator(snapshot.description || '');
      });
    }
    
    return tokens;
  }

  /**
   * Create token estimator function
   * トークン推定関数を作成
   */
  createTokenEstimator() {
    return (text) => {
      if (typeof text === 'string') {
        return Math.ceil(text.length / 4); // ~4 characters per token
      } else if (typeof text === 'object') {
        return Math.ceil(JSON.stringify(text).length / 4);
      }
      return 0;
    };
  }

  /**
   * Get packaging statistics
   * パッケージング統計を取得
   */
  getPackagingStats() {
    return {
      maxTokens: this.config.maxTokens,
      maxFiles: this.config.maxFiles,
      priorityWeights: this.config.priorityWeights,
      includeTypes: this.config.includeTypes,
      storageStats: this.storage.getStorageStats()
    };
  }
}

export default PromptPackager;
