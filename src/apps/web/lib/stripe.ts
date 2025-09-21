import Stripe from 'stripe';
import { supabase } from './supabase';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export interface SubscriptionPlan {
  id: string;
  name: 'basic' | 'premium';
  display_name: string;
  description: string;
  price_weekly: number;
  price_monthly?: number;
  price_yearly?: number;
  stripe_price_id?: string;
  features: string[];
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  stripe_subscription_id?: string;
  status: 'trial' | 'active' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'unpaid';
  current_period_start?: Date;
  current_period_end?: Date;
  cancel_at_period_end: boolean;
  canceled_at?: Date;
  created_at: Date;
  updated_at: Date;
  subscription_plans?: {
    name: 'basic' | 'premium';
    display_name: string;
    description: string;
    price_weekly: number;
    features: string[];
  };
}

export interface Payment {
  id: string;
  user_id: string;
  subscription_id?: string;
  stripe_payment_intent_id?: string;
  stripe_invoice_id?: string;
  amount: number;
  currency: string;
  status: string;
  payment_method?: string;
  created_at: Date;
}

export class StripeService {
  // Create or get Stripe customer
  static async createOrGetCustomer(userId: string, email: string, name?: string): Promise<string> {
    try {
      // Check if user already has a Stripe customer ID
      const { data: user } = await supabase
        .from('users')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

      if (user?.stripe_customer_id) {
        return user.stripe_customer_id;
      }

      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          userId,
        },
      });

      // Update user with Stripe customer ID
      await supabase
        .from('users')
        .update({ stripe_customer_id: customer.id })
        .eq('id', userId);

      return customer.id;
    } catch (error) {
      console.error('Error creating/getting Stripe customer:', error);
      throw error;
    }
  }

  // Get subscription plans
  static async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const { data: plans, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_weekly');

      if (error) throw error;
      return plans || [];
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      throw error;
    }
  }

  // Create subscription
  static async createSubscription(
    userId: string,
    planName: 'basic' | 'premium',
    paymentMethodId?: string
  ): Promise<{ subscription: UserSubscription; clientSecret?: string }> {
    try {
      // Get user and plan details
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('name', planName)
        .single();

      if (!user || !plan) {
        throw new Error('User or plan not found');
      }

      // Get or create Stripe customer
      const customerId = await this.createOrGetCustomer(userId, user.email, user.full_name);

      // Create Stripe subscription
      const subscriptionData: any = {
        customer: customerId,
        items: [{ price: plan.stripe_price_id }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      };

      if (paymentMethodId) {
        subscriptionData.default_payment_method = paymentMethodId;
      }

      const stripeSubscription = await stripe.subscriptions.create(subscriptionData);

      // Create subscription record in database
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_id: plan.id,
          stripe_subscription_id: stripeSubscription.id,
          status: stripeSubscription.status as any,
          current_period_start: new Date(stripeSubscription.current_period_start * 1000),
          current_period_end: new Date(stripeSubscription.current_period_end * 1000),
        })
        .select()
        .single();

      if (error) throw error;

      const clientSecret = (stripeSubscription.latest_invoice as any)?.payment_intent?.client_secret;

      return { subscription, clientSecret };
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  // Get user subscription
  static async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          subscription_plans (
            name,
            display_name,
            description,
            price_weekly,
            features
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return subscription;
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      throw error;
    }
  }

  // Cancel subscription
  static async cancelSubscription(userId: string, cancelAtPeriodEnd: boolean = true): Promise<void> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription?.stripe_subscription_id) {
        throw new Error('No active subscription found');
      }

      if (cancelAtPeriodEnd) {
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          cancel_at_period_end: true,
        });
      } else {
        await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
      }

      // Update subscription in database
      await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: cancelAtPeriodEnd,
          canceled_at: cancelAtPeriodEnd ? null : new Date(),
          status: cancelAtPeriodEnd ? 'active' : 'canceled',
        })
        .eq('id', subscription.id);
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  // Reactivate subscription
  static async reactivateSubscription(userId: string): Promise<void> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription?.stripe_subscription_id) {
        throw new Error('No subscription found');
      }

      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: false,
      });

      // Update subscription in database
      await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: false,
          canceled_at: null,
        })
        .eq('id', subscription.id);
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      throw error;
    }
  }

  // Get payment history
  static async getPaymentHistory(userId: string): Promise<Payment[]> {
    try {
      const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return payments || [];
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  }

  // Check if user has active subscription
  static async hasActiveSubscription(userId: string): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userId);
      return subscription?.status === 'active' || subscription?.status === 'trialing';
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }

  // Check if user is in trial period
  static async isInTrialPeriod(userId: string): Promise<boolean> {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('trial_end_date')
        .eq('id', userId)
        .single();

      if (!user) return false;

      const trialEndDate = new Date(user.trial_end_date);
      const now = new Date();

      return now < trialEndDate;
    } catch (error) {
      console.error('Error checking trial status:', error);
      return false;
    }
  }

  // Handle webhook events
  static async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          await this.handleSubscriptionEvent(event.data.object as Stripe.Subscription);
          break;
        case 'invoice.payment_succeeded':
        case 'invoice.payment_failed':
          await this.handleInvoiceEvent(event.data.object as Stripe.Invoice);
          break;
        case 'payment_intent.succeeded':
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentEvent(event.data.object as Stripe.PaymentIntent);
          break;
      }
    } catch (error) {
      console.error('Error handling webhook event:', error);
      throw error;
    }
  }

  private static async handleSubscriptionEvent(subscription: Stripe.Subscription): Promise<void> {
    try {
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('stripe_subscription_id', subscription.id)
        .single();

      if (existingSubscription) {
        // Update existing subscription
        await supabase
          .from('subscriptions')
          .update({
            status: subscription.status as any,
            current_period_start: new Date(subscription.current_period_start * 1000),
            current_period_end: new Date(subscription.current_period_end * 1000),
            cancel_at_period_end: subscription.cancel_at_period_end,
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
          })
          .eq('stripe_subscription_id', subscription.id);
      }
    } catch (error) {
      console.error('Error handling subscription event:', error);
      throw error;
    }
  }

  private static async handleInvoiceEvent(invoice: Stripe.Invoice): Promise<void> {
    try {
      if (invoice.subscription) {
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('stripe_subscription_id', invoice.subscription as string)
          .single();

        if (subscription) {
          // Create payment record
          await supabase
            .from('payments')
            .insert({
              user_id: subscription.user_id,
              subscription_id: subscription.id,
              stripe_invoice_id: invoice.id,
              amount: invoice.amount_paid / 100, // Convert from cents
              currency: invoice.currency,
              status: invoice.status || 'paid',
              payment_method: invoice.payment_intent ? 'card' : 'invoice',
            });
        }
      }
    } catch (error) {
      console.error('Error handling invoice event:', error);
      throw error;
    }
  }

  private static async handlePaymentIntentEvent(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      // Handle payment intent events if needed
      console.log('Payment intent event:', paymentIntent.id, paymentIntent.status);
    } catch (error) {
      console.error('Error handling payment intent event:', error);
      throw error;
    }
  }
} 