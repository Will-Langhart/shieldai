import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Save, Tag, BookOpen, Search, Plus, Trash2, Edit, Copy, 
  Download, Upload, Share2, Star, Calendar, Clock, User, 
  ChevronDown, ChevronRight, Filter, SortAsc, SortDesc,
  Quote, Link, RefreshCw, Globe, Palette, Heart, Eye, EyeOff
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { BibleVerse, BibleSearchResult } from '../lib/bible-fallback-service';
import { NoteData, CreateNoteData } from '../types/notes';

interface EnhancedNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  reference?: string;
  text?: string;
  existingNote?: NoteData;
  onNoteCreated?: (note: NoteData) => void;
  onNoteUpdated?: (note: NoteData) => void;
  onNoteDeleted?: (noteId: string) => void;
  theme?: 'light' | 'dark';
}

const NOTE_CATEGORIES = [
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

const NOTE_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#EC4899', // Pink
  '#6B7280'  // Gray
];

export default function EnhancedNoteModal({
  isOpen,
  onClose,
  reference = '',
  text = '',
  existingNote,
  onNoteCreated,
  onNoteUpdated,
  onNoteDeleted,
  theme = 'dark'
}: EnhancedNoteModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'note' | 'bible' | 'related' | 'history'>('note');
  const [note, setNote] = useState(existingNote?.note || '');
  const [tags, setTags] = useState<string[]>(existingNote?.tags || []);
  const [category, setCategory] = useState(existingNote?.category || NOTE_CATEGORIES[0]);
  const [visibility, setVisibility] = useState<'private' | 'public' | 'shared'>(existingNote?.visibility || 'private');
  const [color, setColor] = useState(existingNote?.color || NOTE_COLORS[0]);
  const [isFavorite, setIsFavorite] = useState(existingNote?.isFavorite || false);
  const [currentTag, setCurrentTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Bible search and verse lookup
  const [bibleSearchQuery, setBibleSearchQuery] = useState('');
  const [bibleSearchResults, setBibleSearchResults] = useState<BibleSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState('NIV');
  const [crossReferences, setCrossReferences] = useState<string[]>(existingNote?.crossReferences || []);
  const [relatedVerses, setRelatedVerses] = useState<BibleVerse[]>(existingNote?.relatedVerses || []);
  
  // History and templates
  const [showTemplates, setShowTemplates] = useState(false);
  const [noteHistory, setNoteHistory] = useState<NoteData[]>([]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadRelatedVerses();
      loadNoteHistory();
    }
  }, [isOpen, reference]);

  const loadRelatedVerses = async () => {
    if (!reference) return;
    
    try {
      const response = await fetch(`/api/bible/cross-references?reference=${encodeURIComponent(reference)}`);
      if (response.ok) {
        const data = await response.json();
        setCrossReferences(data.crossReferences || []);
      }
    } catch (error) {
      console.error('Error loading cross-references:', error);
    }
  };

  const loadNoteHistory = async () => {
    if (!user?.id || !reference) return;
    
    try {
      const response = await fetch(`/api/bible/notes/history?reference=${encodeURIComponent(reference)}&userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setNoteHistory(data.notes || []);
      }
    } catch (error) {
      console.error('Error loading note history:', error);
    }
  };

  const searchBibleVerses = async () => {
    if (!bibleSearchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch('/api/bible/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: bibleSearchQuery,
          version: selectedVersion,
          limit: 10 
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setBibleSearchResults(data);
      }
    } catch (error) {
      console.error('Error searching Bible:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const addCrossReference = (verseRef: string) => {
    if (!crossReferences.includes(verseRef)) {
      setCrossReferences([...crossReferences, verseRef]);
    }
  };

  const handleSave = async () => {
    if (!note.trim() || !user?.id) return;

    setIsSaving(true);
    try {
      const noteData: CreateNoteData = {
        ...(existingNote?.id && { id: existingNote.id }),
        reference,
        text,
        note: note.trim(),
        tags,
        category,
        visibility,
        color,
        isFavorite,
        crossReferences,
        relatedVerses
      };

      const response = await fetch('/api/bible/notes', {
        method: existingNote?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData)
      });

      if (response.ok) {
        const savedNote = await response.json();
        if (existingNote?.id) {
          onNoteUpdated?.(savedNote);
        } else {
          onNoteCreated?.(savedNote);
        }
        handleClose();
      } else {
        console.error('Failed to save note');
      }
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingNote?.id || !confirm('Are you sure you want to delete this note?')) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/bible/notes/${existingNote.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        onNoteDeleted?.(existingNote.id);
        handleClose();
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const exportNote = () => {
    const exportData = {
      reference,
      text,
      note,
      tags,
      category,
      crossReferences,
      dateCreated: existingNote?.dateCreated || new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bible-note-${reference.replace(/[^a-zA-Z0-9]/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const insertTemplate = (template: string) => {
    const templates = {
      'study': `**Main Theme:** 

**Key Insights:**
- 

**Personal Application:**
- 

**Questions for Further Study:**
- `,
      'sermon': `**Sermon Title:** 
**Pastor:** 
**Date:** ${new Date().toLocaleDateString()}

**Main Points:**
1. 

**Key Scriptures:**
- ${reference}

**Personal Takeaways:**
- `,
      'devotional': `**Date:** ${new Date().toLocaleDateString()}

**What God is Saying:**


**How This Applies to My Life:**


**Prayer:**
Lord, `,
      'apologetics': `**Question/Challenge:**


**Biblical Response:**


**Supporting Verses:**
- ${reference}

**Key Arguments:**
1. `,
    };

    setNote(templates[template as keyof typeof templates] || template);
    setShowTemplates(false);
  };

  const handleClose = () => {
    setNote(existingNote?.note || '');
    setTags(existingNote?.tags || []);
    setCategory(existingNote?.category || NOTE_CATEGORIES[0]);
    setVisibility(existingNote?.visibility || 'private');
    setColor(existingNote?.color || NOTE_COLORS[0]);
    setIsFavorite(existingNote?.isFavorite || false);
    setCurrentTag('');
    setBibleSearchQuery('');
    setBibleSearchResults(null);
    setActiveTab('note');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-4xl mx-4 rounded-2xl shadow-2xl overflow-hidden ${
        theme === 'dark' 
          ? 'bg-gray-900 border border-gray-700' 
          : 'bg-white border border-gray-200'
      }`} style={{ maxHeight: '90vh' }}>
        
        {/* Header */}
        <div className={`p-6 border-b flex items-center justify-between ${
          theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center space-x-3">
            <div 
              className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: color }}
            />
            <BookOpen className={`w-6 h-6 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
            <div>
              <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {existingNote ? 'Edit Study Note' : 'Create Study Note'}
              </h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {reference || 'Bible Study Notes'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`p-2 rounded-lg transition-colors ${
                isFavorite 
                  ? 'text-yellow-500 bg-yellow-500/10' 
                  : theme === 'dark' 
                    ? 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-500/10' 
                    : 'text-gray-500 hover:text-yellow-500 hover:bg-yellow-50'
              }`}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
            {existingNote && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-red-400 hover:bg-red-400/10'
                    : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                }`}
                title="Delete note"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={exportNote}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="Export note"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={handleClose}
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

        {/* Tabs */}
        <div className={`flex border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          {[
            { id: 'note', label: 'Note', icon: Edit },
            { id: 'bible', label: 'Bible Search', icon: Search },
            { id: 'related', label: 'Cross References', icon: Link },
            { id: 'history', label: 'History', icon: Clock }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-3 transition-colors ${
                  activeTab === tab.id
                    ? theme === 'dark'
                      ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-400/5'
                      : 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : theme === 'dark'
                      ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {activeTab === 'note' && (
            <div className="space-y-6">
              {/* Verse Reference */}
              {reference && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Bible Reference
                  </label>
                  <div className={`p-4 rounded-lg border ${
                    theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {reference}
                    </p>
                    <p className={`text-sm mt-1 italic ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      "{text}"
                    </p>
                  </div>
                </div>
              )}

              {/* Note Template Selector */}
              <div className="flex items-center justify-between">
                <label className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Your Study Note
                </label>
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'text-blue-400 bg-blue-400/10 hover:bg-blue-400/20'
                      : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                  }`}
                >
                  Templates
                </button>
              </div>

              {/* Template Dropdown */}
              {showTemplates && (
                <div className={`rounded-lg border p-3 ${
                  theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'study', name: 'Bible Study' },
                      { id: 'sermon', name: 'Sermon Notes' },
                      { id: 'devotional', name: 'Devotional' },
                      { id: 'apologetics', name: 'Apologetics' }
                    ].map(template => (
                      <button
                        key={template.id}
                        onClick={() => insertTemplate(template.id)}
                        className={`text-sm p-2 rounded-lg text-left transition-colors ${
                          theme === 'dark'
                            ? 'text-gray-300 hover:bg-gray-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {template.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Note Textarea */}
              <div>
                <textarea
                  ref={textareaRef}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Write your thoughts, insights, or questions about this verse..."
                  className={`w-full h-48 px-4 py-3 rounded-lg border resize-none transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                />
              </div>

              {/* Metadata Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  >
                    {NOTE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Visibility */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Visibility
                  </label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  >
                    <option value="private">Private</option>
                    <option value="shared">Shared</option>
                    <option value="public">Public</option>
                  </select>
                </div>

                {/* Color */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Color
                  </label>
                  <div className="flex space-x-2">
                    {NOTE_COLORS.map(noteColor => (
                      <button
                        key={noteColor}
                        onClick={() => setColor(noteColor)}
                        className={`w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 ${
                          color === noteColor ? 'border-white shadow-lg' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: noteColor }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <Tag className="w-4 h-4 inline mr-1" />
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                        theme === 'dark'
                          ? 'bg-blue-400/20 text-blue-300'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-2 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    placeholder="Add a tag"
                    className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  />
                  <button
                    onClick={addTag}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      theme === 'dark'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bible' && (
            <div className="space-y-6">
              {/* Bible Search */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Search Bible Verses
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={bibleSearchQuery}
                    onChange={(e) => setBibleSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchBibleVerses()}
                    placeholder="Search for verses, keywords, or topics..."
                    className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  />
                  <select
                    value={selectedVersion}
                    onChange={(e) => setSelectedVersion(e.target.value)}
                    className={`px-3 py-2 rounded-lg border transition-colors ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="NIV">NIV</option>
                    <option value="ESV">ESV</option>
                    <option value="KJV">KJV</option>
                    <option value="NASB">NASB</option>
                  </select>
                  <button
                    onClick={searchBibleVerses}
                    disabled={isSearching}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      theme === 'dark'
                        ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                        : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                    }`}
                  >
                    {isSearching ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Search Results */}
              {bibleSearchResults && (
                <div>
                  <h4 className={`font-medium mb-3 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Search Results ({bibleSearchResults.total} found)
                  </h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {bibleSearchResults.verses.map((verse, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          theme === 'dark'
                            ? 'bg-gray-800 border-gray-700 hover:bg-gray-750'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                        onClick={() => addCrossReference(verse.reference)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`font-medium ${
                              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                            }`}>
                              {verse.reference}
                            </p>
                            <p className={`mt-1 ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              {verse.text}
                            </p>
                          </div>
                          <Plus className={`w-5 h-5 ml-2 ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'related' && (
            <div className="space-y-6">
              <div>
                <h4 className={`font-medium mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Cross References
                </h4>
                {crossReferences.length > 0 ? (
                  <div className="space-y-2">
                    {crossReferences.map((ref, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          theme === 'dark'
                            ? 'bg-gray-800 border-gray-700'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <span className={`font-medium ${
                          theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                        }`}>
                          {ref}
                        </span>
                        <button
                          onClick={() => setCrossReferences(crossReferences.filter(r => r !== ref))}
                          className={`text-red-500 hover:text-red-600`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-center py-8 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    No cross-references found. Use the Bible Search tab to add related verses.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <div>
                <h4 className={`font-medium mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Note History
                </h4>
                {noteHistory.length > 0 ? (
                  <div className="space-y-3">
                    {noteHistory.map((historicalNote, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${
                          theme === 'dark'
                            ? 'bg-gray-800 border-gray-700'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {new Date(historicalNote.lastModified).toLocaleDateString()}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            theme === 'dark'
                              ? 'bg-blue-400/20 text-blue-300'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {historicalNote.category}
                          </span>
                        </div>
                        <p className={`text-sm line-clamp-3 ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {historicalNote.note}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-center py-8 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    No previous notes for this verse.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-6 border-t flex items-center justify-between ${
          theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center space-x-4">
            <span className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {existingNote ? 'Last modified: ' + new Date(existingNote.lastModified).toLocaleDateString() : 'Creating new note'}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              className={`px-4 py-2 transition-colors ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!note.trim() || isSaving}
              className={`px-6 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                theme === 'dark'
                  ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                  : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
              } disabled:cursor-not-allowed`}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{existingNote ? 'Update Note' : 'Save Note'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}