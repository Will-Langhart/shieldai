import React, { useState, useEffect } from 'react'
import { 
  Brain, 
  BookOpen, 
  Lightbulb, 
  Cross, 
  Heart, 
  MessageCircle, 
  Search, 
  Loader2, 
  ChevronDown, 
  ChevronUp,
  Copy,
  Share2,
  Bookmark,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import { AIDiagnostics } from './AIDiagnostics'

interface BiblePassage {
  id: string
  reference: string
  text: string
  verses: Array<{
    id: string
    text: string
    reference: string
    verseNumber: number
    chapterNumber: number
    bookName: string
  }>
  version: {
    id: string
    name: string
    description: string
    language: { id: string; name: string }
    type: string
  }
}

interface AIInsights {
  explanation: string
  keyThemes: string[]
  crossReferences: Array<{
    reference: string
    text: string
    relevance: string
  }>
  studyQuestions: Array<{
    question: string
    type: 'reflection' | 'application' | 'theological'
  }>
  historicalContext: string
  theologicalSignificance: string
  practicalApplication: string
  prayerPoints: string[]
}

interface AIBibleInsightsProps {
  passage: BiblePassage
  version: string
}

export function AIBibleInsights({ passage, version }: AIBibleInsightsProps) {
  const [insights, setInsights] = useState<AIInsights | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'explanation' | 'themes' | 'questions' | 'context' | 'application'>('explanation')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['explanation']))
  const [showDiagnostics, setShowDiagnostics] = useState(false)

  // Generate AI insights when passage changes
  useEffect(() => {
    if (passage) {
      generateInsights()
    }
  }, [passage, version])

  const generateInsights = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get authentication token
      let authToken = 'test-token' // Default to test token for now
      
      try {
        // Try to get the actual session token
        const { data: { session } } = await import('../../../lib/supabase').then(m => m.supabase.auth.getSession())
        if (session?.access_token) {
          authToken = session.access_token
        }
      } catch (authError) {
        console.log('Using test token for AI insights')
      }

      const response = await fetch('/api/bible/ai-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          passage: passage,
          version: version
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('AI insights API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
        throw new Error(errorData.error || `Failed to generate AI insights (${response.status}: ${response.statusText})`)
      }

      const data = await response.json()
      setInsights(data.insights)
    } catch (err) {
      console.error('AI insights error:', err)
      
      // Provide fallback insights if AI fails
      const fallbackInsights: AIInsights = {
        explanation: `This passage from ${passage.reference} contains important biblical truth. While AI analysis is temporarily unavailable, this scripture speaks to God's love and grace.`,
        keyThemes: ['Faith', 'Love', 'Grace', 'Salvation', 'Hope'],
        crossReferences: [],
        studyQuestions: [
          {
            question: 'What is the main message of this passage?',
            type: 'reflection'
          },
          {
            question: 'How does this passage apply to your life today?',
            type: 'application'
          }
        ],
        historicalContext: 'This passage was written in the context of Jesus\' ministry and teachings.',
        theologicalSignificance: 'This passage reveals important aspects of God\'s character and plan for salvation.',
        practicalApplication: 'Consider how this passage can guide your daily walk with God.',
        prayerPoints: [
          'Thank God for His love and grace',
          'Ask for understanding of this passage',
          'Pray for application in your life'
        ]
      }
      
      setInsights(fallbackInsights)
      setError('AI analysis temporarily unavailable - showing basic insights')
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  const shareInsight = (type: string, content: string) => {
    if (navigator.share) {
      navigator.share({
        title: `${passage.reference} - AI Insight: ${type}`,
        text: content,
        url: window.location.href
      })
    } else {
      copyToClipboard(content)
    }
  }

  if (loading) {
    return (
      <div className="mt-8 p-6 bg-[#1A1D24] rounded-lg">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-400 mr-3" />
          <span className="text-[#9CA3AF]">Generating AI insights...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mt-8 p-6 bg-[#1A1D24] rounded-lg">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <div className="text-red-400 mb-2">Failed to load AI insights</div>
          <div className="text-sm text-[#9CA3AF] mb-4">{error}</div>
          <div className="flex items-center justify-center space-x-4">
            <button 
              onClick={generateInsights}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Try again</span>
            </button>
            <button
              onClick={() => setShowDiagnostics(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>Diagnose</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!insights) {
    return null
  }

  return (
    <div className="mt-8 space-y-6">
      {/* AI Insights Header */}
      <div className="bg-[#1A1D24] rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Brain className="h-6 w-6 text-blue-400" />
            <h3 className="text-xl font-semibold">AI-Powered Bible Study</h3>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => copyToClipboard(JSON.stringify(insights, null, 2))}
              className="p-2 text-[#9CA3AF] hover:text-blue-400 transition-colors"
              title="Copy all insights"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              onClick={() => shareInsight('Study Insights', insights.explanation)}
              className="p-2 text-[#9CA3AF] hover:text-blue-400 transition-colors"
              title="Share insights"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowDiagnostics(true)}
              className="p-2 text-[#9CA3AF] hover:text-yellow-400 transition-colors"
              title="Run diagnostics"
            >
              <AlertTriangle className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: 'explanation', label: 'Explanation', icon: BookOpen },
            { id: 'themes', label: 'Key Themes', icon: Lightbulb },
            { id: 'questions', label: 'Study Questions', icon: MessageCircle },
            { id: 'context', label: 'Historical Context', icon: Search },
            { id: 'application', label: 'Application', icon: Heart }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === id
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#2C303A] text-[#9CA3AF] hover:bg-[#3A404B] hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Explanation Tab */}
          {activeTab === 'explanation' && (
            <div className="space-y-4">
              <div className="prose prose-invert max-w-none">
                <h4 className="text-lg font-semibold mb-3 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-blue-400" />
                  AI Explanation
                </h4>
                <p className="text-[#E5E7EB] leading-relaxed">
                  {insights.explanation}
                </p>
              </div>
              
              {insights.theologicalSignificance && (
                <div className="bg-[#2C303A] p-4 rounded-lg">
                  <h5 className="font-semibold text-blue-400 mb-2 flex items-center">
                    <Cross className="h-4 w-4 mr-2" />
                    Theological Significance
                  </h5>
                  <p className="text-[#E5E7EB] text-sm leading-relaxed">
                    {insights.theologicalSignificance}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Key Themes Tab */}
          {activeTab === 'themes' && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold mb-3 flex items-center">
                <Lightbulb className="h-5 w-5 mr-2 text-blue-400" />
                Key Themes
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {insights.keyThemes.map((theme, index) => (
                  <div key={index} className="bg-[#2C303A] p-3 rounded-lg">
                    <span className="text-blue-400 font-medium">{theme}</span>
                  </div>
                ))}
              </div>

              {/* Cross References */}
              {insights.crossReferences.length > 0 && (
                <div className="mt-6">
                  <h5 className="font-semibold text-blue-400 mb-3 flex items-center">
                    <Search className="h-4 w-4 mr-2" />
                    Related Passages
                  </h5>
                  <div className="space-y-3">
                    {insights.crossReferences.map((ref, index) => (
                      <div key={index} className="bg-[#2C303A] p-3 rounded-lg">
                        <div className="font-medium text-blue-400 mb-1">{ref.reference}</div>
                        <p className="text-[#E5E7EB] text-sm mb-2">{ref.text}</p>
                        <p className="text-[#9CA3AF] text-xs">{ref.relevance}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Study Questions Tab */}
          {activeTab === 'questions' && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold mb-3 flex items-center">
                <MessageCircle className="h-5 w-5 mr-2 text-blue-400" />
                Study Questions
              </h4>
              <div className="space-y-4">
                {insights.studyQuestions.map((question, index) => (
                  <div key={index} className="bg-[#2C303A] p-4 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium mr-3 ${
                            question.type === 'reflection' 
                              ? 'bg-purple-600 text-white' 
                              : question.type === 'application'
                              ? 'bg-green-600 text-white'
                              : 'bg-orange-600 text-white'
                          }`}>
                            {question.type.charAt(0).toUpperCase() + question.type.slice(1)}
                          </span>
                        </div>
                        <p className="text-[#E5E7EB]">{question.question}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(question.question)}
                        className="ml-3 p-1 text-[#9CA3AF] hover:text-blue-400 transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historical Context Tab */}
          {activeTab === 'context' && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold mb-3 flex items-center">
                <Search className="h-5 w-5 mr-2 text-blue-400" />
                Historical Context
              </h4>
              <div className="prose prose-invert max-w-none">
                <p className="text-[#E5E7EB] leading-relaxed">
                  {insights.historicalContext}
                </p>
              </div>
            </div>
          )}

          {/* Application Tab */}
          {activeTab === 'application' && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold mb-3 flex items-center">
                <Heart className="h-5 w-5 mr-2 text-blue-400" />
                Practical Application
              </h4>
              <div className="prose prose-invert max-w-none">
                <p className="text-[#E5E7EB] leading-relaxed mb-4">
                  {insights.practicalApplication}
                </p>
              </div>

              {/* Prayer Points */}
              {insights.prayerPoints.length > 0 && (
                <div className="bg-[#2C303A] p-4 rounded-lg">
                  <h5 className="font-semibold text-blue-400 mb-3 flex items-center">
                    <Cross className="h-4 w-4 mr-2" />
                    Prayer Points
                  </h5>
                  <ul className="space-y-2">
                    {insights.prayerPoints.map((point, index) => (
                      <li key={index} className="text-[#E5E7EB] text-sm flex items-start">
                        <span className="text-blue-400 mr-2">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Diagnostics Modal */}
      {showDiagnostics && (
        <AIDiagnostics onClose={() => setShowDiagnostics(false)} />
      )}
    </div>
  )
}
