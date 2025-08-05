# 🏛️ Google Places API Setup Guide

This guide will help you set up the Google Places API for the church finder functionality in Shield AI.

## 🚀 Quick Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable billing for your project (required for Places API)

### 2. Enable Google Places API

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Places API"
3. Click on **Places API** and click **Enable**

### 3. Create API Key

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **API Key**
3. Copy the generated API key

### 4. Configure API Key Restrictions

**IMPORTANT**: For server-side usage, you need to configure the API key properly:

1. Click on your API key to edit it
2. Under **Application restrictions**, select **None** or **HTTP referrers (web sites)**
3. Under **API restrictions**, select **Restrict key** and choose **Places API**
4. Save the changes

### 5. Add to Environment Variables

Add your API key to your `.env.local` file:

```env
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_actual_api_key_here
```

## 🔧 API Key Configuration Options

### Option 1: No Restrictions (Development)
- **Application restrictions**: None
- **API restrictions**: Places API only
- **Best for**: Development and testing

### Option 2: HTTP Referrers (Production)
- **Application restrictions**: HTTP referrers (web sites)
- **Allowed referrers**: 
  - `localhost:3001/*` (development)
  - `yourdomain.com/*` (production)
- **API restrictions**: Places API only

### Option 3: IP Address Restrictions (Most Secure)
- **Application restrictions**: IP addresses
- **Allowed IPs**: Your server's IP address
- **API restrictions**: Places API only

## 🧪 Testing the API

### Test API Key Directly

```bash
curl "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=40.7128,-74.0060&radius=25000&type=church&key=YOUR_API_KEY"
```

Expected response:
```json
{
  "status": "OK",
  "results": [...]
}
```

### Test Through Shield AI

1. Start the development server: `npm run dev`
2. Open the church finder in your app
3. Allow location access
4. Search for churches

## 🚨 Common Issues & Solutions

### Issue: "REQUEST_DENIED" with "referer restrictions"

**Cause**: API key has referer restrictions that prevent server-side usage.

**Solution**: 
1. Go to Google Cloud Console > Credentials
2. Edit your API key
3. Set **Application restrictions** to **None** or **IP addresses**
4. Save changes

### Issue: "REQUEST_DENIED" with "API key not valid"

**Cause**: API key is invalid or not properly configured.

**Solution**:
1. Verify the API key is correct
2. Ensure Places API is enabled
3. Check billing is enabled
4. Verify API key restrictions allow your usage

### Issue: "OVER_QUERY_LIMIT"

**Cause**: Exceeded API quota.

**Solution**:
1. Check your Google Cloud billing
2. Monitor API usage in Google Cloud Console
3. Consider upgrading your billing plan

## 📊 API Usage & Limits

### Free Tier Limits
- **Places API**: 1,000 requests per day
- **Places Details API**: 1,000 requests per day
- **Places Photos API**: 1,000 requests per day

### Paid Tier
- **Places API**: $17 per 1,000 requests
- **Places Details API**: $17 per 1,000 requests
- **Places Photos API**: $7 per 1,000 requests

## 🔒 Security Best Practices

### For Development
```env
# .env.local
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_api_key
```

### For Production
1. **Use IP restrictions** when possible
2. **Monitor API usage** regularly
3. **Set up billing alerts**
4. **Rotate API keys** periodically

## 🏛️ Church Finder Features

Once configured, the church finder will provide:

- **Location-based search**: Find churches near you
- **Advanced filtering**: By denomination, distance, services
- **Detailed information**: Contact info, ratings, photos
- **Interactive map**: Visual church locations
- **Directions**: Navigation to churches

## 🧪 Testing Checklist

- [ ] API key is valid and working
- [ ] Places API is enabled
- [ ] Billing is configured
- [ ] API key restrictions are appropriate
- [ ] Church finder loads without errors
- [ ] Search returns real church data
- [ ] Fallback data works when API fails

## 📞 Support

If you encounter issues:

1. **Check Google Cloud Console** for API usage and errors
2. **Verify billing** is enabled and has sufficient funds
3. **Test API key** directly using curl commands above
4. **Check server logs** for detailed error messages
5. **Review this guide** for common solutions

---

**Note**: The church finder will fall back to sample data if the Google Places API is not properly configured, ensuring the app continues to work for testing purposes. 