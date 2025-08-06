# 🚀 Enhanced Subscription System Setup Guide

## Overview

The enhanced subscription system provides Bible-specific tiers, usage tracking, feature gating, and comprehensive billing management for Shield AI.

## 🏗️ **Architecture Components**

### **1. Database Schema** (`database/enhanced-subscription-schema.sql`)
- **Enhanced subscription plans** with Bible-specific features
- **Usage tracking** for daily/monthly limits
- **Subscription limits** configuration
- **Promo codes** and referral system
- **Analytics views** for revenue insights

### **2. Enhanced Service Layer** (`lib/enhanced-stripe-service.ts`)
- Extends existing `StripeService` with advanced features
- **Feature access checking** with real-time limits
- **Usage tracking** and incrementing
- **Promo code validation** and application
- **Referral program** management

### **3. Subscription Middleware** (`lib/subscription-middleware.ts`)
- **Feature gates** for API endpoints
- **Caching layer** for performance
- **React hooks** for frontend integration
- **Higher-order components** for feature gating

### **4. API Endpoints**
- `/api/subscriptions/tiers` - Get subscription plans
- `/api/subscriptions/usage` - Current usage metrics
- `/api/subscriptions/check-feature` - Feature access validation
- `/api/subscriptions/promo-code` - Promo code validation
- `/api/subscriptions/referral` - Referral management

### **5. UI Components**
- `EnhancedSubscriptionModal` - Upgrade/subscription management
- `SubscriptionUsageDashboard` - Usage tracking display
- `UpgradePrompt` - Feature upgrade prompts

## 📊 **Subscription Tiers**

### **Explorer (Free Trial)**
- 5 AI conversations per day
- Basic Bible search (20 searches/day)
- 5 verse notes per week
- Standard apologetics responses

### **Bible Student ($9.99/month)**
- Unlimited AI conversations
- Advanced Bible search with cross-references
- Unlimited verse notes with templates
- Church finder with ratings
- Export study materials
- Email support

### **Bible Scholar ($19.99/month)**
- Everything in Student +
- GPT-4 'Accurate' mode unlimited
- Advanced apologetics knowledge base
- Mood-based verse recommendations
- Collaboration features
- Priority support
- Advanced analytics
- API access (1,000 calls/month)

### **Ministry ($49.99/month)**
- Everything in Scholar +
- Multi-user accounts (up to 25)
- Sermon preparation tools
- Bulk note management
- White-label options
- Advanced church finder
- Dedicated support
- API access (5,000 calls/month)
- Custom integrations

## 🛠️ **Setup Instructions**

### **Step 1: Database Setup**

Run the enhanced subscription schema:

```sql
-- In your Supabase SQL editor
\i database/enhanced-subscription-schema.sql
```

This will:
- ✅ Add new subscription plan types
- ✅ Create usage tracking tables
- ✅ Set up subscription limits configuration
- ✅ Install promo codes and referral system
- ✅ Create analytics views
- ✅ Set up RLS policies

### **Step 2: Environment Variables**

Add to your `.env.local`:

```env
# Stripe (existing)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Subscription Settings
SUBSCRIPTION_TRIAL_DAYS=7
SUBSCRIPTION_GRACE_PERIOD_DAYS=3
```

### **Step 3: Stripe Product Setup**

Create products in Stripe dashboard for each tier:

1. **Bible Student Plan**
   - Monthly: $9.99
   - Yearly: $99.99 (17% discount)

2. **Bible Scholar Plan**
   - Monthly: $19.99
   - Yearly: $199.99 (17% discount)

3. **Ministry Plan**
   - Monthly: $49.99
   - Yearly: $499.99 (17% discount)

Update the `stripe_price_id` in your subscription_plans table with the actual Stripe price IDs.

### **Step 4: Integration Points**

#### **A. Update Existing Components**

Replace the old `SubscriptionModal` with `EnhancedSubscriptionModal`:

```tsx
// In components/UserSettings.tsx or wherever you use subscriptions
import EnhancedSubscriptionModal from './EnhancedSubscriptionModal';

// Replace old modal
<EnhancedSubscriptionModal
  isOpen={showSubscriptionModal}
  onClose={() => setShowSubscriptionModal(false)}
  currentSubscription={subscription}
  theme={theme}
/>
```

#### **B. Add Usage Dashboard**

