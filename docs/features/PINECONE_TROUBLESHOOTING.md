# Pinecone Connection Troubleshooting Guide

## 🚨 **Current Issue: Pinecone Index Shows 0 Records**

Your Pinecone index `shieldai` is showing 0 records even after sending chat messages. This indicates a connection or configuration issue.

## 🔍 **Diagnosis Results**

### ✅ **What's Working:**
- Environment variables are properly set
- API key format is correct
- Index name is correct

### ❌ **What's Not Working:**
- Pinecone connection is failing with "Request failed to reach Pinecone"
- Cannot list indexes or access the index directly
- No vectors are being stored

## 🛠️ **Troubleshooting Steps**

### **Step 1: Verify Pinecone Index Configuration**

1. **Go to [Pinecone Console](https://app.pinecone.io/)**
2. **Check your index details:**
   - Index Name: `shieldai`
   - Environment: `us-east-1-aws`
   - Dimensions: `1024`
   - Metric: `cosine`
   - Model: `llama-text-embed-v2`

3. **Verify the index is ACTIVE and not in a different state**

### **Step 2: Check API Key Permissions**

1. **In Pinecone Console, go to API Keys section**
2. **Verify your API key:**
   - Has the correct permissions
   - Belongs to the same project as your index
   - Is not expired or revoked

### **Step 3: Verify Environment Configuration**

The issue might be with the environment format. Try these variations:

```bash
# Option 1: Full environment name
PINECONE_ENVIRONMENT=us-east-1-aws

# Option 2: Short environment name
PINECONE_ENVIRONMENT=us-east-1

# Option 3: Project-specific environment
PINECONE_ENVIRONMENT=your-project-id
```

### **Step 4: Check Network and Firewall**

1. **Verify your network allows outbound HTTPS connections**
2. **Check if you're behind a corporate firewall or VPN**
3. **Try from a different network (mobile hotspot, etc.)**

### **Step 5: Test with Different Environment Formats**

Run these test scripts to find the correct configuration:

```bash
# Test with us-east-1-aws
node scripts/test-pinecone-correct-env.js

# Test with us-east-1
node scripts/test-pinecone-simple.js

# Test with direct index access
node scripts/test-index-direct.js
```

## 🔧 **Immediate Fixes to Try**

### **Fix 1: Update Environment Variables**

Update your `.env.local` file:

```bash
# Try this format first
PINECONE_ENVIRONMENT=us-east-1-aws

# If that doesn't work, try this
PINECONE_ENVIRONMENT=us-east-1
```

### **Fix 2: Check Pinecone Project Settings**

1. **In Pinecone Console, note your Project ID**
2. **Try using the Project ID as the environment:**

```bash
PINECONE_ENVIRONMENT=your-project-id-here
```

### **Fix 3: Verify Index Host URL**

From your Pinecone index screenshot, the host is:
```
https://shieldai-smb4qh6.svc.aped-4627-b74a.pinecone.io
```

This suggests the environment might be `aped-4627-b74a` or similar.

## 🧪 **Testing Commands**

### **Test 1: Basic Connection**
```bash
curl -H "Api-Key: YOUR_API_KEY" \
  "https://controller.us-east-1-aws.pinecone.io/actions/whoami"
```

### **Test 2: Index Access**
```bash
curl -H "Api-Key: YOUR_API_KEY" \
  "https://shieldai-smb4qh6.svc.aped-4627-b74a.pinecone.io/describe_index_stats"
```

### **Test 3: Local Script**
```bash
node scripts/test-pinecone-correct-env.js
```

## 📋 **Environment Variable Checklist**

Make sure these are set correctly in your `.env.local`:

```bash
PINECONE_API_KEY=pcsk_6La4fD_KxUwby6c62E93h7pPAdgjhSG5szTKgqh9Pych3nSwCPVx1Ze5mFEzuFixbqszw1
PINECONE_ENVIRONMENT=us-east-1-aws  # Try different formats
PINECONE_INDEX_NAME=shieldai
```

## 🚀 **Next Steps**

1. **Check Pinecone Console for correct environment format**
2. **Verify API key permissions and project access**
3. **Test with different environment configurations**
4. **Check network connectivity and firewall settings**
5. **Contact Pinecone support if issues persist**

## 📞 **Getting Help**

- **Pinecone Status**: https://status.pinecone.io/
- **Pinecone Documentation**: https://docs.pinecone.io/
- **Pinecone Support**: Available in your console

## 🔍 **Debug Information**

When you run the test scripts, look for these specific error messages:

- `Request failed to reach Pinecone` → Network/configuration issue
- `Index not found` → Index doesn't exist or wrong name
- `Unauthorized` → API key permission issue
- `Invalid environment` → Wrong environment format

---

**Note**: The most likely issue is the environment format. Your index host URL suggests a different environment format than `us-east-1-aws`.
