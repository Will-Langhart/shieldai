import { apiService } from './api'
import { Church, ChurchSearchForm } from '../types/church'

export class ChurchService {
  /**
   * Search for churches by location
   */
  async searchChurches(searchForm: ChurchSearchForm): Promise<Church[]> {
    const response = await apiService.searchChurches(
      searchForm.location,
      searchForm.radius
    )
    return response.churches
  }

  /**
   * Get church details by ID
   */
  async getChurchById(churchId: string): Promise<Church> {
    const response = await apiService.getChurchById(churchId)
    return response
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
    return response.churches
  }

  /**
   * Get churches by denomination
   */
  async getChurchesByDenomination(denomination: string): Promise<Church[]> {
    const response = await apiService.getChurchesByDenomination(denomination)
    return response.churches
  }

  /**
   * Get popular churches
   */
  async getPopularChurches(_limit: number = 10): Promise<Church[]> {
    const response = await apiService.getPopularChurches()
    return response.churches
  }

  /**
   * Get church reviews
   */
  async getChurchReviews(churchId: string): Promise<any[]> {
    const response = await apiService.getChurchReviews(churchId)
    return response.reviews
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
    return response.service_times
  }
}

export const churchService = new ChurchService()

