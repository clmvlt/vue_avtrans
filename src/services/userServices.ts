import { apiClient } from '@/api'
import type { ServiceDTO } from '@/models'
import type { SuccessMessageResponse, ApiResponse, PagedResponse, PaginationParams } from '@/types'

/**
 * Service start request data
 */
export interface ServiceStartRequest {
  vehiculeId?: string
  startDate?: string
  comment?: string
  latitude?: number
  longitude?: number
}

/**
 * Service end request data
 */
export interface ServiceEndRequest {
  vehiculeId?: string
  endDate?: string
  comment?: string
  latitude?: number
  longitude?: number
}

/**
 * Worked hours response
 * Values are in hours (decimal format)
 */
export interface WorkedHoursDTO {
  year?: number
  month?: number
  week?: number
  day?: number
  lastMonth?: number
}

/**
 * Service search filters
 */
export interface ServiceSearchParams extends PaginationParams {
  isBreak?: boolean
  startDate?: string
  endDate?: string
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
}

/**
 * Hours query parameters
 */
export interface HoursQueryParams {
  period?: 'day' | 'week' | 'month' | 'year'
  year?: number
  month?: number
  week?: number
  day?: number
}

/**
 * Service create request (admin)
 */
export interface ServiceCreateRequest {
  userUuid: string
  vehiculeId?: string
  debut: string
  fin?: string
  latitude?: number
  longitude?: number
  comment?: string
}

/**
 * Service update request (admin)
 */
export interface ServiceUpdateRequest {
  debut?: string
  fin?: string
  latitude?: number
  longitude?: number
  isBreak?: boolean
}

/**
 * Active service data
 */
export interface ActiveServiceData {
  uuid: string
  debut: string
  fin?: string | null
  duree?: number
  isBreak: boolean
  latitude?: number
  longitude?: number
  isAdmin?: boolean
  userUuid: string
}

/**
 * Active service response (admin)
 */
export interface ActiveServiceResponse {
  success: boolean
  service: ActiveServiceData | null
}

/**
 * GPS location request for service operations
 */
export interface GpsLocationRequest {
  latitude: number
  longitude: number
  userUuid?: string // Admin only - to perform action for another user
}

/**
 * Time tracking service (services de travail)
 * Handles user time tracking, breaks, and service history
 */
export class UserServicesService {
  /**
   * Start a service with GPS coordinates
   * If userUuid is provided, starts service for that user (admin only)
   * @param data - GPS coordinates and optional user UUID
   * @returns Promise with started service
   */
  async startService(data: GpsLocationRequest): Promise<ServiceDTO> {
    return apiClient.post<ServiceDTO>('services/start', data)
  }

  /**
   * End a service with GPS coordinates
   * If userUuid is provided, ends service for that user (admin only)
   * @param data - GPS coordinates and optional user UUID
   * @returns Promise with ended service
   */
  async endService(data: GpsLocationRequest): Promise<ServiceDTO> {
    return apiClient.post<ServiceDTO>('services/end', data)
  }

  /**
   * Start a break with GPS coordinates
   * If userUuid is provided, starts break for that user (admin only)
   * @param data - GPS coordinates and optional user UUID
   * @returns Promise with started break
   */
  async startBreak(data: GpsLocationRequest): Promise<ServiceDTO> {
    return apiClient.post<ServiceDTO>('services/break/start', data)
  }

  /**
   * End a break with GPS coordinates
   * If userUuid is provided, ends break for that user (admin only)
   * @param data - GPS coordinates and optional user UUID
   * @returns Promise with ended break
   */
  async endBreak(data: GpsLocationRequest): Promise<ServiceDTO> {
    return apiClient.post<ServiceDTO>('services/break/end', data)
  }

  /**
   * Get active service for the authenticated user
   * @returns Promise with active service response
   */
  async getCurrentService(): Promise<{ success: boolean; service: ServiceDTO | null }> {
    return apiClient.get<{ success: boolean; service: ServiceDTO | null }>('services/active')
  }

