import React, { useState } from 'react'
import { AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react'

interface AIDiagnosticsProps {
  onClose: () => void
}

interface TestResult {
  name: string
  status: 'pass' | 'fail' | 'error'
  message: string
  details?: any
}

interface DiagnosticsResults {
  timestamp: string
  tests: TestResult[]
}

export function AIDiagnostics({ onClose }: AIDiagnosticsProps) {
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResults | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  const runDiagnostics = async () => {
    setIsRunning(true)
    setDiagnostics(null)

    try {
      const results: DiagnosticsResults = {
        timestamp: new Date().toISOString(),
        tests: [] as TestResult[]
      }

      // Test 1: Check if API endpoints are accessible
      try {
        const testResponse = await fetch('/api/bible/test-ai-insights')
        const testData = await testResponse.json()
        results.tests.push({
          name: 'API Endpoint Test',
          status: testResponse.ok ? 'pass' : 'fail',
          message: testResponse.ok ? 'API endpoint accessible' : `API error: ${testData.error || testResponse.statusText}`,
          details: testData
        })
      } catch (error) {
        results.tests.push({
          name: 'API Endpoint Test',
          status: 'fail',
          message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: null
        })
      }

      // Test 2: Check authentication
      try {
        const authResponse = await fetch('/api/bible/ai-insights', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          body: JSON.stringify({
            passage: {
              id: 'test',
              reference: 'John 3:16',
              text: 'For God so loved the world...',
              verses: [],
              version: { id: 'test', name: 'Test' }
            },
            version: 'test'
          })
        })
        
        results.tests.push({
          name: 'Authentication Test',
          status: authResponse.ok ? 'pass' : 'fail',
          message: authResponse.ok ? 'Authentication working' : `Auth error: ${authResponse.status} ${authResponse.statusText}`,
          details: { status: authResponse.status, statusText: authResponse.statusText }
        })
      } catch (error) {
        results.tests.push({
          name: 'Authentication Test',
          status: 'fail',
          message: `Auth test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: null
        })
      }

      // Test 3: Check environment variables
      try {
        const envResponse = await fetch('/api/test-api-integration')
        const envData = await envResponse.json()
        results.tests.push({
          name: 'Environment Variables',
          status: envResponse.ok ? 'pass' : 'fail',
          message: envResponse.ok ? 'Environment variables configured' : 'Environment variables missing',
          details: envData
        })
      } catch (error) {
        results.tests.push({
          name: 'Environment Variables',
          status: 'fail',
          message: `Environment test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: null
        })
      }

      // Test 4: Check Bible service
      try {
        const bibleResponse = await fetch('/api/bible/versions')
        const bibleData = await bibleResponse.json()
        results.tests.push({
          name: 'Bible Service',
          status: bibleResponse.ok ? 'pass' : 'fail',
          message: bibleResponse.ok ? 'Bible service working' : 'Bible service error',
          details: bibleData
        })
      } catch (error) {
        results.tests.push({
          name: 'Bible Service',
          status: 'fail',
          message: `Bible service test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: null
        })
      }

      setDiagnostics(results)
    } catch (error) {
      setDiagnostics({
        timestamp: new Date().toISOString(),
        tests: [{
          name: 'Diagnostic Runner',
          status: 'fail',
          message: `Diagnostic failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: null
        }]
      })
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: 'pass' | 'fail' | 'error') => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-400" />
      case 'fail':
        return <AlertCircle className="h-5 w-5 text-red-400" />
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-400" />
    }
  }

  const getStatusColor = (status: 'pass' | 'fail' | 'error') => {
    switch (status) {
      case 'pass':
        return 'text-green-400'
      case 'fail':
        return 'text-red-400'
      default:
        return 'text-yellow-400'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1A1D24] rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-[#3A404B]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center">
              <AlertCircle className="h-6 w-6 text-blue-400 mr-2" />
              AI Diagnostics
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-[#9CA3AF] hover:text-white transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <button
              onClick={runDiagnostics}
              disabled={isRunning}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>{isRunning ? 'Running Diagnostics...' : 'Run Diagnostics'}</span>
            </button>
          </div>

          {diagnostics && (
            <div className="space-y-4">
              <div className="text-sm text-[#9CA3AF]">
                Diagnostics run at: {new Date(diagnostics.timestamp).toLocaleString()}
              </div>
              
              {diagnostics.tests.map((test: any, index: number) => (
                <div key={index} className="bg-[#2C303A] rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(test.status)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{test.name}</h3>
                        <span className={`text-sm font-medium ${getStatusColor(test.status)}`}>
                          {test.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-[#E5E7EB] mt-1">{test.message}</p>
                      {test.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-[#9CA3AF] cursor-pointer hover:text-white">
                            View Details
                          </summary>
                          <pre className="mt-2 text-xs bg-[#1A1D24] p-2 rounded overflow-auto max-h-32">
                            {JSON.stringify(test.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!diagnostics && !isRunning && (
            <div className="text-center py-8 text-[#9CA3AF]">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Click "Run Diagnostics" to check AI system status</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
