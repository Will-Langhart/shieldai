import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export interface BibleVerse {
  text: string
  reference: string
  book: string
  chapter: number
  verse?: number
}

export interface BibleSearchResult {
  results: BibleVerse[]
  query: string
  total_results: number
  bible_id: string
}

export interface Church {
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

export interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

export interface ApiResponse<T> {
  data: T
  message?: string
  status: 'success' | 'error'
}

class ApiService {
  // Health check
  async healthCheck() {
    const response = await api.get('/health')
    return response.data
  }

  // API status
  async getApiStatus() {
    const response = await api.get('/api/status')
    return response.data
  }

  // Bible API methods
  async getBibleVerses(book: string, chapter: number, verseStart?: number, verseEnd?: number) {
    const params = new URLSearchParams({
      book,
      chapter: chapter.toString(),
    })
    
    if (verseStart) params.append('verse_start', verseStart.toString())
    if (verseEnd) params.append('verse_end', verseEnd.toString())
    
    const response = await api.get(`/api/bible/verses?${params}`)
    return response.data
  }

  async searchBible(query: string, limit: number = 10): Promise<BibleSearchResult> {
    const response = await api.get('/api/bible/search', {
      params: { query, limit }
    })
    return response.data
  }

  async getBibleBooks() {
    const response = await api.get('/api/bible/books')
    return response.data
  }

  async getBibleChapters(book: string) {
    const response = await api.get('/api/bible/chapters', {
      params: { book }
    })
    return response.data
  }

  // Vector search methods
  async vectorSearch(query: string, topK: number = 8) {
    const response = await api.post('/api/vector/search', {
      query,
      top_k: topK
    })
    return response.data
  }

  async vectorUpsert(vectors: any[]) {
    const response = await api.post('/api/vector/upsert', { vectors })
    return response.data
  }

  // Database methods
  async getTableData(table: string, limit: number = 100) {
    const response = await api.get(`/api/db/${table}`, {
      params: { limit }
    })
    return response.data
  }

  async insertTableData(table: string, data: Record<string, any>) {
    const response = await api.post(`/api/db/${table}`, data)
    return response.data
  }

  // MCP service methods
  async getMcpServiceStatus(serviceName: string) {
    const response = await api.get(`/api/mcp/${serviceName}/status`)
    return response.data
  }

  async queryMcpService(serviceName: string, query: Record<string, any>) {
    const response = await api.post(`/api/mcp/${serviceName}/query`, query)
    return response.data
  }

  // Chat methods (placeholder for future implementation)
  async sendChatMessage(message: string, conversationId?: string) {
    // This would be implemented when the chat API is ready
    const response = await api.post('/api/chat', {
      message,
      conversation_id: conversationId
    })
    return response.data
  }

  // Church finder methods (placeholder for future implementation)
  async searchChurches(location: string, radius: number = 10) {
    // This would be implemented when the church finder API is ready
    const response = await api.post('/api/churches/search', {
      location,
      radius
    })
    return response.data
  }

  // Chat conversation methods
  async getConversation(conversationId: string) {
    const response = await api.get(`/api/conversations/${conversationId}`)
    return response.data
  }

  async getConversations() {
    const response = await api.get('/api/conversations')
    return response.data
  }

  async createConversation(title: string) {
    const response = await api.post('/api/conversations', { title })
    return response.data
  }

  async deleteConversation(conversationId: string) {
    const response = await api.delete(`/api/conversations/${conversationId}`)
    return response.data
  }

  async updateConversationTitle(conversationId: string, title: string) {
    const response = await api.patch(`/api/conversations/${conversationId}`, { title })
    return response.data
  }

  async getChatSuggestions() {
    const response = await api.get('/api/chat/suggestions')
    return response.data
  }

  // Church methods
  async getChurchById(churchId: string) {
    const response = await api.get(`/api/churches/${churchId}`)
    return response.data
  }

  async getNearbyChurches(latitude: number, longitude: number, radius: number = 10) {
    const response = await api.get('/api/churches/nearby', {
      params: { latitude, longitude, radius }
    })
    return response.data
  }

  async getChurchesByDenomination(denomination: string) {
    const response = await api.get('/api/churches/by-denomination', {
      params: { denomination }
    })
    return response.data
  }

  async getPopularChurches() {
    const response = await api.get('/api/churches/popular')
    return response.data
  }

  async getChurchReviews(churchId: string) {
    const response = await api.get(`/api/churches/${churchId}/reviews`)
    return response.data
  }

  async submitChurchReview(churchId: string, rating: number, comment: string) {
    const response = await api.post(`/api/churches/${churchId}/reviews`, {
      rating,
      comment
    })
    return response.data
  }

  async getChurchServiceTimes(churchId: string) {
    const response = await api.get(`/api/churches/${churchId}/service-times`)
    return response.data
  }
}

export const apiService = new ApiService()
export default api


