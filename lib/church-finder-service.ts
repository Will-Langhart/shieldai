export interface ChurchLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
  website?: string;
  rating?: number;
  review_count?: number;
  photos?: string[];
  types: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
  distance?: number;
  place_id: string;
}

export interface ChurchSearchParams {
  latitude: number;
  longitude: number;
  radius: number; // in meters
  keyword?: string;
  denomination?: string;
}

export class ChurchFinderService {
  private static GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  private static GOOGLE_PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

  static async findChurchesNearby(params: ChurchSearchParams): Promise<ChurchLocation[]> {
    try {
      // First, search for churches using Google Places API
      const searchUrl = `${this.GOOGLE_PLACES_BASE_URL}/nearbysearch/json?` +
        `location=${params.latitude},${params.longitude}&` +
        `radius=${params.radius}&` +
        `type=church&` +
        `keyword=${encodeURIComponent(params.keyword || 'church')}&` +
        `key=${this.GOOGLE_PLACES_API_KEY}`;

      const response = await fetch(searchUrl);
      const data = await response.json();

      if (data.status !== 'OK') {
        console.error('Google Places API error:', data.status);
        return this.getFallbackChurches(params);
      }

      // Get detailed information for each church
      const churchesWithDetails = await Promise.all(
        data.results.map(async (place: any) => {
          const details = await this.getChurchDetails(place.place_id);
          return this.formatChurchData(place, details, params);
        })
      );

      return churchesWithDetails;
    } catch (error) {
      console.error('Error finding churches:', error);
      return this.getFallbackChurches(params);
    }
  }

  static async getChurchDetails(placeId: string): Promise<any> {
    try {
      const detailsUrl = `${this.GOOGLE_PLACES_BASE_URL}/details/json?` +
        `place_id=${placeId}&` +
        `fields=formatted_phone_number,website,rating,user_ratings_total,photos&` +
        `key=${this.GOOGLE_PLACES_API_KEY}`;

      const response = await fetch(detailsUrl);
      const data = await response.json();

      return data.result || {};
    } catch (error) {
      console.error('Error getting church details:', error);
      return {};
    }
  }

  static formatChurchData(place: any, details: any, params: ChurchSearchParams): ChurchLocation {
    const addressComponents = place.vicinity.split(', ');
    const cityState = addressComponents[addressComponents.length - 1] || '';
    const [city, state] = cityState.split(' ');

    return {
      id: place.place_id,
      name: place.name,
      address: place.vicinity,
      city: city || '',
      state: state || '',
      zip: '', // Not provided by Google Places
      phone: details.formatted_phone_number,
      website: details.website,
      rating: place.rating,
      review_count: details.user_ratings_total,
      photos: place.photos?.map((photo: any) => 
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${this.GOOGLE_PLACES_API_KEY}`
      ) || [],
      types: place.types,
      coordinates: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      },
      distance: this.calculateDistance(
        params.latitude,
        params.longitude,
        place.geometry.location.lat,
        place.geometry.location.lng
      ),
      place_id: place.place_id
    };
  }

  static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  static deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  static getFallbackChurches(params: ChurchSearchParams): ChurchLocation[] {
    // Fallback data when API is unavailable
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
          lat: params.latitude + 0.01,
          lng: params.longitude + 0.01
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
          lat: params.latitude - 0.01,
          lng: params.longitude - 0.01
        },
        distance: 4.1,
        place_id: 'fallback-2'
      }
    ];
  }

  static async getUserLocation(): Promise<{lat: number, lng: number} | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  static async searchChurchesByDenomination(
    denomination: string,
    location: {lat: number, lng: number},
    radius: number = 25000
  ): Promise<ChurchLocation[]> {
    const churches = await this.findChurchesNearby({
      latitude: location.lat,
      longitude: location.lng,
      radius,
      keyword: denomination
    });

    // Filter by denomination keywords
    const denominationKeywords = {
      'Baptist': ['baptist', 'baptist church'],
      'Catholic': ['catholic', 'catholic church', 'st.', 'saint'],
      'Lutheran': ['lutheran', 'lutheran church'],
      'Methodist': ['methodist', 'methodist church'],
      'Presbyterian': ['presbyterian', 'presbyterian church'],
      'Non-denominational': ['community', 'non-denominational', 'christian']
    };

    const keywords = denominationKeywords[denomination as keyof typeof denominationKeywords] || [];
    
    return churches.filter(church => 
      keywords.some(keyword => 
        church.name.toLowerCase().includes(keyword) ||
        church.types.some(type => type.toLowerCase().includes(keyword))
      )
    );
  }

  static async getChurchEvents(churchId: string): Promise<any[]> {
    // This would integrate with church-specific APIs or databases
    // For now, return mock events
    return [
      {
        id: '1',
        title: 'Sunday Service',
        description: 'Weekly worship service',
        date: new Date().toISOString(),
        time: '10:00 AM',
        type: 'worship'
      },
      {
        id: '2',
        title: 'Bible Study',
        description: 'Weekly Bible study group',
        date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        time: '7:00 PM',
        type: 'bible_study'
      }
    ];
  }
} 