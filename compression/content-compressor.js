/**
 * Content Compressor for ContextOptimizer
 * コンテンツ圧縮器 - 要約圧縮機能
 * 
 * Features:
 * - Token-based compression with threshold
 * - Multiple compression algorithms
 * - Importance-based preservation
 * - Smart summarization for code and text
 */

import natural from 'natural';
import { Parser } from 'acorn';
import jsx from 'acorn-jsx';
import { simple as walk } from 'acorn-walk';
import { extname } from 'path';

export class ContentCompressor {
  constructor(config = {}) {
    this.config = {
      tokenThreshold: config.tokenThreshold || 1000,
      compressionRatio: config.compressionRatio || 0.7,
      preserveImportant: config.preserveImportant !== false,
      algorithms: config.algorithms || ['summarization', 'truncation', 'keyword-extraction'],
      importanceTags: config.importanceTags || ['core', 'config'],
      maxSummaryLength: config.maxSummaryLength || 500,
      ...config
    };

    this.tokenizer = new natural.WordTokenizer();
    this.sentenceTokenizer = new natural.SentenceTokenizer();
    this.stemmer = natural.PorterStemmer;
    
    // Initialize compression algorithms
    this.algorithms = {
      summarization: this.summarizeContent.bind(this),
      truncation: this.truncateContent.bind(this),
      'keyword-extraction': this.extractKeywords.bind(this)
    };
  }

  /**
   * Compress content based on token count and importance
   * トークン数と重要度に基づいてコンテンツを圧縮
   */
  compressContent(content, metadata = {}) {
    try {
      const tokens = this.estimateTokenCount(content);
      const importance = metadata.importance || 'normal';
      
      // Skip compression if below threshold or high importance
      if (tokens <= this.config.tokenThreshold || 
          (this.config.preserveImportant && this.config.importanceTags.includes(importance))) {
        return {
          compressed: false,
          originalContent: content,
          compressedContent: content,
          compressionRatio: 1.0,
          tokens: tokens,
          algorithm: 'none',
          summary: null
        };
      }

      // Choose compression algorithm based on content type
      const algorithm = this.selectCompressionAlgorithm(content, metadata);
      const result = this.algorithms[algorithm](content, metadata);
      
      return {
        compressed: true,
        originalContent: content,
        compressedContent: result.content,
        compressionRatio: result.compressionRatio,
        tokens: tokens,
        compressedTokens: this.estimateTokenCount(result.content),
        algorithm: algorithm,
        summary: result.summary,
        metadata: {
          ...metadata,
          compressedAt: new Date().toISOString(),
          compressionAlgorithm: algorithm
        }
      };
    } catch (error) {
      console.error('❌ Compression failed:', error);
      return {
        compressed: false,
        originalContent: content,
        compressedContent: content,
        compressionRatio: 1.0,
        tokens: this.estimateTokenCount(content),
        algorithm: 'error',
        summary: null,
        error: error.message
      };
    }
  }

  /**
   * Select appropriate compression algorithm based on content type
   * コンテンツタイプに基づいて適切な圧縮アルゴリズムを選択
   */
  selectCompressionAlgorithm(content, metadata) {
    const ext = metadata.extension || '';
    
    // Code files: prefer summarization
    if (['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rs'].includes(ext)) {
      return 'summarization';
    }
    
    // Documentation files: prefer keyword extraction
    if (['.md', '.txt', '.rst'].includes(ext)) {
      return 'keyword-extraction';
    }
    
    // Configuration files: prefer truncation (preserve structure)
    if (['.json', '.yaml', '.yml', '.xml'].includes(ext)) {
      return 'truncation';
    }
    
    // Default: summarization
    return 'summarization';
  }

