import { Html, Head, Main, NextScript } from 'next/document'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://shieldai.cloud').replace(/\/$/, '')

// Site-wide structured data. Organization + WebSite help Google understand the
// brand and can enable a sitelinks search box / knowledge panel.
const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'Shield AI',
      url: SITE_URL,
      logo: `${SITE_URL}/icon-512.png`,
      description:
        'AI-powered Bible study and Christian apologetics platform providing scripturally grounded answers to theological questions.',
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'Shield AI',
      publisher: { '@id': `${SITE_URL}/#organization` },
      inLanguage: 'en',
    },
  ],
}

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Page-level SEO (title, description, canonical, OG/Twitter) lives in
            the per-page <Seo> component. Keep only global, non-duplicated tags here. */}
        <link rel="icon" href="/favicon.png" type="image/png" sizes="48x48" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#0B0D12" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
          rel="stylesheet"
        />
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
