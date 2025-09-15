/**
 * Persistent Storage Layer for ContextOptimizer
 * 永続化ストレージレイヤー - PoC版
 * 
 * Features:
 * - JSON-based storage for simplicity
 * - Incremental indexing support
 * - Compression and summarization metadata
 * - History management with snapshots
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class PersistentStorage {
  constructor(config = {}) {
    this.config = {
      storagePath: config.storagePath || join(__dirname, '../storage'),
      indexFileName: config.indexFileName || 'persistent-index.json',
      historyFileName: config.historyFileName || 'context-history.json',
      snapshotsFileName: config.snapshotsFileName || 'snapshots.json',
      maxHistoryEntries: config.maxHistoryEntries || 100,
      compressionThreshold: config.compressionThreshold || 1000, // tokens
      ...config
    };
    
    this.indexData = {
      files: new Map(), // filePath -> fileMetadata
      lastUpdate: null,
      version: '1.0.0'
    };
    
    this.historyData = {
      entries: [],
      lastCleanup: null,
      compressionStats: {
        totalCompressed: 0,
        totalSaved: 0,
        compressionRatio: 0
      }
    };
    
    this.snapshotsData = {
      snapshots: [],
      maxSnapshots: config.maxSnapshots || 10
    };
    
    this.initializeStorage();
  }

  /**
   * Initialize storage directories and load existing data
   * ストレージディレクトリの初期化と既存データの読み込み
   */
  initializeStorage() {
    try {
      // Create storage directory if it doesn't exist
      if (!existsSync(this.config.storagePath)) {
        mkdirSync(this.config.storagePath, { recursive: true });
      }

      // Load existing data
      this.loadIndexData();
      this.loadHistoryData();
      this.loadSnapshotsData();
      
      console.log(`📁 Persistent storage initialized at: ${this.config.storagePath}`);
    } catch (error) {
      console.error('❌ Failed to initialize persistent storage:', error);
      throw error;
    }
  }

  /**
   * Load index data from JSON file
   * インデックスデータをJSONファイルから読み込み
   */
  loadIndexData() {
    const indexPath = join(this.config.storagePath, this.config.indexFileName);
    
    if (existsSync(indexPath)) {
      try {
        const data = JSON.parse(readFileSync(indexPath, 'utf8'));
        this.indexData = {
          files: new Map(data.files || []),
          lastUpdate: data.lastUpdate,
          version: data.version || '1.0.0'
        };
        console.log(`📖 Loaded ${this.indexData.files.size} indexed files`);
      } catch (error) {
        console.warn('⚠️ Failed to load index data, starting fresh:', error.message);
      }
    }
  }

  /**
   * Load history data from JSON file
   * 履歴データをJSONファイルから読み込み
   */
  loadHistoryData() {
    const historyPath = join(this.config.storagePath, this.config.historyFileName);
    
    if (existsSync(historyPath)) {
      try {
        const data = JSON.parse(readFileSync(historyPath, 'utf8'));
        this.historyData = {
          entries: data.entries || [],
          lastCleanup: data.lastCleanup,
          compressionStats: data.compressionStats || {
            totalCompressed: 0,
            totalSaved: 0,
            compressionRatio: 0
          }
        };
        console.log(`📚 Loaded ${this.historyData.entries.length} history entries`);
      } catch (error) {
        console.warn('⚠️ Failed to load history data, starting fresh:', error.message);
      }
    }
  }

  /**
   * Load snapshots data from JSON file
   * スナップショットデータをJSONファイルから読み込み
   */
  loadSnapshotsData() {
    const snapshotsPath = join(this.config.storagePath, this.config.snapshotsFileName);
    
    if (existsSync(snapshotsPath)) {
      try {
        const data = JSON.parse(readFileSync(snapshotsPath, 'utf8'));
        this.snapshotsData = {
          snapshots: data.snapshots || [],
          maxSnapshots: data.maxSnapshots || this.config.maxSnapshots
        };
        console.log(`📸 Loaded ${this.snapshotsData.snapshots.length} snapshots`);
      } catch (error) {
        console.warn('⚠️ Failed to load snapshots data, starting fresh:', error.message);
      }
    }
  }

  /**
   * Save index data to JSON file
   * インデックスデータをJSONファイルに保存
   */
  saveIndexData() {
    try {
      const indexPath = join(this.config.storagePath, this.config.indexFileName);
      const data = {
        files: Array.from(this.indexData.files.entries()),
        lastUpdate: new Date().toISOString(),
        version: this.indexData.version
      };
      
      writeFileSync(indexPath, JSON.stringify(data, null, 2));
      console.log(`💾 Saved index data: ${this.indexData.files.size} files`);
    } catch (error) {
      console.error('❌ Failed to save index data:', error);
      throw error;
    }
  }

  /**
   * Save history data to JSON file
   * 履歴データをJSONファイルに保存
   */
  saveHistoryData() {
    try {
      const historyPath = join(this.config.storagePath, this.config.historyFileName);
      const data = {
        entries: this.historyData.entries,
        lastCleanup: this.historyData.lastCleanup,
        compressionStats: this.historyData.compressionStats
      };
      
      writeFileSync(historyPath, JSON.stringify(data, null, 2));
      console.log(`💾 Saved history data: ${this.historyData.entries.length} entries`);
    } catch (error) {
      console.error('❌ Failed to save history data:', error);
      throw error;
    }
  }

  /**
   * Save snapshots data to JSON file
   * スナップショットデータをJSONファイルに保存
   */
  saveSnapshotsData() {
    try {
      const snapshotsPath = join(this.config.storagePath, this.config.snapshotsFileName);
      const data = {
        snapshots: this.snapshotsData.snapshots,
        maxSnapshots: this.snapshotsData.maxSnapshots
      };
      
      writeFileSync(snapshotsPath, JSON.stringify(data, null, 2));
      console.log(`💾 Saved snapshots data: ${this.snapshotsData.snapshots.length} snapshots`);
    } catch (error) {
      console.error('❌ Failed to save snapshots data:', error);
      throw error;
    }
  }

  /**
   * Add or update file metadata in index
   * ファイルメタデータをインデックスに追加または更新
   */
  addFileMetadata(filePath, metadata) {
    const fileMetadata = {
      path: filePath,
      lastModified: metadata.lastModified || new Date().toISOString(),
      size: metadata.size || 0,
      tokens: metadata.tokens || 0,
      importance: metadata.importance || 'normal', // core, utility, test, normal
      compressed: metadata.compressed || false,
      summary: metadata.summary || null,
      tags: metadata.tags || [],
      indexedAt: new Date().toISOString(),
      ...metadata
    };

    this.indexData.files.set(filePath, fileMetadata);
    this.indexData.lastUpdate = new Date().toISOString();
    
    return fileMetadata;
  }

  /**
   * Get file metadata from index
   * インデックスからファイルメタデータを取得
   */
  getFileMetadata(filePath) {
    return this.indexData.files.get(filePath);
  }

  /**
   * Check if file needs re-indexing based on modification time
   * ファイルの更新時刻に基づいて再インデックスが必要かチェック
   */
  needsReindexing(filePath, currentStats) {
    const existingMetadata = this.getFileMetadata(filePath);
    
    if (!existingMetadata) {
      return true; // New file
    }

    const existingTime = new Date(existingMetadata.lastModified).getTime();
    const currentTime = currentStats.mtime.getTime();
    
    return currentTime > existingTime;
  }

  /**
   * Add context history entry
   * コンテキスト履歴エントリを追加
   */
  addHistoryEntry(entry) {
    const historyEntry = {
      id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      contextSize: entry.contextSize || 0,
      compressed: entry.compressed || false,
      compressionRatio: entry.compressionRatio || 1.0,
      summary: entry.summary || null,
      tags: entry.tags || [],
      ...entry
    };

    this.historyData.entries.unshift(historyEntry);
    
    // Keep only the most recent entries
    if (this.historyData.entries.length > this.config.maxHistoryEntries) {
      this.historyData.entries = this.historyData.entries.slice(0, this.config.maxHistoryEntries);
    }

    // Update compression stats
    if (entry.compressed) {
      this.historyData.compressionStats.totalCompressed++;
      this.historyData.compressionStats.totalSaved += entry.contextSize * (1 - entry.compressionRatio);
      this.historyData.compressionStats.compressionRatio = 
        this.historyData.compressionStats.totalSaved / 
        (this.historyData.compressionStats.totalCompressed * entry.contextSize);
    }

    return historyEntry;
  }

  /**
   * Create a snapshot of current state
   * 現在の状態のスナップショットを作成
   */
  createSnapshot(description = '') {
    const snapshot = {
      id: `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      description,
      stats: {
        totalFiles: this.indexData.files.size,
        totalHistoryEntries: this.historyData.entries.length,
        compressionStats: { ...this.historyData.compressionStats }
      },
      metadata: {
        version: this.indexData.version,
        lastUpdate: this.indexData.lastUpdate
      }
    };

    this.snapshotsData.snapshots.unshift(snapshot);
    
    // Keep only the most recent snapshots
    if (this.snapshotsData.snapshots.length > this.snapshotsData.maxSnapshots) {
      this.snapshotsData.snapshots = this.snapshotsData.snapshots.slice(0, this.snapshotsData.maxSnapshots);
    }

    return snapshot;
  }

  /**
   * Get files that need re-indexing based on modification time
   * 更新時刻に基づいて再インデックスが必要なファイルを取得
   */
  getFilesNeedingReindexing(filePaths, fileStats) {
    const needsReindexing = [];
    
    for (const filePath of filePaths) {
      const stats = fileStats[filePath];
      if (stats && this.needsReindexing(filePath, stats)) {
        needsReindexing.push(filePath);
      }
    }
    
    return needsReindexing;
  }

  /**
   * Get compression statistics
   * 圧縮統計を取得
   */
  getCompressionStats() {
    return {
      ...this.historyData.compressionStats,
      totalEntries: this.historyData.entries.length,
      compressedEntries: this.historyData.entries.filter(e => e.compressed).length,
      averageCompressionRatio: this.historyData.entries.length > 0 
        ? this.historyData.entries.reduce((sum, e) => sum + (e.compressionRatio || 1), 0) / this.historyData.entries.length
        : 1
    };
  }

  /**
   * Cleanup old data based on retention policy
   * 保持ポリシーに基づいて古いデータをクリーンアップ
   */
  cleanupOldData(retentionDays = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    // Cleanup old history entries
    const originalCount = this.historyData.entries.length;
    this.historyData.entries = this.historyData.entries.filter(entry => 
      new Date(entry.timestamp) > cutoffDate
    );
    
    const removedCount = originalCount - this.historyData.entries.length;
    this.historyData.lastCleanup = new Date().toISOString();
    
    console.log(`🧹 Cleaned up ${removedCount} old history entries`);
    return removedCount;
  }

  /**
   * Get storage statistics
   * ストレージ統計を取得
   */
  getStorageStats() {
    return {
      index: {
        totalFiles: this.indexData.files.size,
        lastUpdate: this.indexData.lastUpdate,
        version: this.indexData.version
      },
      history: {
        totalEntries: this.historyData.entries.length,
        lastCleanup: this.historyData.lastCleanup,
        compressionStats: this.getCompressionStats()
      },
      snapshots: {
        totalSnapshots: this.snapshotsData.snapshots.length,
        maxSnapshots: this.snapshotsData.maxSnapshots
      }
    };
  }

  /**
   * Save all data to disk
   * すべてのデータをディスクに保存
   */
  saveAll() {
    this.saveIndexData();
    this.saveHistoryData();
    this.saveSnapshotsData();
  }

  /**
   * Close storage and save all data
   * ストレージを閉じてすべてのデータを保存
   */
  close() {
    this.saveAll();
    console.log('🔒 Persistent storage closed and data saved');
  }
}

export default PersistentStorage;
