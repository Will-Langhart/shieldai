import axios from 'axios';

export interface BibleVerse {
  reference: string;
  text: string;
  version: string;
  language: string;
}

export interface BibleSearchResult {
  query: string;
  total: number;
  verses: BibleVerse[];
}

export interface BibleProvider {
  name: string;
  priority: number;
  isAvailable: () => Promise<boolean>;
  getVerse: (reference: string) => Promise<BibleVerse | null>;
  search: (query: string, limit?: number) => Promise<BibleSearchResult>;
}

class BibleFallbackService {
  private providers: BibleProvider[] = [];

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Primary provider - API.Bible
    this.providers.push(new ApiBibleProvider());
    
    // Fallback providers
    this.providers.push(new BibleApiComProvider());
    this.providers.push(new WldehBibleProvider());
    this.providers.push(new BibliaProvider());
    
    // Sort by priority (lower number = higher priority)
    this.providers.sort((a, b) => a.priority - b.priority);
  }

  async getVerse(reference: string): Promise<BibleVerse | null> {
    for (const provider of this.providers) {
      try {
        if (await provider.isAvailable()) {
          const verse = await provider.getVerse(reference);
          if (verse) {
            console.log(`Verse found via ${provider.name}`);
            return verse;
          }
        }
      } catch (error) {
        console.warn(`Provider ${provider.name} failed:`, error);
        continue;
      }
    }
    
    console.error('All Bible providers failed');
    return null;
  }

  async search(query: string, limit: number = 10): Promise<BibleSearchResult> {
    for (const provider of this.providers) {
      try {
        if (await provider.isAvailable()) {
          const result = await provider.search(query, limit);
          if (result.verses.length > 0) {
            console.log(`Search results found via ${provider.name}`);
            return result;
          }
        }
      } catch (error) {
        console.warn(`Provider ${provider.name} search failed:`, error);
        continue;
      }
    }
    
    console.error('All Bible providers failed for search');
    return { query, total: 0, verses: [] };
  }

  async getAvailableProviders(): Promise<string[]> {
    const available: string[] = [];
    
    for (const provider of this.providers) {
      try {
        if (await provider.isAvailable()) {
          available.push(provider.name);
        }
      } catch (error) {
        console.warn(`Provider ${provider.name} availability check failed:`, error);
      }
    }
    
    return available;
  }
}

// API.Bible Provider (Primary)
class ApiBibleProvider implements BibleProvider {
  name = 'API.Bible';
  priority = 1;
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.BIBLE_API_KEY || '';
    this.baseUrl = process.env.BIBLE_API_BASE_URL || 'https://api.scripture.api.bible/v1';
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async getVerse(reference: string): Promise<BibleVerse | null> {
    if (!this.apiKey) return null;

    try {
      const response = await axios.get(`${this.baseUrl}/bibles/de4e12af7f28f599-02/passages/${encodeURIComponent(reference)}`, {
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      const data = response.data.data;
      if (data) {
        return {
          reference: data.reference,
          text: this.stripHtml(data.content || data.text || ''),
          version: 'KJV',
          language: 'en'
        };
      }
    } catch (error) {
      console.error('API.Bible getVerse error:', error);
    }

    return null;
  }

  async search(query: string, limit: number = 10): Promise<BibleSearchResult> {
    if (!this.apiKey) return { query, total: 0, verses: [] };

    try {
      const response = await axios.get(`${this.baseUrl}/bibles/de4e12af7f28f599-02/search`, {
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        params: {
          query,
          limit,
          sort: 'relevance',
        },
      });

      const data = response.data.data || response.data;
      const verses = data.verses || [];

      return {
        query: data.query || query,
        total: data.total || verses.length,
        verses: verses.map((verse: any) => ({
          reference: verse.reference,
          text: this.stripHtml(verse.text),
          version: 'KJV',
          language: 'en'
        }))
      };
    } catch (error) {
      console.error('API.Bible search error:', error);
      return { query, total: 0, verses: [] };
    }
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  }
}

// Bible-API.com Provider (Fallback)
class BibleApiComProvider implements BibleProvider {
  name = 'Bible-API.com';
  priority = 2;
  private baseUrl = 'https://bible-api.com';

  async isAvailable(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/john+3:16`);
      return response.status === 200;
    } catch {
      return false;
    }
  }

  async getVerse(reference: string): Promise<BibleVerse | null> {
    try {
      const formattedRef = reference.replace(/\s+/g, '+');
      const response = await axios.get(`${this.baseUrl}/${formattedRef}`);
      
      if (response.data && response.data.text) {
        return {
          reference: response.data.reference,
          text: response.data.text,
          version: response.data.translation_name || 'KJV',
          language: 'en'
        };
      }
    } catch (error) {
      console.error('Bible-API.com getVerse error:', error);
    }

    return null;
  }

  async search(query: string, limit: number = 10): Promise<BibleSearchResult> {
    // Bible-API.com doesn't support search, so we'll return empty results
    return { query, total: 0, verses: [] };
  }
}

// wldeh's Bible API Provider (GitHub CDN)
class WldehBibleProvider implements BibleProvider {
  name = 'wldeh Bible API';
  priority = 3;
  private baseUrl = 'https://raw.githubusercontent.com/wldeh/bible_api/master';

  async isAvailable(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/bibles/en/kjv.json`);
      return response.status === 200;
    } catch {
      return false;
    }
  }

