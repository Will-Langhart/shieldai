import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Shield AI - AI-powered apologetics companion" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <body className="bg-shield-black text-shield-white">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
} 