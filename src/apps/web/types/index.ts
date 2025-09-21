// Re-export all types
export * from './api'
export * from './bible'
export * from './chat'
export * from './church'

// User Types
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  created_at: Date
  updated_at: Date
  subscription?: Subscription
}

// Common component types
export interface PageProps {
  className?: string
}

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  className?: string
}

export interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  placeholder?: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  error?: string
  label?: string
  required?: boolean
  className?: string
}

// Navigation Types
export interface NavItem {
  path: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

// Theme Types
export interface Theme {
  name: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
    text: string
    textSecondary: string
  }
}

// Analytics Types
export interface AnalyticsEvent {
  event: string
  properties: Record<string, any>
  timestamp: Date
  user_id?: string
}

// Subscription Types
export interface Subscription {
  id: string
  user_id: string
  plan: 'free' | 'premium' | 'enterprise'
  status: 'active' | 'cancelled' | 'past_due'
  current_period_start: Date
  current_period_end: Date
  cancel_at_period_end: boolean
}

export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: 'month' | 'year'
  features: string[]
  limits: {
    messages_per_month: number
    bible_searches_per_month: number
    church_searches_per_month: number
  }
}