  async getVerse(reference: string): Promise<BibleVerse | null> {
    try {
      // This is a simplified implementation
      // In practice, you'd need to parse the reference and find the verse
      const response = await axios.get(`${this.baseUrl}/bibles/en/kjv.json`);
      
      if (response.data) {
        // Simple lookup - in practice you'd need more sophisticated parsing
        const verse = this.findVerseInData(response.data, reference);
        if (verse) {
          return {
            reference: reference,
            text: verse,
            version: 'KJV',
            language: 'en'
          };
        }
      }
    } catch (error) {
      console.error('wldeh Bible API getVerse error:', error);
    }

    return null;
  }

  async search(query: string, limit: number = 10): Promise<BibleSearchResult> {
    // This provider doesn't support search
    return { query, total: 0, verses: [] };
  }

  private findVerseInData(data: any, reference: string): string | null {
    // Simplified verse finding - in practice you'd need proper Bible reference parsing
    // This is just a placeholder implementation
    return null;
  }
}

// Biblia.com Provider (Reference Detection)
class BibliaProvider implements BibleProvider {
  name = 'Biblia.com';
  priority = 4;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.BIBLIA_API_KEY || '';
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async getVerse(reference: string): Promise<BibleVerse | null> {
    if (!this.apiKey) return null;

    try {
      const response = await axios.get(`https://api.bibliaapi.com/v1/bibles/search/${encodeURIComponent(reference)}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data && response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        return {
          reference: result.reference,
          text: result.text,
          version: result.bible || 'ESV',
          language: 'en'
        };
      }
    } catch (error) {
      console.error('Biblia.com getVerse error:', error);
    }

    return null;
  }

  async search(query: string, limit: number = 10): Promise<BibleSearchResult> {
    if (!this.apiKey) return { query, total: 0, verses: [] };

    try {
      const response = await axios.get(`https://api.bibliaapi.com/v1/bibles/search`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        params: {
          query,
          limit,
        },
      });

      if (response.data && response.data.results) {
        return {
          query,
          total: response.data.total || response.data.results.length,
          verses: response.data.results.map((result: any) => ({
            reference: result.reference,
            text: result.text,
            version: result.bible || 'ESV',
            language: 'en'
          }))
        };
      }
    } catch (error) {
      console.error('Biblia.com search error:', error);
    }

    return { query, total: 0, verses: [] };
  }
}

export const bibleFallbackService = new BibleFallbackService(); 