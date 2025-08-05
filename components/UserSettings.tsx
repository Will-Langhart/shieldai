import React, { useState, useEffect, useRef } from 'react';
import { X, User, Mail, Shield, Palette, Bell, Download, Trash2, Save, Upload, Camera, CreditCard, BookOpen, Heart, History, Settings, Edit } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import SubscriptionStatus from './SubscriptionStatus';
import SubscriptionModal from './SubscriptionModal';

interface UserSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserSettings({ isOpen, onClose }: UserSettingsProps) {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [subscription, setSubscription] = useState<any>(null);
  const [isInTrial, setIsInTrial] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [preferences, setPreferences] = useState({
    theme: 'dark',
    notifications: true,
    autoSave: true,
    defaultMode: 'fast',
    bibleDefaultVersion: 'de4e12af7f28f599-02', // NIV
    bibleSearchHistory: true,
    bibleAutoSaveNotes: true
  });
  const [bibleFavorites, setBibleFavorites] = useState<Array<{ reference: string; text: string; version: string; created_at: string }>>([]);
  const [bibleHistory, setBibleHistory] = useState<Array<{ query: string; created_at: string }>>([]);
  const [bibleNotes, setBibleNotes] = useState<Array<{ id: string; reference: string; note: string; tags: string[]; created_at: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && isOpen) {
      loadUserData();
      loadSubscriptionData();
      loadBibleData();
    }
  }, [user, isOpen]);

  const loadUserData = async () => {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profile) {
        setFullName(profile.full_name || '');
        setEmail(profile.email || user?.email || '');
        setAvatarUrl(profile.avatar_url || '');
        setPreferences(profile.preferences || preferences);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadSubscriptionData = async () => {
    try {
      const response = await fetch('/api/subscriptions/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
        setIsInTrial(data.isInTrial);
        setHasActiveSubscription(data.hasActiveSubscription);
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
    }
  };

  const loadBibleData = async () => {
    if (!user) return;
    
    try {
      // Load Bible favorites
      const { data: favorites } = await supabase
        .from('bible_favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (favorites) {
        setBibleFavorites(favorites);
      }

      // Load Bible search history
      const { data: history } = await supabase
        .from('bible_search_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (history) {
        setBibleHistory(history);
      }

      // Load Bible notes
      const { data: notes } = await supabase
        .from('bible_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (notes) {
        setBibleNotes(notes);
      }
    } catch (error) {
      console.error('Error loading Bible data:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          full_name: fullName,
          avatar_url: avatarUrl,
          preferences
        });

      if (error) throw error;
      
      // Show success message
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setAvatarUrl(publicUrl);
      
      // Update user profile
      await supabase
        .from('users')
        .upsert({
          id: user.id,
          avatar_url: publicUrl
        });

      alert('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleExportData = async () => {
    try {
      const { data: conversations } = await supabase
        .from('conversations')
        .select(`
          *,
          messages (*)
        `)
        .eq('user_id', user?.id);

      const dataStr = JSON.stringify(conversations, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `shieldai-data-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error exporting data. Please try again.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete user data
      await supabase.from('conversations').delete().eq('user_id', user?.id);
      await supabase.from('users').delete().eq('id', user?.id);
      
      // Sign out
      await signOut();
      onClose();
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Error deleting account. Please try again.');
    }
  };

  const handleUpgradeSubscription = () => {
    setShowSubscriptionModal(true);
  };

  const handleRemoveBibleFavorite = async (reference: string) => {
    if (!user) return;
    
    try {
      await supabase
        .from('bible_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('reference', reference);
      
      setBibleFavorites(prev => prev.filter(fav => fav.reference !== reference));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const handleClearBibleHistory = async () => {
    if (!user) return;
    
    try {
      await supabase
        .from('bible_search_history')
        .delete()
        .eq('user_id', user.id);
      
      setBibleHistory([]);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  const handleDeleteBibleNote = async (noteId: string) => {
    if (!user) return;
    
    try {
      await supabase
        .from('bible_notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', user.id);
      
      setBibleNotes(prev => prev.filter(note => note.id !== noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'bible', label: 'Bible Settings', icon: BookOpen },
    { id: 'data', label: 'Data & Privacy', icon: Shield }
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-shield-gray/95 backdrop-blur-sm border border-gray-700/50 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
            <h2 className="text-2xl font-bold text-shield-white">User Settings</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-shield-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex h-[calc(90vh-120px)]">
            {/* Sidebar */}
            <div className="w-64 border-r border-gray-700/50 bg-shield-light-gray/20">
              <nav className="p-4">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                        activeTab === tab.id
                          ? 'bg-shield-blue text-shield-white'
                          : 'text-gray-300 hover:bg-shield-light-gray/30'
                      }`}
                    >
                      <Icon size={18} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-shield-white mb-4">Profile Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-4 py-3 bg-shield-light-gray/50 border border-gray-600/50 rounded-lg text-shield-white placeholder-gray-400 focus:outline-none focus:border-shield-blue/50 transition-colors"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-shield-light-gray/50 border border-gray-600/50 rounded-lg text-shield-white placeholder-gray-400 focus:outline-none focus:border-shield-blue/50 transition-colors"
                        placeholder="Enter your email"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Profile Picture</label>
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-shield-blue/20 border border-shield-blue/30 rounded-full flex items-center justify-center overflow-hidden">
                          {avatarUrl ? (
                            <img 
                              src={avatarUrl} 
                              alt="Profile" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-shield-blue font-bold text-xl">
                              {user?.email?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <button
                            onClick={handleUploadClick}
                            disabled={uploading}
                            className="flex items-center space-x-2 px-4 py-2 bg-shield-blue text-shield-white rounded-lg hover:bg-shield-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Camera size={16} />
                            <span>{uploading ? 'Uploading...' : 'Upload Photo'}</span>
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            JPG, PNG, GIF, or WebP up to 5MB
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Avatar URL (Alternative)</label>
                      <input
                        type="url"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        className="w-full px-4 py-3 bg-shield-light-gray/50 border border-gray-600/50 rounded-lg text-shield-white placeholder-gray-400 focus:outline-none focus:border-shield-blue/50 transition-colors"
                        placeholder="Enter avatar URL (optional)"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Or enter a direct URL to an image
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="w-full py-3 bg-shield-blue text-shield-white rounded-lg font-medium hover:bg-shield-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <Save size={18} />
                    <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              )}

              {activeTab === 'subscription' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-shield-white mb-4">Subscription Management</h3>
                  
                  <div className="bg-shield-light-gray/20 rounded-lg p-6">
                    <SubscriptionStatus
                      subscription={subscription}
                      isInTrial={isInTrial}
                      hasActiveSubscription={hasActiveSubscription}
                      onUpgrade={handleUpgradeSubscription}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-shield-white mb-4">Preferences</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Theme</label>
                      <select
                        value={preferences.theme}
                        onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                        className="w-full px-4 py-3 bg-shield-light-gray/50 border border-gray-600/50 rounded-lg text-shield-white focus:outline-none focus:border-shield-blue/50 transition-colors"
                      >
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                        <option value="auto">Auto</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Default Response Mode</label>
                      <select
                        value={preferences.defaultMode}
                        onChange={(e) => setPreferences({ ...preferences, defaultMode: e.target.value })}
                        className="w-full px-4 py-3 bg-shield-light-gray/50 border border-gray-600/50 rounded-lg text-shield-white focus:outline-none focus:border-shield-blue/50 transition-colors"
                      >
                        <option value="fast">Fast</option>
                        <option value="accurate">Accurate</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-300">Notifications</label>
                          <p className="text-xs text-gray-400">Receive email notifications</p>
                        </div>
                        <button
                          onClick={() => setPreferences({ ...preferences, notifications: !preferences.notifications })}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            preferences.notifications ? 'bg-shield-blue' : 'bg-gray-600'
                          }`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                            preferences.notifications ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-300">Auto-save conversations</label>
                          <p className="text-xs text-gray-400">Automatically save chat history</p>
                        </div>
                        <button
                          onClick={() => setPreferences({ ...preferences, autoSave: !preferences.autoSave })}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            preferences.autoSave ? 'bg-shield-blue' : 'bg-gray-600'
                          }`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                            preferences.autoSave ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'bible' && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <BookOpen className="w-6 h-6 text-shield-blue" />
                    <h3 className="text-xl font-semibold text-shield-white">Bible Study Settings</h3>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Bible Preferences */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <Settings className="w-5 h-5 text-shield-blue" />
                        <h4 className="text-lg font-medium text-shield-white">Study Preferences</h4>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Default Bible Version</label>
                        <select
                          value={preferences.bibleDefaultVersion}
                          onChange={(e) => setPreferences({ ...preferences, bibleDefaultVersion: e.target.value })}
                          className="w-full px-4 py-3 bg-shield-light-gray/50 border border-gray-600/50 rounded-lg text-shield-white focus:outline-none focus:border-shield-blue/50 transition-colors"
                        >
                          <option value="de4e12af7f28f599-02">NIV - New International Version</option>
                          <option value="65eec8e0b60e656b-01">KJV - King James Version</option>
                          <option value="f421fe261da7624f-01">ESV - English Standard Version</option>
                          <option value="9879dbb7cfe39e4d-01">NLT - New Living Translation</option>
                          <option value="c315fa9f71d94af9-01">NKJV - New King James Version</option>
                        </select>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-gray-300">Save search history</label>
                            <p className="text-xs text-gray-400">Remember your Bible searches</p>
                          </div>
                          <button
                            onClick={() => setPreferences({ ...preferences, bibleSearchHistory: !preferences.bibleSearchHistory })}
                            className={`w-12 h-6 rounded-full transition-colors ${
                              preferences.bibleSearchHistory ? 'bg-shield-blue' : 'bg-gray-600'
                            }`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                              preferences.bibleSearchHistory ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-gray-300">Auto-save study notes</label>
                            <p className="text-xs text-gray-400">Automatically save your Bible study notes</p>
                          </div>
                          <button
                            onClick={() => setPreferences({ ...preferences, bibleAutoSaveNotes: !preferences.bibleAutoSaveNotes })}
                            className={`w-12 h-6 rounded-full transition-colors ${
                              preferences.bibleAutoSaveNotes ? 'bg-shield-blue' : 'bg-gray-600'
                            }`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                              preferences.bibleAutoSaveNotes ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Bible Favorites */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-medium text-shield-white">Favorite Verses</h4>
                        <span className="text-sm text-gray-400">{bibleFavorites.length} verses</span>
                      </div>
                      
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {bibleFavorites.length > 0 ? (
                          bibleFavorites.map((favorite, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-shield-light-gray/20 rounded-lg">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-shield-white truncate">{favorite.reference}</p>
                                <p className="text-xs text-gray-400 truncate">{favorite.text.substring(0, 60)}...</p>
                                <p className="text-xs text-gray-500">{favorite.version} • {new Date(favorite.created_at).toLocaleDateString()}</p>
                              </div>
                              <button
                                onClick={() => handleRemoveBibleFavorite(favorite.reference)}
                                className="ml-2 p-1 text-red-400 hover:text-red-300 transition-colors"
                                title="Remove from favorites"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-400 text-sm">No favorite verses yet</p>
                        )}
                      </div>
                    </div>

                    {/* Bible Search History */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-medium text-shield-white">Search History</h4>
                        <button
                          onClick={handleClearBibleHistory}
                          className="text-sm text-red-400 hover:text-red-300 transition-colors"
                        >
                          Clear All
                        </button>
                      </div>
                      
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {bibleHistory.length > 0 ? (
                          bibleHistory.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-shield-light-gray/20 rounded-lg">
                              <div className="flex-1">
                                <p className="text-sm text-shield-white">{item.query}</p>
                                <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-400 text-sm">No search history</p>
                        )}
                      </div>
                    </div>

                    {/* Bible Study Notes */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Edit className="w-5 h-5 text-shield-blue" />
                          <h4 className="text-lg font-medium text-shield-white">Study Notes</h4>
                        </div>
                        <span className="text-sm text-gray-400">{bibleNotes.length} note{bibleNotes.length !== 1 ? 's' : ''}</span>
                      </div>
                      
                      <div className="bg-shield-light-gray/10 border border-shield-light-gray/20 rounded-lg p-4">
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {bibleNotes.length > 0 ? (
                            bibleNotes.map((note, index) => (
                              <div key={index} className="p-4 bg-shield-light-gray/20 rounded-lg border border-shield-light-gray/30">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs font-medium text-shield-blue bg-shield-blue/20 px-2 py-1 rounded">
                                      {note.reference}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      {new Date(note.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteBibleNote(note.id)}
                                    className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                    title="Delete note"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                                
                                <p className="text-sm text-gray-300 mb-3 leading-relaxed">
                                  {note.note}
                                </p>
                                
                                {note.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {note.tags.map((tag, tagIndex) => (
                                      <span key={tagIndex} className="text-xs bg-shield-blue/20 text-shield-blue px-2 py-1 rounded-full">
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-gray-400">
                              <Edit className="w-12 h-12 mx-auto mb-3 opacity-50" />
                              <p className="text-sm">No study notes yet</p>
                              <p className="text-xs mt-1">Create notes in the Bible Study Suite</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'data' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-shield-white mb-4">Data & Privacy</h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-shield-light-gray/20 rounded-lg">
                      <h4 className="text-shield-white font-medium mb-2">Export Your Data</h4>
                      <p className="text-gray-400 text-sm mb-3">
                        Download all your conversations and settings as a JSON file.
                      </p>
                      <button
                        onClick={handleExportData}
                        className="flex items-center space-x-2 px-4 py-2 bg-shield-blue text-shield-white rounded-lg hover:bg-shield-blue/90 transition-colors"
                      >
                        <Download size={16} />
                        <span>Export Data</span>
                      </button>
                    </div>

                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <h4 className="text-red-400 font-medium mb-2">Delete Account</h4>
                      <p className="text-gray-400 text-sm mb-3">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <button
                        onClick={handleDeleteAccount}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <Trash2 size={16} />
                        <span>Delete Account</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        currentSubscription={subscription}
        isInTrial={isInTrial}
      />
    </>
  );
} 