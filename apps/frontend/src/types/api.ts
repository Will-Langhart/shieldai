// API Response Types
export interface ApiResponse<T> {
  data: T
  message?: string
  status: 'success' | 'error'
}

export interface ApiError {
  message: string
  code?: string
  details?: Record<string, any>
  status_code: number
}

// Vector Search Types
export interface VectorSearchResult {
  id: string
  score: number
  metadata: Record<string, any>
  text?: string
}

export interface VectorSearchResponse {
  matches: VectorSearchResult[]
  total_matches: number
  query: string
}

// MCP Service Types
export interface McpServiceStatus {
  service_name: string
  is_initialized: boolean
  connection_status: 'connected' | 'disconnected' | 'error'
  timestamp: number
}

export interface McpServiceQuery {
  type: string
  [key: string]: any
}

