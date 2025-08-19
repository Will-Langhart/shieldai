# 🔑 GitHub Secrets Setup for Vercel Auto-Deploy

## 🚨 **Why the Workflow Failed**

The GitHub Actions workflow failed because it's missing the required `VERCEL_TOKEN` secret. This token is needed to:
- Deploy to Vercel from GitHub Actions
- Sync the custom domain (`shieldai.cloud`) to the latest deployment
- Access Vercel project information

## 🔧 **How to Fix It**

### **Step 1: Get Your Vercel Token**

1. Go to [Vercel Account Settings](https://vercel.com/account/tokens)
2. Click **"Create"** to create a new token
3. Give it a name like "GitHub Actions - Shield AI"
4. Set **Scope** to "Full Account"
5. Click **"Create"**
6. **Copy the token value** (you won't see it again!)

### **Step 2: Add Token to GitHub Secrets**

1. Go to your GitHub repository: `https://github.com/Will-Langhart/shieldai`
2. Click **"Settings"** tab
3. Click **"Secrets and variables"** → **"Actions"**
4. Click **"New repository secret"**
5. **Name**: `VERCEL_TOKEN`
6. **Value**: Paste your Vercel token from Step 1
7. Click **"Add secret"**

### **Step 3: Verify Setup**

After adding the secret:
1. **Push to `ios-app` branch** to trigger the workflow
2. **Check Actions tab** to see if it runs successfully
3. **Monitor deployment** at [vercel.com/dashboard](https://vercel.com/dashboard)

## 📋 **What the Workflow Does**

1. **🧪 Build & Test**: Runs `npm ci` and `npm run build:web`
2. **🚀 Deploy**: Deploys to Vercel production
3. **🔗 Sync Domain**: Links `shieldai.cloud` to latest deployment
4. **📢 Notify**: Reports success/failure status

## 🔍 **Troubleshooting**

### **Workflow Still Failing?**
- Check the **Actions** tab for specific error messages
- Verify the `VERCEL_TOKEN` secret is set correctly
- Ensure the token has full account access

### **Domain Not Syncing?**
- The workflow will skip domain sync if token is missing
- Add the token and push again to trigger domain sync
- Or run manually: `npm run sync-domain`

### **Build Errors?**
- Check if `npm run build:web` works locally
- Verify all environment variables are set in Vercel
- Check Node.js version compatibility

## 🎯 **Expected Result**

✅ **Automatic deployment** on every push to `ios-app` or `main`  
✅ **Domain sync** happens automatically  
✅ **shieldai.cloud** always points to latest deployment  
✅ **GitHub Actions** show successful runs  

## 🔗 **Quick Commands**

```bash
# Test build locally
npm run build:web

# Deploy manually
npm run deploy

# Sync domain manually
npm run sync-domain

# Setup Vercel integration
npm run setup-vercel
```

---

**Need Help?** Check the GitHub Actions logs or run the commands above to troubleshoot.
