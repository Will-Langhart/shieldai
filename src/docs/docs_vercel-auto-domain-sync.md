# 🚀 Vercel Automatic Domain Sync Setup

This guide ensures that `shieldai.cloud` automatically points to the latest deployment from any branch.

## 🎯 **Problem Solved**

**Before**: `shieldai.cloud` was manually linked and often behind the latest deployments  
**After**: `shieldai.cloud` automatically syncs to the latest deployment from any branch

## 🔧 **Setup Steps**

### **1. GitHub Secrets Required**

Add these secrets to your GitHub repository (`Settings > Secrets and variables > Actions`):

```bash
VERCEL_TOKEN=your_vercel_token_here
VERCEL_ORG_ID=team_4315X4mj5c08ssrj3DVAzUyW
VERCEL_PROJECT_ID=prj_iISSR8yUy7WJJimHKUX6E47PCUD0
```

**To get VERCEL_TOKEN:**
1. Go to [Vercel Account Settings](https://vercel.com/account/tokens)
2. Create a new token with full access
3. Copy the token value

### **2. Automatic Configuration**

Run the configuration script:

```bash
npm run configure-vercel
```

This script will:
- ✅ Link your project to Vercel
- ✅ Configure automatic domain aliasing
- ✅ Test the configuration
- ✅ Verify domain sync

### **3. Manual Configuration (Alternative)**

If the script doesn't work, manually configure:

```bash
# Link project
vercel link

# Configure domain
vercel alias [LATEST_DEPLOYMENT_URL] shieldai.cloud

# Verify
vercel inspect shieldai.cloud
```

## 🚀 **How It Works**

### **Automatic Workflow**

1. **Push to any branch** (`ios-app`, `main`, `dev`, `prod`, `staging`)
2. **GitHub Actions trigger** automatically
3. **Vercel deploys** the new code
4. **Domain syncs** to the latest deployment
5. **shieldai.cloud** points to the new deployment

### **Workflow Jobs**

1. **🧪 Test & Build**: Runs tests and builds the project
2. **🚀 Deploy**: Deploys to Vercel production
3. **🔗 Sync Domain**: Links `shieldai.cloud` to latest deployment
4. **📢 Notify**: Reports success/failure status

## 📋 **Available Commands**

```bash
# Configure Vercel for automatic domain syncing
npm run configure-vercel

# Deploy and sync domain
npm run deploy

# Deploy with auto-confirmation
npm run deploy-branch

# Manual domain sync only
npm run sync-domain

# Check deployment status
vercel ls

# Check domain status
vercel inspect shieldai.cloud
```

## 🔍 **Verification**

### **Check Domain Status**
```bash
vercel inspect shieldai.cloud
```

**Expected Output:**
```
General
  id          dpl_xxxxxxxxx
  name        shieldai
  target      production
  status      ● Ready
  url         https://shieldai-xxxxx-wwjd.vercel.app

Aliases
  ╶ https://shieldai.cloud
  ╶ https://shieldai-wwjd.vercel.app
```

### **Check Latest Deployment**
```bash
vercel ls | grep "Production" | head -1
```

The domain should point to the same URL as the latest production deployment.

## 🚨 **Troubleshooting**

### **Domain Not Syncing**

1. **Check GitHub Actions**: Ensure the workflow is running
2. **Verify Secrets**: Check `VERCEL_TOKEN` is set correctly
3. **Manual Sync**: Run `npm run sync-domain`
4. **Check Logs**: Review GitHub Actions logs for errors

### **Deployment Failing**

1. **Check Build**: Ensure `npm run build:web` works locally
2. **Environment Variables**: Verify all required env vars are set in Vercel
3. **Node Version**: Ensure Node.js 18+ compatibility

### **Domain Still Behind**

1. **Force Sync**: Run `npm run sync-domain`
2. **Check DNS**: Wait for DNS propagation (can take up to 24 hours)
3. **Clear Cache**: Clear browser cache and try again

## 🔄 **Branch Strategy**

### **Production Branches**
- **`ios-app`**: Main development branch (auto-deploy + domain sync)
- **`main`**: Production branch (auto-deploy + domain sync)
- **`prod`**: Production releases (auto-deploy + domain sync)

### **Development Branches**
- **`dev`**: Development features (deploy only, no domain sync)
- **`staging`**: Pre-production testing (deploy only, no domain sync)

## 📊 **Monitoring**

### **GitHub Actions Dashboard**
- Go to `Actions` tab in your repository
- Monitor `🚀 Vercel Auto-Deploy & Domain Sync` workflow
- Check for successful domain syncs

### **Vercel Dashboard**
- Monitor deployments at [vercel.com](https://vercel.com)
- Check domain status in `Settings > Domains`
- Review function logs for any issues

## 🎉 **Success Indicators**

✅ **Automatic deployment** on every push to production branches  
✅ **Domain sync** happens automatically  
✅ **shieldai.cloud** always points to latest deployment  
✅ **Health checks** verify deployment success  
✅ **Notifications** report deployment status  

## 🔗 **Related Files**

- `.github/workflows/vercel-auto-deploy.yml` - Main workflow
- `scripts/configure-vercel.sh` - Configuration script
- `scripts/sync-vercel-domain.sh` - Domain sync script
- `vercel.json` - Vercel configuration
- `.vercel/project.json` - Project settings

---

**Need Help?** Check the GitHub Actions logs or run `npm run configure-vercel` to troubleshoot.
