import React, { useState, useEffect } from 'react';
import { BookOpen, Search, FileText, Link, Bookmark, Edit, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
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
}

export default function BibleStudyTools({ reference, onVerseSelect, className = '' }: BibleStudyToolsProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'concordance' | 'crossrefs' | 'notes' | 'outline'>('concordance');
  const [concordanceData, setConcordanceData] = useState<ConcordanceEntry[]>([]);
  const [crossReferences, setCrossReferences] = useState<CrossReference[]>([]);
  const [studyNotes, setStudyNotes] = useState<StudyNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [noteTags, setNoteTags] = useState('');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  useEffect(() => {
    if (reference) {
      loadStudyData();
    }
  }, [reference, activeTab]);

  const loadStudyData = async () => {
    setIsLoading(true);
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
        case 'outline':
          // Outline data would be loaded here
          break;
      }
    } catch (error) {
      console.error('Error loading study data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConcordance = async () => {
    try {
      const response = await fetch(`/api/bible/concordance?reference=${encodeURIComponent(reference)}`);
      const data = await response.json();
      setConcordanceData(data.entries || []);
    } catch (error) {
      console.error('Error loading concordance:', error);
      // Mock data for demonstration
      setConcordanceData([
        { word: 'love', count: 5, references: ['John 3:16', '1 John 4:8', 'Romans 5:8'] },
        { word: 'faith', count: 3, references: ['Hebrews 11:1', 'Romans 10:17', 'James 2:17'] },
        { word: 'grace', count: 2, references: ['Ephesians 2:8', '2 Corinthians 12:9'] },
      ]);
    }
  };

  const loadCrossReferences = async () => {
    try {
      const response = await fetch(`/api/bible/crossrefs?reference=${encodeURIComponent(reference)}`);
      const data = await response.json();
      setCrossReferences(data.references || []);
    } catch (error) {
      console.error('Error loading cross-references:', error);
      // Mock data for demonstration
      setCrossReferences([
        { reference: 'John 3:16', text: 'For God so loved the world...', relevance: 'Similar theme of God\'s love' },
        { reference: 'Romans 5:8', text: 'But God demonstrates his own love...', relevance: 'God\'s love demonstrated' },
        { reference: '1 John 4:19', text: 'We love because he first loved us', relevance: 'Response to God\'s love' },
      ]);
    }
  };

  const loadStudyNotes = async () => {
    try {
      if (!user?.id) {
        setStudyNotes([]);
        return;
      }

      const response = await fetch(`/api/bible/notes?reference=${encodeURIComponent(reference)}&userId=${user.id}`);
      const data = await response.json();
      setStudyNotes(data.notes || []);
    } catch (error) {
      console.error('Error loading study notes:', error);
      setStudyNotes([]);
    }
  };

  const addStudyNote = async () => {
    if (!newNote.trim() || !user?.id) return;

    const noteData = {
      reference: reference,
      note: newNote,
      tags: noteTags.split(',').map(tag => tag.trim()).filter(tag => tag),
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
        setStudyNotes([...studyNotes, savedNote]);
        setNewNote('');
        setNoteTags('');
      }
    } catch (error) {
      console.error('Error adding study note:', error);
    }
  };

  // Auto-save note as user types (with debounce)
  useEffect(() => {
    if (!autoSaveEnabled || !user?.id || !newNote.trim()) return;

    const timeoutId = setTimeout(() => {
      const noteData = {
        reference: reference,
        note: newNote,
        tags: noteTags.split(',').map(tag => tag.trim()).filter(tag => tag),
        userId: user.id
      };

      fetch('/api/bible/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData)
      }).then(response => {
        if (response.ok) {
          console.log('Note auto-saved');
        }
      }).catch(error => {
        console.error('Error auto-saving note:', error);
      });
    }, 2000); // Auto-save after 2 seconds of no typing

    return () => clearTimeout(timeoutId);
  }, [newNote, noteTags, autoSaveEnabled, user?.id, reference]);

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
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Reference: {reference}
          </h4>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
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
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading...</span>
          </div>
        )}

        {!isLoading && (
          <>
            {/* Concordance Tab */}
            {activeTab === 'concordance' && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Key Words in {reference}
                </h5>
                <div className="space-y-3">
                  {concordanceData.map((entry, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {entry.word}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {entry.count} occurrences
                        </span>
                      </div>
                      <div className="space-y-1">
                        {entry.references.map((ref, refIndex) => (
                          <button
                            key={refIndex}
                            onClick={() => handleVerseSelect(ref, '')}
                            className="block text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-left"
                          >
                            {ref}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cross-References Tab */}
            {activeTab === 'crossrefs' && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Related Verses
                </h5>
                <div className="space-y-3">
                  {crossReferences.map((crossRef, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <button
                          onClick={() => handleVerseSelect(crossRef.reference, crossRef.text)}
                          className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
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
              </div>
            )}

            {/* Study Notes Tab */}
            {activeTab === 'notes' && (
              <div>
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Add Study Note
                  </h5>
                  <div className="space-y-3">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add your study note here..."
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                      rows={3}
                    />
                    <input
                      type="text"
                      value={noteTags}
                      onChange={(e) => setNoteTags(e.target.value)}
                      placeholder="Tags (comma-separated): salvation, faith, grace"
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={addStudyNote}
                      disabled={!newNote.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      Add Note
                    </button>
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Your Notes
                  </h5>
                  <div className="space-y-3">
                    {studyNotes.map((note) => (
                      <div key={note.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(note.timestamp).toLocaleDateString()}
                          </span>
                          <div className="flex space-x-1">
                            {note.tags.map((tag, tagIndex) => (
                              <span
                                key={tagIndex}
                                className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {note.note}
                        </p>
                      </div>
                    ))}
                  </div>
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