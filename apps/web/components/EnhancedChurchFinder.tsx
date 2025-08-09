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
  Loader2,
  X,
  Share2,
  Copy,
  ExternalLink,
  Building2
} from 'lucide-react';
import { useChurchFinderAPI } from '../lib/api-integration-hooks';
import LocationServicesTrigger from './LocationServicesTrigger';

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

interface EnhancedChurchFinderProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
  onChurchSelect?: (church: Church) => void;
}

const EnhancedChurchFinder: React.FC<EnhancedChurchFinderProps> = ({ 
  isOpen, 
  onClose, 
  theme = 'dark',
  onChurchSelect 
}) => {
  const { findChurchesNearby, getUserLocation, loading, error } = useChurchFinderAPI();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDenomination, setSelectedDenomination] = useState<string>('all');
  const [selectedDistance, setSelectedDistance] = useState<number>(10);
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [churches, setChurches] = useState<any[]>([]);
  const [showLocationTrigger, setShowLocationTrigger] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<any[]>([]);
  const [autocompleteLoading, setAutocompleteLoading] = useState(false);

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
    if (isOpen) {
      initializeLocation();
      loadFavorites();
      loadSearchHistory();
    }
  }, [isOpen]);

  const initializeLocation = async () => {
    try {
      console.log('Attempting to get user location...');
      
      // First, try to get the user's real location
      const location = await getUserLocation();
      if (location) {
        console.log('✅ Successfully got user location:', location);
        setUserLocation(location);
        await searchChurches(location);
      } else {
        console.log('❌ Could not get user location, showing location trigger');
        setShowLocationTrigger(true);
      }
    } catch (error) {
      console.error('❌ Error getting user location:', error);
      setShowLocationTrigger(true);
    }
  };

  const loadFavorites = () => {
    const savedFavorites = localStorage.getItem('church-favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  };

  const loadSearchHistory = () => {
    const savedHistory = localStorage.getItem('church-search-history');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  };

  const searchChurches = async (location: {lat: number, lng: number}) => {
    try {
      console.log(`Searching churches near ${location.lat}, ${location.lng} within ${selectedDistance} miles`);
      
      const results = await findChurchesNearby(
        location.lat, 
        location.lng, 
        selectedDistance * 1000, // Convert to meters
        selectedDenomination !== 'all' ? selectedDenomination : undefined
      );
      
      console.log(`Found ${results.length} churches:`, results);
      
      // Check if we got real results or fallback data
      if (results && results.length > 0) {
        if (results[0].id.startsWith('fallback')) {
          console.log('Using fallback data - API may be restricted');
          setSearchError('Using sample data. Real church data will be available once API is fully configured.');
        } else {
          console.log('Using real church data from Google Places API');
          setSearchError(null);
        }
        setChurches(results);
      } else {
        console.log('No churches found');
        setChurches([]);
        setSearchError('No churches found in your area. Try increasing the search radius.');
      }
      
      // Add to search history
      const searchKey = `${location.lat},${location.lng},${selectedDistance},${selectedDenomination}`;
      const newHistory = [searchKey, ...searchHistory.filter(h => h !== searchKey)].slice(0, 10);
      setSearchHistory(newHistory);
      localStorage.setItem('church-search-history', JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error searching churches:', error);
      // Show user-friendly error message
      setSearchError('Unable to find churches in your area. Please check your internet connection and try again.');
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      console.log('No search term entered');
      return;
    }

    console.log(`🔍 Searching for churches in: ${searchTerm}`);
    setSearchLoading(true);
    setSearchError(null);

    try {
      // First, geocode the search term to get coordinates
      const coordinates = await geocodeAddress(searchTerm);
      
      if (coordinates) {
        console.log(`📍 Found coordinates for "${searchTerm}":`, coordinates);
        setUserLocation(coordinates);
        await searchChurches(coordinates);
      } else {
        console.log(`❌ Could not find coordinates for "${searchTerm}"`);
        setSearchError(`Could not find location: "${searchTerm}". Please try a different search term.`);
      }
    } catch (error) {
      console.error('Error searching location:', error);
      setSearchError('Error searching for location. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  const geocodeAddress = async (address: string): Promise<{lat: number, lng: number} | null> => {
    try {
      console.log('🌐 Geocoding address via server:', address);
      
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('✅ Geocoding successful:', data.coordinates);
        return data.coordinates;
      } else {
        console.error('❌ Geocoding failed:', data.error);
        return null;
      }
    } catch (error) {
      console.error('❌ Geocoding error:', error);
      return null;
    }
  };

  const fetchAutocompleteSuggestions = async (query: string) => {
    if (query.length < 2) {
      setAutocompleteSuggestions([]);
      setShowAutocomplete(false);
      return;
    }

    try {
      setAutocompleteLoading(true);
      const response = await fetch(`/api/geocode/autocomplete?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (response.ok) {
        setAutocompleteSuggestions(data.suggestions);
        setShowAutocomplete(data.suggestions.length > 0);
      }
    } catch (error) {
      console.error('❌ Autocomplete error:', error);
    } finally {
      setAutocompleteLoading(false);
    }
  };

  const handleSearchInputChange = (value: string) => {
    setSearchTerm(value);
    fetchAutocompleteSuggestions(value);
  };

  const handleSuggestionSelect = (suggestion: any) => {
    setSearchTerm(suggestion.value);
    setShowAutocomplete(false);
    setAutocompleteSuggestions([]);
  };

  const handleRefresh = async () => {
    if (userLocation) {
      await searchChurches(userLocation);
    }
  };

  const handleChurchSelect = (church: any) => {
    setSelectedChurch({
      id: church.id,
      name: church.name,
      denomination: church.types?.includes('baptist') ? 'Baptist' : 'Non-denominational',
      address: church.address,
      city: church.city,
      state: church.state,
      zip: church.zip,
      phone: church.phone || '',
      website: church.website || '',
      email: '',
      pastor: '',
      service_times: ['Sunday 10:00 AM', 'Wednesday 7:00 PM'],
      events: [
        {
          id: '1',
          title: 'Sunday Service',
          description: 'Weekly worship service',
          date: new Date().toISOString(),
          time: '10:00 AM',
          type: 'worship'
        },
        {
          id: '2',
          title: 'Bible Study',
          description: 'Weekly Bible study group',
          date: new Date(Date.now() + 86400000).toISOString(),
          time: '7:00 PM',
          type: 'bible_study'
        }
      ],
      description: 'A welcoming community of believers',
      rating: church.rating || 4.0,
      review_count: church.review_count || 0,
      distance: church.distance,
      coordinates: church.coordinates,
      features: ['Parking', 'Wheelchair Accessible', 'Children\'s Ministry'],
      languages: ['English'],
      accessibility: ['Wheelchair Accessible']
    });
  };

  const handleBackToList = () => {
    setSelectedChurch(null);
  };

  const handleLocationEnabled = async () => {
    setShowLocationTrigger(false);
    console.log('Location enabled, getting user location...');
    
    try {
      const location = await getUserLocation();
      if (location) {
        console.log('Location obtained:', location);
        setUserLocation(location);
        console.log('Starting church search with location:', location);
        await searchChurches(location);
      } else {
        console.log('Failed to get location, using default location');
        // Use a default location instead of showing manual options
        const defaultLocation = { lat: 30.2672, lng: -97.7431 }; // Austin, TX
        setUserLocation(defaultLocation);
        await searchChurches(defaultLocation);
      }
    } catch (error) {
      console.error('Error in handleLocationEnabled:', error);
      // Use default location on error
      const defaultLocation = { lat: 30.2672, lng: -97.7431 }; // Austin, TX
      setUserLocation(defaultLocation);
      await searchChurches(defaultLocation);
    }
  };

  const handleLocationCancelled = async () => {
    setShowLocationTrigger(false);
    console.log('Location cancelled, using default location');
    
    // Use a default location when user cancels
    const defaultLocation = { lat: 30.2672, lng: -97.7431 }; // Austin, TX
    setUserLocation(defaultLocation);
    await searchChurches(defaultLocation);
  };

  const handleFavorite = (churchId: string) => {
    const newFavorites = favorites.includes(churchId)
      ? favorites.filter(f => f !== churchId)
      : [...favorites, churchId];
    
    setFavorites(newFavorites);
    localStorage.setItem('church-favorites', JSON.stringify(newFavorites));
  };

  const handleShareChurch = async (church: any) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: church.name,
          text: `${church.name} - ${church.address}`,
          url: window.location.href
        });
      } else {
        // Fallback to copying
        await navigator.clipboard.writeText(`${church.name} - ${church.address}`);
      }
    } catch (error) {
      console.error('Error sharing church:', error);
    }
  };

  const handleGetDirections = (church: any) => {
    const { lat, lng } = church.coordinates;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'worship': return <Cross className="w-4 h-4" />;
      case 'bible_study': return <BookOpen className="w-4 h-4" />;
      case 'youth_group': return <Users className="w-4 h-4" />;
      case 'outreach': return <Heart className="w-4 h-4" />;
      case 'prayer': return <Heart className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const getThemeClasses = () => {
    return theme === 'dark' 
      ? 'bg-shield-black text-shield-white border-shield-gray' 
      : 'bg-white text-gray-900 border-gray-200';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose} />
      
      <div className={`relative w-full max-w-4xl max-h-[90vh] ${getThemeClasses()} rounded-2xl border backdrop-blur-xl overflow-hidden`}>
        {/* Header */}
        <div className="p-6 border-b border-shield-gray">
          <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
              <MapPin className="w-6 h-6 text-shield-blue" />
              <h2 className="text-xl font-bold">Church Finder</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-shield-gray transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
        </div>

        {/* Search and Filters */}
          <div className="mt-4 space-y-4">
                        <div className="flex space-x-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  onFocus={() => {
                    if (searchTerm.length >= 2) {
                      setShowAutocomplete(true);
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding autocomplete to allow clicking on suggestions
                    setTimeout(() => setShowAutocomplete(false), 200);
                  }}
                  placeholder="Search churches by city, zip code, or location..."
                  className="w-full p-3 bg-shield-gray rounded-xl border-0 focus:ring-2 focus:ring-shield-blue focus:outline-none"
                />
                
                {/* Autocomplete Dropdown */}
                {showAutocomplete && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-shield-gray rounded-lg shadow-lg border border-shield-gray z-10 max-h-60 overflow-y-auto">
                    {autocompleteLoading ? (
                      <div className="p-3 text-center text-shield-gray">
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                      </div>
                    ) : (
                      autocompleteSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionSelect(suggestion)}
                          className="w-full p-3 text-left hover:bg-shield-black transition-colors border-b border-shield-gray last:border-b-0"
                        >
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-shield-blue" />
                            <div>
                              <div className="font-medium">{suggestion.display}</div>
                              <div className="text-sm text-shield-gray">
                                {suggestion.zip} • {suggestion.state}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={handleSearch}
                disabled={searchLoading || loading}
                className="px-4 py-3 bg-shield-blue text-shield-white rounded-xl hover:bg-blue-600 disabled:opacity-50"
              >
                {(searchLoading || loading) ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Denomination</label>
              <select
                value={selectedDenomination}
                onChange={(e) => setSelectedDenomination(e.target.value)}
                  className="w-full p-2 rounded-lg bg-shield-gray border-0 focus:ring-2 focus:ring-shield-blue"
              >
                {denominations.map(denom => (
                  <option key={denom.id} value={denom.id}>{denom.name}</option>
                ))}
              </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Distance (miles)</label>
              <select
                value={selectedDistance}
                onChange={(e) => setSelectedDistance(Number(e.target.value))}
                  className="w-full p-2 rounded-lg bg-shield-gray border-0 focus:ring-2 focus:ring-shield-blue"
              >
                {distances.map(distance => (
                  <option key={distance} value={distance}>{distance} miles</option>
                ))}
              </select>
              </div>
            </div>
            </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {error && (
            <div className="text-red-400 text-center py-4">
              {error}
                                </div>
                              )}
                              
          {searchError && (
            <div className="text-red-400 text-center py-4">
              {searchError}
                </div>
              )}

                      {showLocationTrigger && (
                <div className="space-y-4">
                <LocationServicesTrigger
                  isOpen={showLocationTrigger}
                  onClose={() => setShowLocationTrigger(false)}
                  onLocationEnabled={handleLocationEnabled}
                  onLocationCancelled={handleLocationCancelled}
                  theme={theme}
                />
              
              {/* Manual Search Option */}
              <div className="p-4 bg-shield-gray rounded-xl">
                <h4 className="font-semibold mb-3">Manual Search</h4>
                <p className="text-sm text-shield-gray mb-4">
                  Or search for churches in a specific city or area
                </p>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Enter city name (e.g., Austin, TX)"
                    className="w-full p-3 bg-shield-black rounded-xl border-0 focus:ring-2 focus:ring-shield-blue focus:outline-none"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        // You could implement geocoding here to convert city name to coordinates
                        console.log('Manual search:', e.currentTarget.value);
                      }
                    }}
                  />
                                      <div className="flex space-x-2">
                      <button
                        onClick={async () => {
                          console.log('🔍 Searching Austin, TX churches...');
                          const defaultLocation = { lat: 30.2672, lng: -97.7431 };
                          setUserLocation(defaultLocation);
                          setShowLocationTrigger(false);
                          await searchChurches(defaultLocation);
                        }}
                        className="px-4 py-2 bg-shield-blue text-shield-white rounded-lg hover:bg-blue-600"
                      >
                        Search Austin, TX
                      </button>
                          <button
                        onClick={async () => {
                          console.log('🔍 Searching New York, NY churches...');
                          const defaultLocation = { lat: 40.7128, lng: -74.0060 };
                          setUserLocation(defaultLocation);
                          setShowLocationTrigger(false);
                          await searchChurches(defaultLocation);
                        }}
                        className="px-4 py-2 bg-shield-gray text-shield-white rounded-lg hover:bg-gray-600"
                      >
                        Search New York, NY
                          </button>
                      <button
                        onClick={async () => {
                          console.log('🔍 Retrying your location...');
                          const location = await getUserLocation();
                          if (location) {
                            console.log('✅ Got your location:', location);
                            setUserLocation(location);
                            setShowLocationTrigger(false);
                            await searchChurches(location);
                          } else {
                            console.log('❌ Still no location, using Austin as fallback');
                            const defaultLocation = { lat: 30.2672, lng: -97.7431 };
                            setUserLocation(defaultLocation);
                            setShowLocationTrigger(false);
                            await searchChurches(defaultLocation);
                          }
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Use My Location
                      </button>
                    </div>
                </div>
              </div>
            </div>
          )}

          {selectedChurch ? (
            /* Church Detail View */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={handleBackToList}
                  className="text-shield-blue hover:text-shield-white"
                >
                  ← Back to List
                </button>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleFavorite(selectedChurch.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      favorites.includes(selectedChurch.id) 
                        ? 'text-red-400' 
                        : 'text-shield-gray hover:text-shield-white'
                    }`}
                  >
                    <Heart className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleShareChurch(selectedChurch)}
                    className="p-2 rounded-lg text-shield-gray hover:text-shield-white"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                                     <button
                     onClick={() => handleGetDirections(selectedChurch)}
                     className="p-2 rounded-lg text-shield-gray hover:text-shield-white"
                   >
                     <ExternalLink className="w-5 h-5" />
                   </button>
                </div>
              </div>

                <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold">{selectedChurch.name}</h3>
                  <p className="text-shield-gray">{selectedChurch.denomination}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-shield-gray" />
                    <span>{selectedChurch.address}</span>
                  </div>
                  {selectedChurch.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-shield-gray" />
                      <span>{selectedChurch.phone}</span>
                    </div>
                  )}
                  {selectedChurch.website && (
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-shield-gray" />
                      <a href={selectedChurch.website} target="_blank" rel="noopener noreferrer" className="text-shield-blue hover:underline">
                        Visit Website
                      </a>
                    </div>
                  )}
                  </div>

                  {selectedChurch.rating && (
                    <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span>{selectedChurch.rating} ({selectedChurch.review_count} reviews)</span>
                    </div>
                  )}

                <div>
                  <h4 className="font-semibold mb-2">Service Times</h4>
                  <div className="space-y-1">
                    {selectedChurch.service_times.map((time: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-shield-gray" />
                        <span>{time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Upcoming Events</h4>
                  <div className="space-y-2">
                    {selectedChurch.events.map((event: ChurchEvent) => (
                      <div key={event.id} className="flex items-center space-x-3 p-3 bg-shield-gray rounded-lg">
                        {getEventIcon(event.type)}
                        <div className="flex-1">
                          <div className="font-medium">{event.title}</div>
                          <div className="text-sm text-shield-gray">{event.time} • {event.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Features</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedChurch.features.map((feature: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-shield-gray rounded-full text-sm">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Church List View */
            <div className="space-y-4">
                        {churches.length === 0 && !loading && (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-shield-gray mx-auto mb-4" />
              <p className="text-shield-gray">No churches found in your area</p>
              <p className="text-sm text-shield-gray mt-2">
                Try increasing the search radius or selecting a different denomination
              </p>
            </div>
          )}

          {loading && (
            <div className="mb-4 p-3 bg-shield-gray rounded-lg">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-shield-blue"></div>
                <span className="text-sm font-medium">Searching for churches near you...</span>
              </div>
            </div>
          )}

          {churches.length > 0 && !loading && (
            <div className="mb-4 p-3 bg-shield-gray rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Found {churches.length} churches within {selectedDistance} miles
                  {userLocation && (
                    <span className="text-xs text-shield-gray ml-2">
                      near ({userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)})
                    </span>
                  )}
                </span>
                {churches.some(church => church.id.startsWith('fallback')) && (
                  <span className="text-xs text-yellow-400">
                    ⚠️ Using sample data - configure Google Places API for real results
                  </span>
                )}
              </div>
            </div>
          )}

              {churches.map((church: any) => (
                <div
                  key={church.id}
                  className="p-4 bg-shield-gray rounded-xl hover:bg-gray-700 transition-colors cursor-pointer"
                  onClick={() => handleChurchSelect(church)}
                >
                  <div className="flex items-start space-x-4">
                    {/* Church Image */}
                    <div className="flex-shrink-0">
                      {church.photos && church.photos.length > 0 ? (
                        <img
                          src={church.photos[0]}
                          alt={church.name}
                          className="w-16 h-16 rounded-lg object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-shield-black flex items-center justify-center">
                          <Building2 className="w-8 h-8 text-shield-blue" />
                        </div>
                      )}
                    </div>
                    
                    {/* Church Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold">{church.name}</h3>
                        {favorites.includes(church.id) && (
                          <Heart className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <p className="text-shield-gray text-sm mb-2">{church.address}</p>
                      <div className="flex items-center space-x-4 text-xs text-shield-gray">
                        {church.distance && (
                          <span>📍 {church.distance.toFixed(1)} miles away</span>
                        )}
                        {church.rating && (
                          <span>⭐ {church.rating} ({church.review_count} reviews)</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFavorite(church.id);
                        }}
                        className={`p-2 rounded-lg hover:bg-shield-black transition-colors ${
                          favorites.includes(church.id) 
                            ? 'text-red-400' 
                            : 'text-shield-gray hover:text-shield-white'
                        }`}
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShareChurch(church);
                        }}
                        className="p-2 rounded-lg hover:bg-shield-black transition-colors text-shield-gray hover:text-shield-white"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedChurchFinder; 