import { apiClient } from '@/api'
import type { AbsenceDTO } from '@/models'
import type { SuccessMessageResponse, ApiResponse, PagedResponse, PaginationParams } from '@/types'

/**
 * Absence status enum
 */
export type AbsenceStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

/**
 * Absence create request
 */
export interface AbsenceCreateRequest {
  absenceTypeUuid: string
  startDate: string
  endDate: string
  comment?: string
  halfDayStart?: boolean
  halfDayEnd?: boolean
}

/**
 * Admin absence create request
 */
export interface AdminAbsenceCreateRequest extends AbsenceCreateRequest {
  userUuid: string
  approved?: boolean
}

/**
 * Absence validation request
 */
export interface AbsenceValidationRequest {
  approved: boolean
  rejectionReason?: string
}

/**
 * Absence search filters
 */
export interface AbsenceSearchParams extends PaginationParams {
  startDate?: string
  endDate?: string
  status?: AbsenceStatus
  absenceTypeUuid?: string
  userUuid?: string
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
}

/**
 * Planning query parameters
 */
export interface PlanningQueryParams {
  periodType?: 'week' | 'month'
  year?: number
  month?: number
  week?: number
}

/**
 * Planning response DTO - matches GET /absences/admin/planning
 */
export interface AbsencePlanningResponse {
  success: boolean
  startDate: string
  endDate: string
  periodType: string
  users: PlanningUserDTO[]
}

/**
 * Planning user with absences
 */
export interface PlanningUserDTO {
  uuid: string
  email: string
  firstName: string
  lastName: string
  role: {
    uuid: string
    nom: string
    color: string
  }
  pictureUrl?: string
  isCouchette: boolean
  absences: AbsenceDTO[]
}

/**
 * Absence management service
 * Handles absence requests, validation, and planning
 */
export class AbsencesService {
  /**
   * Create an absence request
   * @param data - Absence data
   * @returns Promise with created absence
   */
  async createAbsenceRequest(data: AbsenceCreateRequest): Promise<ApiResponse<AbsenceDTO>> {
    return apiClient.post<ApiResponse<AbsenceDTO>>('absences', data)
  }

  /**
   * Get my absence requests with filters
   * @param filters - Search filters
   * @returns Promise with paginated absences
   */
  async getAbsences(filters?: AbsenceSearchParams): Promise<PagedResponse<AbsenceDTO>> {
    return apiClient.post<PagedResponse<AbsenceDTO>>('absences/my', filters || {})
  }

  /**
   * Cancel an absence request (if pending)
   * @param uuid - Absence UUID
   * @returns Promise with success message
   */
  async cancelAbsence(uuid: string): Promise<SuccessMessageResponse> {
    return apiClient.delete<SuccessMessageResponse>(`absences/${uuid}`)
  }

  // Admin methods

  /**
   * [ADMIN] Create absence for a user
   * @param data - Absence data with user UUID
   * @returns Promise with created absence
   */
  async createAbsenceForUser(data: AdminAbsenceCreateRequest): Promise<ApiResponse<AbsenceDTO>> {
    return apiClient.post<ApiResponse<AbsenceDTO>>('absences/admin/create', data)
  }

  /**
   * [ADMIN] Search and filter absences
   * @param filters - Search filters
   * @returns Promise with paginated absences
   */
  async searchAbsences(filters?: AbsenceSearchParams): Promise<PagedResponse<AbsenceDTO>> {
    return apiClient.post<PagedResponse<AbsenceDTO>>('absences/admin/search', filters || {})
  }

  /**
   * [ADMIN] Get absence by UUID
   * @param uuid - Absence UUID
   * @returns Promise with absence details
   */
  async getAbsenceById(uuid: string): Promise<ApiResponse<AbsenceDTO>> {
    return apiClient.get<ApiResponse<AbsenceDTO>>(`absences/admin/${uuid}`)
  }

  /**
   * [ADMIN] Validate or reject an absence
   * @param uuid - Absence UUID
   * @param data - Validation data
   * @returns Promise with updated absence
   */
  async validateAbsence(uuid: string, data: AbsenceValidationRequest): Promise<ApiResponse<AbsenceDTO>> {
    return apiClient.post<ApiResponse<AbsenceDTO>>(`absences/admin/${uuid}/validate`, data)
  }

  /**
   * [ADMIN] Reject an absence (convenience method)
   * @param uuid - Absence UUID
   * @param rejectionReason - Rejection reason
   * @returns Promise with updated absence
   */
  async rejectAbsence(uuid: string, rejectionReason?: string): Promise<ApiResponse<AbsenceDTO>> {
    return this.validateAbsence(uuid, { approved: false, rejectionReason })
  }

  /**
   * [ADMIN] Delete absence permanently
   * @param uuid - Absence UUID
   * @returns Promise with success message
   */
  async deleteAbsence(uuid: string): Promise<SuccessMessageResponse> {
    return apiClient.delete<SuccessMessageResponse>(`absences/admin/${uuid}`)
  }

  /**
   * [ADMIN] Get absence planning
   * @param params - Query parameters for period
   * @returns Promise with planning data
   */
  async getAbsencePlanning(params?: PlanningQueryParams): Promise<AbsencePlanningResponse> {
    const queryString = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return apiClient.get<AbsencePlanningResponse>(`absences/admin/planning${queryString}`)
  }
}

/**
 * Singleton instance of AbsencesService
 */
export const absencesService = new AbsencesService()
