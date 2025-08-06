-- Enhanced Subscription Schema for Shield AI
-- This extends the existing subscription system with Bible-specific tiers and usage tracking

-- NOTE: Before running this schema, you MUST first add the new enum values
-- Run the database/fix-enum-additions.sql script first, one section at a time
-- This will safely add 'student', 'scholar', and 'ministry' to the subscription_plan enum

-- Verify enum values exist (this will error if they don't exist, which is intentional)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'student' AND enumtypid = 'subscription_plan'::regtype) THEN
        RAISE EXCEPTION 'Enum value "student" not found. Please run database/fix-enum-additions.sql first.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'scholar' AND enumtypid = 'subscription_plan'::regtype) THEN
        RAISE EXCEPTION 'Enum value "scholar" not found. Please run database/fix-enum-additions.sql first.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ministry' AND enumtypid = 'subscription_plan'::regtype) THEN
        RAISE EXCEPTION 'Enum value "ministry" not found. Please run database/fix-enum-additions.sql first.';
    END IF;
    RAISE NOTICE 'All required enum values found. Proceeding with schema creation.';
END $$;

-- Enhanced subscription plans with Bible-specific features
INSERT INTO subscription_plans (name, display_name, description, price_weekly, price_monthly, price_yearly, features, is_active) VALUES
    ('basic', 'Explorer (Trial)', 'Perfect for exploring Shield AI', 0.00, 0.00, 0.00, 
     '["5 AI conversations per day", "Basic Bible search", "5 verse notes per week", "Standard apologetics responses"]', 
     true),
    ('student', 'Bible Student', 'For serious Bible students', 2.49, 9.99, 99.99,
     '["Unlimited AI conversations", "Advanced Bible search with cross-references", "Unlimited verse notes with templates", "Church finder with ratings", "Export study materials", "Email support"]',
     true),
    ('scholar', 'Bible Scholar', 'For advanced theological study', 4.99, 19.99, 199.99,
     '["Everything in Student +", "GPT-4 Accurate mode unlimited", "Advanced apologetics knowledge base", "Mood-based verse recommendations", "Collaboration features", "Priority support", "Advanced analytics", "API access"]',
     true),
    ('ministry', 'Ministry & Churches', 'For ministries and church teams', 12.49, 49.99, 499.99,
     '["Everything in Scholar +", "Multi-user accounts (up to 25)", "Sermon preparation tools", "Bulk note management", "White-label options", "Advanced church finder", "Dedicated support", "Custom integrations"]',
     true)
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    price_weekly = EXCLUDED.price_weekly,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    features = EXCLUDED.features,
    updated_at = NOW();

-- Create usage tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- AI Usage Metrics
    conversations_count INTEGER DEFAULT 0,
    fast_mode_requests INTEGER DEFAULT 0,
    accurate_mode_requests INTEGER DEFAULT 0,
    total_tokens_used BIGINT DEFAULT 0,
    
    -- Bible Feature Usage
    bible_searches INTEGER DEFAULT 0,
    notes_created INTEGER DEFAULT 0,
    cross_references_generated INTEGER DEFAULT 0,
    verse_lookups INTEGER DEFAULT 0,
    
    -- Premium Feature Usage
    church_searches INTEGER DEFAULT 0,
    mood_verse_requests INTEGER DEFAULT 0,
    exports_generated INTEGER DEFAULT 0,
    api_calls INTEGER DEFAULT 0,
    
    -- Collaboration Features
    notes_shared INTEGER DEFAULT 0,
    collaborations_initiated INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, period_start)
);

-- Create subscription limits configuration table
CREATE TABLE IF NOT EXISTS subscription_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_name subscription_plan NOT NULL UNIQUE,
    
    -- Daily Limits
    daily_conversations INTEGER,
    daily_accurate_mode INTEGER,
    daily_bible_searches INTEGER,
    daily_exports INTEGER,
    
    -- Monthly Limits  
    monthly_notes INTEGER,
    monthly_api_calls INTEGER,
    monthly_church_searches INTEGER,
    
    -- Feature Access
    accurate_mode_enabled BOOLEAN DEFAULT FALSE,
    advanced_bible_search BOOLEAN DEFAULT FALSE,
    cross_references_enabled BOOLEAN DEFAULT FALSE,
    collaboration_enabled BOOLEAN DEFAULT FALSE,
    api_access_enabled BOOLEAN DEFAULT FALSE,
    priority_support BOOLEAN DEFAULT FALSE,
    white_label_enabled BOOLEAN DEFAULT FALSE,
    
    -- Team Features
    max_team_members INTEGER DEFAULT 1,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default limits for each plan
