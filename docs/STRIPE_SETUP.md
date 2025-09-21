# Stripe Setup Guide for Shield AI

This guide will help you set up Stripe for the Shield AI subscription system.

## Prerequisites

1. A Stripe account (create one at [stripe.com](https://stripe.com))
2. Access to your Stripe Dashboard
3. Your Shield AI application ready for deployment

## Step 1: Create Stripe Products and Prices

### 1.1 Create Basic Plan Product

1. Go to your Stripe Dashboard
2. Navigate to **Products** → **Add Product**
3. Create a product with these details:
   - **Name**: Shield AI Basic Plan
   - **Description**: Full access to AI chat and basic features
   - **Pricing**: $4.99 per week
   - **Billing**: Recurring
   - **Billing interval**: Weekly

### 1.2 Create Premium Plan Product

1. Create another product with these details:
   - **Name**: Shield AI Premium Plan
   - **Description**: Enhanced features with advanced AI models and priority support
   - **Pricing**: $9.99 per week
   - **Billing**: Recurring
   - **Billing interval**: Weekly

### 1.3 Note the Price IDs

After creating both products, note down the Price IDs (they start with `price_`). You'll need these for the database setup.

## Step 2: Configure Webhooks

### 2.1 Create Webhook Endpoint

1. In your Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set the endpoint URL to: `https://your-domain.com/api/webhooks/stripe`
4. Select these events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

### 2.2 Get Webhook Secret

After creating the webhook, copy the signing secret (starts with `whsec_`). You'll need this for your environment variables.

## Step 3: Update Database with Stripe Price IDs

Run this SQL in your Supabase SQL editor to update the subscription plans with your Stripe Price IDs:

```sql
-- Update Basic Plan with Stripe Price ID
UPDATE public.subscription_plans 
SET stripe_price_id = 'price_YOUR_BASIC_PLAN_PRICE_ID'
WHERE name = 'basic';

-- Update Premium Plan with Stripe Price ID
UPDATE public.subscription_plans 
SET stripe_price_id = 'price_YOUR_PREMIUM_PLAN_PRICE_ID'
WHERE name = 'premium';
```

Replace `price_YOUR_BASIC_PLAN_PRICE_ID` and `price_YOUR_PREMIUM_PLAN_PRICE_ID` with your actual Stripe Price IDs.

## Step 4: Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here
```

### 4.1 Get Your API Keys

1. In your Stripe Dashboard, go to **Developers** → **API Keys**
2. Copy your **Publishable key** (starts with `pk_test_` or `pk_live_`)
3. Copy your **Secret key** (starts with `sk_test_` or `sk_live_`)

### 4.2 Test vs Live Keys

- Use test keys (starting with `sk_test_` and `pk_test_`) for development
- Use live keys (starting with `sk_live_` and `pk_live_`) for production

## Step 5: Test the Integration

### 5.1 Test Card Numbers

Use these test card numbers to test the payment flow:

- **Successful payment**: `4242 4242 4242 4242`
- **Declined payment**: `4000 0000 0000 0002`
- **Requires authentication**: `4000 0025 0000 3155`

### 5.2 Test the Complete Flow

1. Start your development server
2. Create a new user account
3. Try to send a message (should work during trial)
4. Open the subscription modal
5. Select a plan and use a test card
6. Verify the subscription is created in Stripe Dashboard

## Step 6: Production Deployment

### 6.1 Update Environment Variables

For production, update your environment variables with live keys:

```bash
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
```

### 6.2 Update Webhook URL

Update your webhook endpoint URL to your production domain:

```
https://your-production-domain.com/api/webhooks/stripe
```

### 6.3 Test Production

1. Deploy your application
2. Test the complete payment flow with real cards
3. Verify webhooks are working in Stripe Dashboard
4. Check that subscriptions are being created correctly

## Step 7: Monitoring and Analytics

### 7.1 Stripe Dashboard

Monitor your subscriptions in the Stripe Dashboard:
- **Customers**: View all your customers
- **Subscriptions**: Track active subscriptions
- **Payments**: Monitor payment success/failure rates
- **Webhooks**: Check webhook delivery status

### 7.2 Application Logs

Monitor your application logs for:
- Webhook processing errors
- Subscription creation failures
- Payment processing issues

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Check your webhook endpoint URL is correct
   - Verify the webhook secret in your environment variables
   - Check your server logs for webhook processing errors

2. **Subscription creation fails**
   - Verify your Stripe Price IDs are correct
   - Check that your Stripe API keys are valid
   - Ensure your database schema is properly set up

3. **Payment fails**
   - Use test card numbers for development
   - Check Stripe Dashboard for detailed error messages
   - Verify your webhook is processing events correctly

### Debug Mode

Enable debug logging by adding this to your environment:

```bash
STRIPE_DEBUG=true
```

This will log detailed information about Stripe API calls and webhook processing.

## Security Best Practices

1. **Never expose your secret key** in client-side code
2. **Always verify webhook signatures** before processing events
3. **Use HTTPS** for all webhook endpoints
4. **Implement proper error handling** for failed payments
5. **Regularly monitor** your Stripe Dashboard for suspicious activity

## Support

If you encounter issues:

1. Check the [Stripe Documentation](https://stripe.com/docs)
2. Review your application logs
3. Check the Stripe Dashboard for error details
4. Contact Stripe Support if needed

## Next Steps

After setting up Stripe:

1. Test the complete subscription flow
2. Monitor your first few real payments
3. Set up email notifications for subscription events
4. Consider implementing additional features like:
   - Subscription upgrades/downgrades
   - Prorated billing
   - Coupon codes
   - Usage-based billing 