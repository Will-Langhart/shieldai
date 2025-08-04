# 🏛️ Church Finder Setup Guide

## Overview
The Church Finder feature uses Google Places API to find real churches near users based on their geolocation. This provides accurate, up-to-date church information including contact details, ratings, and photos.

## 🔧 Setup Instructions

### 1. Google Places API Setup

#### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable billing for your project

#### Step 2: Enable Places API
1. Go to "APIs & Services" > "Library"
2. Search for "Places API"
3. Click on "Places API" and click "Enable"

#### Step 3: Create API Key
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key

#### Step 4: Restrict API Key (Recommended)
1. Click on the created API key
2. Under "Application restrictions", select "HTTP referrers"
3. Add your domain: `https://yourdomain.com/*`
4. Under "API restrictions", select "Restrict key"
5. Select "Places API" from the dropdown
6. Click "Save"

### 2. Environment Variables

Add the following to your `.env.local` file:

```bash
# Google Places API
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
```

### 3. API Features

#### Available APIs:
- **Google Places API** (Primary) - Most comprehensive church data
- **Foursquare Places API** (Alternative) - Good for venue data
- **OpenStreetMap Overpass API** (Free) - Open source option

#### Google Places API Benefits:
- ✅ Real-time church data
- ✅ Accurate geolocation
- ✅ Photos and reviews
- ✅ Contact information
- ✅ Distance calculations
- ✅ Denomination filtering

### 4. Usage Limits

#### Google Places API Limits:
- **Free Tier**: 1,000 requests/day
- **Paid Tier**: $17 per 1,000 requests
- **Nearby Search**: 20 requests/second
- **Place Details**: 100 requests/second

### 5. Fallback Strategy

The system includes fallback data when:
- API key is missing
- Rate limits exceeded
- Network errors occur
- Location services disabled

### 6. Geolocation Features

#### Browser Geolocation:
- Uses `navigator.geolocation.getCurrentPosition()`
- High accuracy mode enabled
- 10-second timeout
- 5-minute cache

#### Distance Calculation:
- Uses Haversine formula
- Calculates distance in miles
- Accurate to ~0.1 miles

### 7. Church Data Structure

```typescript
interface ChurchLocation {
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
```

### 8. Search Features

#### Filters Available:
- **Distance**: 5, 10, 25, 50, 100 miles
- **Denomination**: Baptist, Catholic, Lutheran, Methodist, Presbyterian, Non-denominational
- **Search**: Church name, city, denomination

#### Search Parameters:
```typescript
interface ChurchSearchParams {
  latitude: number;
  longitude: number;
  radius: number; // in meters
  keyword?: string;
  denomination?: string;
}
```

### 9. Integration with Chat

When users select a church, it generates a chat prompt:
```
"Tell me about [Church Name] in [City]. What are their main ministries and how can I get involved?"
```

### 10. Mobile Optimization

- Responsive design for all screen sizes
- Touch-friendly interface
- Optimized for mobile geolocation
- Fast loading with skeleton states

### 11. Error Handling

#### Common Errors:
- **Location Permission Denied**: Shows fallback data
- **API Key Invalid**: Uses mock data
- **Network Error**: Graceful degradation
- **No Churches Found**: Helpful message

### 12. Performance Optimization

- Lazy loading of church details
- Caching of location data
- Debounced search input
- Optimized image loading

### 13. Security Considerations

- API key restricted to domain
- No sensitive data exposed
- Rate limiting implemented
- Input validation

### 14. Testing

#### Test Scenarios:
1. **Location Enabled**: Should find nearby churches
2. **Location Disabled**: Should show fallback data
3. **No Internet**: Should show cached data
4. **API Limits**: Should gracefully degrade

#### Test Locations:
- Austin, TX (Urban)
- Rural areas
- International locations

### 15. Monitoring

#### Key Metrics:
- API request count
- Response times
- Error rates
- User engagement

#### Logging:
- API errors logged
- User location requests
- Search patterns

### 16. Future Enhancements

#### Planned Features:
- Church event integration
- Real-time service times
- Church reviews system
- Denomination-specific filtering
- Multi-language support
- Accessibility features

#### Additional APIs:
- **Bible.org Church Directory**
- **Christianity.com Church Finder**
- **Denomination-specific APIs**

### 17. Troubleshooting

#### Common Issues:

**Issue**: No churches found
**Solution**: Check API key, location permissions, network connection

**Issue**: Slow loading
**Solution**: Check API quotas, optimize requests, implement caching

**Issue**: Wrong location
**Solution**: Check browser geolocation settings, clear cache

**Issue**: API errors
**Solution**: Verify API key, check billing, review rate limits

### 18. Cost Optimization

#### Strategies:
- Implement caching
- Use fallback data
- Optimize request frequency
- Monitor usage patterns

#### Estimated Costs:
- **1,000 users/day**: ~$5-10/month
- **10,000 users/day**: ~$50-100/month
- **100,000 users/day**: ~$500-1000/month

### 19. Deployment Checklist

- [ ] Google Places API enabled
- [ ] API key created and restricted
- [ ] Environment variable set
- [ ] Fallback data configured
- [ ] Error handling tested
- [ ] Mobile responsiveness verified
- [ ] Performance optimized
- [ ] Security measures implemented

### 20. Support

For issues with the Church Finder:
1. Check API quotas and billing
2. Verify environment variables
3. Test with different locations
4. Review browser console errors
5. Check network connectivity

---

**Note**: The Church Finder provides a valuable service to help users find local churches. The Google Places API integration ensures accurate, up-to-date information while maintaining good performance and user experience. 