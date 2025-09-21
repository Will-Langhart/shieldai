import React, { useState, useEffect } from 'react'
import { 
  Search, 
  BookOpen, 
  Link, 
  Loader2, 
  Copy, 
  ExternalLink,
  ChevronRight,
  Lightbulb,
  Heart,
  Cross
} from 'lucide-react'

interface CrossReference {
  id: string
  reference: string
  text: string
  book: string
  chapter: number
  verse: number
  relevance: string
  connectionType: 'thematic' | 'prophetic' | 'fulfillment' | 'parallel' | 'contrast' | 'explanation'
  strength: 'strong' | 'moderate' | 'weak'
  context: string
  theologicalSignificance?: string
}

interface AICrossReferencesProps {
  passage: {
    reference: string
    text: string
    verses: Array<{
      text: string
      reference: string
      verseNumber: number
    }>
  }
  onReferenceSelect?: (reference: CrossReference) => void
}

export function AICrossReferences({ passage, onReferenceSelect }: AICrossReferencesProps) {
  const [references, setReferences] = useState<CrossReference[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedStrength, setSelectedStrength] = useState<string>('all')
  const [expandedRefs, setExpandedRefs] = useState<Set<string>>(new Set())

  const connectionTypes = [
    { id: 'all', label: 'All Types', icon: Search },
    { id: 'thematic', label: 'Thematic', icon: Lightbulb },
    { id: 'prophetic', label: 'Prophetic', icon: Cross },
    { id: 'fulfillment', label: 'Fulfillment', icon: Heart },
    { id: 'parallel', label: 'Parallel', icon: Link },
    { id: 'contrast', label: 'Contrast', icon: BookOpen },
    { id: 'explanation', label: 'Explanation', icon: ExternalLink }
  ]

  const strengthLevels = [
    { id: 'all', label: 'All Strengths' },
    { id: 'strong', label: 'Strong' },
    { id: 'moderate', label: 'Moderate' },
    { id: 'weak', label: 'Weak' }
  ]

  // Generate cross-references when passage changes
  useEffect(() => {
    if (passage) {
      generateCrossReferences()
    }
  }, [passage])

  const generateCrossReferences = async () => {
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
        console.log('Using test token for cross-references')
      }

      const response = await fetch('/api/bible/cross-references', {
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
        throw new Error(errorData.error || `Failed to generate cross-references (${response.status})`)
      }

      const data = await response.json()
      setReferences(data.references || [])
    } catch (err) {
      console.error('Cross-references error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate cross-references')
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (refId: string) => {
    const newExpanded = new Set(expandedRefs)
    if (newExpanded.has(refId)) {
      newExpanded.delete(refId)
    } else {
      newExpanded.add(refId)
    }
    setExpandedRefs(newExpanded)
  }

  const copyReference = (reference: CrossReference) => {
    const text = `${reference.reference}: "${reference.text}"\n\nConnection: ${reference.relevance}`
    navigator.clipboard.writeText(text)
  }

  const getConnectionTypeColor = (type: string) => {
    const colors = {
      thematic: 'bg-purple-600',
      prophetic: 'bg-red-600',
      fulfillment: 'bg-green-600',
      parallel: 'bg-blue-600',
      contrast: 'bg-orange-600',
      explanation: 'bg-pink-600'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-600'
  }

  const getStrengthColor = (strength: string) => {
    const colors = {
      strong: 'bg-green-500',
      moderate: 'bg-yellow-500',
      weak: 'bg-red-500'
    }
    return colors[strength as keyof typeof colors] || 'bg-gray-500'
  }

  const filteredReferences = references.filter(ref => {
    const typeMatch = selectedType === 'all' || ref.connectionType === selectedType
    const strengthMatch = selectedStrength === 'all' || ref.strength === selectedStrength
    return typeMatch && strengthMatch
  })

  if (loading) {
    return (
      <div className="bg-[#1A1D24] rounded-lg p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-400 mr-3" />
          <span className="text-[#9CA3AF]">Finding cross-references...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-[#1A1D24] rounded-lg p-6">
        <div className="text-center">
          <div className="text-red-400 mb-2">Failed to generate cross-references</div>
          <button 
            onClick={generateCrossReferences}
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
          <Search className="h-6 w-6 text-blue-400" />
          <h3 className="text-xl font-semibold">AI Cross-References</h3>
        </div>
        <div className="text-sm text-[#9CA3AF]">
          {filteredReferences.length} references found
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#9CA3AF] mb-2">Connection Type</label>
          <div className="flex flex-wrap gap-2">
            {connectionTypes.map(({ id, label, icon: Icon }) => (
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
          <label className="block text-sm font-medium text-[#9CA3AF] mb-2">Connection Strength</label>
          <div className="flex flex-wrap gap-2">
            {strengthLevels.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setSelectedStrength(id)}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedStrength === id
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

      {/* References List */}
      <div className="space-y-4">
        {filteredReferences.length === 0 ? (
          <div className="text-center py-8">
            <Search className="h-12 w-12 text-[#9CA3AF] mx-auto mb-4" />
            <p className="text-[#9CA3AF]">No cross-references match your current filters</p>
          </div>
        ) : (
          filteredReferences.map((reference) => (
            <div 
              key={reference.id} 
              className="bg-[#2C303A] rounded-lg p-4 transition-all hover:bg-[#3A404B]"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getConnectionTypeColor(reference.connectionType)}`}>
                      {reference.connectionType}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStrengthColor(reference.strength)}`}>
                      {reference.strength}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-semibold text-blue-400">{reference.reference}</h4>
                    <button
                      onClick={() => copyReference(reference)}
                      className="p-1 text-[#9CA3AF] hover:text-blue-400 transition-colors"
                      title="Copy reference"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-[#E5E7EB] text-sm leading-relaxed mb-2">
                    "{reference.text}"
                  </p>
                  <p className="text-[#9CA3AF] text-sm">
                    {reference.relevance}
                  </p>
                </div>
                <div className="flex space-x-1 ml-4">
                  <button
                    onClick={() => toggleExpanded(reference.id)}
                    className="p-1 text-[#9CA3AF] hover:text-blue-400 transition-colors"
                    title={expandedRefs.has(reference.id) ? 'Show less' : 'Show more'}
                  >
                    <ChevronRight className={`h-4 w-4 transition-transform ${expandedRefs.has(reference.id) ? 'rotate-90' : ''}`} />
                  </button>
                  {onReferenceSelect && (
                    <button
                      onClick={() => onReferenceSelect(reference)}
                      className="p-1 text-[#9CA3AF] hover:text-blue-400 transition-colors"
                      title="Use in chat"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded Content */}
              {expandedRefs.has(reference.id) && (
                <div className="mt-3 pt-3 border-t border-[#3A404B]">
                  <div className="space-y-3">
                    <div>
                      <h5 className="font-medium text-blue-400 mb-1">Context</h5>
                      <p className="text-[#E5E7EB] text-sm leading-relaxed">
                        {reference.context}
                      </p>
                    </div>
                    
                    {reference.theologicalSignificance && (
                      <div>
                        <h5 className="font-medium text-blue-400 mb-1">Theological Significance</h5>
                        <p className="text-[#E5E7EB] text-sm leading-relaxed">
                          {reference.theologicalSignificance}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <div className="text-xs text-[#9CA3AF]">
                        Book: {reference.book} | Chapter: {reference.chapter} | Verse: {reference.verse}
                      </div>
                      <button
                        onClick={() => copyReference(reference)}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        Copy Full Reference
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      {filteredReferences.length > 0 && (
        <div className="mt-6 p-4 bg-[#2C303A] rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#9CA3AF]">
              Showing {filteredReferences.length} of {references.length} cross-references
            </span>
            <div className="flex space-x-4 text-xs">
              <span className="text-green-400">
                {references.filter(r => r.strength === 'strong').length} strong
              </span>
              <span className="text-yellow-400">
                {references.filter(r => r.strength === 'moderate').length} moderate
              </span>
              <span className="text-red-400">
                {references.filter(r => r.strength === 'weak').length} weak
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
