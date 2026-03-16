import { apiClient } from '@/api'
import type { AbsenceDTO } from '@/models'

/**
 * Absence status enum
 */
export type AbsenceStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

/**
 * Absence create request (user)
 */
export interface AbsenceCreateRequest {
  startDate: string
  endDate: string
  reason?: string
  absenceTypeUuid?: string
  customType?: string
  period?: string
}

/**
 * Admin absence create request
 */
export interface AdminAbsenceCreateRequest {
  userUuid: string
  startDate: string
  endDate: string
  reason?: string
  absenceTypeUuid?: string
  customType?: string
  period?: string
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
export interface AbsenceSearchParams {
  startDate?: string
  endDate?: string
  status?: AbsenceStatus
  absenceTypeUuid?: string
  userUuid?: string
  page?: number
  size?: number
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  includePast?: boolean
}

/**
 * API response for a single absence
 */
export interface AbsenceResponse {
  success: boolean
  message?: string
  absence: AbsenceDTO
}

/**
 * API response for a list of absences (paginated)
 */
export interface AbsenceListResponse {
  success: boolean
  absences: AbsenceDTO[]
  totalPages: number
  totalElements: number
  currentPage: number
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
    name: string
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
  async createAbsenceRequest(data: AbsenceCreateRequest): Promise<AbsenceResponse> {
    return apiClient.post<AbsenceResponse>('absences', data)
  }

  /**
   * Get my absence requests with filters
   * @param filters - Search filters
   * @returns Promise with paginated absences
   */
  async getAbsences(filters?: AbsenceSearchParams): Promise<AbsenceListResponse> {
    return apiClient.post<AbsenceListResponse>('absences/my', filters || {})
  }

  /**
   * Cancel an absence request (if pending)
   * @param uuid - Absence UUID
   * @returns Promise with cancelled absence
   */
  async cancelAbsence(uuid: string): Promise<AbsenceResponse> {
    return apiClient.delete<AbsenceResponse>(`absences/${uuid}`)
  }

  // Admin methods

  /**
   * [ADMIN] Create absence for a user
   * @param data - Absence data with user UUID
   * @returns Promise with created absence
   */
  async createAbsenceForUser(data: AdminAbsenceCreateRequest): Promise<AbsenceResponse> {
    return apiClient.post<AbsenceResponse>('absences/admin/create', data)
  }

  /**
   * [ADMIN] Search and filter absences
   * @param filters - Search filters
   * @returns Promise with paginated absences
   */
  async searchAbsences(filters?: AbsenceSearchParams): Promise<AbsenceListResponse> {
    return apiClient.post<AbsenceListResponse>('absences/admin/search', filters || {})
  }

  /**
   * [ADMIN] Get absence by UUID
   * @param uuid - Absence UUID
   * @returns Promise with absence details
   */
  async getAbsenceById(uuid: string): Promise<AbsenceResponse> {
    return apiClient.get<AbsenceResponse>(`absences/admin/${uuid}`)
  }

  /**
   * [ADMIN] Validate or reject an absence
   * @param uuid - Absence UUID
   * @param data - Validation data
   * @returns Promise with updated absence
   */
  async validateAbsence(uuid: string, data: AbsenceValidationRequest): Promise<AbsenceResponse> {
    return apiClient.post<AbsenceResponse>(`absences/admin/${uuid}/validate`, data)
  }

  /**
   * [ADMIN] Reject an absence (convenience method)
   * @param uuid - Absence UUID
   * @param rejectionReason - Rejection reason
   * @returns Promise with updated absence
   */
  async rejectAbsence(uuid: string, rejectionReason?: string): Promise<AbsenceResponse> {
    return this.validateAbsence(uuid, { approved: false, rejectionReason })
  }

  /**
   * [ADMIN] Delete absence permanently
   * @param uuid - Absence UUID
   * @returns Promise with deleted absence
   */
  async deleteAbsence(uuid: string): Promise<AbsenceResponse> {
    return apiClient.delete<AbsenceResponse>(`absences/admin/${uuid}`)
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
