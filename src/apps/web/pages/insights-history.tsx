import React from 'react'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { Header } from '../components/Header'
import { EnhancedInsightsQuery } from '../components/features/bible/EnhancedInsightsQuery'

interface InsightsHistoryPageProps {
  userId?: string
}

export default function InsightsHistoryPage({ userId }: InsightsHistoryPageProps) {
  return (
    <>
      <Head>
        <title>Insights History - Shield AI</title>
        <meta name="description" content="View and manage your AI Bible insights history" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-[#0F0F0F]">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#E0E0E0] mb-2">Insights History</h1>
            <p className="text-[#9CA3AF]">
              View, manage, and analyze your AI-generated Bible insights
            </p>
          </div>
          
          <EnhancedInsightsQuery userId={userId} />
        </main>
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
