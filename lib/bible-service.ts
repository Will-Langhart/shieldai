import axios from 'axios';
import { supabase } from './supabase';

export interface BibleVersion {
  id: string;
  name: string;
  description: string;
  language: {
    id: string;
    name: string;
  };
  type: string;
}

export interface BibleVerse {
  id: string;
  text: string;
  reference: string;
  verseNumber: number;
  chapterNumber: number;
  bookName: string;
}

export interface BiblePassage {
  id: string;
  reference: string;
  text: string;
  content?: string; // Add content field for API responses
  verses: BibleVerse[];
  version: BibleVersion;
}

export interface BibleSearchResult {
  query: string;
  total: number;
  passages: BiblePassage[];
}

class BibleService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.BIBLE_API_KEY || '';
    this.baseUrl = process.env.BIBLE_API_BASE_URL || 'https://api.scripture.api.bible/v1';
  }

  private getHeaders() {
    return {
      'api-key': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  // Get available Bible versions
  async getBibleVersions(): Promise<BibleVersion[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/bibles`, {
        headers: this.getHeaders(),
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching Bible versions:', error);
      throw new Error('Failed to fetch Bible versions');
    }
  }

  // Get a specific Bible version
  async getBibleVersion(versionId: string): Promise<BibleVersion | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/bibles/${versionId}`, {
        headers: this.getHeaders(),
      });
      return response.data.data || null;
    } catch (error) {
      console.error('Error fetching Bible version:', error);
      return null;
    }
  }

  // Get books in a Bible version
  async getBooks(versionId: string): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/bibles/${versionId}/books`, {
        headers: this.getHeaders(),
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching books:', error);
      throw new Error('Failed to fetch books');
    }
  }

  // Get chapters in a book
  async getChapters(versionId: string, bookId: string): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/bibles/${versionId}/books/${bookId}/chapters`, {
        headers: this.getHeaders(),
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching chapters:', error);
      throw new Error('Failed to fetch chapters');
    }
  }

  // Get verses in a chapter
  async getVerses(versionId: string, chapterId: string): Promise<BibleVerse[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/bibles/${versionId}/chapters/${chapterId}/verses`, {
        headers: this.getHeaders(),
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching verses:', error);
      throw new Error('Failed to fetch verses');
    }
  }

  // Get a specific verse
  async getVerse(versionId: string, verseId: string): Promise<BibleVerse | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/bibles/${versionId}/verses/${verseId}`, {
        headers: this.getHeaders(),
      });
      return response.data.data || null;
    } catch (error) {
      console.error('Error fetching verse:', error);
      return null;
    }
  }

  // Get a passage (range of verses)
  async getPassage(versionId: string, passageId: string): Promise<BiblePassage | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/bibles/${versionId}/passages/${passageId}`, {
        headers: this.getHeaders(),
      });
      return response.data.data || null;
    } catch (error) {
      console.error('Error fetching passage:', error);
      return null;
    }
  }

  // Search the Bible
  async searchBible(versionId: string, query: string, limit: number = 10): Promise<BibleSearchResult> {
    try {
      const response = await axios.get(`${this.baseUrl}/bibles/${versionId}/search`, {
        headers: this.getHeaders(),
        params: {
          query,
          limit,
          sort: 'relevance',
        },
      });
      
      // Transform the API response to match our expected structure
      const apiData = response.data.data || response.data;
      const verses = apiData.verses || [];
      
      // Helper function to strip HTML tags
      const stripHtml = (html: string) => {
        return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
      };

      // Convert verses to passages format
      const passages = verses.map((verse: any) => ({
        id: verse.id,
        reference: verse.reference,
        text: stripHtml(verse.text),
        verses: [{
          id: verse.id,
          text: stripHtml(verse.text),
          reference: verse.reference,
          verseNumber: parseInt(verse.reference.split(':')[1]) || 0,
          chapterNumber: parseInt(verse.reference.split(':')[0].split(' ').pop()) || 0,
          bookName: verse.reference.split(' ')[0]
        }],
        version: {
          name: 'KJV' // Default to KJV for now
        }
      }));

      return {
        query: apiData.query || query,
        total: apiData.total || verses.length,
        passages: passages
      };
    } catch (error) {
      console.error('Error searching Bible:', error);
      throw new Error('Failed to search Bible');
    }
  }

  // Convert reference format (e.g., "John 3:16" to "JHN.3.16")
  private convertReferenceFormat(reference: string): string {
    const bookMappings: { [key: string]: string } = {
      'Genesis': 'GEN', 'Exodus': 'EXO', 'Leviticus': 'LEV', 'Numbers': 'NUM', 'Deuteronomy': 'DEU',
      'Joshua': 'JOS', 'Judges': 'JDG', 'Ruth': 'RUT', '1 Samuel': '1SA', '2 Samuel': '2SA',
      '1 Kings': '1KI', '2 Kings': '2KI', '1 Chronicles': '1CH', '2 Chronicles': '2CH',
      'Ezra': 'EZR', 'Nehemiah': 'NEH', 'Esther': 'EST', 'Job': 'JOB', 'Psalms': 'PSA',
      'Proverbs': 'PRO', 'Ecclesiastes': 'ECC', 'Song of Solomon': 'SNG', 'Isaiah': 'ISA',
      'Jeremiah': 'JER', 'Lamentations': 'LAM', 'Ezekiel': 'EZK', 'Daniel': 'DAN',
      'Hosea': 'HOS', 'Joel': 'JOL', 'Amos': 'AMO', 'Obadiah': 'OBA', 'Jonah': 'JON',
      'Micah': 'MIC', 'Nahum': 'NAH', 'Habakkuk': 'HAB', 'Zephaniah': 'ZEP', 'Haggai': 'HAG',
      'Zechariah': 'ZEC', 'Malachi': 'MAL',
      'Matthew': 'MAT', 'Mark': 'MRK', 'Luke': 'LUK', 'John': 'JHN', 'Acts': 'ACT',
      'Romans': 'ROM', '1 Corinthians': '1CO', '2 Corinthians': '2CO', 'Galatians': 'GAL',
      'Ephesians': 'EPH', 'Philippians': 'PHP', 'Colossians': 'COL', '1 Thessalonians': '1TH',
      '2 Thessalonians': '2TH', '1 Timothy': '1TI', '2 Timothy': '2TI', 'Titus': 'TIT',
      'Philemon': 'PHM', 'Hebrews': 'HEB', 'James': 'JAS', '1 Peter': '1PE', '2 Peter': '2PE',
      '1 John': '1JN', '2 John': '2JN', '3 John': '3JN', 'Jude': 'JUD', 'Revelation': 'REV'
    };

    // Try to match the reference format
    const match = reference.match(/^([1-3]?\s*[A-Za-z]+)\s+(\d+):(\d+)$/);
    if (match) {
      const [, bookName, chapter, verse] = match;
      const bookCode = bookMappings[bookName.trim()];
      if (bookCode) {
        return `${bookCode}.${chapter}.${verse}`;
      }
    }

    // If no match, return the original reference
    return reference;
  }

  // Get verse by reference (e.g., "John 3:16")
  async getVerseByReference(versionId: string, reference: string): Promise<BiblePassage | null> {
    try {
      const convertedReference = this.convertReferenceFormat(reference);
      const response = await axios.get(`${this.baseUrl}/bibles/${versionId}/passages/${encodeURIComponent(convertedReference)}`, {
        headers: this.getHeaders(),
      });
      return response.data.data || null;
    } catch (error) {
      console.error('Error fetching verse by reference:', error);
      return null;
    }
  }

  // Get popular verses for apologetics
  async getPopularVerses(versionId: string): Promise<BiblePassage[]> {
    const popularReferences = [
      'John 3:16',
      'Romans 3:23',
      'Romans 6:23',
      'Ephesians 2:8-9',
      'John 14:6',
      'Acts 4:12',
      '1 Peter 3:15',
      '2 Timothy 3:16',
      'Hebrews 11:1',
      'Matthew 28:19-20',
    ];

    const passages: BiblePassage[] = [];
    
    for (const reference of popularReferences) {
      try {
        const passage = await this.getVerseByReference(versionId, reference);
        if (passage) {
          // Helper function to strip HTML tags
          const stripHtml = (html: string) => {
            return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
          };

          // Transform the passage to match our expected structure
          const transformedPassage: BiblePassage = {
            id: passage.id,
            reference: passage.reference,
            text: stripHtml(passage.content || passage.text || ''),
            verses: [{
              id: passage.id,
              text: stripHtml((passage.content || passage.text || '').toString()),
              reference: passage.reference,
              verseNumber: parseInt(passage.reference.split(':')[1]) || 0,
              chapterNumber: parseInt(passage.reference.split(':')[0].split(' ').pop() || '0') || 0,
              bookName: passage.reference.split(' ')[0] || ''
            }],
            version: {
              id: versionId,
              name: 'KJV',
              description: 'King James Version',
              language: { id: 'eng', name: 'English' },
              type: 'text'
            }
          };
          passages.push(transformedPassage);
        }
      } catch (error) {
        console.error(`Error fetching ${reference}:`, error);
      }
    }

    return passages;
  }

  // Get apologetics-focused verse collections
  async getApologeticsVerses(versionId: string, category: string): Promise<BiblePassage[]> {
    const apologeticsCollections: { [key: string]: string[] } = {
      'existence-of-god': [
        'Romans 1:20',
        'Psalm 19:1',
        'Hebrews 11:3',
        'Genesis 1:1',
        'John 1:1-3'
      ],
      'problem-of-evil': [
        'Romans 8:28',
        'Genesis 50:20',
        'James 1:2-4',
        '1 Peter 1:6-7',
        'Revelation 21:4'
      ],
      'resurrection': [
        '1 Corinthians 15:3-4',
        'John 20:27-29',
        'Acts 1:3',
        '1 Corinthians 15:14',
        'Romans 10:9'
      ],
      'salvation': [
        'John 3:16',
        'Romans 3:23',
        'Romans 6:23',
        'Ephesians 2:8-9',
        'Acts 4:12'
      ],
      'bible-reliability': [
        '2 Timothy 3:16',
        '2 Peter 1:20-21',
        'Psalm 119:160',
        'John 17:17',
        'Matthew 5:18'
      ],
      'witnessing': [
        '1 Peter 3:15',
        'Matthew 28:19-20',
        'Acts 1:8',
        'Romans 10:14-15',
        '2 Timothy 4:2'
      ],
      'faith-and-reason': [
        'Hebrews 11:1',
        'Isaiah 1:18',
        '1 Peter 3:15',
        'Romans 12:2',
        '2 Corinthians 10:5'
      ],
      'creation': [
        'Genesis 1:1',
        'Psalm 139:13-14',
        'Colossians 1:16',
        'Hebrews 11:3',
        'Romans 1:20'
      ]
    };

    const references = apologeticsCollections[category] || [];
    const passages: BiblePassage[] = [];

    for (const reference of references) {
      try {
        const passage = await this.getVerseByReference(versionId, reference);
        if (passage) {
          const stripHtml = (html: string) => {
            return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
          };

          const transformedPassage: BiblePassage = {
            id: passage.id,
            reference: passage.reference,
            text: stripHtml(passage.content || passage.text || ''),
            verses: [{
              id: passage.id,
              text: stripHtml((passage.content || passage.text || '').toString()),
              reference: passage.reference,
              verseNumber: parseInt(passage.reference.split(':')[1]) || 0,
              chapterNumber: parseInt(passage.reference.split(':')[0].split(' ').pop() || '0') || 0,
              bookName: passage.reference.split(' ')[0] || ''
            }],
            version: {
              id: versionId,
              name: 'KJV',
              description: 'King James Version',
              language: { id: 'eng', name: 'English' },
              type: 'text'
            }
          };
          passages.push(transformedPassage);
        }
      } catch (error) {
        console.error(`Error fetching ${reference}:`, error);
      }
    }

    return passages;
  }

  // Get verse suggestions based on conversation context
  async getVerseSuggestions(context: string, versionId: string): Promise<BiblePassage[]> {
    // Extract key themes from conversation context
    const themes = this.extractThemes(context);
    const suggestions: BiblePassage[] = [];

    for (const theme of themes) {
      try {
        const results = await this.getVersesByTopic(versionId, theme);
        if (results.passages && results.passages.length > 0) {
          suggestions.push(...results.passages.slice(0, 2)); // Limit to 2 verses per theme
        }
      } catch (error) {
        console.error(`Error getting suggestions for theme ${theme}:`, error);
      }
    }

    // Remove duplicates and limit total results
    const uniqueSuggestions = suggestions.filter((passage, index, self) => 
      index === self.findIndex(p => p.id === passage.id)
    );

    return uniqueSuggestions.slice(0, 5);
  }

  // Extract themes from conversation context
  private extractThemes(context: string): string[] {
    const themeKeywords: { [key: string]: string[] } = {
      'salvation': ['salvation', 'saved', 'redeem', 'redemption', 'born again', 'eternal life'],
      'faith': ['faith', 'believe', 'trust', 'doubt', 'unbelief'],
      'love': ['love', 'charity', 'agape', 'compassion', 'mercy'],
      'forgiveness': ['forgive', 'forgiveness', 'pardon', 'sin', 'repentance'],
      'hope': ['hope', 'hope in', 'hope for', 'despair', 'discouragement'],
      'wisdom': ['wisdom', 'wise', 'understanding', 'knowledge', 'foolish'],
      'prayer': ['pray', 'prayer', 'supplication', 'intercession'],
      'witness': ['witness', 'testimony', 'testify', 'evangelism', 'sharing'],
      'grace': ['grace', 'gracious', 'mercy', 'favor'],
      'creation': ['creation', 'created', 'design', 'intelligent design', 'evolution'],
      'resurrection': ['resurrection', 'raised', 'risen', 'tomb', 'empty'],
      'bible': ['bible', 'scripture', 'word of god', 'inspired', 'authority'],
      'god': ['god', 'lord', 'jesus', 'christ', 'holy spirit', 'trinity'],
      'sin': ['sin', 'sinful', 'transgression', 'iniquity', 'wickedness'],
      'heaven': ['heaven', 'eternal', 'paradise', 'kingdom of god'],
      'hell': ['hell', 'eternal punishment', 'damnation', 'lake of fire']
    };

    const contextLower = context.toLowerCase();
    const foundThemes: string[] = [];

    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      for (const keyword of keywords) {
        if (contextLower.includes(keyword)) {
          foundThemes.push(theme);
          break; // Found one keyword for this theme, move to next
        }
      }
    }

    return foundThemes.slice(0, 3); // Limit to top 3 themes
  }

  // Get daily verse for notifications
  async getDailyVerse(versionId: string): Promise<BiblePassage | null> {
    const dailyVerses = [
      'Psalm 119:105',
      'Proverbs 3:5-6',
      'Philippians 4:13',
      'Jeremiah 29:11',
      'Romans 8:28',
      'Isaiah 40:31',
      'Matthew 11:28',
      'John 14:27',
      'Galatians 5:22-23',
      'Colossians 3:23'
    ];

    // Use date to select a verse (changes daily)
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const selectedVerse = dailyVerses[dayOfYear % dailyVerses.length];

    try {
      const passage = await this.getVerseByReference(versionId, selectedVerse);
      if (passage) {
        const stripHtml = (html: string) => {
          return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
        };

        return {
          id: passage.id,
          reference: passage.reference,
          text: stripHtml(passage.content || passage.text || ''),
          verses: [{
            id: passage.id,
            text: stripHtml((passage.content || passage.text || '').toString()),
            reference: passage.reference,
            verseNumber: parseInt(passage.reference.split(':')[1]) || 0,
            chapterNumber: parseInt(passage.reference.split(':')[0].split(' ').pop() || '0') || 0,
            bookName: passage.reference.split(' ')[0] || ''
          }],
          version: {
            id: versionId,
            name: 'KJV',
            description: 'King James Version',
            language: { id: 'eng', name: 'English' },
            type: 'text'
          }
        };
      }
    } catch (error) {
      console.error(`Error fetching daily verse ${selectedVerse}:`, error);
    }

    return null;
  }

  // Get verse context for AI responses
  async getVerseContext(reference: string, versionId: string): Promise<{
    verse: BiblePassage;
    context: string;
    relatedVerses: BiblePassage[];
  } | null> {
    try {
      const verse = await this.getVerseByReference(versionId, reference);
      if (!verse) return null;

      // Get surrounding verses for context
      const [book, chapterVerse] = reference.split(' ');
      const [chapter, verseNum] = chapterVerse.split(':');
      
      // Get chapter context
      const chapterRef = `${book} ${chapter}`;
      const chapterPassage = await this.getVerseByReference(versionId, chapterRef);
      
      // Get related verses
      const relatedVerses = await this.getVersesByTopic(versionId, 'faith');

      return {
        verse: verse,
        context: chapterPassage ? (chapterPassage.content || chapterPassage.text || '').toString() : '',
        relatedVerses: relatedVerses.passages.slice(0, 3)
      };
    } catch (error) {
      console.error('Error getting verse context:', error);
      return null;
    }
  }

  // Get verses related to a specific topic
  async getVersesByTopic(versionId: string, topic: string): Promise<BibleSearchResult> {
    const topicKeywords: { [key: string]: string[] } = {
      'salvation': ['salvation', 'saved', 'redeem', 'redemption'],
      'faith': ['faith', 'believe', 'trust'],
      'love': ['love', 'charity', 'agape'],
      'forgiveness': ['forgive', 'forgiveness', 'pardon'],
      'hope': ['hope', 'hope in', 'hope for'],
      'wisdom': ['wisdom', 'wise', 'understanding'],
      'prayer': ['pray', 'prayer', 'supplication'],
      'witness': ['witness', 'testimony', 'testify'],
      'grace': ['grace', 'gracious'],
      'mercy': ['mercy', 'merciful'],
    };

    const keywords = topicKeywords[topic.toLowerCase()] || [topic];
    let allResults: BiblePassage[] = [];

    for (const keyword of keywords) {
      try {
        const result = await this.searchBible(versionId, keyword, 5);
        allResults = [...allResults, ...result.passages];
      } catch (error) {
        console.error(`Error searching for ${keyword}:`, error);
      }
    }

    // Remove duplicates based on passage ID
    const uniqueResults = allResults.filter((passage, index, self) => 
      index === self.findIndex(p => p.id === passage.id)
    );

    return {
      query: topic,
      total: uniqueResults.length,
      passages: uniqueResults.slice(0, 10),
    };
  }

  // Advanced search with filters
  async advancedSearch(params: {
    query: string;
    versionId: string;
    book?: string;
    chapter?: number;
    verse?: number;
    searchType?: 'exact' | 'contains' | 'starts_with' | 'ends_with';
    caseSensitive?: boolean;
    limit?: number;
  }): Promise<BibleSearchResult> {
    try {
      const searchParams = new URLSearchParams({
        query: params.query,
        limit: (params.limit || 20).toString(),
        sort: 'relevance',
      });

      if (params.searchType && params.searchType !== 'contains') {
        searchParams.append('searchType', params.searchType);
      }

      const response = await axios.get(`${this.baseUrl}/bibles/${params.versionId}/search`, {
        headers: this.getHeaders(),
        params: searchParams,
      });

      const apiData = response.data.data || response.data;
      const verses = apiData.verses || [];

      // Helper function to strip HTML tags
      const stripHtml = (html: string) => {
        return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
      };

      // Apply additional filters
      let filteredVerses = verses;
      
      if (params.book) {
        filteredVerses = filteredVerses.filter((verse: any) => 
          verse.reference.toLowerCase().includes(params.book!.toLowerCase())
        );
      }

      if (params.chapter) {
        filteredVerses = filteredVerses.filter((verse: any) => {
          const chapterMatch = verse.reference.match(/(\d+):/);
          return chapterMatch && parseInt(chapterMatch[1]) === params.chapter;
        });
      }

      if (params.verse) {
        filteredVerses = filteredVerses.filter((verse: any) => {
          const verseMatch = verse.reference.match(/:(\d+)/);
          return verseMatch && parseInt(verseMatch[1]) === params.verse;
        });
      }

      // Convert verses to passages format
      const passages = filteredVerses.map((verse: any) => ({
        id: verse.id,
        reference: verse.reference,
        text: stripHtml(verse.text),
        verses: [{
          id: verse.id,
          text: stripHtml(verse.text),
          reference: verse.reference,
          verseNumber: parseInt(verse.reference.split(':')[1]) || 0,
          chapterNumber: parseInt(verse.reference.split(':')[0].split(' ').pop()) || 0,
          bookName: verse.reference.split(' ')[0]
        }],
        version: {
          name: 'KJV' // Default to KJV for now
        }
      }));

      return {
        query: apiData.query || params.query,
        total: filteredVerses.length,
        passages: passages
      };
    } catch (error) {
      console.error('Error performing advanced search:', error);
      throw new Error('Failed to perform advanced search');
    }
  }

  // Get concordance for a verse
  async getConcordance(reference: string, versionId: string): Promise<any> {
    try {
      // First get the verse text
      const passage = await this.getVerseByReference(versionId, reference);
      if (!passage) return { entries: [] };

      // Extract key words (simple implementation)
      const text = (passage.content || passage.text || '').toString();
      const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((word: string) => word.length > 3);

      // Count word frequency
      const wordCount: { [key: string]: number } = {};
      words.forEach((word: string) => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });

      // Get top words and find related verses
      const topWords = Object.entries(wordCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([word]) => word);

      const entries = [];
      for (const word of topWords) {
        try {
          const searchResults = await this.searchBible(versionId, word, 3);
          entries.push({
            word,
            count: wordCount[word],
            references: searchResults.passages?.map((p: any) => p.reference) || []
          });
        } catch (error) {
          console.error(`Error searching for word ${word}:`, error);
        }
      }

      return { entries };
    } catch (error) {
      console.error('Error getting concordance:', error);
      throw new Error('Failed to get concordance');
    }
  }

  // Get cross-references for a verse
  async getCrossReferences(reference: string, versionId: string): Promise<any> {
    try {
      // This would typically use a cross-reference database
      // For now, we'll search for similar themes
      const passage = await this.getVerseByReference(versionId, reference);
      if (!passage) return { references: [] };

      const text = passage.content || passage.text || '';
      
      // Extract key themes and search for related verses
      const themes = ['love', 'faith', 'grace', 'salvation', 'prayer', 'witness'];
      const references = [];

      for (const theme of themes) {
        if (text.toLowerCase().includes(theme)) {
          try {
            const searchResults = await this.searchBible(versionId, theme, 2);
            if (searchResults.passages) {
              references.push(...searchResults.passages.map((p: any) => ({
                reference: p.reference,
                text: p.text,
                relevance: `Related to ${theme}`
              })));
            }
          } catch (error) {
            console.error(`Error searching for theme ${theme}:`, error);
          }
        }
      }

      return { references: references.slice(0, 5) };
    } catch (error) {
      console.error('Error getting cross-references:', error);
      throw new Error('Failed to get cross-references');
    }
  }

  // Save search history
  async saveSearchHistory(userId: string, query: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('bible_search_history')
        .insert({
          user_id: userId,
          query: query,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving search history:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error saving search history:', error);
      // Don't throw here to avoid breaking the search functionality
    }
  }

  // Save study note
  async saveStudyNote(userId: string, reference: string, note: string, tags: string[] = []): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('bible_notes')
        .insert({
          user_id: userId,
          reference: reference,
          note: note,
          tags: tags,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving study note:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error saving study note:', error);
      throw error;
    }
  }

  // Save favorite verse
  async saveFavoriteVerse(userId: string, reference: string, text: string, version: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('bible_favorites')
        .upsert({
          user_id: userId,
          reference: reference,
          text: text,
          version: version,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,reference'
        });

      if (error) {
        console.error('Error saving favorite verse:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error saving favorite verse:', error);
      throw error;
    }
  }

  // Get user preferences
  async getUserPreferences(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('bible_user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error loading user preferences:', error);
        throw error;
      }

      return data || {
        user_id: userId,
        default_version: 'de4e12af7f28f599-02',
        preferred_versions: [],
        search_history_enabled: true,
        auto_save_notes: true
      };
    } catch (error) {
      console.error('Error loading user preferences:', error);
      return {
        user_id: userId,
        default_version: 'de4e12af7f28f599-02',
        preferred_versions: [],
        search_history_enabled: true,
        auto_save_notes: true
      };
    }
  }

  // Update user preferences
  async updateUserPreferences(userId: string, preferences: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('bible_user_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating user preferences:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }
}

export const bibleService = new BibleService(); 