```tsx
// In components/UserSettings.tsx
import SubscriptionUsageDashboard from './SubscriptionUsageDashboard';

<SubscriptionUsageDashboard
  theme={theme}
  currentTier={subscription?.subscription_plans?.name || 'basic'}
  onUpgradeClick={() => setShowSubscriptionModal(true)}
/>
```

#### **C. Integrate Feature Checks**

```tsx
// In any component that needs feature gating
import { useSubscriptionFeatures } from '../lib/subscription-middleware';

const { checkFeature } = useSubscriptionFeatures(user?.id);

const handleFeatureUse = async () => {
  const access = await checkFeature('accurate_mode', true);
  if (!access.allowed) {
    // Show upgrade prompt
    return;
  }
  // Continue with feature
};
```

### **Step 5: API Integration**

The enhanced subscription system automatically integrates with:

- ✅ **Chat API** (`/api/chat`) - Conversation and accurate mode limits
- ✅ **Bible Search API** (`/api/bible/search`) - Search limits and advanced features
- ✅ **Notes API** (`/api/bible/notes`) - Note creation limits
- ✅ **Export features** - Export limits
- ✅ **Church Finder** - Search limits

### **Step 6: Testing**

#### **Test Subscription Tiers**

```javascript
// Test feature access
const testFeatureAccess = async (userId, feature) => {
  const response = await fetch('/api/subscriptions/check-feature', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ feature, incrementUsage: false })
  });
  
  const result = await response.json();
  console.log(`Feature ${feature}:`, result);
};

// Test usage tracking
const testUsageTracking = async (userId) => {
  const response = await fetch('/api/subscriptions/usage', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const usage = await response.json();
  console.log('Current usage:', usage);
};
```

#### **Test Promo Codes**

```javascript
// Test promo code
const testPromoCode = async (code) => {
  const response = await fetch('/api/subscriptions/promo-code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ code })
  });
  
  const result = await response.json();
  console.log('Promo code result:', result);
};
```

## 📈 **Usage Monitoring**

### **Analytics Dashboard**

Access subscription analytics:

```sql
-- View subscription metrics
SELECT * FROM subscription_analytics;

-- View usage trends
SELECT 
  DATE_TRUNC('week', period_start) as week,
  AVG(conversations_count) as avg_conversations,
  AVG(bible_searches) as avg_searches,
  COUNT(DISTINCT user_id) as active_users
FROM usage_tracking 
GROUP BY week 
ORDER BY week;
```

### **Feature Usage Tracking**

Monitor which features drive upgrades:

```sql
-- Most limited features
SELECT 
  plan_name,
  daily_conversations,
  daily_accurate_mode,
  daily_bible_searches,
  monthly_notes
FROM subscription_limits
ORDER BY plan_name;
```

## 🔄 **Migration from Old System**

If migrating from the existing subscription system:

1. **Backup existing data**:
   ```sql
   CREATE TABLE backup_subscriptions AS SELECT * FROM subscriptions;
   CREATE TABLE backup_subscription_plans AS SELECT * FROM subscription_plans;
   ```

2. **Run migration script**:
   ```sql
   -- Update existing users to basic plan if no subscription
   UPDATE users SET trial_end_date = NOW() + INTERVAL '7 days' 
   WHERE trial_end_date IS NULL;
   ```

3. **Test thoroughly** before production deployment

## 🚨 **Important Notes**

### **Performance Considerations**
- Feature checks are cached for 5 minutes
- Usage tracking is asynchronous and won't block user actions
- Database indexes are optimized for common queries

### **Security**
- All subscription data is protected by RLS policies
- Feature checks validate user authentication
- Usage data is user-isolated

### **Scalability**
- Usage tracking aggregates daily/monthly for efficiency
- Analytics views are materialized for performance
- Caching reduces database load

## 🎯 **Next Steps**

After setup, consider implementing:

1. **Email notifications** for usage limits
2. **Webhook handlers** for Stripe events
3. **Admin dashboard** for subscription management
4. **A/B testing** for pricing strategies
5. **Customer success** automation

## 📞 **Support**

For issues with the subscription system:

1. Check Supabase logs for database errors
2. Verify Stripe webhook delivery
3. Monitor usage tracking accuracy
4. Test feature gates in development
5. Review subscription limits configuration

The enhanced subscription system provides a robust foundation for monetizing Shield AI while delivering value to users through Bible-specific features and intelligent usage management.