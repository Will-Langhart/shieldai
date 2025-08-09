import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Filter, SortAsc, SortDesc, Plus, Edit, Trash2, Star, 
  Eye, EyeOff, Share2, Download, Calendar, Tag, BookOpen,
  ChevronDown, ChevronRight, Save, RefreshCw, Grid, List
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { NoteData } from '../types/notes';

interface NotesManagerProps {
  className?: string;
  onNoteSelect?: (note: NoteData) => void;
  onNoteEdit?: (note: NoteData) => void;
  onNoteDelete?: (noteId: string) => void;
}

interface NotesFilter {
  query: string;
  category: string;
  tags: string[];
  visibility: string;
  isFavorite: boolean;
  startDate: string;
  endDate: string;
}

interface SortOption {
  field: 'lastModified' | 'dateCreated' | 'reference' | 'category';
  direction: 'asc' | 'desc';
}

export default function NotesManager({ 
  className = '', 
  onNoteSelect, 
  onNoteEdit, 
  onNoteDelete 
}: NotesManagerProps) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<NoteData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter and search state
  const [filters, setFilters] = useState<NotesFilter>({
    query: '',
    category: '',
    tags: [],
    visibility: '',
    isFavorite: false,
    startDate: '',
    endDate: ''
  });
  
  // Sort and view state
  const [sortOption, setSortOption] = useState<SortOption>({
    field: 'lastModified',
    direction: 'desc'
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalNotes, setTotalNotes] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const notesPerPage = 20;

  // Categories and tags
  const [categories, setCategories] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    if (user?.id) {
      loadNotes();
      loadCategoriesAndTags();
    }
  }, [user?.id, currentPage]);

  useEffect(() => {
    applyFilters();
  }, [notes, filters, sortOption]);

  const loadNotes = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        userId: user.id,
        limit: notesPerPage.toString(),
        offset: ((currentPage - 1) * notesPerPage).toString()
      });

      // Add filters to params
      if (filters.query) params.append('query', filters.query);
      if (filters.category) params.append('category', filters.category);
      if (filters.visibility) params.append('visibility', filters.visibility);
      if (filters.isFavorite) params.append('isFavorite', 'true');
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.tags.length > 0) params.append('tags', filters.tags.join(','));

      const response = await fetch(`/api/bible/notes/search?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes || []);
        setTotalNotes(data.total || 0);
        setHasMore(data.pagination?.hasMore || false);
      } else {
        throw new Error('Failed to load notes');
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      setError('Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategoriesAndTags = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/bible/notes?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        const allNotes = data.notes || [];
        
        // Extract unique categories
        const categories: string[] = [];
        allNotes.forEach((note: NoteData) => {
          if (note.category && !categories.includes(note.category)) {
            categories.push(note.category);
          }
        });
        setCategories(categories);
        
        // Extract unique tags
        const allTags: string[] = [];
        allNotes.forEach((note: NoteData) => {
          note.tags?.forEach(tag => {
            if (!allTags.includes(tag)) {
              allTags.push(tag);
            }
          });
        });
        setAllTags(allTags);
      }
    } catch (error) {
      console.error('Error loading categories and tags:', error);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...notes];

    // Apply text search
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(note => 
        note.note.toLowerCase().includes(query) ||
        note.reference.toLowerCase().includes(query) ||
        note.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(note => note.category === filters.category);
    }

    // Apply visibility filter
    if (filters.visibility) {
      filtered = filtered.filter(note => note.visibility === filters.visibility);
    }

    // Apply favorite filter
    if (filters.isFavorite) {
      filtered = filtered.filter(note => note.isFavorite);
    }

    // Apply tag filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(note => 
        note.tags?.some(tag => filters.tags.includes(tag))
      );
    }

    // Apply date filters
    if (filters.startDate) {
      filtered = filtered.filter(note => 
        new Date(note.dateCreated) >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      filtered = filtered.filter(note => 
        new Date(note.dateCreated) <= new Date(filters.endDate)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortOption.field) {
        case 'lastModified':
          aValue = new Date(a.lastModified);
          bValue = new Date(b.lastModified);
          break;
        case 'dateCreated':
          aValue = new Date(a.dateCreated);
          bValue = new Date(b.dateCreated);
          break;
        case 'reference':
          aValue = a.reference;
          bValue = b.reference;
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        default:
          return 0;
      }

      if (sortOption.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredNotes(filtered);
  }, [notes, filters, sortOption]);

  const handleFilterChange = (key: keyof NotesFilter, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSortChange = (field: SortOption['field']) => {
    setSortOption(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handleNoteDelete = async (noteId: string) => {
    if (!user?.id || !confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(`/api/bible/notes?noteId=${noteId}&userId=${user.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setNotes(prev => prev.filter(note => note.id !== noteId));
        onNoteDelete?.(noteId);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      setError('Failed to delete note');
    }
  };

  const exportNotes = () => {
    const exportData = {
      notes: filteredNotes,
      exportDate: new Date().toISOString(),
      filters,
      totalNotes: filteredNotes.length
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bible-notes-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      category: '',
      tags: [],
      visibility: '',
      isFavorite: false,
      startDate: '',
      endDate: ''
    });
    setCurrentPage(1);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Bible Notes Manager
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({totalNotes} notes)
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
            </button>
            
            <button
              onClick={exportNotes}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <Download className="w-4 h-4" />
            </button>
            
            <button
              onClick={loadNotes}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notes by content, reference, or tags..."
              value={filters.query}
              onChange={(e) => handleFilterChange('query', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {showFilters ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {(filters.category || filters.visibility || filters.isFavorite || filters.tags.length > 0 || filters.startDate || filters.endDate) && (
              <button
                onClick={clearFilters}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              {/* Category Filter */}
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              {/* Visibility Filter */}
              <select
                value={filters.visibility}
                onChange={(e) => handleFilterChange('visibility', e.target.value)}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="">All Visibility</option>
                <option value="private">Private</option>
                <option value="shared">Shared</option>
                <option value="public">Public</option>
              </select>

              {/* Favorite Filter */}
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={filters.isFavorite}
                  onChange={(e) => handleFilterChange('isFavorite', e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <span className="text-gray-700 dark:text-gray-300">Favorites Only</span>
              </label>

              {/* Date Range */}
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder="Start Date"
                />
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder="End Date"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600 dark:text-red-400">
            <p>{error}</p>
            <button
              onClick={loadNotes}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No notes found</p>
            <p className="text-sm mt-1">Try adjusting your filters or create a new note</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Sort Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
                {(['lastModified', 'dateCreated', 'reference', 'category'] as const).map(field => (
                  <button
                    key={field}
                    onClick={() => handleSortChange(field)}
                    className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                      sortOption.field === field
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {field === 'lastModified' ? 'Modified' : 
                     field === 'dateCreated' ? 'Created' : 
                     field === 'reference' ? 'Reference' : 'Category'}
                    {sortOption.field === field && (
                      sortOption.direction === 'asc' ? <SortAsc className="w-3 h-3 ml-1" /> : <SortDesc className="w-3 h-3 ml-1" />
                    )}
                  </button>
                ))}
              </div>
              
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {filteredNotes.length} of {totalNotes} notes
              </span>
            </div>

            {/* Notes Grid/List */}
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                    viewMode === 'grid' ? 'h-48 overflow-hidden' : ''
                  }`}
                  onClick={() => onNoteSelect?.(note)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: note.color || '#3B82F6' }}
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {note.reference}
                      </span>
                      {note.isFavorite && <Star className="w-4 h-4 text-yellow-600" />}
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {note.visibility === 'private' ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : note.visibility === 'shared' ? (
                        <Share2 className="w-4 h-4 text-blue-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-green-400" />
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNoteEdit?.(note);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNoteDelete(note.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <p className={`text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed ${
                    viewMode === 'grid' ? 'line-clamp-4' : ''
                  }`}>
                    {note.note}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-2">
                      {note.category && (
                        <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {note.category}
                        </span>
                      )}
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(note.lastModified).toLocaleDateString()}</span>
                    </div>
                    
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <Tag className="w-3 h-3" />
                        <span>{note.tags.length} tag{note.tags.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {hasMore && (
              <div className="flex items-center justify-center pt-4">
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Load More Notes
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}