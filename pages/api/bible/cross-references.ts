import { NextApiRequest, NextApiResponse } from 'next';
import { bibleService } from '../../../lib/bible-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { reference } = req.query;

    if (!reference || typeof reference !== 'string') {
      return res.status(400).json({ error: 'Reference parameter is required' });
    }

    // Get cross-references for the verse
    const crossReferences = await getCrossReferencesForVerse(reference);
    
    res.status(200).json({ crossReferences });
  } catch (error) {
    console.error('Error fetching cross-references:', error);
    res.status(500).json({ error: 'Failed to get cross-references' });
  }
}

async function getCrossReferencesForVerse(reference: string): Promise<string[]> {
  try {
    // Use our Bible service to get cross-references
    const crossRefs = await bibleService.getCrossReferences(reference, 'KJV');
    return crossRefs || [];
  } catch (error) {
    console.error('Error getting cross-references from Bible service:', error);
    
    // Fallback to manual cross-reference mapping for common verses
    return getFallbackCrossReferences(reference);
  }
}

function getFallbackCrossReferences(reference: string): string[] {
  // Manual mapping of popular verses to their cross-references
  const crossRefMap: Record<string, string[]> = {
    'John 3:16': ['Romans 5:8', '1 John 4:9', 'Romans 6:23', 'Ephesians 2:8-9'],
    'Romans 3:23': ['Romans 5:12', '1 John 1:8', 'Ecclesiastes 7:20', 'Isaiah 53:6'],
    'Romans 6:23': ['John 3:16', 'Ephesians 2:8-9', '1 John 5:11', 'Romans 5:8'],
    'Ephesians 2:8-9': ['Romans 6:23', 'Titus 3:5', 'Romans 4:16', 'Galatians 2:16'],
    'Matthew 28:19-20': ['Mark 16:15', 'Acts 1:8', 'Luke 24:47', '2 Timothy 2:2'],
    'Philippians 4:13': ['2 Corinthians 12:9', 'Isaiah 40:31', '1 Corinthians 10:13'],
    'Jeremiah 29:11': ['Romans 8:28', 'Proverbs 3:5-6', 'Isaiah 55:8-9'],
    'Psalm 23:1': ['John 10:11', 'Isaiah 40:11', 'Ezekiel 34:11-12'],
    'Romans 8:28': ['Jeremiah 29:11', 'Genesis 50:20', 'Isaiah 55:8-9'],
    'Proverbs 3:5-6': ['Psalm 37:5', 'Isaiah 55:8-9', 'Jeremiah 10:23'],
    '1 Corinthians 10:13': ['Philippians 4:13', '2 Corinthians 12:9', 'James 1:2-4'],
    'Isaiah 40:31': ['Philippians 4:13', 'Psalm 27:14', '2 Corinthians 12:9'],
    'Matthew 11:28-30': ['1 Peter 5:7', 'Psalm 55:22', 'Philippians 4:6-7'],
    'Romans 12:2': ['2 Corinthians 5:17', 'Colossians 3:2', 'Ephesians 4:22-24'],
    'Joshua 1:9': ['Deuteronomy 31:6', 'Isaiah 41:10', 'Psalm 27:1'],
    'Psalm 119:105': ['2 Timothy 3:16', 'John 1:1', 'Hebrews 4:12'],
    '2 Timothy 3:16': ['Psalm 119:105', 'Hebrews 4:12', '2 Peter 1:21'],
    'Matthew 6:33': ['Luke 12:31', 'Psalm 37:4', 'Philippians 4:19'],
    'Romans 10:9': ['Acts 16:31', 'John 3:16', 'Romans 10:13'],
    'Galatians 2:20': ['Romans 6:6', '2 Corinthians 5:17', 'Colossians 3:3'],
    // Apologetics verses
    '1 Peter 3:15': ['Colossians 4:6', 'Acts 17:2-3', '2 Timothy 2:24-26'],
    'Romans 1:20': ['Psalm 19:1', 'Acts 14:17', 'Isaiah 40:26'],
    'Acts 4:12': ['John 14:6', '1 Timothy 2:5', 'Acts 16:31'],
    'John 14:6': ['Acts 4:12', '1 Timothy 2:5', 'John 10:9'],
    'Genesis 1:1': ['John 1:1-3', 'Colossians 1:16', 'Hebrews 11:3'],
    'Isaiah 53:5': ['1 Peter 2:24', 'Romans 5:8', '2 Corinthians 5:21'],
    'Daniel 9:24-27': ['Isaiah 53', 'Psalm 22', 'Zechariah 9:9'],
    'Psalm 22:16': ['Isaiah 53:5', 'Zechariah 12:10', 'John 19:34-37']
  };

  // Normalize reference (remove spaces, make case-insensitive)
  const normalizedRef = reference.replace(/\s+/g, ' ').trim();
  
  // Try exact match first
  if (crossRefMap[normalizedRef]) {
    return crossRefMap[normalizedRef];
  }

  // Try to find partial matches for book and chapter
  const bookChapter = normalizedRef.split(':')[0];
  const matchingRefs = Object.keys(crossRefMap).filter(ref => 
    ref.startsWith(bookChapter) || crossRefMap[ref].some(cr => cr.startsWith(bookChapter))
  );

  if (matchingRefs.length > 0) {
    return crossRefMap[matchingRefs[0]] || [];
  }

  return [];
}