  /**
   * Get worked hours (service duration - break duration)
   * If period is not provided, returns all periods (year, month, week, day, lastMonth)
   * @param params - Query parameters for specific period
   * @returns Promise with worked hours
   */
  async getWorkedHours(params?: HoursQueryParams): Promise<WorkedHoursDTO> {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : ''
    return apiClient.get<WorkedHoursDTO>(`services/hours${queryString}`)
  }

  /**
   * Get monthly services
   * If year and month are not provided, uses current month
   * @param year - Year (e.g., 2025). Defaults to current year
   * @param month - Month (1-12). Defaults to current month
   * @returns Promise with monthly services
   */
  async getMonthlyServices(year?: number, month?: number): Promise<ServiceDTO[]> {
    const params = new URLSearchParams()
    if (year !== undefined) params.append('year', year.toString())
    if (month !== undefined) params.append('month', month.toString())
    const queryString = params.toString() ? `?${params.toString()}` : ''
    return apiClient.get<ServiceDTO[]>(`services/month${queryString}`)
  }

  /**
   * Get services history with filters and pagination
   * @param filters - Search filters
   * @returns Promise with paginated services
   */
  async getServiceHistory(filters?: ServiceSearchParams): Promise<PagedResponse<ServiceDTO>> {
    return apiClient.post<PagedResponse<ServiceDTO>>('services/history', filters || {})
  }

  /**
   * Get daily services for the authenticated user
   * Returns all services for the current day (from 00:00 to 23:59)
   * @returns Promise with daily services
   */
  async getDailyServices(): Promise<ServiceDTO[]> {
    return apiClient.get<ServiceDTO[]>('services/user/daily')
  }

  // Admin methods

  /**
   * [ADMIN] Create service for a user
   * @param serviceData - Service data
   * @returns Promise with created service
   */
  async createService(serviceData: ServiceCreateRequest): Promise<ApiResponse<ServiceDTO>> {
    return apiClient.post<ApiResponse<ServiceDTO>>('services/admin/create', serviceData)
  }

  /**
   * [ADMIN] Get user services with filters and pagination
   * @param userUuid - User UUID
   * @param filters - Search filters
   * @returns Promise with paginated user services
   */
  async searchServices(userUuid: string, filters?: ServiceSearchParams): Promise<PagedResponse<ServiceDTO>> {
    return apiClient.post<PagedResponse<ServiceDTO>>(`services/admin/user/${userUuid}`, filters || {})
  }

  /**
   * [ADMIN] Get user worked hours
   * @param userUuid - User UUID
   * @param params - Query parameters for specific period
   * @returns Promise with worked hours
   */
  async getUserWorkedHours(userUuid: string, params?: HoursQueryParams): Promise<ApiResponse<WorkedHoursDTO>> {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : ''
    return apiClient.get<ApiResponse<WorkedHoursDTO>>(`services/admin/hours/${userUuid}${queryString}`)
  }

  /**
   * [ADMIN] Update service
   * @param serviceUuid - Service UUID
   * @param serviceData - Service data to update
   * @returns Promise with updated service
   */
  async validateService(serviceUuid: string, serviceData: ServiceUpdateRequest): Promise<ApiResponse<ServiceDTO>> {
    return apiClient.put<ApiResponse<ServiceDTO>>(`services/admin/${serviceUuid}`, serviceData)
  }

  /**
   * [ADMIN] Delete service
   * @param serviceUuid - Service UUID
   * @returns Promise with success message
   */
  async deleteService(serviceUuid: string): Promise<SuccessMessageResponse> {
    return apiClient.delete<SuccessMessageResponse>(`services/admin/${serviceUuid}`)
  }

  /**
   * [ADMIN] Get user active service
   * @param userUuid - User UUID
   * @returns Promise with active service or null if no active service
   */
  async getActiveService(userUuid: string): Promise<ActiveServiceResponse | null> {
    return apiClient.get<ActiveServiceResponse | null>(`services/admin/${userUuid}/active`)
  }
}

/**
 * Singleton instance of UserServicesService
 */
export const userServicesService = new UserServicesService()
