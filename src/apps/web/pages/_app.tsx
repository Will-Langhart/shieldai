import type { AppProps } from 'next/app'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '../contexts/AuthContext'
import { ThemeProvider } from '../contexts/ThemeContext'
import '../styles/globals.css'
import '../styles/landing.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Component {...pageProps} />
        <Analytics />
      </ThemeProvider>
    </AuthProvider>
  )
}
