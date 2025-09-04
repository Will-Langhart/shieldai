import { apiService } from './api'
import { Church, ChurchSearchForm } from '../types/church'

export class ChurchService {
  /**
   * Search for churches by location
   */
  async searchChurches(searchForm: ChurchSearchForm): Promise<Church[]> {
    const response = await apiService.searchChurches(
      searchForm.location,
      searchForm.radius,
      searchForm.denomination,
      searchForm.service_day
    )
    return response.data.churches
  }

  /**
   * Get church details by ID
   */
  async getChurchById(churchId: string): Promise<Church> {
    const response = await apiService.getChurchById(churchId)
    return response.data
  }

  /**
   * Get nearby churches by coordinates
   */
  async getNearbyChurches(
    latitude: number,
    longitude: number,
    radius: number = 10
  ): Promise<Church[]> {
    const response = await apiService.getNearbyChurches(latitude, longitude, radius)
    return response.data.churches
  }

  /**
   * Get churches by denomination
   */
  async getChurchesByDenomination(denomination: string): Promise<Church[]> {
    const response = await apiService.getChurchesByDenomination(denomination)
    return response.data.churches
  }

  /**
   * Get popular churches
   */
  async getPopularChurches(limit: number = 10): Promise<Church[]> {
    const response = await apiService.getPopularChurches(limit)
    return response.data.churches
  }

  /**
   * Get church reviews
   */
  async getChurchReviews(churchId: string): Promise<any[]> {
    const response = await apiService.getChurchReviews(churchId)
    return response.data.reviews
  }

  /**
   * Submit a church review
   */
  async submitChurchReview(
    churchId: string,
    rating: number,
    comment: string
  ): Promise<void> {
    await apiService.submitChurchReview(churchId, rating, comment)
  }

  /**
   * Get service times for a church
   */
  async getChurchServiceTimes(churchId: string): Promise<any[]> {
    const response = await apiService.getChurchServiceTimes(churchId)
    return response.data.service_times
  }
}

export const churchService = new ChurchService()

