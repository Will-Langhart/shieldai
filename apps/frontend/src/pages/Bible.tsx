import { useState } from 'react'
import { Search, BookOpen, ChevronRight } from 'lucide-react'
import { apiService, BibleVerse } from '../services/api'

export function Bible() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<BibleVerse[]>([])
  const [selectedBook, setSelectedBook] = useState('')
  const [selectedChapter, setSelectedChapter] = useState(1)
  const [verses, setVerses] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setLoading(true)
    try {
      const results = await apiService.searchBible(searchQuery)
      setSearchResults(results.results || [])
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGetVerses = async () => {
    if (!selectedBook) return
    
    setLoading(true)
    try {
      const result = await apiService.getBibleVerses(selectedBook, selectedChapter)
      setVerses(result.verses || '')
    } catch (error) {
      console.error('Error getting verses:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1A1D24] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#E0E0E0] mb-4">
            Bible Study
          </h1>
          <p className="text-xl text-[#9CA3AF]">
            Search scripture and explore God's Word with AI-powered insights
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Search Section */}
          <div className="bg-[#2C303A] border border-[#3A404B] rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-[#E0E0E0] mb-6 flex items-center">
              <Search className="h-6 w-6 mr-2 text-blue-400" />
              Search Scripture
            </h2>
            
            <div className="space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Search for verses, topics, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-2 bg-[#1A1D24] border border-[#3A404B] rounded-lg text-[#E0E0E0] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
              
              {searchResults.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-[#E0E0E0] mb-4">Search Results</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {searchResults.map((result: any, index: number) => (
                      <div key={index} className="p-4 bg-[#1A1D24] border border-[#3A404B] rounded-lg">
                        <p className="text-[#E0E0E0]">{result.text}</p>
                        <p className="text-sm text-blue-400 mt-2">{result.reference}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Verse Lookup Section */}
          <div className="bg-[#2C303A] border border-[#3A404B] rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-[#E0E0E0] mb-6 flex items-center">
              <BookOpen className="h-6 w-6 mr-2 text-blue-400" />
              Read Scripture
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#E0E0E0] mb-2">
                  Book
                </label>
                <select
                  value={selectedBook}
                  onChange={(e) => setSelectedBook(e.target.value)}
                  className="w-full px-4 py-2 bg-[#1A1D24] border border-[#3A404B] rounded-lg text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a book</option>
                  <option value="Genesis">Genesis</option>
                  <option value="Exodus">Exodus</option>
                  <option value="Psalms">Psalms</option>
                  <option value="Proverbs">Proverbs</option>
                  <option value="Matthew">Matthew</option>
                  <option value="Mark">Mark</option>
                  <option value="Luke">Luke</option>
                  <option value="John">John</option>
                  <option value="Romans">Romans</option>
                  <option value="Ephesians">Ephesians</option>
                  <option value="Philippians">Philippians</option>
                  <option value="Colossians">Colossians</option>
                  <option value="1 Corinthians">1 Corinthians</option>
                  <option value="2 Corinthians">2 Corinthians</option>
                  <option value="Galatians">Galatians</option>
                  <option value="1 Thessalonians">1 Thessalonians</option>
                  <option value="2 Thessalonians">2 Thessalonians</option>
                  <option value="1 Timothy">1 Timothy</option>
                  <option value="2 Timothy">2 Timothy</option>
                  <option value="Titus">Titus</option>
                  <option value="Philemon">Philemon</option>
                  <option value="Hebrews">Hebrews</option>
                  <option value="James">James</option>
                  <option value="1 Peter">1 Peter</option>
                  <option value="2 Peter">2 Peter</option>
                  <option value="1 John">1 John</option>
                  <option value="2 John">2 John</option>
                  <option value="3 John">3 John</option>
                  <option value="Jude">Jude</option>
                  <option value="Revelation">Revelation</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#E0E0E0] mb-2">
                  Chapter
                </label>
                <input
                  type="number"
                  min="1"
                  value={selectedChapter}
                  onChange={(e) => setSelectedChapter(parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-[#1A1D24] border border-[#3A404B] rounded-lg text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <button
                onClick={handleGetVerses}
                disabled={loading || !selectedBook}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors"
              >
                <span>{loading ? 'Loading...' : 'Get Verses'}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
              
              {verses && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-[#E0E0E0] mb-4">
                    {selectedBook} {selectedChapter}
                  </h3>
                  <div className="prose max-w-none">
                    <div 
                      className="text-[#E0E0E0] leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: verses }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}