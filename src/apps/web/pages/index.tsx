import { Home } from './Home'
import { Header } from '../components/Header'
import Footer from '../components/layout/Footer'
import { Seo } from '../components/Seo'

export default function IndexPage() {
  return (
    <div className="min-h-screen relative">
      <Seo
        title="Shield AI — AI-Powered Bible Study & Christian Apologetics"
        titleTemplate={false}
        description="Shield AI is an AI-powered Bible study platform offering well-reasoned, scripturally grounded answers to theological questions and skeptic arguments. Study Scripture, explore apologetics, and grow your faith."
        path="/"
        jsonLd={{
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
        }}
      />
      <Header />
      <Home />
      <Footer />
    </div>
  )
}