  /**
   * Summarize content by extracting key information
   * 重要な情報を抽出してコンテンツを要約
   */
  summarizeContent(content, metadata) {
    try {
      const ext = metadata.extension || '';
      
      if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
        return this.summarizeCode(content, metadata);
      } else if (['.md', '.txt'].includes(ext)) {
        return this.summarizeText(content, metadata);
      } else {
        return this.summarizeGeneric(content, metadata);
      }
    } catch (error) {
      console.warn('⚠️ Summarization failed, falling back to truncation:', error.message);
      return this.truncateContent(content, metadata);
    }
  }

  /**
   * Summarize JavaScript/TypeScript code
   * JavaScript/TypeScriptコードを要約
   */
  summarizeCode(content, metadata) {
    try {
      const parser = Parser.extend(jsx());
      const ast = parser.parse(content, {
        ecmaVersion: 2022,
        sourceType: 'module',
        allowHashBang: true
      });

      const summary = {
        functions: [],
        classes: [],
        imports: [],
        exports: [],
        keyLines: []
      };

      // Extract key information from AST
      walk(ast, {
        FunctionDeclaration: (node) => {
          summary.functions.push({
            name: node.id?.name || 'anonymous',
            params: node.params.length,
            line: node.loc?.start.line,
            body: this.extractFunctionBody(node.body)
          });
        },
        ClassDeclaration: (node) => {
          summary.classes.push({
            name: node.id?.name,
            line: node.loc?.start.line,
            methods: this.extractClassMethods(node.body)
          });
        },
        ImportDeclaration: (node) => {
          summary.imports.push({
            source: node.source.value,
            specifiers: node.specifiers.map(spec => ({
              type: spec.type,
              name: spec.local?.name || spec.imported?.name
            }))
          });
        },
        ExportDeclaration: (node) => {
          summary.exports.push({
            type: node.type,
            line: node.loc?.start.line,
            declaration: node.declaration?.type
          });
        }
      });

      // Extract key lines (comments, important statements)
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || 
            trimmed.includes('TODO') || trimmed.includes('FIXME') ||
            trimmed.includes('console.log') || trimmed.includes('debugger')) {
          summary.keyLines.push({
            line: index + 1,
            content: trimmed
          });
        }
      });

      // Create compressed content
      const compressedContent = this.createCodeSummary(summary, content);
      const compressionRatio = compressedContent.length / content.length;

      return {
        content: compressedContent,
        compressionRatio: Math.max(compressionRatio, this.config.compressionRatio),
        summary: summary
      };
    } catch (error) {
      console.warn('⚠️ Code summarization failed:', error.message);
      return this.truncateContent(content, metadata);
    }
  }

  /**
   * Summarize text content (markdown, plain text)
   * テキストコンテンツ（マークダウン、プレーンテキスト）を要約
   */
  summarizeText(content, metadata) {
    try {
      const sentences = this.sentenceTokenizer.tokenize(content);
      const words = this.tokenizer.tokenize(content.toLowerCase());
      
      // Calculate word frequencies
      const wordFreq = new Map();
      words.forEach(word => {
        if (word.length > 3) { // Filter short words
          wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
        }
      });

      // Score sentences based on word frequency and position
      const sentenceScores = sentences.map((sentence, index) => {
        const sentenceWords = this.tokenizer.tokenize(sentence.toLowerCase());
        let score = 0;
        
        sentenceWords.forEach(word => {
          score += wordFreq.get(word) || 0;
        });
        
        // Boost score for sentences at the beginning
        score += Math.max(0, (sentences.length - index) / sentences.length) * 10;
        
        return { sentence, score, index };
      });

      // Select top sentences
      const topSentences = sentenceScores
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.ceil(sentences.length * this.config.compressionRatio))
        .sort((a, b) => a.index - b.index);

      const compressedContent = topSentences.map(s => s.sentence).join(' ');
      const compressionRatio = compressedContent.length / content.length;

      return {
        content: compressedContent,
        compressionRatio: Math.max(compressionRatio, this.config.compressionRatio),
        summary: {
          originalSentences: sentences.length,
          selectedSentences: topSentences.length,
          topWords: Array.from(wordFreq.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word, freq]) => ({ word, frequency: freq }))
        }
      };
    } catch (error) {
      console.warn('⚠️ Text summarization failed:', error.message);
      return this.truncateContent(content, metadata);
    }
  }

  /**
   * Summarize generic content
   * 汎用コンテンツを要約
   */
  summarizeGeneric(content, metadata) {
    try {
      const lines = content.split('\n');
      const importantLines = [];
      
      // Extract important lines based on patterns
      lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (trimmed && (
          trimmed.startsWith('#') || // Headers
          trimmed.startsWith('*') || // Lists
          trimmed.includes('=') || // Assignments
          trimmed.includes(':') || // Key-value pairs
          trimmed.length > 50 // Long lines
        )) {
          importantLines.push({
            line: index + 1,
            content: trimmed
          });
        }
      });

      // Select top lines
      const selectedLines = importantLines
        .slice(0, Math.ceil(importantLines.length * this.config.compressionRatio))
        .map(item => item.content);

      const compressedContent = selectedLines.join('\n');
      const compressionRatio = compressedContent.length / content.length;

      return {
        content: compressedContent,
        compressionRatio: Math.max(compressionRatio, this.config.compressionRatio),
        summary: {
          originalLines: lines.length,
          importantLines: importantLines.length,
          selectedLines: selectedLines.length
        }
      };
    } catch (error) {
      console.warn('⚠️ Generic summarization failed:', error.message);
      return this.truncateContent(content, metadata);
    }
  }

  /**
   * Truncate content to fit within limits
   * 制限内に収まるようにコンテンツを切り詰め
   */
  truncateContent(content, metadata) {
    try {
      const maxLength = Math.floor(content.length * this.config.compressionRatio);
      
      if (content.length <= maxLength) {
        return {
          content: content,
          compressionRatio: 1.0,
          summary: { method: 'no_truncation_needed' }
        };
      }

      // Smart truncation: try to break at word boundaries
      const truncated = content.substring(0, maxLength);
      const lastSpaceIndex = truncated.lastIndexOf(' ');
      const lastNewlineIndex = truncated.lastIndexOf('\n');
      
      const breakPoint = Math.max(lastSpaceIndex, lastNewlineIndex);
      const smartTruncated = breakPoint > maxLength * 0.8 
        ? truncated.substring(0, breakPoint) + '\n...'
        : truncated + '...';

      return {
        content: smartTruncated,
        compressionRatio: smartTruncated.length / content.length,
        summary: { 
          method: 'truncation',
          originalLength: content.length,
          truncatedLength: smartTruncated.length
        }
      };
    } catch (error) {
      console.error('❌ Truncation failed:', error);
      return {
        content: content,
        compressionRatio: 1.0,
        summary: { method: 'truncation_failed', error: error.message }
      };
    }
  }

  /**
   * Extract keywords from content
   * コンテンツからキーワードを抽出
   */
  extractKeywords(content, metadata) {
    try {
      const words = this.tokenizer.tokenize(content.toLowerCase());
      const filteredWords = words.filter(word => 
        word.length > 3 && 
        !this.isStopWord(word) &&
        /^[a-zA-Z]+$/.test(word) // Only alphabetic words
      );

      // Count word frequencies
      const wordFreq = new Map();
      filteredWords.forEach(word => {
        const stemmed = this.stemmer.stem(word);
        wordFreq.set(stemmed, (wordFreq.get(stemmed) || 0) + 1);
      });

      // Get top keywords
      const topKeywords = Array.from(wordFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([word, freq]) => ({ word, frequency: freq }));

      // Create keyword-based summary
      const keywordSummary = topKeywords
        .map(kw => `${kw.word} (${kw.frequency})`)
        .join(', ');

      const compressedContent = `Keywords: ${keywordSummary}\n\n${this.truncateContent(content, metadata).content}`;
      const compressionRatio = compressedContent.length / content.length;

      return {
        content: compressedContent,
        compressionRatio: Math.max(compressionRatio, this.config.compressionRatio),
        summary: {
          method: 'keyword_extraction',
          keywords: topKeywords,
          totalWords: filteredWords.length,
          uniqueWords: wordFreq.size
        }
      };
    } catch (error) {
      console.warn('⚠️ Keyword extraction failed:', error.message);
      return this.truncateContent(content, metadata);
    }
  }

  /**
   * Create code summary from extracted information
   * 抽出された情報からコード要約を作成
   */
  createCodeSummary(summary, originalContent) {
    const parts = [];

    // Add imports
    if (summary.imports.length > 0) {
      parts.push('// Imports:');
      summary.imports.forEach(imp => {
        parts.push(`import { ${imp.specifiers.map(s => s.name).join(', ')} } from '${imp.source}';`);
      });
      parts.push('');
    }

    // Add classes
    if (summary.classes.length > 0) {
      parts.push('// Classes:');
      summary.classes.forEach(cls => {
        parts.push(`class ${cls.name} {`);
        if (cls.methods.length > 0) {
          cls.methods.forEach(method => {
            parts.push(`  ${method.name}(${method.params}) { ... }`);
          });
        }
        parts.push('}');
      });
      parts.push('');
    }

    // Add functions
    if (summary.functions.length > 0) {
      parts.push('// Functions:');
      summary.functions.forEach(func => {
        parts.push(`${func.name}(${func.params} params) { ... }`);
      });
      parts.push('');
    }

    // Add exports
    if (summary.exports.length > 0) {
      parts.push('// Exports:');
      summary.exports.forEach(exp => {
        parts.push(`export ${exp.type} ...`);
      });
      parts.push('');
    }

    // Add key lines
    if (summary.keyLines.length > 0) {
      parts.push('// Key Lines:');
      summary.keyLines.slice(0, 10).forEach(line => {
        parts.push(`// Line ${line.line}: ${line.content}`);
      });
    }

    return parts.join('\n');
  }

  /**
   * Extract function body information
   * 関数ボディ情報を抽出
   */
  extractFunctionBody(body) {
    if (!body || !body.body) return null;
    
    const statements = body.body.slice(0, 3); // First 3 statements
    return statements.map(stmt => stmt.type).join(', ');
  }

  /**
   * Extract class methods
   * クラスメソッドを抽出
   */
  extractClassMethods(classBody) {
    if (!classBody || !classBody.body) return [];
    
    return classBody.body
      .filter(member => member.type === 'MethodDefinition')
      .map(method => ({
        name: method.key.name,
        params: method.value.params.length,
        type: method.kind
      }));
  }

  /**
   * Check if word is a stop word
   * 単語がストップワードかチェック
   */
  isStopWord(word) {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
      'before', 'after', 'above', 'below', 'between', 'among', 'is', 'are',
      'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
      'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
      'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it',
      'we', 'they', 'me', 'him', 'her', 'us', 'them'
    ]);
    
    return stopWords.has(word.toLowerCase());
  }

  /**
   * Estimate token count for content
   * コンテンツのトークン数を推定
   */
  estimateTokenCount(content) {
    // Simple estimation: ~4 characters per token
    return Math.ceil(content.length / 4);
  }

  /**
   * Get compression statistics
   * 圧縮統計を取得
   */
  getCompressionStats() {
    return {
      algorithms: Object.keys(this.algorithms),
      tokenThreshold: this.config.tokenThreshold,
      compressionRatio: this.config.compressionRatio,
      preserveImportant: this.config.preserveImportant,
      importanceTags: this.config.importanceTags
    };
  }
}

export default ContentCompressor;