INSERT INTO subscription_limits (
    plan_name, 
    daily_conversations, daily_accurate_mode, daily_bible_searches, daily_exports,
    monthly_notes, monthly_api_calls, monthly_church_searches,
    accurate_mode_enabled, advanced_bible_search, cross_references_enabled, 
    collaboration_enabled, api_access_enabled, priority_support, white_label_enabled,
    max_team_members
) VALUES
    -- Basic (Trial) Plan
    ('basic', 5, 0, 20, 1, 20, 0, 5, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 1),
    
    -- Student Plan  
    ('student', NULL, 10, NULL, 10, NULL, 0, 50, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE, 1),
    
    -- Scholar Plan
    ('scholar', NULL, NULL, NULL, NULL, NULL, 1000, NULL, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, 3),
    
    -- Ministry Plan
    ('ministry', NULL, NULL, NULL, NULL, NULL, 5000, NULL, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 25)
ON CONFLICT (plan_name) DO UPDATE SET
    daily_conversations = EXCLUDED.daily_conversations,
    daily_accurate_mode = EXCLUDED.daily_accurate_mode,
    daily_bible_searches = EXCLUDED.daily_bible_searches,
    daily_exports = EXCLUDED.daily_exports,
    monthly_notes = EXCLUDED.monthly_notes,
    monthly_api_calls = EXCLUDED.monthly_api_calls,
    monthly_church_searches = EXCLUDED.monthly_church_searches,
    accurate_mode_enabled = EXCLUDED.accurate_mode_enabled,
    advanced_bible_search = EXCLUDED.advanced_bible_search,
    cross_references_enabled = EXCLUDED.cross_references_enabled,
    collaboration_enabled = EXCLUDED.collaboration_enabled,
    api_access_enabled = EXCLUDED.api_access_enabled,
    priority_support = EXCLUDED.priority_support,
    white_label_enabled = EXCLUDED.white_label_enabled,
    max_team_members = EXCLUDED.max_team_members,
    updated_at = NOW();

-- Create promo codes table
CREATE TABLE IF NOT EXISTS promo_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed_amount', 'free_trial_extension')),
    value DECIMAL(10,2) NOT NULL,
    applicable_plans subscription_plan[] DEFAULT '{}',
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ NOT NULL,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    first_time_only BOOLEAN DEFAULT FALSE,
    min_plan_duration INTEGER DEFAULT 0, -- days
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create promo code usage tracking
CREATE TABLE IF NOT EXISTS promo_code_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    promo_code_id UUID REFERENCES promo_codes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
    discount_amount DECIMAL(10,2) NOT NULL,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(promo_code_id, user_id)
);

-- Create referral system
CREATE TABLE IF NOT EXISTS referral_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(20) UNIQUE NOT NULL,
    referrer_reward_type VARCHAR(20) DEFAULT 'free_months',
    referrer_reward_value INTEGER DEFAULT 1,
    referee_reward_type VARCHAR(20) DEFAULT 'extended_trial', 
    referee_reward_value INTEGER DEFAULT 7, -- days
    min_subscription_duration INTEGER DEFAULT 30, -- days
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Create referral tracking
CREATE TABLE IF NOT EXISTS referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referral_code_id UUID REFERENCES referral_codes(id) ON DELETE CASCADE,
    referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    referee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    referee_subscription_id UUID REFERENCES subscriptions(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'qualified', 'rewarded')),
    referrer_rewarded BOOLEAN DEFAULT FALSE,
    referee_rewarded BOOLEAN DEFAULT FALSE,
    qualified_at TIMESTAMPTZ,
    rewarded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(referrer_id, referee_id)
);

-- Create subscription analytics view
CREATE OR REPLACE VIEW subscription_analytics AS
SELECT 
    sp.name as plan_name,
    sp.display_name,
    COUNT(s.id) as active_subscriptions,
    COUNT(s.id) FILTER (WHERE s.created_at >= NOW() - INTERVAL '30 days') as new_subscriptions_30d,
    COUNT(s.id) FILTER (WHERE s.status = 'canceled') as canceled_subscriptions,
    COUNT(s.id) FILTER (WHERE s.cancel_at_period_end = true) as pending_cancellations,
    AVG(EXTRACT(epoch FROM (s.canceled_at - s.created_at))/86400.0) as avg_lifetime_days,
    SUM(CASE 
        WHEN sp.price_monthly > 0 THEN sp.price_monthly 
        ELSE 0 
    END) as monthly_recurring_revenue,
    SUM(CASE 
        WHEN sp.price_yearly > 0 THEN sp.price_yearly 
        ELSE 0 
    END) as annual_recurring_revenue
