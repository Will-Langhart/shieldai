import React, { useState, useEffect } from 'react'
import { 
  MessageCircle, 
  Lightbulb, 
  Target, 
  BookOpen, 
  Loader2, 
  Copy, 
  Share2,
  RefreshCw,
  CheckCircle,
  Clock
} from 'lucide-react'

interface StudyQuestion {
  id: string
  question: string
  type: 'reflection' | 'application' | 'theological' | 'historical' | 'practical'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  suggestedAnswer?: string
  relatedVerses?: string[]
  category: string
}

interface AIStudyQuestionsProps {
  passage: {
    reference: string
    text: string
    verses: Array<{
      text: string
      reference: string
      verseNumber: number
    }>
  }
  onQuestionSelect?: (question: StudyQuestion) => void
}

export function AIStudyQuestions({ passage, onQuestionSelect }: AIStudyQuestionsProps) {
  const [questions, setQuestions] = useState<StudyQuestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [showAnswers, setShowAnswers] = useState<Set<string>>(new Set())
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set())

  const questionTypes = [
    { id: 'all', label: 'All Types', icon: MessageCircle },
    { id: 'reflection', label: 'Reflection', icon: Lightbulb },
    { id: 'application', label: 'Application', icon: Target },
    { id: 'theological', label: 'Theological', icon: BookOpen },
    { id: 'historical', label: 'Historical', icon: Clock },
    { id: 'practical', label: 'Practical', icon: CheckCircle }
  ]

  const difficulties = [
    { id: 'all', label: 'All Levels' },
    { id: 'beginner', label: 'Beginner' },
    { id: 'intermediate', label: 'Intermediate' },
    { id: 'advanced', label: 'Advanced' }
  ]

  // Generate study questions when passage changes
  useEffect(() => {
    if (passage) {
      generateQuestions()
    }
  }, [passage])

  const generateQuestions = async () => {
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
        console.log('Using test token for study questions')
      }

      const response = await fetch('/api/bible/study-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          passage: passage
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to generate study questions (${response.status})`)
      }

      const data = await response.json()
      setQuestions(data.questions || [])
    } catch (err) {
      console.error('Study questions error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate questions')
    } finally {
      setLoading(false)
    }
  }

  const toggleAnswer = (questionId: string) => {
    const newShowAnswers = new Set(showAnswers)
    if (newShowAnswers.has(questionId)) {
      newShowAnswers.delete(questionId)
    } else {
      newShowAnswers.add(questionId)
    }
    setShowAnswers(newShowAnswers)
  }

  const markAsAnswered = (questionId: string) => {
    const newAnswered = new Set(answeredQuestions)
    if (newAnswered.has(questionId)) {
      newAnswered.delete(questionId)
    } else {
      newAnswered.add(questionId)
    }
    setAnsweredQuestions(newAnswered)
  }

  const copyQuestion = (question: StudyQuestion) => {
    const text = `${question.question}\n\nType: ${question.type}\nDifficulty: ${question.difficulty}`
    navigator.clipboard.writeText(text)
  }

  const shareQuestion = (question: StudyQuestion) => {
    if (navigator.share) {
      navigator.share({
        title: `Study Question: ${passage.reference}`,
        text: question.question,
        url: window.location.href
      })
    } else {
      copyQuestion(question)
    }
  }

  const filteredQuestions = questions.filter(question => {
    const typeMatch = selectedType === 'all' || question.type === selectedType
    const difficultyMatch = selectedDifficulty === 'all' || question.difficulty === selectedDifficulty
    return typeMatch && difficultyMatch
  })

  const getTypeColor = (type: string) => {
    const colors = {
      reflection: 'bg-purple-600',
      application: 'bg-green-600',
      theological: 'bg-blue-600',
      historical: 'bg-orange-600',
      practical: 'bg-pink-600'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-600'
  }

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      beginner: 'bg-green-500',
      intermediate: 'bg-yellow-500',
      advanced: 'bg-red-500'
    }
    return colors[difficulty as keyof typeof colors] || 'bg-gray-500'
  }

  if (loading) {
    return (
      <div className="bg-[#1A1D24] rounded-lg p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-400 mr-3" />
          <span className="text-[#9CA3AF]">Generating study questions...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-[#1A1D24] rounded-lg p-6">
        <div className="text-center">
          <div className="text-red-400 mb-2">Failed to generate study questions</div>
          <button 
            onClick={generateQuestions}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#1A1D24] rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <MessageCircle className="h-6 w-6 text-blue-400" />
          <h3 className="text-xl font-semibold">AI Study Questions</h3>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={generateQuestions}
            disabled={loading}
            className="p-2 text-[#9CA3AF] hover:text-blue-400 transition-colors disabled:opacity-50"
            title="Generate new questions"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#9CA3AF] mb-2">Question Type</label>
          <div className="flex flex-wrap gap-2">
            {questionTypes.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSelectedType(id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedType === id
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#2C303A] text-[#9CA3AF] hover:bg-[#3A404B] hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#9CA3AF] mb-2">Difficulty Level</label>
          <div className="flex flex-wrap gap-2">
            {difficulties.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setSelectedDifficulty(id)}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedDifficulty === id
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#2C303A] text-[#9CA3AF] hover:bg-[#3A404B] hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-[#9CA3AF] mx-auto mb-4" />
            <p className="text-[#9CA3AF]">No questions match your current filters</p>
          </div>
        ) : (
          filteredQuestions.map((question) => (
            <div 
              key={question.id} 
              className={`bg-[#2C303A] rounded-lg p-4 transition-all ${
                answeredQuestions.has(question.id) ? 'opacity-75' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(question.type)}`}>
                      {question.type}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                      {question.difficulty}
                    </span>
                    {answeredQuestions.has(question.id) && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-green-600">
                        Answered
                      </span>
                    )}
                  </div>
                  <p className="text-[#E5E7EB] leading-relaxed">{question.question}</p>
                </div>
                <div className="flex space-x-1 ml-4">
                  <button
                    onClick={() => copyQuestion(question)}
                    className="p-1 text-[#9CA3AF] hover:text-blue-400 transition-colors"
                    title="Copy question"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => shareQuestion(question)}
                    className="p-1 text-[#9CA3AF] hover:text-blue-400 transition-colors"
                    title="Share question"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Suggested Answer */}
              {question.suggestedAnswer && (
                <div className="mt-3">
                  <button
                    onClick={() => toggleAnswer(question.id)}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                  >
                    {showAnswers.has(question.id) ? 'Hide' : 'Show'} Suggested Answer
                  </button>
                  {showAnswers.has(question.id) && (
                    <div className="mt-2 p-3 bg-[#1A1D24] rounded-lg">
                      <p className="text-[#E5E7EB] text-sm leading-relaxed">
                        {question.suggestedAnswer}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Related Verses */}
              {question.relatedVerses && question.relatedVerses.length > 0 && (
                <div className="mt-3">
                  <p className="text-[#9CA3AF] text-sm mb-1">Related verses:</p>
                  <div className="flex flex-wrap gap-1">
                    {question.relatedVerses.map((verse, index) => (
                      <span key={index} className="px-2 py-1 bg-[#1A1D24] rounded text-xs text-blue-400">
                        {verse}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => markAsAnswered(question.id)}
                  className={`flex items-center space-x-2 px-3 py-1 rounded text-sm transition-colors ${
                    answeredQuestions.has(question.id)
                      ? 'bg-green-600 text-white'
                      : 'bg-[#1A1D24] text-[#9CA3AF] hover:bg-green-600 hover:text-white'
                  }`}
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>{answeredQuestions.has(question.id) ? 'Mark as Unanswered' : 'Mark as Answered'}</span>
                </button>

                {onQuestionSelect && (
                  <button
                    onClick={() => onQuestionSelect(question)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                  >
                    Use in Chat
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      {filteredQuestions.length > 0 && (
        <div className="mt-6 p-4 bg-[#2C303A] rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#9CA3AF]">
              Showing {filteredQuestions.length} of {questions.length} questions
            </span>
            <span className="text-blue-400">
              {answeredQuestions.size} answered
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
