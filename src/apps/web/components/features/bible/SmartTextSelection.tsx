import React, { useState, useRef, useEffect, useCallback } from 'react'
import { 
  Brain, 
  X, 
  Loader2, 
  Image, 
  Copy, 
  Share2, 
  Bookmark,
  Sparkles,
  Zap,
  MessageCircle,
  Lightbulb
} from 'lucide-react'

interface SelectedText {
  text: string
  startOffset: number
  endOffset: number
  reference: string
  verseNumber: number
  chapterNumber: number
  bookName: string
}

interface SmartTextSelectionProps {
  passage: {
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
  onInsightGenerated?: (insight: any) => void
  onImageGenerated?: (image: any) => void
  children: React.ReactNode
}

export function SmartTextSelection({ passage, onInsightGenerated, onImageGenerated, children }: SmartTextSelectionProps) {
  const [selectedText, setSelectedText] = useState<SelectedText | null>(null)
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [generatedInsight, setGeneratedInsight] = useState<any>(null)
  const [generatedImage, setGeneratedImage] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null)
  
  const textRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Handle text selection
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      setSelectedText(null)
      setShowAnalysisModal(false)
      return
    }

    const range = selection.getRangeAt(0)
    const selectedText = selection.toString().trim()
    
    if (!selectedText || selectedText.length < 3) {
      setSelectedText(null)
      setShowAnalysisModal(false)
      return
    }

    // Find which verse contains the selected text
    const verseElement = range.commonAncestorContainer.parentElement?.closest('[data-verse]')
    if (!verseElement) {
      setSelectedText(null)
      setShowAnalysisModal(false)
      return
    }

    const verseNumber = parseInt(verseElement.getAttribute('data-verse') || '1')
    const verse = passage.verses.find(v => v.verseNumber === verseNumber)
    
    if (!verse) {
      setSelectedText(null)
      setShowAnalysisModal(false)
      return
    }

    // Calculate position for modal
    const rect = range.getBoundingClientRect()
    setSelectionPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    })

    const selectedTextData: SelectedText = {
      text: selectedText,
      startOffset: range.startOffset,
      endOffset: range.endOffset,
      reference: verse.reference,
      verseNumber: verse.verseNumber,
      chapterNumber: verse.chapterNumber,
      bookName: verse.bookName
    }

    setSelectedText(selectedTextData)
    setShowAnalysisModal(true)
    setError(null)
  }, [passage.verses])

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowAnalysisModal(false)
        setSelectedText(null)
      }
    }

    if (showAnalysisModal) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAnalysisModal])

  // Generate AI insight for selected text
  const generateInsight = async () => {
    if (!selectedText) return

    setIsGeneratingInsight(true)
    setError(null)

    try {
      const authToken = await getAuthToken()
      
      const response = await fetch('/api/bible/ai-insights', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          passage: {
            id: selectedText.id || 'unknown',
            reference: selectedText.reference,
            text: selectedText.text,
            verses: [{
              id: selectedText.id || 'unknown',
              text: selectedText.text,
              reference: selectedText.reference,
              verseNumber: selectedText.verseNumber || 1,
              chapterNumber: selectedText.chapterNumber || 1,
              bookName: selectedText.bookName || 'Unknown'
            }],
            version: passage.version
          },
          version: passage.version.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate insight')
      }

      const data = await response.json()
      setGeneratedInsight(data.insights)
      
      if (onInsightGenerated) {
        onInsightGenerated(data.insights)
      }
    } catch (error) {
      console.error('Error generating insight:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate insight')
    } finally {
      setIsGeneratingInsight(false)
    }
  }

  // Generate image for selected text
  const generateImage = async () => {
    if (!selectedText || !generatedInsight) return

    setIsGeneratingImage(true)
    setError(null)

    try {
      const authToken = await getAuthToken()
      
      const response = await fetch('/api/ai-insights/generate-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          passage_reference: selectedText.reference,
          passage_text: selectedText.text,
          insight_text: generatedInsight.explanation,
          key_themes: generatedInsight.keyThemes || [],
          style: 'biblical'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate image')
      }

      const data = await response.json()
      setGeneratedImage(data.image)
      
      if (onImageGenerated) {
        onImageGenerated(data.image)
      }
    } catch (error) {
      console.error('Error generating image:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate image')
    } finally {
      setIsGeneratingImage(false)
    }
  }

  // Copy selected text
  const copySelectedText = () => {
    if (selectedText) {
      navigator.clipboard.writeText(selectedText.text)
    }
  }

  // Share selected text
  const shareSelectedText = async () => {
    if (selectedText) {
      const shareData = {
        title: `Scripture from ${selectedText.reference}`,
        text: `"${selectedText.text}" - ${selectedText.reference}`,
        url: window.location.href
      }

      if (navigator.share) {
        try {
          await navigator.share(shareData)
        } catch (error) {
          console.log('Error sharing:', error)
        }
      } else {
        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`)
      }
    }
  }

  // Get auth token
  const getAuthToken = async (): Promise<string> => {
    try {
      const { data: { session } } = await import('../../../lib/supabase').then(m => m.supabase.auth.getSession())
      return session?.access_token || 'test-token'
    } catch (error) {
      return 'test-token'
    }
  }

  // Close modal
  const closeModal = () => {
    setShowAnalysisModal(false)
    setSelectedText(null)
    setGeneratedInsight(null)
    setGeneratedImage(null)
    setError(null)
  }

  return (
    <>
      {/* Text selection handler */}
      <div
        ref={textRef}
        onMouseUp={handleTextSelection}
        className="select-text"
        style={{ userSelect: 'text' }}
      >
        {children}
      </div>

      {/* Analysis Modal */}
      {showAnalysisModal && selectedText && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            ref={modalRef}
            className="bg-shield-canvas border border-shield-panel rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            style={{
              position: 'fixed',
              top: selectionPosition ? `${selectionPosition.y}px` : '50%',
              left: selectionPosition ? `${selectionPosition.x}px` : '50%',
              transform: selectionPosition ? 'translate(-50%, -100%)' : 'translate(-50%, -50%)'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Brain className="h-6 w-6 text-blue-400" />
                <div>
                  <h3 className="text-lg font-semibold text-shield-fg">Selected Scripture</h3>
                  <p className="text-sm text-shield-muted">{selectedText.reference}</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-shield-muted hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Selected Text */}
            <div className="mb-4 p-4 bg-shield-panel rounded-lg">
              <p className="text-shield-fg italic text-lg leading-relaxed">
                "{selectedText.text}"
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={generateInsight}
                disabled={isGeneratingInsight}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {isGeneratingInsight ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4" />
                )}
                <span>{isGeneratingInsight ? 'Analyzing...' : 'AI Analysis'}</span>
              </button>

              <button
                onClick={generateImage}
                disabled={isGeneratingImage || !generatedInsight}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {isGeneratingImage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Image className="h-4 w-4" />
                )}
                <span>{isGeneratingImage ? 'Generating...' : 'Generate Image'}</span>
              </button>

              <button
                onClick={copySelectedText}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                <Copy className="h-4 w-4" />
                <span>Copy</span>
              </button>

              <button
                onClick={shareSelectedText}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Generated Insight */}
            {generatedInsight && (
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Sparkles className="h-5 w-5 text-yellow-400" />
                  <h4 className="text-lg font-semibold text-shield-fg">AI Analysis</h4>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-shield-panel rounded-lg">
                    <h5 className="font-medium text-shield-fg mb-2">Explanation</h5>
                    <p className="text-shield-fg text-sm leading-relaxed">{generatedInsight.explanation}</p>
                  </div>

                  {generatedInsight.keyThemes && generatedInsight.keyThemes.length > 0 && (
                    <div className="p-4 bg-shield-panel rounded-lg">
                      <h5 className="font-medium text-shield-fg mb-2">Key Themes</h5>
                      <div className="flex flex-wrap gap-2">
                        {generatedInsight.keyThemes.map((theme: string, index: number) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm"
                          >
                            {theme}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {generatedInsight.practicalApplication && (
                    <div className="p-4 bg-shield-panel rounded-lg">
                      <h5 className="font-medium text-shield-fg mb-2">Practical Application</h5>
                      <p className="text-shield-fg text-sm leading-relaxed">{generatedInsight.practicalApplication}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Generated Image */}
            {generatedImage && (
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Image className="h-5 w-5 text-purple-400" />
                  <h4 className="text-lg font-semibold text-shield-fg">Generated Image</h4>
                </div>
                
                <div className="p-4 bg-shield-panel rounded-lg">
                  <img
                    src={generatedImage.url}
                    alt={`Visual representation of ${selectedText.reference}`}
                    className="w-full rounded-lg"
                  />
                  {generatedImage.revisedPrompt && (
                    <p className="text-xs text-shield-muted mt-2 italic">
                      Generated from: "{generatedImage.revisedPrompt}"
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
