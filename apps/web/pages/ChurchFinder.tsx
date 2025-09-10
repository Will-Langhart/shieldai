import { useState } from 'react'
import { MapPin, Search, Phone, Globe, Clock } from 'lucide-react'

interface Church {
  id: string
  name: string
  address: string
  phone?: string
  website?: string
  denomination: string
  serviceTimes: string[]
  distance: number
  description: string
}

export function ChurchFinder() {
  const [location, setLocation] = useState('')
  const [searchRadius, setSearchRadius] = useState(10)
  const [churches, setChurches] = useState<Church[]>([])
  const [loading, setLoading] = useState(false)

  // Mock data for demonstration
  const mockChurches: Church[] = [
    {
      id: '1',
      name: 'Grace Community Church',
      address: '123 Main St, Anytown, ST 12345',
      phone: '(555) 123-4567',
      website: 'https://gracecommunity.org',
      denomination: 'Non-denominational',
      serviceTimes: ['Sunday 9:00 AM', 'Sunday 11:00 AM', 'Wednesday 7:00 PM'],
      distance: 2.3,
      description: 'A welcoming community focused on biblical teaching and fellowship.'
    },
    {
      id: '2',
      name: 'First Baptist Church',
      address: '456 Oak Ave, Anytown, ST 12345',
      phone: '(555) 234-5678',
      website: 'https://firstbaptist.org',
      denomination: 'Southern Baptist',
      serviceTimes: ['Sunday 8:30 AM', 'Sunday 10:45 AM', 'Sunday 6:00 PM'],
      distance: 3.7,
      description: 'Traditional worship with contemporary elements and strong community outreach.'
    },
    {
      id: '3',
      name: 'New Life Fellowship',
      address: '789 Pine St, Anytown, ST 12345',
      phone: '(555) 345-6789',
      website: 'https://newlifefellowship.org',
      denomination: 'Pentecostal',
      serviceTimes: ['Sunday 10:00 AM', 'Tuesday 7:00 PM', 'Friday 7:00 PM'],
      distance: 5.1,
      description: 'Spirit-filled worship with emphasis on prayer and healing ministry.'
    }
  ]

  const handleSearch = async () => {
    if (!location.trim()) return
    
    setLoading(true)
    try {
      // In a real implementation, you would call your church finder API here
      // For now, we'll use mock data
      await new Promise(resolve => setTimeout(resolve, 1000))
      setChurches(mockChurches)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1A1D24] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#E0E0E0] mb-4">
            Find Churches Near You
          </h1>
          <p className="text-xl text-[#9CA3AF]">
            Discover Christian communities in your area
          </p>
        </div>

        {/* Search Section */}
        <div className="bg-[#2C303A] border border-[#3A404B] rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-[#E0E0E0] mb-6 flex items-center">
            <Search className="h-6 w-6 mr-2 text-blue-400" />
            Search for Churches
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#E0E0E0] mb-2">
                Location
              </label>
              <input
                type="text"
                placeholder="Enter city, state, or zip code"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2 bg-[#1A1D24] border border-[#3A404B] rounded-lg text-[#E0E0E0] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#E0E0E0] mb-2">
                Search Radius (miles)
              </label>
              <select
                value={searchRadius}
                onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-[#1A1D24] border border-[#3A404B] rounded-lg text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={5}>5 miles</option>
                <option value={10}>10 miles</option>
                <option value={25}>25 miles</option>
                <option value={50}>50 miles</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={loading || !location.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors"
              >
                <Search className="h-4 w-4" />
                <span>{loading ? 'Searching...' : 'Find Churches'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {churches.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-[#E0E0E0]">
              Churches Near {location}
            </h2>
            
            {churches.map((church) => (
              <div key={church.id} className="bg-[#2C303A] border border-[#3A404B] rounded-lg p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-[#E0E0E0] mb-2">
                          {church.name}
                        </h3>
                        <p className="text-sm text-[#9CA3AF] mb-2">
                          {church.denomination}
                        </p>
                        <p className="text-[#E0E0E0] mb-4">
                          {church.description}
                        </p>
                      </div>
                      <div className="flex items-center text-sm text-[#9CA3AF]">
                        <MapPin className="h-4 w-4 mr-1" />
                        {church.distance} miles
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-[#E0E0E0] mb-2 flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-blue-400" />
                          Address
                        </h4>
                        <p className="text-[#E0E0E0]">{church.address}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-[#E0E0E0] mb-2 flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-blue-400" />
                          Service Times
                        </h4>
                        <ul className="text-[#E0E0E0] space-y-1">
                          {church.serviceTimes.map((time, index) => (
                            <li key={index}>{time}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 lg:mt-0 lg:ml-6">
                    <div className="flex flex-col space-y-2">
                      {church.phone && (
                        <a
                          href={`tel:${church.phone}`}
                          className="flex items-center text-sm text-[#9CA3AF] hover:text-blue-400 transition-colors"
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          {church.phone}
                        </a>
                      )}
                      {church.website && (
                        <a
                          href={church.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-sm text-[#9CA3AF] hover:text-blue-400 transition-colors"
                        >
                          <Globe className="h-4 w-4 mr-2" />
                          Visit Website
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {churches.length === 0 && !loading && location && (
          <div className="text-center py-12">
            <MapPin className="h-16 w-16 text-[#9CA3AF] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#E0E0E0] mb-2">
              No churches found
            </h3>
            <p className="text-[#9CA3AF]">
              Try expanding your search radius or checking a different location.
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <p className="mt-4 text-[#9CA3AF]">Searching for churches...</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChurchFinder;