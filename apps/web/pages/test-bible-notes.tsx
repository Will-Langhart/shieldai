import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useAuth } from '../lib/auth-context';
import BibleStudyTools from '../components/BibleStudyTools';
import NotesManager from '../components/NotesManager';
import EnhancedNoteModal from '../components/EnhancedNoteModal';
import { NoteData } from '../types/notes';

const TestBibleNotes: NextPage = () => {
  const { user } = useAuth();
  const [selectedReference, setSelectedReference] = useState('John 3:16');
  const [selectedVerse, setSelectedVerse] = useState('For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.');
  const [showNotesManager, setShowNotesManager] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<NoteData | undefined>();
  const [activeTab, setActiveTab] = useState<'study' | 'manager' | 'modal'>('study');

  const handleVerseSelect = (reference: string, text: string) => {
    setSelectedReference(reference);
    setSelectedVerse(text);
  };

  const handleNoteSelect = (note: NoteData) => {
    setSelectedNote(note);
    setShowNoteModal(true);
  };

  const handleNoteEdit = (note: NoteData) => {
    setSelectedNote(note);
    setShowNoteModal(true);
  };

  const handleNoteDelete = (noteId: string) => {
    console.log('Note deleted:', noteId);
    // Refresh the notes manager if it's open
    if (showNotesManager) {
      // The NotesManager will handle its own refresh
    }
  };

  const handleNoteCreated = (note: NoteData) => {
    console.log('Note created:', note);
    // Refresh the study tools if they're open
    if (activeTab === 'study') {
      // The BibleStudyTools will handle its own refresh
    }
  };

  const handleNoteUpdated = (note: NoteData) => {
    console.log('Note updated:', note);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Please sign in to test Bible Notes
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You need to be authenticated to access the Bible notes features.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Bible Notes Test - Shield AI</title>
        <meta name="description" content="Test the enhanced Bible notes functionality" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Bible Notes Test
                </h1>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Testing enhanced notes functionality
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Logged in as: {user.email}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('study')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'study'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Study Tools
              </button>
              <button
                onClick={() => setActiveTab('manager')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'manager'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Notes Manager
              </button>
              <button
                onClick={() => setActiveTab('modal')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'modal'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Note Modal
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Current Verse Display */}
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Current Verse
            </h2>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Reference: <span className="font-medium text-gray-900 dark:text-white">{selectedReference}</span>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                "{selectedVerse}"
              </p>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'study' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Bible Study Tools
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Test the enhanced study tools with notes, concordance, and cross-references.
                </p>
                <BibleStudyTools
                  reference={selectedReference}
                  onVerseSelect={handleVerseSelect}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {activeTab === 'manager' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Notes Manager
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Manage all your Bible notes with advanced filtering, searching, and organization features.
                </p>
                <NotesManager
                  className="w-full"
                  onNoteSelect={handleNoteSelect}
                  onNoteEdit={handleNoteEdit}
                  onNoteDelete={handleNoteDelete}
                />
              </div>
            </div>
          )}

          {activeTab === 'modal' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Enhanced Note Modal
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Test the enhanced note creation and editing modal with advanced features.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => {
                        setSelectedNote(undefined);
                        setShowNoteModal(true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create New Note
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedNote({
                          id: 'test-note',
                          reference: selectedReference,
                          text: selectedVerse,
                          note: 'This is a test note for demonstration purposes.',
                          tags: ['test', 'demo', 'bible'],
                          category: 'Personal Study',
                          visibility: 'private',
                          dateCreated: new Date().toISOString(),
                          lastModified: new Date().toISOString(),
                          userId: user.id,
                          color: '#3B82F6',
                          isFavorite: false,
                          crossReferences: [],
                          relatedVerses: []
                        });
                        setShowNoteModal(true);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Edit Test Note
                    </button>
                  </div>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>• Click "Create New Note" to test note creation</p>
                    <p>• Click "Edit Test Note" to test note editing</p>
                    <p>• The modal includes advanced features like categories, tags, visibility, and more</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Note Modal */}
        {showNoteModal && (
          <EnhancedNoteModal
            isOpen={showNoteModal}
            onClose={() => {
              setShowNoteModal(false);
              setSelectedNote(undefined);
            }}
            reference={selectedReference}
            text={selectedVerse}
            existingNote={selectedNote}
            onNoteCreated={handleNoteCreated}
            onNoteUpdated={handleNoteUpdated}
            onNoteDeleted={handleNoteDelete}
            theme="dark"
          />
        )}
      </div>
    </>
  );
};

export default TestBibleNotes;
