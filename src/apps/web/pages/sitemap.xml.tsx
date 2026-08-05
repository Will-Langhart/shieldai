import type { GetServerSideProps } from 'next'

// Canonical production origin. Override per-environment with NEXT_PUBLIC_SITE_URL
// (no trailing slash), e.g. https://shieldai.cloud
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://shieldai.cloud').replace(/\/$/, '')

type Route = {
  path: string
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly'
  priority: number
}

// Public + primary app routes. Excludes API routes, auth callbacks
// (/EmailConfirm), duplicate/legacy pages (/Home), and test pages.
const ROUTES: Route[] = [
  { path: '/', changefreq: 'weekly', priority: 1.0 },
  { path: '/chat', changefreq: 'weekly', priority: 0.9 },
  { path: '/bible', changefreq: 'weekly', priority: 0.9 },
  { path: '/journal', changefreq: 'monthly', priority: 0.7 },
  { path: '/insights-history', changefreq: 'monthly', priority: 0.6 },
]

function buildSitemap(lastmod: string): string {
  const urls = ROUTES.map(
    ({ path, changefreq, priority }) => `  <url>
    <loc>${SITE_URL}${path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
  </url>`
  ).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const lastmod = new Date().toISOString().split('T')[0]
  const sitemap = buildSitemap(lastmod)

  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate')
  res.write(sitemap)
  res.end()

  return { props: {} }
}

// Page body never renders — the response is written in getServerSideProps.
export default function Sitemap() {
  return null
}
