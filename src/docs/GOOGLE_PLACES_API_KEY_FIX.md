# Fix Google Places API Key Referer Restrictions

**Issue**: Your API key has referer restrictions that prevent server-side usage  
**Error**: "API keys with referer restrictions cannot be used with this API"

## 🔧 **Solution Options**

### **Option 1: Update API Key Restrictions (Recommended)**

1. **Go to Google Cloud Console**
   ```
   https://console.cloud.google.com/apis/credentials
   ```

2. **Find Your API Key**
   - Look for the key: the key stored in Vercel as `GOOGLE_PLACES_API_KEY`

3. **Update Application Restrictions**
   - Click on the API key
   - Under "Application restrictions", change from "HTTP referrers" to **"None"**
   - Or add these referrers:
     ```
     localhost:3001/*
     yourdomain.com/*
     *.vercel.app/*
     ```

4. **Update API Restrictions**
   - Under "API restrictions", ensure "Places API" is selected
   - Make sure "Places API" is enabled in your project

### **Option 2: Create a New API Key (Alternative)**

1. **Create New API Key**
   - Go to Google Cloud Console > Credentials
   - Click "Create Credentials" > "API Key"
   - Name it "Shield AI Server Key"

2. **Configure Restrictions**
   - Application restrictions: **"None"** (for server-side usage)
   - API restrictions: **"Places API"** only

3. **Update Environment Variable**
   ```bash
   # Replace in .env.local
   NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_new_api_key_here
   ```

## 🚨 **Security Note**

Setting "Application restrictions" to "None" allows the API key to be used from any domain. For production, consider:

1. **IP Restrictions**: Limit to your server IPs
2. **Domain Restrictions**: Add your production domains
3. **API Restrictions**: Only enable Places API

## 🧪 **Test the Fix**

After updating the API key restrictions:

1. **Restart your server:**
   ```bash
   npm run dev
   ```

2. **Test the API:**
   ```bash
   curl -X POST http://localhost:3001/api/churches/search \
     -H "Content-Type: application/json" \
     -d '{"latitude": 30.2672, "longitude": -97.7431, "radius": 5000}' \
     | jq '.churches[0].name'
   ```

3. **Expected Result:**
   ```json
   {
     "name": "Real Church Name",
     "address": "123 Real Street",
     "distance": 2.3,
     "rating": 4.5
   }
   ```

## ✅ **Success Indicators**

After fixing the API key restrictions, you should see:

- ✅ Real church names (not "First Baptist Church")
- ✅ Actual addresses from Google Places
- ✅ Real ratings and review counts
- ✅ No more "REQUEST_DENIED" errors in logs
- ✅ No fallback data warnings in the UI

## 🔍 **Verify the Fix**

Check your server logs for:
- ❌ "API keys with referer restrictions cannot be used"
- ✅ "Found X churches" messages
- ✅ Real church names in the response

---

**Need Help?** If you're still seeing issues after updating the API key restrictions, let me know and I can help troubleshoot further!

