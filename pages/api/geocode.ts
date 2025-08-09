import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    
    if (!GOOGLE_PLACES_API_KEY) {
      return res.status(500).json({ error: 'Google Places API key not configured' });
    }

    console.log(`🌐 Geocoding address: ${address}`);

    // Common cities mapping as fallback
    const commonCities: { [key: string]: { lat: number, lng: number, name: string } } = {
      'tampa': { lat: 27.9506, lng: -82.4572, name: 'Tampa, FL' },
      'miami': { lat: 25.7617, lng: -80.1918, name: 'Miami, FL' },
      'orlando': { lat: 28.5383, lng: -81.3792, name: 'Orlando, FL' },
      'jacksonville': { lat: 30.3322, lng: -81.6557, name: 'Jacksonville, FL' },
      'new york': { lat: 40.7128, lng: -74.0060, name: 'New York, NY' },
      'los angeles': { lat: 34.0522, lng: -118.2437, name: 'Los Angeles, CA' },
      'chicago': { lat: 41.8781, lng: -87.6298, name: 'Chicago, IL' },
      'houston': { lat: 29.7604, lng: -95.3698, name: 'Houston, TX' },
      'phoenix': { lat: 33.4484, lng: -112.0740, name: 'Phoenix, AZ' },
      'philadelphia': { lat: 39.9526, lng: -75.1652, name: 'Philadelphia, PA' },
      'san antonio': { lat: 29.4241, lng: -98.4936, name: 'San Antonio, TX' },
      'san diego': { lat: 32.7157, lng: -117.1611, name: 'San Diego, CA' },
      'dallas': { lat: 32.7767, lng: -96.7970, name: 'Dallas, TX' },
      'austin': { lat: 30.2672, lng: -97.7431, name: 'Austin, TX' },
      'fort worth': { lat: 32.7555, lng: -97.3308, name: 'Fort Worth, TX' },
      'columbus': { lat: 39.9612, lng: -82.9988, name: 'Columbus, OH' },
      'charlotte': { lat: 35.2271, lng: -80.8431, name: 'Charlotte, NC' },
      'san francisco': { lat: 37.7749, lng: -122.4194, name: 'San Francisco, CA' },
      'indianapolis': { lat: 39.7684, lng: -86.1581, name: 'Indianapolis, IN' },
      'seattle': { lat: 47.6062, lng: -122.3321, name: 'Seattle, WA' },
      'denver': { lat: 39.7392, lng: -104.9903, name: 'Denver, CO' },
      'washington': { lat: 38.9072, lng: -77.0369, name: 'Washington, DC' },
      'boston': { lat: 42.3601, lng: -71.0589, name: 'Boston, MA' },
      'nashville': { lat: 36.1627, lng: -86.7816, name: 'Nashville, TN' },
      'detroit': { lat: 42.3314, lng: -83.0458, name: 'Detroit, MI' },
      'portland': { lat: 45.5152, lng: -122.6784, name: 'Portland, OR' },
      'memphis': { lat: 35.1495, lng: -90.0490, name: 'Memphis, TN' },
      'oklahoma city': { lat: 35.4676, lng: -97.5164, name: 'Oklahoma City, OK' },
      'las vegas': { lat: 36.1699, lng: -115.1398, name: 'Las Vegas, NV' },
      'louisville': { lat: 38.2527, lng: -85.7585, name: 'Louisville, KY' },
      'baltimore': { lat: 39.2904, lng: -76.6122, name: 'Baltimore, MD' },
      'milwaukee': { lat: 43.0389, lng: -87.9065, name: 'Milwaukee, WI' },
      'albuquerque': { lat: 35.0844, lng: -106.6504, name: 'Albuquerque, NM' },
      'tucson': { lat: 32.2226, lng: -110.9747, name: 'Tucson, AZ' },
      'fresno': { lat: 36.7378, lng: -119.7871, name: 'Fresno, CA' },
      'sacramento': { lat: 38.5816, lng: -121.4944, name: 'Sacramento, CA' },
      'atlanta': { lat: 33.7490, lng: -84.3880, name: 'Atlanta, GA' },
      'kansas city': { lat: 39.0997, lng: -94.5786, name: 'Kansas City, MO' },
      'long beach': { lat: 33.7701, lng: -118.1937, name: 'Long Beach, CA' },
      'colorado springs': { lat: 38.8339, lng: -104.8214, name: 'Colorado Springs, CO' },
      'raleigh': { lat: 35.7796, lng: -78.6382, name: 'Raleigh, NC' },
      'omaha': { lat: 41.2565, lng: -95.9345, name: 'Omaha, NE' },
      'oakland': { lat: 37.8044, lng: -122.2711, name: 'Oakland, CA' },
      'minneapolis': { lat: 44.9778, lng: -93.2650, name: 'Minneapolis, MN' },
      'tulsa': { lat: 36.1540, lng: -95.9928, name: 'Tulsa, OK' },
      'cleveland': { lat: 41.4993, lng: -81.6944, name: 'Cleveland, OH' },
      'wichita': { lat: 37.6872, lng: -97.3301, name: 'Wichita, KS' },
      'arlington': { lat: 32.7357, lng: -97.1081, name: 'Arlington, TX' },
      'new orleans': { lat: 29.9511, lng: -90.0715, name: 'New Orleans, LA' },
      'bakersfield': { lat: 35.3733, lng: -119.0187, name: 'Bakersfield, CA' },
      'tampa': { lat: 27.9506, lng: -82.4572, name: 'Tampa, FL' }
    };

    // First try Google Geocoding API
    try {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_PLACES_API_KEY}`;
      
      const response = await fetch(geocodeUrl);
      const data = await response.json();

      console.log('Geocoding API response status:', data.status);

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        const formattedAddress = data.results[0].formatted_address;
        
        console.log(`✅ Geocoding successful for "${address}":`, {
          lat: location.lat,
          lng: location.lng,
          formattedAddress
        });

        return res.status(200).json({
          success: true,
          coordinates: {
            lat: location.lat,
            lng: location.lng
          },
          formattedAddress
        });
      }
    } catch (error) {
      console.log('Google Geocoding API failed, trying fallback...');
    }

    // Fallback to common cities mapping with improved matching
    const normalizedAddress = address.toLowerCase().trim();
    
    // Try exact match first
    let cityMatch = commonCities[normalizedAddress];
    
    // If no exact match, try to extract city name from "City, State" format
    if (!cityMatch) {
      const cityStateMatch = normalizedAddress.match(/^([^,]+)(?:,\s*([^,]+))?$/);
      if (cityStateMatch) {
        const cityName = cityStateMatch[1].trim();
        cityMatch = commonCities[cityName];
        console.log(`🔍 Trying city name extraction: "${cityName}" from "${normalizedAddress}"`);
      }
    }
    
    // If still no match, try partial matching
    if (!cityMatch) {
      for (const [key, value] of Object.entries(commonCities)) {
        if (normalizedAddress.includes(key) || key.includes(normalizedAddress)) {
          cityMatch = value;
          console.log(`🔍 Partial match found: "${key}" for "${normalizedAddress}"`);
          break;
        }
      }
    }
    
    if (cityMatch) {
      console.log(`✅ Found city in fallback mapping: ${cityMatch.name}`);
      return res.status(200).json({
        success: true,
        coordinates: {
          lat: cityMatch.lat,
          lng: cityMatch.lng
        },
        formattedAddress: cityMatch.name
      });
    }

    // If still not found, return error
    console.error('❌ Location not found in any mapping:', address);
    return res.status(404).json({ 
      error: `Could not find location: "${address}". Please try a more specific address or city name.`,
      details: 'Location not found in our database'
    });
  } catch (error) {
    console.error('❌ Geocoding error:', error);
    return res.status(500).json({ error: 'Failed to geocode address' });
  }
}
