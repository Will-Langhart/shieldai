import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Search, Link, Edit, FileText, Plus, Tag, 
  Star, Calendar, Clock, User, ChevronDown, ChevronRight,
  Save, Trash2, Eye, EyeOff, Share2, Download
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';

interface BibleStudyToolsProps {
  reference: string;
  onVerseSelect?: (reference: string, text: string) => void;
  className?: string;
}

interface ConcordanceEntry {
  word: string;
  count: number;
  references: string[];
}

interface CrossReference {
  reference: string;
  text: string;
  relevance: string;
}

interface StudySession {
  id: string;
  session_name: string;
  verse_references: string[];
  notes: string;
  created_at: string;
  updated_at: string;
}

interface StudyNote {
  id: string;
  reference: string;
  note: string;
  timestamp: string;
  tags: string[];
  category?: string;
  visibility?: string;
  color?: string;
  isFavorite?: boolean;
}

export default function BibleStudyTools({ reference, onVerseSelect, className = '' }: BibleStudyToolsProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'concordance' | 'crossrefs' | 'notes' | 'outline'>('concordance');
  const [concordanceData, setConcordanceData] = useState<ConcordanceEntry[]>([]);
  const [crossReferences, setCrossReferences] = useState<CrossReference[]>([]);
  const [studyNotes, setStudyNotes] = useState<StudyNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Notes state
  const [newNote, setNewNote] = useState('');
  const [noteTags, setNoteTags] = useState('');
  const [noteCategory, setNoteCategory] = useState('Personal Study');
  const [noteVisibility, setNoteVisibility] = useState<'private' | 'shared' | 'public'>('private');
  const [noteColor, setNoteColor] = useState('#3B82F6');
  const [isNoteFavorite, setIsNoteFavorite] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  // Auto-save settings
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [autoSaveDelay, setAutoSaveDelay] = useState(2000);

  useEffect(() => {
    if (reference && user?.id) {
      loadStudyData();
    }
  }, [reference, user?.id]);

  const loadStudyData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      switch (activeTab) {
        case 'concordance':
          await loadConcordance();
          break;
        case 'crossrefs':
          await loadCrossReferences();
          break;
        case 'notes':
          await loadStudyNotes();
          break;
      }
    } catch (error) {
      console.error('Error loading study data:', error);
      setError('Failed to load study data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadConcordance = async () => {
    try {
      const response = await fetch(`/api/bible/concordance?reference=${encodeURIComponent(reference)}`);
      if (response.ok) {
        const data = await response.json();
        setConcordanceData(data.concordance || []);
      }
    } catch (error) {
      console.error('Error loading concordance:', error);
    }
  };

  const loadCrossReferences = async () => {
    try {
      const response = await fetch(`/api/bible/cross-references?reference=${encodeURIComponent(reference)}`);
      if (response.ok) {
        const data = await response.json();
        setCrossReferences(data.crossReferences || []);
      }
    } catch (error) {
      console.error('Error loading cross references:', error);
    }
  };

  const loadStudyNotes = async () => {
    try {
      if (!user?.id) {
        setStudyNotes([]);
        return;
      }

      const response = await fetch(`/api/bible/notes?reference=${encodeURIComponent(reference)}&userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setStudyNotes(data.notes || []);
      } else {
        console.error('Failed to load notes:', response.statusText);
        setError('Failed to load notes');
      }
    } catch (error) {
      console.error('Error loading study notes:', error);
      setError('Failed to load notes');
      setStudyNotes([]);
    }
  };

  const addStudyNote = async () => {
    if (!newNote.trim() || !user?.id) return;

    setIsSaving(true);
    setSaveStatus('saving');

    const noteData = {
      reference: reference,
      text: '', // Will be populated from the verse context
      note: newNote.trim(),
      tags: noteTags.split(',').map(tag => tag.trim()).filter(tag => tag),
      category: noteCategory,
      visibility: noteVisibility,
      color: noteColor,
      isFavorite: isNoteFavorite,
      crossReferences: [],
      relatedVerses: [],
      userId: user.id
    };

    try {
      const response = await fetch('/api/bible/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData)
      });

      if (response.ok) {
        const savedNote = await response.json();
        setStudyNotes(prevNotes => [savedNote, ...prevNotes]);
        setNewNote('');
        setNoteTags('');
        setSaveStatus('saved');
        
        // Reset save status after 3 seconds
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        const errorData = await response.json();
        console.error('Failed to save note:', errorData);
        setSaveStatus('error');
        setError('Failed to save note');
      }
    } catch (error) {
      console.error('Error adding study note:', error);
      setSaveStatus('error');
      setError('Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  const updateStudyNote = async (noteId: string, updatedData: Partial<StudyNote>) => {
    if (!user?.id) return;

    try {
      const response = await fetch('/api/bible/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: noteId,
          reference,
          text: '',
          note: updatedData.note,
          tags: updatedData.tags || [],
          category: updatedData.category || 'Personal Study',
          visibility: updatedData.visibility || 'private',
          color: updatedData.color || '#3B82F6',
          isFavorite: updatedData.isFavorite || false,
          crossReferences: [],
          relatedVerses: [],
          userId: user.id
        })
      });

      if (response.ok) {
        const updatedNote = await response.json();
        setStudyNotes(prevNotes => 
          prevNotes.map(note => 
            note.id === noteId ? updatedNote : note
          )
        );
      }
    } catch (error) {
      console.error('Error updating note:', error);
      setError('Failed to update note');
    }
  };

  const deleteStudyNote = async (noteId: string) => {
    if (!user?.id || !confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(`/api/bible/notes?noteId=${noteId}&userId=${user.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setStudyNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      setError('Failed to delete note');
    }
  };

  // Auto-save note as user types (with debounce)
  useEffect(() => {
    if (!autoSaveEnabled || !user?.id || !newNote.trim()) return;

    const timeoutId = setTimeout(() => {
      const noteData = {
        reference: reference,
        text: '',
        note: newNote.trim(),
        tags: noteTags.split(',').map(tag => tag.trim()).filter(tag => tag),
        category: noteCategory,
        visibility: noteVisibility,
        color: noteColor,
        isFavorite: isNoteFavorite,
        crossReferences: [],
        relatedVerses: [],
        userId: user.id
      };

      fetch('/api/bible/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData)
      }).then(response => {
        if (response.ok) {
          console.log('Note auto-saved');
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        }
      }).catch(error => {
        console.error('Error auto-saving note:', error);
        setSaveStatus('error');
      });
    }, autoSaveDelay);

    return () => clearTimeout(timeoutId);
  }, [newNote, noteTags, noteCategory, noteVisibility, noteColor, isNoteFavorite, autoSaveEnabled, user?.id, reference, autoSaveDelay]);

  const handleVerseSelect = (ref: string, text: string) => {
    if (onVerseSelect) {
      onVerseSelect(ref, text);
    }
  };

  const tabs = [
    { id: 'concordance', label: 'Concordance', icon: Search },
    { id: 'crossrefs', label: 'Cross-Refs', icon: Link },
    { id: 'notes', label: 'Study Notes', icon: Edit },
    { id: 'outline', label: 'Outline', icon: FileText },
  ];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2 mb-4">
          <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Bible Study Tools
          </h3>
        </div>

        {/* Reference */}
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Studying: <span className="font-medium text-gray-900 dark:text-white">{reference}</span>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
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
              onClick={loadStudyData}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Concordance Tab */}
            {activeTab === 'concordance' && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Key Words in {reference}
                </h5>
                {concordanceData.length > 0 ? (
                  <div className="space-y-3">
                    {concordanceData.map((entry, index) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900 dark:text-white">{entry.word}</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {entry.count} occurrence{entry.count !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {entry.references.slice(0, 3).join(', ')}
                          {entry.references.length > 3 && '...'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No concordance data available</p>
                  </div>
                )}
              </div>
            )}

            {/* Cross References Tab */}
            {activeTab === 'crossrefs' && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Cross References for {reference}
                </h5>
                {crossReferences.length > 0 ? (
                  <div className="space-y-3">
                    {crossReferences.map((crossRef, index) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <button
                            onClick={() => handleVerseSelect(crossRef.reference, crossRef.text)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                          >
                            {crossRef.reference}
                          </button>
                          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {crossRef.relevance}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          "{crossRef.text}"
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Link className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No cross references found</p>
                  </div>
                )}
              </div>
            )}

            {/* Study Notes Tab */}
            {activeTab === 'notes' && (
              <div>
                <div className="mb-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Edit className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Study Notes for {reference}
                    </h5>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                    <h6 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                      ✨ Quick Note Creation
                    </h6>
                    <p className="text-xs text-blue-600 dark:text-blue-300 mb-3">
                      Add your insights, questions, or reflections about this verse. Notes auto-save as you type!
                    </p>
                    
                    {/* Note Form */}
                    <div className="space-y-3">
                      <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Write your thoughts, insights, or questions about this verse..."
                        className="w-full p-3 border border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500"
                        rows={4}
                      />
                      
                      {/* Note Options */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={noteTags}
                          onChange={(e) => setNoteTags(e.target.value)}
                          placeholder="Tags: salvation, faith, grace (optional)"
                          className="p-2 border border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                        
                        <select
                          value={noteCategory}
                          onChange={(e) => setNoteCategory(e.target.value)}
                          className="p-2 border border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        >
                          <option value="Personal Study">Personal Study</option>
                          <option value="Sermon Notes">Sermon Notes</option>
                          <option value="Prayer Requests">Prayer Requests</option>
                          <option value="Devotional">Devotional</option>
                          <option value="Apologetics">Apologetics</option>
                          <option value="Theology">Theology</option>
                          <option value="Life Application">Life Application</option>
                          <option value="Questions">Questions</option>
                          <option value="Insights">Insights</option>
                          <option value="Cross References">Cross References</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <select
                            value={noteVisibility}
                            onChange={(e) => setNoteVisibility(e.target.value as any)}
                            className="p-2 border border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          >
                            <option value="private">Private</option>
                            <option value="shared">Shared</option>
                            <option value="public">Public</option>
                          </select>
                          
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={noteColor}
                              onChange={(e) => setNoteColor(e.target.value)}
                              className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600"
                            />
                            <button
                              onClick={() => setIsNoteFavorite(!isNoteFavorite)}
                              className={`p-2 rounded-lg transition-colors ${
                                isNoteFavorite 
                                  ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20' 
                                  : 'text-gray-400 hover:text-yellow-600'
                              }`}
                            >
                              <Star className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {saveStatus === 'saving' && (
                            <span className="text-sm text-blue-600 dark:text-blue-400">Saving...</span>
                          )}
                          {saveStatus === 'saved' && (
                            <span className="text-sm text-green-600 dark:text-green-400">Saved!</span>
                          )}
                          {saveStatus === 'error' && (
                            <span className="text-sm text-red-600 dark:text-red-400">Error</span>
                          )}
                          
                          <button
                            onClick={addStudyNote}
                            disabled={!newNote.trim() || isSaving}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                          >
                            <Save className="w-4 h-4" />
                            <span>Save Note</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Your Study Notes
                    </h5>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {studyNotes.length} note{studyNotes.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {studyNotes.length > 0 ? (
                    <div className="space-y-4">
                      {studyNotes.map((note) => (
                        <div key={note.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                {new Date(note.timestamp).toLocaleDateString()}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(note.timestamp).toLocaleTimeString()}
                              </span>
                              {note.category && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                                  {note.category}
                                </span>
                              )}
                              {note.isFavorite && (
                                <Star className="w-4 h-4 text-yellow-600" />
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  // TODO: Add edit functionality
                                  console.log('Edit note:', note.id);
                                }}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteStudyNote(note.id)}
                                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                            {note.note}
                          </p>
                          
                          {note.tags && note.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {note.tags.map((tag, tagIndex) => (
                                <span
                                  key={tagIndex}
                                  className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Edit className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No study notes yet</p>
                      <p className="text-xs mt-1">Add your first note above!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Outline Tab */}
            {activeTab === 'outline' && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Chapter Outline
                </h5>
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Chapter outline feature coming soon...</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 