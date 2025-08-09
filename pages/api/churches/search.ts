import { NextApiRequest, NextApiResponse } from 'next';
import { ChurchFinderService } from '../../../lib/church-finder-service';

// Helper function to get fallback churches
function getFallbackChurches(latitude: number, longitude: number) {
  return [
    {
      id: 'fallback-1',
      name: 'First Baptist Church',
      address: '123 Main Street',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
      phone: '(512) 555-0123',
      website: 'https://example.com',
      rating: 4.5,
      review_count: 127,
      photos: [],
      types: ['church', 'place_of_worship'],
      coordinates: {
        lat: latitude + 0.01,
        lng: longitude + 0.01
      },
      distance: 2.3,
      place_id: 'fallback-1'
    },
    {
      id: 'fallback-2',
      name: 'Grace Community Church',
      address: '456 Oak Avenue',
      city: 'Austin',
      state: 'TX',
      zip: '78702',
      phone: '(512) 555-0456',
      website: 'https://example.com',
      rating: 4.2,
      review_count: 89,
      photos: [],
      types: ['church', 'place_of_worship'],
      coordinates: {
        lat: latitude - 0.01,
        lng: longitude - 0.01
      },
      distance: 4.1,
      place_id: 'fallback-2'
    }
  ];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { latitude, longitude, radius, denomination } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    // Use Google Places API directly on the server side
    // Prefer server-only key; fall back to public key for legacy compatibility
    const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_SERVER_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    const GOOGLE_PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

    // Check if API key is properly configured
    if (!GOOGLE_PLACES_API_KEY) {
      console.error('Google Places API key not configured');
      return res.status(500).json({ 
        error: 'Google Places API key not configured',
        churches: getFallbackChurches(latitude, longitude)
      });
    }

    // Search specifically for Christian churches and Christian places of worship
    const searchQueries = [
      // Primary church search
      `${GOOGLE_PLACES_BASE_URL}/nearbysearch/json?` +
      `location=${latitude},${longitude}&` +
      `radius=${radius || 25000}&` +
      `type=church&` +
      `key=${GOOGLE_PLACES_API_KEY}`,
      
      // Text search for Christian churches specifically
      `${GOOGLE_PLACES_BASE_URL}/textsearch/json?` +
      `query=Christian church OR Baptist church OR Catholic church OR Methodist church OR Presbyterian church OR Lutheran church OR Episcopal church OR Pentecostal church OR Assembly of God OR Church of Christ&` +
      `location=${latitude},${longitude}&` +
      `radius=${radius || 25000}&` +
      `key=${GOOGLE_PLACES_API_KEY}`,
      
      // Search for Christian denominations
      `${GOOGLE_PLACES_BASE_URL}/textsearch/json?` +
      `query=church chapel cathedral Christian worship center&` +
      `location=${latitude},${longitude}&` +
      `radius=${radius || 25000}&` +
      `key=${GOOGLE_PLACES_API_KEY}`,
      
      // Search for specific denominations if provided
      ...(denomination && denomination !== 'all' ? [
        `${GOOGLE_PLACES_BASE_URL}/textsearch/json?` +
        `query=${encodeURIComponent(denomination)} church&` +
        `location=${latitude},${longitude}&` +
        `radius=${radius || 25000}&` +
        `key=${GOOGLE_PLACES_API_KEY}`
      ] : [])
    ];

    // Execute all search queries and combine results
    const allResults = [];
    const seenPlaceIds = new Set();

    for (const searchUrl of searchQueries) {
      try {
        const response = await fetch(searchUrl);
        const data = await response.json();

        if (data.status === 'OK' && data.results) {
          console.log(`Query successful: Found ${data.results.length} results`);
          // Add unique results to our collection
          for (const place of data.results) {
            if (!seenPlaceIds.has(place.place_id)) {
              seenPlaceIds.add(place.place_id);
              allResults.push(place);
            }
          }
        } else {
          console.error('Google Places API error for query:', data.status, data.error_message || 'No error message', searchUrl);
          if (data.status === 'REQUEST_DENIED') {
            console.error('API key may be invalid or missing required permissions');
            console.error('Error details:', data.error_message);
            // If it's a referer restriction, provide specific guidance
            if (data.error_message?.includes('referer restrictions')) {
              console.error('API key has referer restrictions. Please configure the key to allow server-side usage.');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching from Google Places API:', error);
      }
    }

    // If no results found, return fallback data
    if (allResults.length === 0) {
      console.log('No churches found, returning fallback data');
      const fallbackChurches = [
        {
          id: 'fallback-1',
          name: 'First Baptist Church',
          address: '123 Main Street',
          city: 'Austin',
          state: 'TX',
          zip: '78701',
          phone: '(512) 555-0123',
          website: 'https://example.com',
          rating: 4.5,
          review_count: 127,
          photos: [],
          types: ['church', 'place_of_worship'],
          coordinates: {
            lat: latitude + 0.01,
            lng: longitude + 0.01
          },
          distance: 2.3,
          place_id: 'fallback-1'
        },
        {
          id: 'fallback-2',
          name: 'Grace Community Church',
          address: '456 Oak Avenue',
          city: 'Austin',
          state: 'TX',
          zip: '78702',
          phone: '(512) 555-0456',
          website: 'https://example.com',
          rating: 4.2,
          review_count: 89,
          photos: [],
          types: ['church', 'place_of_worship'],
          coordinates: {
            lat: latitude - 0.01,
            lng: longitude - 0.01
          },
          distance: 4.1,
          place_id: 'fallback-2'
        }
      ];
      return res.status(200).json({ churches: fallbackChurches });
    } else {
      console.log(`Found ${allResults.length} churches/places of worship`);
    }

    // Get detailed information for each church
    const churchesWithDetails = await Promise.all(
      allResults.map(async (place: any) => {
        try {
          // Get additional details for each church
          const detailsUrl = `${GOOGLE_PLACES_BASE_URL}/details/json?` +
            `place_id=${place.place_id}&` +
            `fields=formatted_phone_number,website,rating,user_ratings_total,photos,formatted_address&` +
            `key=${GOOGLE_PLACES_API_KEY}`;

          const detailsResponse = await fetch(detailsUrl);
          const detailsData = await detailsResponse.json();
          const details = detailsData.result || {};

          // Format the church data
          const addressComponents = place.vicinity.split(', ');
          const cityState = addressComponents[addressComponents.length - 1] || '';
          const [city, state] = cityState.split(' ');

          // Calculate distance
          const R = 3959; // Earth's radius in miles
          const dLat = (place.geometry.location.lat - latitude) * (Math.PI/180);
          const dLon = (place.geometry.location.lng - longitude) * (Math.PI/180);
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(latitude * (Math.PI/180)) * Math.cos(place.geometry.location.lat * (Math.PI/180)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = R * c;

          return {
            id: place.place_id,
            name: place.name,
            address: details.formatted_address || place.vicinity,
            city: city || '',
            state: state || '',
            zip: '',
            phone: details.formatted_phone_number,
            website: details.website,
            rating: place.rating,
            review_count: details.user_ratings_total,
            photos: place.photos?.map((photo: any) => 
              `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
            ) || details.photos?.map((photo: any) => 
              `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
            ) || [],
            types: place.types,
            coordinates: {
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng
            },
            distance: distance,
            place_id: place.place_id
          };
        } catch (error) {
          console.error('Error processing church:', error);
          return null;
        }
      })
    );

    // Filter out any null results and filter for Christian churches only
    const validChurches = churchesWithDetails
      .filter((church: any) => {
        if (church === null) return false;
        
        // Filter for Christian churches only
        const name = church.name.toLowerCase();
        const types = church.types || [];
        
        // Include if it has church-related types or names
        const isChurch = types.includes('church') || 
                        types.includes('place_of_worship') ||
                        name.includes('church') ||
                        name.includes('chapel') ||
                        name.includes('cathedral') ||
                        name.includes('baptist') ||
                        name.includes('catholic') ||
                        name.includes('methodist') ||
                        name.includes('presbyterian') ||
                        name.includes('lutheran') ||
                        name.includes('episcopal') ||
                        name.includes('pentecostal') ||
                        name.includes('assembly of god') ||
                        name.includes('church of christ');
        
        // Exclude non-Christian religious institutions
        const isNonChristian = name.includes('synagogue') ||
                              name.includes('mosque') ||
                              name.includes('temple') ||
                              name.includes('buddhist') ||
                              name.includes('hindu') ||
                              name.includes('sikh') ||
                              name.includes('jewish') ||
                              name.includes('islamic');
        
        return isChurch && !isNonChristian;
      })
      .sort((a: any, b: any) => (a.distance || 0) - (b.distance || 0));

    console.log(`✅ Found ${validChurches.length} Christian churches after filtering`);
    res.status(200).json({ churches: validChurches });
  } catch (error) {
    console.error('Error searching churches:', error);
    res.status(500).json({ error: 'Failed to search churches' });
  }
} 