// Church Types
export interface Church {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip_code: string
  phone?: string
  website?: string
  email?: string
  denomination: string
  service_times: ServiceTime[]
  distance?: number
  description: string
  latitude?: number
  longitude?: number
  rating?: number
  review_count?: number
}

export interface ServiceTime {
  day: string
  time: string
  type: 'Worship' | 'Bible Study' | 'Prayer' | 'Youth' | 'Children' | 'Other'
}

export interface ChurchSearchForm {
  location: string
  radius: number
  denomination?: string
  service_day?: string
}

export interface ChurchReview {
  id: string
  church_id: string
  user_id: string
  rating: number
  comment: string
  created_at: Date
  updated_at: Date
}

