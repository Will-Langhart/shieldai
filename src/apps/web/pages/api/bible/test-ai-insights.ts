import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Construct the base URL properly for server-side fetch
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    // Test the AI insights API with a simple passage
    const testPassage = {
      id: 'test-passage',
      reference: 'John 3:16',
      text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
      verses: [{
        id: 'john-3-16-1',
        text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
        reference: 'John 3:16',
        verseNumber: 16,
        chapterNumber: 3,
        bookName: 'John'
      }],
      version: {
        id: 'de4e12af7f28f599-02',
        name: 'King James Version',
        description: 'King James Version',
        language: { id: 'eng', name: 'English' },
        type: 'text'
      }
    };

    const response = await fetch(`${baseUrl}/api/bible/ai-insights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        passage: testPassage,
        version: 'de4e12af7f28f599-02'
      })
    });

    const data = await response.json();

    return res.status(200).json({
      success: true,
      status: response.status,
      data: data,
      message: 'AI insights API test completed'
    });

  } catch (error) {
    console.error('Test error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'AI insights API test failed'
    });
  }
}
