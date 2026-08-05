import { Home } from './Home'
import { Header } from '../components/Header'
import Footer from '../components/layout/Footer'
import { Seo } from '../components/Seo'
import { FAQ_ITEMS } from '../components/features/landing/faqData'

const webApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Shield AI',
  applicationCategory: 'EducationApplication',
  operatingSystem: 'Web, iOS',
  url: 'https://shieldai.cloud/',
  description:
    'AI-powered Bible study and Christian apologetics — scripturally grounded answers to theological questions, Scripture reading, cross-references, and study tools.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
}

// Built from the same FAQ_ITEMS the page renders visibly, so the structured
// data always matches the on-page content (a Google requirement for FAQPage).
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
}

export default function IndexPage() {
  return (
    <div className="min-h-screen relative">
      <Seo
        title="Shield AI — AI-Powered Bible Study & Christian Apologetics"
        titleTemplate={false}
        description="Shield AI is an AI-powered Bible study platform offering well-reasoned, scripturally grounded answers to theological questions and skeptic arguments. Study Scripture, explore apologetics, and grow your faith."
        path="/"
        jsonLd={[webApplicationSchema, faqSchema]}
      />
      <Header />
      <Home />
      <Footer />
    </div>
  )
}
