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
  Loader
} from 'lucide-react';
import { ChurchFinderService, ChurchLocation } from '../lib/church-finder-service';

interface ChurchEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  type: 'bible_study' | 'youth_group' | 'outreach' | 'worship' | 'prayer';
}

interface Church {
  id: string;
  name: string;
  denomination: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  website: string;
  email: string;
  pastor: string;
  service_times: string[];
  events: ChurchEvent[];
  description: string;
  rating: number;
  review_count: number;
  distance?: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  features: string[];
  languages: string[];
  accessibility: string[];
}

interface ChurchFinderProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
  onChurchSelect?: (church: Church) => void;
}

const ChurchFinder: React.FC<ChurchFinderProps> = ({ 
  isOpen, 
  onClose, 
  theme = 'dark',
  onChurchSelect 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDenomination, setSelectedDenomination] = useState<string>('all');
  const [selectedDistance, setSelectedDistance] = useState<number>(10);
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [churches, setChurches] = useState<ChurchLocation[]>([]);

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
      try {
        const location = await ChurchFinderService.getUserLocation();
        setUserLocation(location);
        
        if (location) {
          const nearbyChurches = await ChurchFinderService.findChurchesNearby({
            latitude: location.lat,
            longitude: location.lng,
            radius: selectedDistance * 1609.34 // Convert miles to meters
          });
          setChurches(nearbyChurches);
        }
      } catch (err) {
        setError('Failed to get your location. Please enable location services.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      initialize();
    }
  }, [isOpen, selectedDistance]);

  const filteredChurches = churches.filter(church => {
    const matchesSearch = church.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         church.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDenomination = selectedDenomination === 'all' || 
      church.name.toLowerCase().includes(selectedDenomination.toLowerCase());
    
    const matchesDistance = !church.distance || church.distance <= selectedDistance;
    
    return matchesSearch && matchesDenomination && matchesDistance;
  });

  const handleChurchSelect = (church: ChurchLocation) => {
    // Convert ChurchLocation to Church format
    const churchData: Church = {
      id: church.id,
      name: church.name,
      denomination: church.types.includes('church') ? 'Christian' : 'Unknown',
      address: church.address,
      city: church.city,
      state: church.state,
      zip: church.zip,
      phone: church.phone || '',
      website: church.website || '',
      email: '',
      pastor: '',
      service_times: ['Sunday 10:00 AM'], // Default service time
      events: [],
      description: `${church.name} in ${church.city}, ${church.state}`,
      rating: church.rating || 0,
      review_count: church.review_count || 0,
      distance: church.distance,
      coordinates: church.coordinates,
      features: [],
      languages: ['English'],
      accessibility: []
    };
    
    setSelectedChurch(churchData);
  };

  const handleBackToList = () => {
    setSelectedChurch(null);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'bible_study': return <BookOpen className="w-4 h-4" />;
      case 'youth_group': return <Users className="w-4 h-4" />;
      case 'outreach': return <Heart className="w-4 h-4" />;
      case 'worship': return <Cross className="w-4 h-4" />;
      case 'prayer': return <Heart className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-6xl mx-4 rounded-2xl shadow-2xl overflow-hidden ${
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
              }`}>Find a Church</h2>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Discover churches in your area</p>
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
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-96">
          {/* Church List */}
          {!selectedChurch && (
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
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
              </div>
            </div>
          )}

          {/* Church Details */}
          {selectedChurch && (
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                {/* Back Button */}
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

                {/* Church Header */}
                <div className="mb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className={`text-2xl font-bold mb-2 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {selectedChurch.name}
                      </h2>
                      <div className="flex items-center space-x-2 mb-3">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {selectedChurch.denomination}
                        </span>
                        {selectedChurch.rating && (
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className={`text-sm ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              {selectedChurch.rating} ({selectedChurch.review_count} reviews)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className={`text-lg mb-4 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {selectedChurch.description}
                  </p>
                </div>

                {/* Contact Info */}
                <div className={`p-4 rounded-lg mb-6 ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                }`}>
                  <h3 className={`text-lg font-semibold mb-3 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Contact Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className={`text-sm ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {selectedChurch.address}, {selectedChurch.city}, {selectedChurch.state} {selectedChurch.zip}
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
                          {selectedChurch.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Service Times */}
                <div className="mb-6">
                  <h3 className={`text-lg font-semibold mb-3 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Service Times
                  </h3>
                  <div className="space-y-2">
                    {selectedChurch.service_times.map((time, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className={`text-sm ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => onChurchSelect?.(selectedChurch)}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-colors"
                  >
                    Ask About This Church
                  </button>
                  <button className="px-4 py-3 border border-gray-300 rounded-lg font-medium transition-colors hover:bg-gray-50">
                    Get Directions
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChurchFinder; 