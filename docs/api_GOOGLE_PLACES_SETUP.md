# Google Places API Setup for Church Finder

**Status**: ⚠️ **REQUIRES CONFIGURATION**  
**Impact**: Church Finder currently uses fallback data when API key is not configured

## 🎯 **Objective**

Configure Google Places API to fetch real church data from the user's actual location instead of using mock/fallback data.

## 📋 **Current Status**

### ✅ **What's Working**
- Church Finder component is properly implemented
- API endpoint uses Google Places API correctly
- Geolocation services work
- Error handling and fallback data in place

### ⚠️ **What Needs Configuration**
- Google Places API key not configured
- Currently falls back to mock data when API fails

## 🔧 **Setup Instructions**

### **Step 1: Get Google Places API Key**

1. **Go to Google Cloud Console**
   ```
   https://console.cloud.google.com/
   ```

2. **Create or Select a Project**
   - Create a new project or select existing one
   - Note your Project ID

3. **Enable Places API**
   - Go to "APIs & Services" > "Library"
   - Search for "Places API"
   - Click "Enable"

4. **Create API Key**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated key

5. **Restrict API Key (Recommended)**
   - Click on the created API key
   - Under "Application restrictions", select "HTTP referrers"
   - Add your domain: `localhost:3001/*` (for development)
   - Under "API restrictions", select "Restrict key"
   - Choose "Places API" from the list

### **Step 2: Configure Environment Variables**

1. **Add to your `.env.local` file:**
   ```bash
   # Google Places API (for church finder)
   NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_actual_google_places_api_key_here
   ```

2. **For Production, add to Vercel:**
   ```bash
   # In Vercel dashboard > Settings > Environment Variables
   NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_actual_google_places_api_key_here
   ```

### **Step 3: Test the Configuration**

1. **Restart your development server:**
   ```bash
   npm run dev
   ```

2. **Test the API endpoint:**
   ```bash
   curl -X POST http://localhost:3001/api/churches/search \
     -H "Content-Type: application/json" \
     -d '{"latitude": 30.2672, "longitude": -97.7431, "radius": 5000}'
   ```

3. **Expected Response:**
   ```json
   {
     "churches": [
       {
         "id": "ChIJ...",
         "name": "Real Church Name",
         "address": "123 Real Street",
         "city": "Austin",
         "state": "TX",
         "rating": 4.5,
         "review_count": 127,
         "distance": 2.3,
         "place_id": "ChIJ..."
       }
     ]
   }
   ```

## 🔍 **Verification Steps**

### **Check API Key Configuration**

1. **Verify environment variable is loaded:**
   ```bash
   # In your browser console or server logs
   console.log(process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY);
   ```

2. **Test API endpoint directly:**
   ```bash
   curl -X POST http://localhost:3001/api/churches/search \
     -H "Content-Type: application/json" \
     -d '{"latitude": 30.2672, "longitude": -97.7431, "radius": 5000}' \
     | jq '.churches[0].name'
   ```

3. **Check browser network tab:**
   - Open Church Finder in browser
   - Open Developer Tools > Network
   - Look for requests to `/api/churches/search`
   - Verify response contains real church data

### **Expected Behavior After Setup**

1. **Real Church Data:**
   - Church names from Google Places
   - Real addresses and contact info
   - Actual ratings and reviews
   - Accurate distances

2. **No More Mock Data:**
   - No "First Baptist Church" fallback
   - No "Grace Community Church" fallback
   - Real church names from your area

## 🚨 **Common Issues & Solutions**

### **Issue 1: "API key not configured"**
**Solution:**
```bash
# Add to .env.local
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_actual_key_here
```

### **Issue 2: "REQUEST_DENIED" error**
**Solutions:**
1. **Check API key restrictions:**
   - Ensure Places API is enabled
   - Check referrer restrictions
   - Verify API key is correct

2. **Enable billing:**
   - Google Places API requires billing to be enabled
   - Go to Google Cloud Console > Billing

### **Issue 3: "No churches found"**
**Solutions:**
1. **Check location:**
   - Ensure user location is accurate
   - Try different coordinates

2. **Check radius:**
   - Increase search radius
   - Try different denominations

### **Issue 4: "Referer restrictions"**
**Solution:**
```bash
# In Google Cloud Console > Credentials > API Key
# Add these to "Application restrictions":
localhost:3001/*
yourdomain.com/*
```

## 📊 **API Usage & Costs**

### **Google Places API Pricing**
- **Nearby Search**: $17 per 1000 requests
- **Text Search**: $5 per 1000 requests
- **Place Details**: $17 per 1000 requests

### **Estimated Costs**
- **Development**: ~$1-5/month
- **Production**: ~$10-50/month (depending on usage)

### **Cost Optimization**
1. **Implement caching:**
   ```javascript
   // Cache results for 1 hour
   const cacheKey = `churches_${lat}_${lng}_${radius}`;
   const cached = localStorage.getItem(cacheKey);
   ```

2. **Limit API calls:**
   - Only search when user explicitly requests
   - Cache results locally
   - Implement rate limiting

## 🔧 **Advanced Configuration**

### **Enhanced Search Queries**

The current implementation searches for:
- `type=church` - Churches specifically
- `type=place_of_worship` - All places of worship
- Text search for: "church OR chapel OR cathedral OR temple OR synagogue OR mosque OR religious center"

### **Denomination-Specific Search**

When a denomination is selected, it adds:
- `query=${denomination} church`

### **Custom Search Parameters**

You can modify the search in `pages/api/churches/search.ts`:

```javascript
// Add more specific searches
const searchQueries = [
  // Existing queries...
  
  // Add specific denomination searches
  `${GOOGLE_PLACES_BASE_URL}/textsearch/json?` +
  `query=${encodeURIComponent(denomination)} church near me&` +
  `location=${latitude},${longitude}&` +
  `radius=${radius}&` +
  `key=${GOOGLE_PLACES_API_KEY}`
];
```

## ✅ **Success Criteria**

After setup, you should see:

1. **Real Church Names** instead of "First Baptist Church" fallback
2. **Actual Addresses** from Google Places
3. **Real Ratings** and review counts
4. **Accurate Distances** calculated from user location
5. **Church Photos** (if available)
6. **Contact Information** (phone, website)

## 🎯 **Testing Checklist**

- [ ] API key is configured in `.env.local`
- [ ] Google Places API is enabled in Google Cloud Console
- [ ] API key has proper restrictions
- [ ] Billing is enabled on Google Cloud account
- [ ] Church Finder shows real church names
- [ ] Distances are accurate
- [ ] Ratings and reviews are real
- [ ] No fallback data is shown

## 🚀 **Next Steps**

1. **Configure API key** following the steps above
2. **Test the Church Finder** with real location
3. **Monitor API usage** in Google Cloud Console
4. **Implement caching** for cost optimization
5. **Add error handling** for API limits

---

**Need Help?** Check the troubleshooting section in `docs/api/API_INTEGRATION_GUIDE.md`

