import { NextApiRequest, NextApiResponse } from 'next';

// Common cities and zip codes for autocomplete
const citySuggestions = [
  { name: 'Tampa, FL', zip: '33601', state: 'FL' },
  { name: 'Miami, FL', zip: '33101', state: 'FL' },
  { name: 'Orlando, FL', zip: '32801', state: 'FL' },
  { name: 'Jacksonville, FL', zip: '32201', state: 'FL' },
  { name: 'New York, NY', zip: '10001', state: 'NY' },
  { name: 'Los Angeles, CA', zip: '90001', state: 'CA' },
  { name: 'Chicago, IL', zip: '60601', state: 'IL' },
  { name: 'Houston, TX', zip: '77001', state: 'TX' },
  { name: 'Phoenix, AZ', zip: '85001', state: 'AZ' },
  { name: 'Philadelphia, PA', zip: '19101', state: 'PA' },
  { name: 'San Antonio, TX', zip: '78201', state: 'TX' },
  { name: 'San Diego, CA', zip: '92101', state: 'CA' },
  { name: 'Dallas, TX', zip: '75201', state: 'TX' },
  { name: 'Austin, TX', zip: '78701', state: 'TX' },
  { name: 'Fort Worth, TX', zip: '76101', state: 'TX' },
  { name: 'Columbus, OH', zip: '43201', state: 'OH' },
  { name: 'Charlotte, NC', zip: '28201', state: 'NC' },
  { name: 'San Francisco, CA', zip: '94101', state: 'CA' },
  { name: 'Indianapolis, IN', zip: '46201', state: 'IN' },
  { name: 'Seattle, WA', zip: '98101', state: 'WA' },
  { name: 'Denver, CO', zip: '80201', state: 'CO' },
  { name: 'Washington, DC', zip: '20001', state: 'DC' },
  { name: 'Boston, MA', zip: '02101', state: 'MA' },
  { name: 'Nashville, TN', zip: '37201', state: 'TN' },
  { name: 'Detroit, MI', zip: '48201', state: 'MI' },
  { name: 'Portland, OR', zip: '97201', state: 'OR' },
  { name: 'Memphis, TN', zip: '38101', state: 'TN' },
  { name: 'Oklahoma City, OK', zip: '73101', state: 'OK' },
  { name: 'Las Vegas, NV', zip: '89101', state: 'NV' },
  { name: 'Louisville, KY', zip: '40201', state: 'KY' },
  { name: 'Baltimore, MD', zip: '21201', state: 'MD' },
  { name: 'Milwaukee, WI', zip: '53201', state: 'WI' },
  { name: 'Albuquerque, NM', zip: '87101', state: 'NM' },
  { name: 'Tucson, AZ', zip: '85701', state: 'AZ' },
  { name: 'Fresno, CA', zip: '93701', state: 'CA' },
  { name: 'Sacramento, CA', zip: '95801', state: 'CA' },
  { name: 'Atlanta, GA', zip: '30301', state: 'GA' },
  { name: 'Kansas City, MO', zip: '64101', state: 'MO' },
  { name: 'Long Beach, CA', zip: '90801', state: 'CA' },
  { name: 'Colorado Springs, CO', zip: '80901', state: 'CO' },
  { name: 'Raleigh, NC', zip: '27601', state: 'NC' },
  { name: 'Omaha, NE', zip: '68101', state: 'NE' },
  { name: 'Oakland, CA', zip: '94601', state: 'CA' },
  { name: 'Minneapolis, MN', zip: '55401', state: 'MN' },
  { name: 'Tulsa, OK', zip: '74101', state: 'OK' },
  { name: 'Cleveland, OH', zip: '44101', state: 'OH' },
  { name: 'Wichita, KS', zip: '67201', state: 'KS' },
  { name: 'Arlington, TX', zip: '76001', state: 'TX' },
  { name: 'New Orleans, LA', zip: '70101', state: 'LA' },
  { name: 'Bakersfield, CA', zip: '93301', state: 'CA' }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const searchTerm = query.toLowerCase().trim();
    const suggestions = [];

    // Search for city names
    for (const city of citySuggestions) {
      if (city.name.toLowerCase().includes(searchTerm) || 
          city.zip.includes(searchTerm) ||
          city.state.toLowerCase().includes(searchTerm)) {
        suggestions.push({
          type: 'city',
          display: city.name,
          value: city.name,
          zip: city.zip,
          state: city.state
        });
      }
    }

    // If query looks like a zip code (5 digits), prioritize zip code matches
    if (/^\d{5}$/.test(searchTerm)) {
      const zipMatches = suggestions.filter(s => s.zip === searchTerm);
      if (zipMatches.length > 0) {
        suggestions.unshift(...zipMatches);
      }
    }

    // Limit results to top 10
    const limitedSuggestions = suggestions.slice(0, 10);

    console.log(`🔍 Autocomplete for "${query}": Found ${limitedSuggestions.length} suggestions`);

    res.status(200).json({ 
      suggestions: limitedSuggestions,
      query: searchTerm
    });
  } catch (error) {
    console.error('❌ Autocomplete error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
}

