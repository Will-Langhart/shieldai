import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Clock, 
  Phone, 
  Globe, 
  Users, 
  Star, 
  Filter,
  Navigation,
  Calendar,
  Heart,
  Cross,
  BookOpen,
  Loader,
  Sparkles,
  MessageCircle,
  Target,
  Award
} from 'lucide-react';
import { ChurchFinderService, ChurchLocation } from '../lib/church-finder-service';
import { AIChurchRecommendations, UserPreferences, AIRecommendation } from '../lib/ai-church-recommendations';
import { AIChurchAssistant, ChurchQuestion, AIChurchResponse } from '../lib/ai-church-assistant';

interface EnhancedChurchFinderProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
  onChurchSelect?: (church: any) => void;
}

const EnhancedChurchFinder: React.FC<EnhancedChurchFinderProps> = ({ 
  isOpen, 
  onClose, 
  theme = 'dark',
  onChurchSelect 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDenomination, setSelectedDenomination] = useState<string>('all');
  const [selectedDistance, setSelectedDistance] = useState<number>(10);
  const [selectedChurch, setSelectedChurch] = useState<ChurchLocation | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [churches, setChurches] = useState<ChurchLocation[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({});
  const [activeTab, setActiveTab] = useState<'search' | 'ai-recommendations' | 'spiritual-guidance'>('search');
  const [aiResponse, setAiResponse] = useState<AIChurchResponse | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);

  const denominations = [
    { id: 'all', name: 'All Denominations' },
    { id: 'Baptist', name: 'Baptist' },
    { id: 'Catholic', name: 'Catholic' },
    { id: 'Lutheran', name: 'Lutheran' },
    { id: 'Methodist', name: 'Methodist' },
    { id: 'Presbyterian', name: 'Presbyterian' },
    { id: 'Non-denominational', name: 'Non-denominational' }
  ];

  const distances = [5, 10, 25, 50, 100];

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      setError(null);
      try {
        const location = await ChurchFinderService.getUserLocation();
        setUserLocation(location);
        
        if (location) {
          console.log('User location:', location);
          const nearbyChurches = await ChurchFinderService.findChurchesNearby({
            latitude: location.lat,
            longitude: location.lng,
            radius: selectedDistance * 1609.34,
            denomination: selectedDenomination !== 'all' ? selectedDenomination : undefined
          });
          console.log('Found churches:', nearbyChurches);
          setChurches(nearbyChurches);

          // Get AI recommendations
          if (nearbyChurches.length > 0) {
            const recommendations = await AIChurchRecommendations.getPersonalizedRecommendations(
              nearbyChurches,
              userPreferences,
              location
            );
            setAiRecommendations(recommendations);
          }
        } else {
          setError('Unable to get your location. Please enable location services.');
        }
      } catch (err) {
        console.error('Error initializing church finder:', err);
        setError('Failed to load churches. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      initialize();
    }
  }, [isOpen, selectedDistance, selectedDenomination, userPreferences]);

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const location = await ChurchFinderService.getUserLocation();
      if (location) {
        const nearbyChurches = await ChurchFinderService.findChurchesNearby({
          latitude: location.lat,
          longitude: location.lng,
          radius: selectedDistance * 1609.34,
          denomination: selectedDenomination !== 'all' ? selectedDenomination : undefined
        });
        setChurches(nearbyChurches);

        // Refresh AI recommendations
        if (nearbyChurches.length > 0) {
          const recommendations = await AIChurchRecommendations.getPersonalizedRecommendations(
            nearbyChurches,
            userPreferences,
            location
          );
          setAiRecommendations(recommendations);
        }
      } else {
        setError('Unable to get your location. Please enable location services.');
      }
    } catch (err) {
      console.error('Error refreshing churches:', err);
      setError('Failed to refresh churches. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChurchSelect = (church: ChurchLocation) => {
    setSelectedChurch(church);
  };

  const handleBackToList = () => {
    setSelectedChurch(null);
  };

  const handleAskAI = async (question: string) => {
    try {
      const churchQuestion: ChurchQuestion = {
        type: 'general',
        question,
        context: {
          userLocation: userLocation || undefined,
          selectedChurch: selectedChurch || undefined,
          preferences: userPreferences
        }
      };

      const response = await AIChurchAssistant.answerChurchQuestion(churchQuestion);
      setAiResponse(response);
    } catch (error) {
      console.error('Error asking AI:', error);
    }
  };

  const handleSpiritualGuidance = async (topic: string) => {
    try {
      const response = await AIChurchAssistant.getSpiritualGuidance(topic);
      setAiResponse(response);
    } catch (error) {
      console.error('Error getting spiritual guidance:', error);
    }
  };

  const filteredChurches = churches.filter(church => {
    const matchesSearch = searchTerm === '' || 
      church.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      church.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      church.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDenomination = selectedDenomination === 'all' || 
      (() => {
        const churchName = church.name.toLowerCase();
        const denominationKeywords = {
          'Baptist': ['baptist', 'baptist church', 'first baptist', 'second baptist'],
          'Catholic': ['catholic', 'st.', 'saint', 'cathedral', 'basilica'],
          'Lutheran': ['lutheran', 'lutheran church', 'elca', 'lcms'],
          'Methodist': ['methodist', 'umc', 'united methodist'],
          'Presbyterian': ['presbyterian', 'pca', 'pcusa'],
          'Non-denominational': ['community', 'non-denominational', 'christian', 'fellowship']
        };
        
        const keywords = denominationKeywords[selectedDenomination as keyof typeof denominationKeywords] || [];
        return keywords.some(keyword => churchName.includes(keyword));
      })();
    
    const matchesDistance = !church.distance || church.distance <= selectedDistance;
    
    return matchesSearch && matchesDenomination && matchesDistance;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-7xl mx-4 rounded-2xl shadow-2xl overflow-hidden ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>AI-Powered Church Finder</h2>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Discover churches with AI recommendations and spiritual guidance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          {[
            { id: 'search', name: 'Search Churches', icon: <Search className="w-4 h-4" /> },
            { id: 'ai-recommendations', name: 'AI Recommendations', icon: <Sparkles className="w-4 h-4" /> },
            { id: 'spiritual-guidance', name: 'Spiritual Guidance', icon: <MessageCircle className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-6 py-4 transition-colors ${
                activeTab === tab.id
                  ? theme === 'dark'
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-blue-600 border-b-2 border-blue-600'
                  : theme === 'dark'
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.icon}
              <span className="font-medium">{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Search and Filters */}
        <div className={`p-6 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search churches, cities, or denominations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <select
                value={selectedDenomination}
                onChange={(e) => setSelectedDenomination(e.target.value)}
                className={`px-4 py-3 rounded-lg border transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {denominations.map(denom => (
                  <option key={denom.id} value={denom.id}>{denom.name}</option>
                ))}
              </select>

              <select
                value={selectedDistance}
                onChange={(e) => setSelectedDistance(Number(e.target.value))}
                className={`px-4 py-3 rounded-lg border transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {distances.map(distance => (
                  <option key={distance} value={distance}>{distance} miles</option>
                ))}
              </select>

              <button
                onClick={() => setShowPreferences(!showPreferences)}
                className={`px-4 py-3 rounded-lg border transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700'
                    : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Target className="w-4 h-4" />
              </button>

              <button
                onClick={handleRefresh}
                disabled={loading}
                className={`px-4 py-3 rounded-lg border transition-colors ${
                  loading
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-50'
                } ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {loading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  'Refresh'
                )}
              </button>
            </div>
          </div>

          {/* Preferences Panel */}
          {showPreferences && (
            <div className={`mt-4 p-4 rounded-lg ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <h3 className={`font-semibold mb-3 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>AI Preferences</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className={`text-sm ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Service Style</label>
                  <select
                    value={userPreferences.serviceStyle || ''}
                    onChange={(e) => setUserPreferences(prev => ({ ...prev, serviceStyle: e.target.value as any }))}
                    className={`w-full mt-1 px-3 py-2 rounded border ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Any Style</option>
                    <option value="traditional">Traditional</option>
                    <option value="contemporary">Contemporary</option>
                    <option value="blended">Blended</option>
                  </select>
                </div>
                <div>
                  <label className={`text-sm ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Church Size</label>
                  <select
                    value={userPreferences.size || ''}
                    onChange={(e) => setUserPreferences(prev => ({ ...prev, size: e.target.value as any }))}
                    className={`w-full mt-1 px-3 py-2 rounded border ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Any Size</option>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
                <div>
                  <label className={`text-sm ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Family Friendly</label>
                  <select
                    value={userPreferences.familyFriendly ? 'true' : 'false'}
                    onChange={(e) => setUserPreferences(prev => ({ ...prev, familyFriendly: e.target.value === 'true' }))}
                    className={`w-full mt-1 px-3 py-2 rounded border ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="false">Not Required</option>
                    <option value="true">Required</option>
                  </select>
                </div>
                <div>
                  <label className={`text-sm ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Youth Programs</label>
                  <select
                    value={userPreferences.youthPrograms ? 'true' : 'false'}
                    onChange={(e) => setUserPreferences(prev => ({ ...prev, youthPrograms: e.target.value === 'true' }))}
                    className={`w-full mt-1 px-3 py-2 rounded border ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="false">Not Required</option>
                    <option value="true">Required</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Search Status */}
          {userLocation && (
            <div className={`mt-3 text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Searching for churches within {selectedDistance} miles of your location
              {selectedDenomination !== 'all' && ` (${selectedDenomination})`}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex h-96">
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {activeTab === 'search' && (
                <div className="space-y-4">
                  {loading ? (
                    <div className="flex justify-center items-center h-32">
                      <Loader className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                  ) : error ? (
                    <div className="text-center text-red-500 p-4">{error}</div>
                  ) : filteredChurches.length === 0 ? (
                    <div className="text-center text-gray-500 p-4">No churches found in your area.</div>
                  ) : (
                    filteredChurches.map((church) => (
                      <div
                        key={church.id}
                        onClick={() => handleChurchSelect(church)}
                        className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
                          theme === 'dark'
                            ? 'border-gray-600 bg-gray-800 hover:border-gray-500'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className={`text-lg font-semibold ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>
                                {church.name}
                              </h3>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                              }`}>
                                Church
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-4 mb-3">
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span className={`text-sm ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  {church.city}, {church.state}
                                </span>
                              </div>
                              {church.distance && (
                                <div className="flex items-center space-x-1">
                                  <Navigation className="w-4 h-4 text-gray-400" />
                                  <span className={`text-sm ${
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                  }`}>
                                    {church.distance.toFixed(1)} miles away
                                  </span>
                                </div>
                              )}
                            </div>

                            <p className={`text-sm mb-3 ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {church.address}
                            </p>

                            <div className="flex items-center justify-between">
                              {church.rating && (
                                <div className="flex items-center space-x-2">
                                  <div className="flex items-center space-x-1">
                                    <Star className="w-4 h-4 text-yellow-500" />
                                    <span className={`text-sm ${
                                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                      {church.rating}
                                    </span>
                                  </div>
                                  {church.review_count && (
                                    <span className={`text-sm ${
                                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                      ({church.review_count} reviews)
                                    </span>
                                  )}
                                </div>
                              )}
                              
                              <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className={`text-sm ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  Sunday Service
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'ai-recommendations' && (
                <div className="space-y-4">
                  <h3 className={`text-xl font-semibold mb-4 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>AI-Powered Recommendations</h3>
                  
                  {aiRecommendations.length === 0 ? (
                    <div className="text-center text-gray-500 p-4">
                      Set your preferences to get personalized AI recommendations
                    </div>
                  ) : (
                    aiRecommendations.map((recommendation, index) => (
                      <div
                        key={recommendation.church.id}
                        className={`p-6 rounded-lg border-2 ${
                          theme === 'dark'
                            ? 'border-gray-600 bg-gray-800'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Award className="w-5 h-5 text-yellow-500" />
                            <h4 className={`text-lg font-semibold ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                              {recommendation.church.name}
                            </h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              theme === 'dark' ? 'bg-green-700 text-green-300' : 'bg-green-100 text-green-700'
                            }`}>
                              {recommendation.matchPercentage.toFixed(0)}% Match
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {recommendation.reasons.map((reason, idx) => (
                            <div key={idx} className="flex items-center space-x-2">
                              <Sparkles className="w-4 h-4 text-blue-500" />
                              <span className={`text-sm ${
                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                {reason}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <span className={`text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {recommendation.church.distance?.toFixed(1)} miles away
                          </span>
                          <button
                            onClick={() => handleChurchSelect(recommendation.church)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Learn More
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'spiritual-guidance' && (
                <div className="space-y-4">
                  <h3 className={`text-xl font-semibold mb-4 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Spiritual Guidance</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { topic: 'first-time', title: 'First Time Visitor', icon: <Users className="w-5 h-5" /> },
                      { topic: 'denomination', title: 'Understanding Denominations', icon: <BookOpen className="w-5 h-5" /> },
                      { topic: 'community', title: 'Getting Involved', icon: <Heart className="w-5 h-5" /> },
                      { topic: 'worship', title: 'Worship Styles', icon: <Cross className="w-5 h-5" /> },
                      { topic: 'family', title: 'Family-Friendly Churches', icon: <Users className="w-5 h-5" /> }
                    ].map((item) => (
                      <button
                        key={item.topic}
                        onClick={() => handleSpiritualGuidance(item.topic)}
                        className={`p-4 rounded-lg border-2 text-left transition-all duration-300 hover:scale-105 ${
                          theme === 'dark'
                            ? 'border-gray-600 bg-gray-800 hover:border-gray-500'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {item.icon}
                          <span className={`font-medium ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {item.title}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {aiResponse && (
                    <div className={`mt-6 p-4 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                    }`}>
                      <h4 className={`font-semibold mb-2 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>AI Guidance</h4>
                      <p className={`text-sm mb-3 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {aiResponse.answer}
                      </p>
                      
                      {aiResponse.bibleVerses && (
                        <div className="mt-3">
                          <h5 className={`font-medium mb-2 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>Relevant Bible Verses</h5>
                          <div className="space-y-1">
                            {aiResponse.bibleVerses.map((verse, idx) => (
                              <p key={idx} className={`text-sm italic ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {verse}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {aiResponse.suggestions && (
                        <div className="mt-3">
                          <h5 className={`font-medium mb-2 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>Suggestions</h5>
                          <div className="space-y-1">
                            {aiResponse.suggestions.map((suggestion, idx) => (
                              <p key={idx} className={`text-sm ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                • {suggestion}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Church Details Sidebar */}
          {selectedChurch && (
            <div className="w-96 border-l border-gray-200 overflow-y-auto">
              <div className="p-6">
                <button
                  onClick={handleBackToList}
                  className={`mb-4 px-4 py-2 rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  ← Back to churches
                </button>

                <h3 className={`text-xl font-bold mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {selectedChurch.name}
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className={`text-sm ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {selectedChurch.address}
                    </span>
                  </div>

                  {selectedChurch.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className={`text-sm ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {selectedChurch.phone}
                      </span>
                    </div>
                  )}

                  {selectedChurch.website && (
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <a
                        href={selectedChurch.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-sm text-blue-500 hover:underline ${
                          theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                        }`}
                      >
                        Visit Website
                      </a>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Navigation className="w-4 h-4 text-gray-400" />
                    <span className={`text-sm ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {selectedChurch.distance?.toFixed(1)} miles away
                    </span>
                  </div>

                  {selectedChurch.rating && (
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className={`text-sm ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {selectedChurch.rating}/5 stars ({selectedChurch.review_count} reviews)
                      </span>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={() => onChurchSelect?.(selectedChurch)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-colors"
                    >
                      Ask AI About This Church
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedChurchFinder; 