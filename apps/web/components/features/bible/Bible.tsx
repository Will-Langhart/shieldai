import React, { useState } from 'react'
import { BookOpen, Search, Bookmark } from 'lucide-react'

export function Bible() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBook, setSelectedBook] = useState('Genesis')
  const [selectedChapter, setSelectedChapter] = useState(1)
  const [selectedVerse, setSelectedVerse] = useState(1)

  const books = [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
    'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
    '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
    'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
    'Ecclesiastes', 'Song of Songs', 'Isaiah', 'Jeremiah', 'Lamentations',
    'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
    'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
    'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'
  ]

  const handleSearch = () => {
    console.log('Searching for:', searchTerm)
    // TODO: Implement search functionality
  }

  return (
    <div className="min-h-screen bg-[#1A1D24] text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 flex items-center">
            <BookOpen className="h-10 w-10 text-blue-400 mr-3" />
            Bible Study
          </h1>
          <p className="text-[#9CA3AF] text-lg">
            Explore scripture with AI-powered insights and study tools
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search scripture..."
                className="w-full bg-[#2C303A] border border-[#3A404B] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Search className="h-5 w-5" />
              <span>Search</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-[#2C303A] rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Navigation</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#9CA3AF] mb-2">Book</label>
                  <select
                    value={selectedBook}
                    onChange={(e) => setSelectedBook(e.target.value)}
                    className="w-full bg-[#1A1D24] border border-[#3A404B] text-white px-3 py-2 rounded"
                  >
                    {books.map((book) => (
                      <option key={book} value={book}>{book}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#9CA3AF] mb-2">Chapter</label>
                  <input
                    type="number"
                    value={selectedChapter}
                    onChange={(e) => setSelectedChapter(parseInt(e.target.value))}
                    className="w-full bg-[#1A1D24] border border-[#3A404B] text-white px-3 py-2 rounded"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#9CA3AF] mb-2">Verse</label>
                  <input
                    type="number"
                    value={selectedVerse}
                    onChange={(e) => setSelectedVerse(parseInt(e.target.value))}
                    className="w-full bg-[#1A1D24] border border-[#3A404B] text-white px-3 py-2 rounded"
                    min="1"
                  />
                </div>

                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition-colors">
                  Go to Passage
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-[#2C303A] rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {selectedBook} {selectedChapter}:{selectedVerse}
                </h2>
                <button className="flex items-center space-x-2 text-blue-400 hover:text-blue-300">
                  <Bookmark className="h-5 w-5" />
                  <span>Bookmark</span>
                </button>
              </div>

              <div className="prose prose-invert max-w-none">
                <div className="text-lg leading-relaxed">
                  <p className="mb-4">
                    This is where the Bible text would be displayed. The AI-powered Bible study features
                    will provide insights, cross-references, and study notes here.
                  </p>
                  
                  <p className="mb-4">
                    For now, this is a placeholder. In the full implementation, this would connect to
                    a Bible API to fetch the actual scripture text and provide AI-enhanced study tools.
                  </p>
                </div>
              </div>

              <div className="mt-8 p-4 bg-[#1A1D24] rounded-lg">
                <h4 className="text-lg font-semibold mb-3">AI Insights</h4>
                <p className="text-[#9CA3AF]">
                  AI-powered insights and study notes will appear here to help you understand
                  the deeper meaning and context of the scripture.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
