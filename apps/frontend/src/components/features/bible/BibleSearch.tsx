import React, { useState } from 'react'
import { Button, Input } from '../../ui'
import { LoadingSpinner } from '../../common'
import { BibleSearchResult } from '../../../types/bible'

export interface BibleSearchProps {
  onSearch: (query: string) => Promise<BibleSearchResult>
  loading?: boolean
  className?: string
}

const BibleSearch: React.FC<BibleSearchProps> = ({
  onSearch,
  loading = false,
  className
}) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<BibleSearchResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsSearching(true)
    try {
      const searchResults = await onSearch(query)
      setResults(searchResults)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className={className}>
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="search"
            placeholder="Search Bible verses..."
            value={query}
            onChange={setQuery}
            className="flex-1"
            disabled={isSearching}
          />
          <Button
            type="submit"
            loading={isSearching}
            disabled={!query.trim() || isSearching}
          >
            Search
          </Button>
        </div>
      </form>

      {isSearching && (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {results && !isSearching && (
        <div className="mt-6 space-y-4">
          <div className="text-sm text-gray-600">
            Found {results.total_results} results for "{results.query}"
          </div>
          
          <div className="space-y-3">
            {results.results.map((verse, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-sm font-medium text-blue-600 mb-2">
                  {verse.reference}
                </div>
                <div className="text-gray-800 leading-relaxed">
                  {verse.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default BibleSearch

