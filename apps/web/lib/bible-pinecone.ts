import { EmbeddingService } from './embeddings';
import { bibleService } from './bible-service';

export interface BibleVector {
  id: string;
  values: number[];
  metadata: {
    book: string;
    chapter: number;
    verse: number;
    reference: string;
    text: string;
    version: string;
    content: string;
    type: 'bible_verse' | 'bible_chapter' | 'bible_book';
    timestamp: string;
  };
}

export interface BibleSearchResult {
  id: string;
  score: number;
  reference: string;
  text: string;
  book: string;
  chapter: number;
  verse: number;
  version: string;
  metadata: Record<string, any>;
}

export class BiblePineconeService {
  private static defaultTopK = Number(process.env.PINECONE_TOPK || 10);
  private static minSimilarity = Number(process.env.PINECONE_MIN_SIMILARITY || 0.7);
  private static batchSize = Number(process.env.PINECONE_BATCH_SIZE || 50);
  private static maxRetries = Number(process.env.PINECONE_MAX_RETRIES || 3);
  private static backoffMs = Number(process.env.PINECONE_BACKOFF_MS || 300);
  private static targetDim = Number(process.env.PINECONE_DIMENSION || 1024);

  // Utility: sleep
  private static async sleep(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
  }

  // Initialize Pinecone connection
  private static async initializePinecone() {
    const apiKey = process.env.PINECONE_API_KEY || '';
    if (!apiKey) {
      console.warn('Missing Pinecone configuration. RAG features will be disabled.');
      return null;
    }

    try {
      // Get the index host from the API
      const response = await fetch('https://api.pinecone.io/indexes', {
        headers: {
          'Api-Key': apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn(`Pinecone API error: ${response.status}. RAG features will be disabled.`);
        return null;
      }

      const data = await response.json();
      const shieldaiIndex = data.indexes.find((idx: any) => idx.name === 'shieldai');
    
      if (!shieldaiIndex) {
        throw new Error('shieldai index not found');
      }

      return { apiKey, indexHost: shieldaiIndex.host };
    } catch (error) {
      console.warn('Pinecone connection failed. RAG features will be disabled.', error);
      return null;
    }
  }

  // Generate namespace for Bible chapter (e.g., "genesis_1", "john_3")
  private static generateChapterNamespace(book: string, chapter: number): string {
    return `${book.toLowerCase().replace(/\s+/g, '_')}_${chapter}`;
  }

  // Generate namespace for Bible book (e.g., "genesis", "john")
  private static generateBookNamespace(book: string): string {
    return book.toLowerCase().replace(/\s+/g, '_');
  }

  // Store Bible verse in Pinecone with chapter namespace
  static async storeBibleVerse(
    verse: {
      id: string;
      book: string;
      chapter: number;
      verse: number;
      reference: string;
      text: string;
      version: string;
    },
    embedding: number[]
  ): Promise<void> {
    try {
      const { apiKey, indexHost } = await this.initializePinecone();
      
      // Match target index dimension
      const values = this.targetDim === 1536 ? embedding : EmbeddingService.convertTo1024Dimensions(embedding);
      
      // Create chapter namespace
      const chapterNamespace = this.generateChapterNamespace(verse.book, verse.chapter);
      
      // Create verse ID
      const verseId = `${verse.book.toLowerCase()}_${verse.chapter}_${verse.verse}`;
      
      const vector: BibleVector = {
        id: verseId,
        values,
        metadata: {
          book: verse.book,
          chapter: verse.chapter,
          verse: verse.verse,
          reference: verse.reference,
          text: verse.text,
          version: verse.version,
          content: verse.text,
          type: 'bible_verse',
          timestamp: new Date().toISOString(),
        },
      };

      await this.upsertBatched(apiKey, indexHost, [vector], chapterNamespace);
      console.log(`✅ Stored Bible verse in Pinecone: ${verse.reference} (namespace: ${chapterNamespace})`);
    } catch (error) {
      console.error(`❌ Error storing Bible verse ${verse.reference}:`, error);
      throw error;
    }
  }

  // Store entire Bible chapter in Pinecone
  static async storeBibleChapter(
    book: string,
    chapter: number,
    verses: Array<{
      verse: number;
      text: string;
      reference: string;
    }>,
    version: string,
    embeddings: number[][]
  ): Promise<void> {
    try {
      const { apiKey, indexHost } = await this.initializePinecone();
      const chapterNamespace = this.generateChapterNamespace(book, chapter);
      
      const vectors: BibleVector[] = verses.map((verse, index) => {
        const embedding = embeddings[index];
        const values = this.targetDim === 1536 ? embedding : EmbeddingService.convertTo1024Dimensions(embedding);
        
        return {
          id: `${book.toLowerCase()}_${chapter}_${verse.verse}`,
          values,
          metadata: {
            book,
            chapter,
            verse: verse.verse,
            reference: verse.reference,
            text: verse.text,
            version,
            content: verse.text,
            type: 'bible_verse',
            timestamp: new Date().toISOString(),
          },
        };
      });

      await this.upsertBatched(apiKey, indexHost, vectors, chapterNamespace);
      console.log(`✅ Stored Bible chapter in Pinecone: ${book} ${chapter} (${verses.length} verses, namespace: ${chapterNamespace})`);
    } catch (error) {
      console.error(`❌ Error storing Bible chapter ${book} ${chapter}:`, error);
      throw error;
    }
  }

  // Search for Bible content across all namespaces
  static async searchBibleContent(
    queryEmbedding: number[],
    topK: number = 10,
    filters?: {
      book?: string;
      chapter?: number;
      version?: string;
      type?: 'bible_verse' | 'bible_chapter' | 'bible_book';
    }
  ): Promise<BibleSearchResult[]> {
    try {
      const pineconeConfig = await this.initializePinecone();
      if (!pineconeConfig) {
        console.warn('Pinecone not available, returning empty search results');
        return [];
      }
      
      const { apiKey, indexHost } = pineconeConfig;
      
      // Match target index dimension
      const queryVec = this.targetDim === 1536 ? queryEmbedding : EmbeddingService.convertTo1024Dimensions(queryEmbedding);
      
      // Build filter
      const filter: any = {};
      if (filters?.book) filter.book = filters.book;
      if (filters?.chapter) filter.chapter = filters.chapter;
      if (filters?.version) filter.version = filters.version;
      if (filters?.type) filter.type = filters.type;

      const response = await fetch(`https://${indexHost}/query`, {
        method: 'POST',
        headers: {
          'Api-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vector: queryVec,
          topK: topK || this.defaultTopK,
          filter,
          includeMetadata: true,
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to search Bible content: ${response.status}`);
      }

      const data = await response.json();
      
      const gated = (data.matches || []).filter((m: any) => (m.score || 0) >= this.minSimilarity);

      return gated.map((match: any) => ({
        id: match.id,
        score: match.score || 0,
        reference: String(match.metadata?.reference || ''),
        text: String(match.metadata?.text || ''),
        book: String(match.metadata?.book || ''),
        chapter: Number(match.metadata?.chapter || 0),
        verse: Number(match.metadata?.verse || 0),
        version: String(match.metadata?.version || ''),
        metadata: match.metadata,
      }));
    } catch (error) {
      console.error('❌ Error searching Bible content in Pinecone:', error);
      return [];
    }
  }

  // Search within a specific Bible chapter namespace
  static async searchBibleChapter(
    book: string,
    chapter: number,
    queryEmbedding: number[],
    topK: number = 5
  ): Promise<BibleSearchResult[]> {
    try {
      const { apiKey, indexHost } = await this.initializePinecone();
      
      const queryVec = this.targetDim === 1536 ? queryEmbedding : EmbeddingService.convertTo1024Dimensions(queryEmbedding);
      const chapterNamespace = this.generateChapterNamespace(book, chapter);
      
      const response = await fetch(`https://${indexHost}/query`, {
        method: 'POST',
        headers: {
          'Api-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vector: queryVec,
          topK: topK || this.defaultTopK,
          namespace: chapterNamespace,
          includeMetadata: true,
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to search Bible chapter: ${response.status}`);
      }

      const data = await response.json();
      
      const gated = (data.matches || []).filter((m: any) => (m.score || 0) >= this.minSimilarity);

      return gated.map((match: any) => ({
        id: match.id,
        score: match.score || 0,
        reference: String(match.metadata?.reference || ''),
        text: String(match.metadata?.text || ''),
        book: String(match.metadata?.book || ''),
        chapter: Number(match.metadata?.chapter || 0),
        verse: Number(match.metadata?.verse || 0),
        version: String(match.metadata?.version || ''),
        metadata: match.metadata,
      }));
    } catch (error) {
      console.error(`❌ Error searching Bible chapter ${book} ${chapter}:`, error);
      return [];
    }
  }

  // Get all Bible namespaces (chapters)
  static async getBibleNamespaces(): Promise<string[]> {
    try {
      const { apiKey, indexHost } = await this.initializePinecone();
      
      const response = await fetch(`https://${indexHost}/describe_index_stats`, {
        method: 'GET',
        headers: {
          'Api-Key': apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get index stats: ${response.status}`);
      }

      const data = await response.json();
      const namespaces = data.namespaces || {};
      
      // Filter for Bible namespaces (those containing book names)
      const bibleNamespaces = Object.keys(namespaces).filter(namespace => {
        // Check if namespace follows Bible naming pattern (book_chapter)
        return /^[a-z_]+_\d+$/.test(namespace);
      });

      return bibleNamespaces;
    } catch (error) {
      console.error('❌ Error getting Bible namespaces:', error);
      return [];
    }
  }

  // Utility: batched upsert with retries
  private static async upsertBatched(
    apiKey: string,
    indexHost: string,
    vectors: BibleVector[],
    namespace: string
  ) {
    for (let i = 0; i < vectors.length; i += this.batchSize) {
      const chunk = vectors.slice(i, i + this.batchSize);
      let attempt = 0;
      
      while (true) {
        try {
          const res = await fetch(`https://${indexHost}/vectors/upsert`, {
            method: 'POST',
            headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              vectors: chunk,
              namespace,
            }),
          });
          
          if (!res.ok) throw new Error(`Upsert failed: ${res.status}`);
          break;
        } catch (err) {
          attempt += 1;
          if (attempt > this.maxRetries) throw err;
          await this.sleep(this.backoffMs * attempt);
        }
      }
    }
  }

  // Bulk import Bible content from API
  static async bulkImportBible(
    versionId: string,
    books: string[] = [],
    maxChapters: number = 50 // Limit for testing
  ): Promise<void> {
    try {
      console.log(`🚀 Starting bulk import of Bible version: ${versionId}`);
      
      const version = await bibleService.getBibleVersion(versionId);
      if (!version) {
        throw new Error(`Bible version not found: ${versionId}`);
      }

      // Get all books if none specified
      let targetBooks = books;
      if (books.length === 0) {
        const allBooks = await bibleService.getBooks(versionId);
        targetBooks = allBooks.map(book => book.name);
      }

      let totalChapters = 0;
      
      for (const bookName of targetBooks) {
        if (totalChapters >= maxChapters) break;
        
        try {
          // Get all books and find the one by name
          const allBooks = await bibleService.getBooks(versionId);
          const book = allBooks.find((b: any) => b.name === bookName);
          if (!book) continue;

          const chapters = await bibleService.getChapters(versionId, book.id);
          
          for (const chapter of chapters) {
            if (totalChapters >= maxChapters) break;
            
            try {
              const passage = await bibleService.getPassage(versionId, chapter.id);
              if (!passage || !passage.verses || passage.verses.length === 0) continue;

              // Generate embeddings for all verses in the chapter
              const verseTexts = passage.verses.map((v: any) => v.text);
              const embeddings = await Promise.all(
                verseTexts.map((text: string) => EmbeddingService.generateEmbedding(text))
              );

              // Store the chapter
              await this.storeBibleChapter(
                bookName,
                chapter.number,
                passage.verses.map((v: any) => ({
                  verse: v.verseNumber,
                  text: v.text,
                  reference: v.reference,
                })),
                version.name,
                embeddings
              );

              totalChapters++;
              console.log(`✅ Imported ${bookName} ${chapter.number} (${passage.verses.length} verses)`);
              
              // Small delay to avoid overwhelming the API
              await this.sleep(100);
            } catch (error) {
              console.error(`❌ Error importing chapter ${bookName} ${chapter.number}:`, error);
            }
          }
        } catch (error) {
          console.error(`❌ Error importing book ${bookName}:`, error);
        }
      }

      console.log(`🎉 Bulk import completed! Imported ${totalChapters} chapters from ${targetBooks.length} books.`);
    } catch (error) {
      console.error('❌ Error in bulk import:', error);
      throw error;
    }
  }
}
