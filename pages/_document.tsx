import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/logo.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/logo.png" />
        <meta name="description" content="Shield AI - AI-powered apologetics companion" />
      </Head>
      <body className="bg-shield-black text-shield-white">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
} 