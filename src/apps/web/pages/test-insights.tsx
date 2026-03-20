import React, { useState } from 'react'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { Header } from '../components/Header'

export default function TestInsightsPage() {
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [healthCheckResult, setHealthCheckResult] = useState<any>(null)

  const testSaveAndRetrieve = async () => {
    setLoading(true)
    setError(null)
    setTestResult(null)

    try {
      // First, test the save functionality
      const saveResponse = await fetch('/api/ai-insights/test-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const saveData = await saveResponse.json()
      
      if (!saveResponse.ok) {
        throw new Error(saveData.error || 'Failed to save test insight')
      }

      // Then, test retrieving insights
      const retrieveResponse = await fetch('/api/ai-insights/history?limit=10', {
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        }
      })

      const retrieveData = await retrieveResponse.json()
      
      if (!retrieveResponse.ok) {
        throw new Error(retrieveData.error || 'Failed to retrieve insights')
      }

      setTestResult({
        save_result: saveData,
        retrieve_result: retrieveData
      })

    } catch (error) {
      console.error('Test failed:', error)
      setError(error instanceof Error ? error.message : 'Test failed')
    } finally {
      setLoading(false)
    }
  }

  const runHealthCheck = async () => {
    setLoading(true)
    setError(null)
    setHealthCheckResult(null)

    try {
      const response = await fetch('/api/ai-insights/health-check', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Health check failed')
      }

      setHealthCheckResult(data)

    } catch (error) {
      console.error('Health check failed:', error)
      setError(error instanceof Error ? error.message : 'Health check failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Test Insights - Shield AI</title>
        <meta name="description" content="Test AI insights save and retrieve functionality" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-shield-void">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-shield-fg mb-2">Test Insights Functionality</h1>
            <p className="text-shield-muted">
              Test the save and retrieve functionality for AI insights
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-shield-canvas border border-shield-panel rounded-lg p-6">
              <h2 className="text-xl font-semibold text-shield-fg mb-4">Database Health Check</h2>
              
              <div className="flex space-x-4 mb-4">
                <button
                  onClick={runHealthCheck}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {loading ? 'Checking...' : 'Health Check'}
                </button>
                
                <button
                  onClick={testSaveAndRetrieve}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {loading ? 'Testing...' : 'Run Save Test'}
                </button>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
                  <h3 className="text-red-400 font-medium mb-2">Error:</h3>
                  <p className="text-red-300">{error}</p>
                </div>
              )}

              {healthCheckResult && (
                <div className="mt-6 space-y-4">
                  <div className={`p-4 border rounded-lg ${
                    healthCheckResult.success 
                      ? 'bg-green-900/20 border-green-500/50' 
                      : 'bg-red-900/20 border-red-500/50'
                  }`}>
                    <h3 className={`font-medium mb-2 ${
                      healthCheckResult.success ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {healthCheckResult.success ? '✅' : '❌'} Health Check Results:
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Database Connection:</strong> {healthCheckResult.connection || 'Unknown'}</p>
                      <p><strong>Table Access:</strong> {healthCheckResult.table_access || 'Unknown'}</p>
                      <p><strong>Insert Test:</strong> {healthCheckResult.insert_test || 'Unknown'}</p>
                      <p><strong>Existing Records:</strong> {healthCheckResult.existing_records || 0}</p>
                      <p><strong>Supabase URL:</strong> {healthCheckResult.environment?.supabase_url || 'Unknown'}</p>
                      <p><strong>Service Role Key:</strong> {healthCheckResult.environment?.service_role_key || 'Unknown'}</p>
                    </div>
                  </div>
                </div>
              )}

              {testResult && (
                <div className="mt-6 space-y-4">
                  <div className="p-4 bg-green-900/20 border border-green-500/50 rounded-lg">
                    <h3 className="text-green-400 font-medium mb-2">✅ Test Results:</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Save Success:</strong> {testResult.save_result.success ? 'Yes' : 'No'}</p>
                      <p><strong>Retrieve Success:</strong> {testResult.retrieve_result.success ? 'Yes' : 'No'}</p>
                      <p><strong>Total Insights Found:</strong> {testResult.retrieve_result.insights?.length || 0}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-shield-panel rounded-lg p-4">
                      <h4 className="font-medium text-shield-fg mb-2">Save Result:</h4>
                      <pre className="text-xs text-shield-muted overflow-auto">
                        {JSON.stringify(testResult.save_result, null, 2)}
                      </pre>
                    </div>

                    <div className="bg-shield-panel rounded-lg p-4">
                      <h4 className="font-medium text-shield-fg mb-2">Retrieve Result:</h4>
                      <pre className="text-xs text-shield-muted overflow-auto">
                        {JSON.stringify(testResult.retrieve_result, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
