import Head from 'next/head'

// Canonical production origin. Override per-environment with NEXT_PUBLIC_SITE_URL
// (no trailing slash), e.g. https://shieldai.cloud
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://shieldai.cloud').replace(/\/$/, '')
const SITE_NAME = 'Shield AI'
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`

export interface SeoProps {
  /** Page title. Rendered as `{title} – Shield AI` unless `titleTemplate` is false. */
  title: string
  description: string
  /** Path of the current page, e.g. `/bible`. Used for the canonical + og:url. */
  path: string
  /** Absolute or root-relative image URL for social cards. Defaults to /og-image.png */
  image?: string
  /** og:type — 'website' for landing pages, 'article' for content. */
  type?: 'website' | 'article'
  /** Discourage indexing (e.g. for auth-gated app screens). */
  noindex?: boolean
  /** Set false to use `title` verbatim without the " – Shield AI" suffix. */
  titleTemplate?: boolean
  /** Optional JSON-LD structured data object(s) for this page. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}

export function Seo({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  type = 'website',
  noindex = false,
  titleTemplate = true,
  jsonLd,
}: SeoProps) {
  const fullTitle = titleTemplate ? `${title} – ${SITE_NAME}` : title
  const canonical = `${SITE_URL}${path === '/' ? '' : path}`
  const ogImage = image.startsWith('http') ? image : `${SITE_URL}${image}`

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="canonical" href={canonical} />
      {noindex ? (
        <meta name="robots" content="noindex, follow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </Head>
  )
}

export default Seo
