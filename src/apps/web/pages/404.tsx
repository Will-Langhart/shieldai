import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { Header } from '../components/Header'
import { Seo } from '../components/Seo'
import { useWarmTheme } from '../hooks/useWarmTheme'
import { isFeatureOn } from '../lib/feature-flags'
import {
  NOT_FOUND_HEADING,
  NOT_FOUND_LINKS,
  NOT_FOUND_MESSAGE,
  notFoundView,
  plainNotFoundParts,
} from '../lib/not-found'

// Custom 404 (statically generated). Branded behind the `not-found-page` flag;
// with the flag off it shows the same plain text as Next's default 404.

function PlainNotFound() {
  const { code, message } = plainNotFoundParts()
  return (
    <>
      <Head>
        <title>{`${code}: ${message}`}</title>
      </Head>
      <div>
        <h1>{code}</h1>
        <p>{message}</p>
      </div>
    </>
  )
}

function BrandedNotFound() {
  const { themeAttr } = useWarmTheme()
  return (
    <>
      <Seo
        title="Page not found"
        description="The page you were looking for couldn't be found. Head back to Shield AI's home page, Bible reader or apologetics chat."
        path="/404"
        noindex
      />
      <div className="warm-theme" {...themeAttr}>
        <div className="shield-page-bg">
          <Header showNav />
          <main className="mx-auto max-w-2xl px-4 sm:px-6 py-16">
            <div className="shield-glass-panel px-6 py-8">
              <p className="text-sm font-semibold uppercase tracking-widest text-shield-accent mb-2">404</p>
              <h1 className="text-3xl font-bold text-shield-fg mb-3">{NOT_FOUND_HEADING}</h1>
              <p className="text-shield-muted mb-8">{NOT_FOUND_MESSAGE}</p>
              <nav aria-label="Helpful links">
                <ul className="space-y-3">
                  {NOT_FOUND_LINKS.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="block rounded-xl border border-shield-edge bg-shield-panel/65 px-4 py-3 transition-colors hover:border-shield-brand/40 hover:bg-shield-brand/10"
                      >
                        <span className="block font-semibold text-shield-brand">{link.label}</span>
                        <span className="block text-sm text-shield-muted">{link.description}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </main>
        </div>
      </div>
    </>
  )
}

export default function NotFoundPage() {
  return notFoundView(isFeatureOn('not-found-page')) === 'branded' ? <BrandedNotFound /> : <PlainNotFound />
}
