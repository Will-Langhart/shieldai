import type React from 'react'
import { BookOpen, Clock, Star } from 'lucide-react'

export interface QuickNavItem {
  id: string
  label: string
  description: string
  reference: string
  type: 'passage' | 'search' | 'ai-feature' | 'shortcut'
  icon: React.ComponentType<any>
  shortcut?: string
  category: string
}

export interface QuickNavSearchResult {
  reference: string
  text: string
}

export interface QuickNavRecentPassage {
  reference: string
  timestamp: Date
}

export interface QuickNavFavoritePassage {
  reference: string
  book: string
  chapter: number
  verse?: number
}

export interface QuickNavItemsInput {
  searchQuery: string
  searchResults: QuickNavSearchResult[]
  activeCategory: string
  baseItems: QuickNavItem[]
  recentPassages: QuickNavRecentPassage[]
  favoritePassages: QuickNavFavoritePassage[]
}

/** The list Quick Navigation shows for the current search and category. */
export function getQuickNavItems({
  searchQuery,
  searchResults,
  activeCategory,
  baseItems,
  recentPassages,
  favoritePassages,
}: QuickNavItemsInput): QuickNavItem[] {
  if (searchQuery.trim()) {
    return searchResults.map((result, index) => ({
      id: `search-${index}`,
      label: result.reference,
      description: result.text.substring(0, 100) + '...',
      reference: result.reference,
      type: 'passage' as const,
      icon: BookOpen,
      category: 'search',
    }))
  }

  switch (activeCategory) {
    case 'ai':
    case 'popular':
    case 'navigation':
      return baseItems.filter((item) => item.category === activeCategory)
    case 'recent':
      return recentPassages.map((passage, index) => ({
        id: `recent-${index}`,
        label: passage.reference,
        description: `Visited ${passage.timestamp.toLocaleDateString()}`,
        reference: passage.reference,
        type: 'passage' as const,
        icon: Clock,
        category: 'recent',
      }))
    case 'favorites':
      return favoritePassages.map((passage, index) => ({
        id: `favorite-${index}`,
        label: passage.reference,
        description: `${passage.book} ${passage.chapter}${passage.verse ? ':' + passage.verse : ''}`,
        reference: passage.reference,
        type: 'passage' as const,
        icon: Star,
        category: 'favorites',
      }))
    default:
      return baseItems
  }
}
