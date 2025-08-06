import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Search, Filter, Star, Calendar, Tag, Eye, EyeOff,
  Plus, Edit, Trash2, Download, Upload, Share2, Grid, List,
  SortAsc, SortDesc, ChevronDown, X, RefreshCw
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import EnhancedNoteModal from './EnhancedNoteModal';
import { NoteData } from '../types/notes';

interface NotesManagerProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
}

type ViewMode = 'grid' | 'list';
type SortField = 'lastModified' | 'dateCreated' | 'reference' | 'category';
type SortOrder = 'asc' | 'desc';

const NOTE_CATEGORIES = [
  'All Categories',
  'Personal Study',
  'Sermon Notes',
  'Prayer Requests',
  'Devotional',
  'Apologetics',
  'Theology',
  'Life Application',
  'Questions',
  'Insights',
  'Cross References'
];

export default function NotesManager({
  isOpen,
  onClose,
  theme = 'dark'
}: NotesManagerProps) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<NoteData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('lastModified');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal states
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<NoteData | undefined>();
  
  // Stats
  const [noteStats, setNoteStats] = useState({
    total: 0,
    favorites: 0,
    categories: {} as Record<string, number>,
    recentlyModified: 0
  });

  useEffect(() => {
    if (isOpen && user?.id) {
      loadNotes();
    }
  }, [isOpen, user?.id]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [notes, searchQuery, selectedCategory, selectedTags, showFavoritesOnly, sortField, sortOrder]);

  const loadNotes = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/bible/notes?userId=${user.id}&limit=1000`);
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
        calculateStats(data);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (notesData: NoteData[]) => {
    const stats = {
      total: notesData.length,
      favorites: notesData.filter(note => note.isFavorite).length,
      categories: {} as Record<string, number>,
      recentlyModified: notesData.filter(note => {
        const lastModified = new Date(note.lastModified);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return lastModified > weekAgo;
      }).length
    };

    notesData.forEach(note => {
      stats.categories[note.category] = (stats.categories[note.category] || 0) + 1;
    });

    setNoteStats(stats);
  };

  const applyFiltersAndSort = () => {
    let filtered = [...notes];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(note =>
        note.note.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply category filter
    if (selectedCategory !== 'All Categories') {
      filtered = filtered.filter(note => note.category === selectedCategory);
    }

    // Apply tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(note =>
        selectedTags.some(tag => note.tags.includes(tag))
      );
    }

    // Apply favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter(note => note.isFavorite);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'lastModified':
          aValue = new Date(a.lastModified);
          bValue = new Date(b.lastModified);
          break;
        case 'dateCreated':
          aValue = new Date(a.dateCreated);
          bValue = new Date(b.dateCreated);
          break;
        case 'reference':
          aValue = a.reference.toLowerCase();
          bValue = b.reference.toLowerCase();
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredNotes(filtered);
  };

  const getAllTags = () => {
    const allTags = new Set<string>();
    notes.forEach(note => {
      note.tags.forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags).sort();
  };

  const handleEditNote = (note: NoteData) => {
    setSelectedNote(note);
    setShowNoteModal(true);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(`/api/bible/notes/${noteId}?userId=${user?.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setNotes(notes.filter(note => note.id !== noteId));
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleToggleFavorite = async (note: NoteData) => {
    try {
      const updatedNote = { ...note, isFavorite: !note.isFavorite };
      
      const response = await fetch('/api/bible/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedNote)
      });

      if (response.ok) {
        const savedNote = await response.json();
        setNotes(notes.map(n => n.id === note.id ? savedNote : n));
      }
    } catch (error) {
      console.error('Error updating favorite status:', error);
    }
  };

  const exportNotes = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalNotes: filteredNotes.length,
      notes: filteredNotes
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

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All Categories');
    setSelectedTags([]);
    setShowFavoritesOnly(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className={`w-full max-w-7xl mx-4 rounded-2xl shadow-2xl overflow-hidden ${
          theme === 'dark' 
            ? 'bg-gray-900 border border-gray-700' 
            : 'bg-white border border-gray-200'
        }`} style={{ maxHeight: '95vh' }}>
          
          {/* Header */}
          <div className={`p-6 border-b flex items-center justify-between ${
            theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center space-x-4">
              <BookOpen className={`w-6 h-6 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              <div>
                <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Bible Study Notes
                </h2>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Manage your biblical insights and reflections
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowNoteModal(true)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                  theme === 'dark'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>New Note</span>
              </button>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className={`px-6 py-4 border-b grid grid-cols-2 md:grid-cols-4 gap-4 ${
            theme === 'dark' ? 'border-gray-700 bg-gray-850' : 'border-gray-200 bg-gray-25'
          }`}>
            <div className="text-center">
              <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                {noteStats.total}
              </p>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Notes
              </p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`}>
                {noteStats.favorites}
              </p>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Favorites
              </p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                {Object.keys(noteStats.categories).length}
              </p>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Categories
              </p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
                {noteStats.recentlyModified}
              </p>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Recent
              </p>
            </div>
          </div>

          {/* Filters and Search */}
          <div className={`p-6 border-b space-y-4 ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            {/* Search and View Controls */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search notes, references, or tags..."
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                    showFilters
                      ? theme === 'dark'
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-600 text-white'
                      : theme === 'dark'
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                </button>

                <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 transition-colors ${
                      viewMode === 'grid'
                        ? theme === 'dark'
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-600 text-white'
                        : theme === 'dark'
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 transition-colors ${
                      viewMode === 'list'
                        ? theme === 'dark'
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-600 text-white'
                        : theme === 'dark'
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={exportNotes}
                  className={`p-2 rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                  title="Export notes"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  onClick={loadNotes}
                  disabled={loading}
                  className={`p-2 rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700 disabled:opacity-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-50'
                  }`}
                  title="Refresh notes"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className={`p-4 rounded-lg border ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Category Filter */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      {NOTE_CATEGORIES.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  {/* Sort Options */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Sort By
                    </label>
                    <div className="flex space-x-2">
                      <select
                        value={sortField}
                        onChange={(e) => setSortField(e.target.value as SortField)}
                        className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="lastModified">Last Modified</option>
                        <option value="dateCreated">Date Created</option>
                        <option value="reference">Reference</option>
                        <option value="category">Category</option>
                      </select>
                      <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className={`px-3 py-2 rounded-lg border transition-colors ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Quick Filters */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Quick Filters
                    </label>
                    <div className="space-y-2">
                      <button
                        onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                        className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                          showFavoritesOnly
                            ? theme === 'dark'
                              ? 'bg-yellow-600/20 border-yellow-500 text-yellow-300'
                              : 'bg-yellow-50 border-yellow-300 text-yellow-700'
                            : theme === 'dark'
                              ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Star className="w-4 h-4" fill={showFavoritesOnly ? 'currentColor' : 'none'} />
                        <span>Favorites Only</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tags Filter */}
                {getAllTags().length > 0 && (
                  <div className="mt-4">
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Filter by Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {getAllTags().map(tag => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            selectedTags.includes(tag)
                              ? theme === 'dark'
                                ? 'bg-blue-600 text-white'
                                : 'bg-blue-600 text-white'
                              : theme === 'dark'
                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clear Filters */}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                      theme === 'dark'
                        ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notes Display */}
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 400px)' }}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                <span className={`ml-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Loading notes...
                </span>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className={`w-16 h-16 mx-auto mb-4 ${
                  theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <h3 className={`text-xl font-semibold mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {notes.length === 0 ? 'No notes yet' : 'No notes match your filters'}
                </h3>
                <p className={`text-sm mb-4 ${
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  {notes.length === 0 
                    ? 'Start creating study notes to track your biblical insights'
                    : 'Try adjusting your search or filter criteria'
                  }
                </p>
                {notes.length === 0 && (
                  <button
                    onClick={() => setShowNoteModal(true)}
                    className={`px-6 py-3 rounded-lg transition-colors ${
                      theme === 'dark'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    Create Your First Note
                  </button>
                )}
              </div>
            ) : (
              <div className={`${
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                  : 'space-y-4'
              }`}>
                {filteredNotes.map(note => (
                  <div
                    key={note.id}
                    className={`rounded-lg border transition-all duration-200 hover:shadow-lg ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    } ${viewMode === 'list' ? 'flex items-start space-x-4 p-4' : 'p-5'}`}
                  >
                    {/* Color Indicator */}
                    <div 
                      className={`w-1 h-full absolute left-0 top-0 rounded-l-lg ${
                        viewMode === 'grid' ? 'relative w-full h-1 rounded-t-lg' : ''
                      }`}
                      style={{ backgroundColor: note.color }}
                    />

                    <div className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
                      {/* Note Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className={`font-semibold ${
                            theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                          }`}>
                            {note.reference}
                          </h3>
                          <p className={`text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {note.category}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleToggleFavorite(note)}
                            className={`p-1 rounded transition-colors ${
                              note.isFavorite 
                                ? 'text-yellow-500' 
                                : theme === 'dark'
                                  ? 'text-gray-600 hover:text-yellow-500'
                                  : 'text-gray-400 hover:text-yellow-500'
                            }`}
                          >
                            <Star className="w-4 h-4" fill={note.isFavorite ? 'currentColor' : 'none'} />
                          </button>
                          <button
                            onClick={() => handleEditNote(note)}
                            className={`p-1 rounded transition-colors ${
                              theme === 'dark'
                                ? 'text-gray-600 hover:text-gray-400'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className={`p-1 rounded transition-colors ${
                              theme === 'dark'
                                ? 'text-gray-600 hover:text-red-400'
                                : 'text-gray-400 hover:text-red-500'
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Note Content */}
                      <p className={`text-sm mb-3 line-clamp-3 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {note.note}
                      </p>

                      {/* Tags */}
                      {note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {note.tags.slice(0, 3).map(tag => (
                            <span
                              key={tag}
                              className={`px-2 py-1 text-xs rounded-full ${
                                theme === 'dark'
                                  ? 'bg-blue-400/20 text-blue-300'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                          {note.tags.length > 3 && (
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              theme === 'dark'
                                ? 'bg-gray-700 text-gray-400'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              +{note.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Meta Info */}
                      <div className={`flex items-center justify-between text-xs ${
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        <span>
                          {new Date(note.lastModified).toLocaleDateString()}
                        </span>
                        {note.crossReferences && note.crossReferences.length > 0 && (
                          <span className="flex items-center space-x-1">
                            <BookOpen className="w-3 h-3" />
                            <span>{note.crossReferences.length} refs</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Note Modal */}
      {showNoteModal && (
        <EnhancedNoteModal
          isOpen={showNoteModal}
          onClose={() => {
            setShowNoteModal(false);
            setSelectedNote(undefined);
          }}
          existingNote={selectedNote}
          onNoteCreated={(note) => {
            setNotes([...notes, note]);
            setSelectedNote(undefined);
          }}
          onNoteUpdated={(note) => {
            setNotes(notes.map(n => n.id === note.id ? note : n));
            setSelectedNote(undefined);
          }}
          onNoteDeleted={(noteId) => {
            setNotes(notes.filter(n => n.id !== noteId));
          }}
          theme={theme}
        />
      )}
    </>
  );
}