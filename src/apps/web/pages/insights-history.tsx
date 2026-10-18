import React from 'react'
import { GetServerSideProps } from 'next'
import { Header } from '../components/Header'
import { EnhancedInsightsQuery } from '../components/features/bible/EnhancedInsightsQuery'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import { Seo } from '../components/Seo'
import { useWarmTheme } from '../hooks/useWarmTheme'

interface InsightsHistoryPageProps {
  userId?: string
}

export default function InsightsHistoryPage({ userId }: InsightsHistoryPageProps) {
  const { themeAttr } = useWarmTheme()
  return (
    <>
      <Seo
        title="Insights History"
        description="View, manage, and analyze your AI-generated Bible insights history with Shield AI."
        path="/insights-history"
      />
      <div className="warm-theme" {...themeAttr}>
      <ProtectedRoute>
      <div className="shield-page-bg">
        <Header showNav />
        <main className="shield-page-shell py-10">
          <div className="shield-glass-panel mb-8 px-8 py-8">
            <h1 className="text-3xl font-bold text-shield-fg mb-2">Insights History</h1>
            <p className="text-shield-muted">
              View, manage, and analyze your AI-generated Bible insights
            </p>
          </div>

          <EnhancedInsightsQuery userId={userId} />
        </main>
      </div>
      </ProtectedRoute>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // You can add server-side logic here if needed
  // For example, to get user ID from session or cookies
  
  return {
    props: {
      // Add any props you need to pass to the component
    }
  }
}