FROM subscription_plans sp
LEFT JOIN subscriptions s ON s.plan_id = sp.id
WHERE sp.is_active = true
GROUP BY sp.id, sp.name, sp.display_name, sp.price_monthly, sp.price_yearly;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_period ON usage_tracking(user_id, period_start);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_period ON usage_tracking(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_valid ON promo_codes(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- Create function to get current usage for a user
CREATE OR REPLACE FUNCTION get_current_usage(p_user_id UUID)
RETURNS TABLE(
    conversations_today INTEGER,
    accurate_mode_today INTEGER,
    bible_searches_today INTEGER,
    exports_today INTEGER,
    notes_this_month INTEGER,
    api_calls_this_month INTEGER,
    church_searches_this_month INTEGER
) AS $$
DECLARE
    today_start DATE := CURRENT_DATE;
    month_start DATE := DATE_TRUNC('month', CURRENT_DATE)::DATE;
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(ut_today.conversations_count, 0)::INTEGER,
        COALESCE(ut_today.accurate_mode_requests, 0)::INTEGER,
        COALESCE(ut_today.bible_searches, 0)::INTEGER,
        COALESCE(ut_today.exports_generated, 0)::INTEGER,
        COALESCE(ut_month.notes_created, 0)::INTEGER,
        COALESCE(ut_month.api_calls, 0)::INTEGER,
        COALESCE(ut_month.church_searches, 0)::INTEGER
    FROM (SELECT 1) dummy
    LEFT JOIN usage_tracking ut_today ON ut_today.user_id = p_user_id AND ut_today.period_start = today_start
    LEFT JOIN usage_tracking ut_month ON ut_month.user_id = p_user_id AND ut_month.period_start = month_start;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment usage
CREATE OR REPLACE FUNCTION increment_usage(
    p_user_id UUID,
    p_metric_type VARCHAR,
    p_increment INTEGER DEFAULT 1
) RETURNS VOID AS $$
DECLARE
    today_start DATE := CURRENT_DATE;
    today_end DATE := CURRENT_DATE + INTERVAL '1 day' - INTERVAL '1 second';
BEGIN
    INSERT INTO usage_tracking (user_id, period_start, period_end)
    VALUES (p_user_id, today_start, today_end)
    ON CONFLICT (user_id, period_start) DO NOTHING;
    
    CASE p_metric_type
        WHEN 'conversation' THEN
            UPDATE usage_tracking 
            SET conversations_count = conversations_count + p_increment, updated_at = NOW()
            WHERE user_id = p_user_id AND period_start = today_start;
        WHEN 'accurate_mode' THEN
            UPDATE usage_tracking 
            SET accurate_mode_requests = accurate_mode_requests + p_increment, updated_at = NOW()
            WHERE user_id = p_user_id AND period_start = today_start;
        WHEN 'bible_search' THEN
            UPDATE usage_tracking 
            SET bible_searches = bible_searches + p_increment, updated_at = NOW()
            WHERE user_id = p_user_id AND period_start = today_start;
        WHEN 'note_created' THEN
            UPDATE usage_tracking 
            SET notes_created = notes_created + p_increment, updated_at = NOW()
            WHERE user_id = p_user_id AND period_start = today_start;
        WHEN 'export' THEN
            UPDATE usage_tracking 
            SET exports_generated = exports_generated + p_increment, updated_at = NOW()
            WHERE user_id = p_user_id AND period_start = today_start;
        WHEN 'api_call' THEN
            UPDATE usage_tracking 
            SET api_calls = api_calls + p_increment, updated_at = NOW()
            WHERE user_id = p_user_id AND period_start = today_start;
        WHEN 'church_search' THEN
            UPDATE usage_tracking 
            SET church_searches = church_searches + p_increment, updated_at = NOW()
            WHERE user_id = p_user_id AND period_start = today_start;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Set up RLS policies
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Usage tracking policies
CREATE POLICY "Users can view their own usage" ON usage_tracking
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage" ON usage_tracking  
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage" ON usage_tracking
    FOR UPDATE USING (auth.uid() = user_id);

-- Subscription limits are readable by all authenticated users
CREATE POLICY "All users can read subscription limits" ON subscription_limits
    FOR SELECT TO authenticated USING (true);

-- Promo codes policies
CREATE POLICY "All users can read active promo codes" ON promo_codes
    FOR SELECT TO authenticated 
    USING (valid_from <= NOW() AND valid_until >= NOW() AND current_uses < max_uses);

CREATE POLICY "Users can view their promo code usage" ON promo_code_usage
    FOR SELECT USING (auth.uid() = user_id);

-- Referral policies  
CREATE POLICY "Users can manage their referral codes" ON referral_codes
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view referrals they're involved in" ON referrals
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON usage_tracking TO authenticated;
GRANT SELECT ON subscription_limits TO authenticated;
GRANT SELECT ON promo_codes TO authenticated;
GRANT SELECT, INSERT ON promo_code_usage TO authenticated;
GRANT SELECT, INSERT, UPDATE ON referral_codes TO authenticated;
GRANT SELECT ON referrals TO authenticated;
GRANT SELECT ON subscription_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_usage TO authenticated;
GRANT EXECUTE ON FUNCTION increment_usage TO authenticated;

-- Add helpful comments
COMMENT ON TABLE usage_tracking IS 'Tracks daily usage metrics for subscription billing and limits';
COMMENT ON TABLE subscription_limits IS 'Defines usage limits and feature access for each subscription plan';
COMMENT ON TABLE promo_codes IS 'Promotional discount codes for subscriptions';
COMMENT ON TABLE referral_codes IS 'User referral codes for growth program';
COMMENT ON VIEW subscription_analytics IS 'Analytics view for subscription metrics and revenue';