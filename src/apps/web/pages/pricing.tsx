import { useEffect, useState } from 'react'
import type { GetStaticProps } from 'next'
import { Header } from '../components/Header'
import Footer from '../components/layout/Footer'
import { Seo } from '../components/Seo'
import { AuthModal } from '../components/auth/AuthModal'
import { useWarmTheme } from '../hooks/useWarmTheme'
import { isFeatureOn } from '../lib/feature-flags'
import {
  FALLBACK_PLANS,
  formatPlanPrice,
  planView,
  tiersToPlanCards,
  type BillingPeriod,
  type ChatMode,
  type PlanCard,
} from '../lib/membership-plans'

// Plans page behind the `pricing-page` flag. With the flag off, /pricing is a 404.

export const getStaticProps: GetStaticProps = async () => {
  if (planView(isFeatureOn('pricing-page')) === 'not-found') return { notFound: true }
  return { props: {} }
}

const PERIODS: { value: BillingPeriod; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

const MODE_LABELS: Record<ChatMode, string> = {
  gentle: 'Gentle',
  scholarly: 'Scholarly',
  debate: 'Debate',
}

const POPULAR_PLAN = 'scholar'

function PlanCardView({ card, period, onChoose }: { card: PlanCard; period: BillingPeriod; onChoose: () => void }) {
  const { amount, suffix } = formatPlanPrice(card, period)
  const popular = card.id === POPULAR_PLAN
  const buttonLabel = card.id === 'basic' ? 'Start free' : `Choose ${card.name}`
  return (
    <article
      aria-labelledby={`plan-${card.id}`}
      data-plan={card.id}
      className={`relative flex flex-col rounded-2xl border bg-shield-panel/80 p-6 ${
        popular ? 'border-shield-accent shadow-lg' : 'border-shield-edge'
      }`}
    >
      {popular && (
        <span className="absolute -top-3 left-6 rounded-full bg-shield-accent px-3 py-0.5 text-xs font-semibold text-shield-canvas">
          Most popular
        </span>
      )}
      <h2 id={`plan-${card.id}`} className="text-xl font-bold text-shield-fg">
        {card.name}
      </h2>
      <p className="mt-1 text-sm text-shield-muted">{card.tagline}</p>
      <p className="mt-4 text-shield-fg" data-testid="plan-price">
        <span className="text-3xl font-bold">{amount}</span>
        {suffix && <span className="ml-1 text-sm text-shield-muted">{suffix}</span>}
      </p>
      <p className="mt-4 text-sm font-medium text-shield-fg">
        {card.dailyConversations === null
          ? 'Unlimited conversations'
          : `${card.dailyConversations} conversations a day`}
      </p>
      <ul className="mt-2 flex flex-wrap gap-2" aria-label="Chat modes">
        {card.modes.map((mode) => (
          <li
            key={mode}
            className="rounded-full border border-shield-brand/40 bg-shield-brand/10 px-2.5 py-0.5 text-xs text-shield-brand"
          >
            {MODE_LABELS[mode]}
          </li>
        ))}
      </ul>
      <ul className="mt-4 flex-1 space-y-2 text-sm text-shield-muted">
        {card.highlights.map((highlight) => (
          <li key={highlight} className="flex gap-2">
            <span aria-hidden="true" className="text-shield-brand">
              ✓
            </span>
            <span>{highlight}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onChoose}
        className={`mt-6 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
          popular
            ? 'bg-shield-accent text-shield-canvas hover:opacity-90'
            : 'bg-shield-brand text-shield-on-brand hover:opacity-90'
        }`}
      >
        {buttonLabel}
      </button>
    </article>
  )
}

export default function PricingPage() {
  const { themeAttr } = useWarmTheme()
  const [period, setPeriod] = useState<BillingPeriod>('monthly')
  const [plans, setPlans] = useState<PlanCard[]>(() => [...FALLBACK_PLANS])
  const [showAuth, setShowAuth] = useState(false)

  // The fallback plans are the loading state; on any error keep them silently.
  useEffect(() => {
    let cancelled = false
    fetch('/api/subscriptions/tiers')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data && data.success === true) setPlans(tiersToPlanCards(data.tiers))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="warm-theme min-h-screen relative" {...themeAttr}>
      <Seo
        title="Plans"
        description="Compare Shield AI's plans: start free with Explorer, or upgrade to Bible Student, Bible Scholar or Ministry for unlimited conversations and deeper study tools."
        path="/pricing"
      />
      <Header />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-shield-fg">Plans</h1>
          <p className="mt-3 text-shield-muted">Start free. Upgrade when you want deeper study.</p>
          <div
            role="radiogroup"
            aria-label="Billing period"
            className="mt-8 inline-flex rounded-lg border border-shield-edge bg-shield-canvas p-1"
          >
            {PERIODS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={period === value}
                onClick={() => setPeriod(value)}
                className={`rounded-md px-5 py-2 text-sm font-medium transition-colors ${
                  period === value ? 'bg-shield-brand text-shield-on-brand' : 'text-shield-muted hover:text-shield-fg'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((card) => (
            <PlanCardView key={card.id} card={card} period={period} onChoose={() => setShowAuth(true)} />
          ))}
        </div>
      </main>
      <Footer />
      {showAuth && <AuthModal initialView="signup" onClose={() => setShowAuth(false)} />}
    </div>
  )
}
