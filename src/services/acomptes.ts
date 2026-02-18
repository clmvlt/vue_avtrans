import { apiClient } from '@/api'
import type { AcompteDTO } from '@/models'
import type { SuccessMessageResponse, ApiResponse, PaginationParams } from '@/types'

/**
 * Acompte status enum
 */
export type AcompteStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'PAID'

/**
 * Acompte create request
 */
export interface AcompteCreateRequest {
  montant: number
  raison?: string
}

/**
 * Admin acompte create request (legacy)
 */
export interface AdminAcompteCreateRequest extends AcompteCreateRequest {
  userUuid: string
  approved?: boolean
}

/**
 * Admin acompte create request for POST /acomptes/admin/new
 */
export interface AdminAcompteNewRequest {
  userUuid: string
  montant: number
  raison?: string
  approved?: boolean
}

/**
 * Acompte validation request
 */
export interface AcompteValidationRequest {
  approved: boolean
  rejectionReason?: string
}

/**
 * Acompte update request
 */
export interface AcompteUpdateRequest {
  montant?: number
  raison?: string
  isPaid?: boolean
}

/**
 * Acompte search filters
 */
export interface AcompteSearchParams extends PaginationParams {
  startDate?: string
  endDate?: string
  status?: AcompteStatus
  userUuid?: string
  montantMin?: number
  montantMax?: number
  isPaid?: boolean
  sortBy?: string
  sortDirection?: 'asc' | 'desc' | 'ASC' | 'DESC'
}

/**
 * Acompte search response from API
 */
export interface AcompteSearchResponse {
  success: boolean
  acomptes: AcompteDTO[]
  totalPages: number
  totalElements: number
  currentPage: number
}

/**
 * Advance payment request service
 * Handles acompte requests, validation, and management
 */
export class AcomptesService {
  /**
   * Create an advance payment request
   * @param data - Acompte data
   * @returns Promise with created acompte
   */
  async createAcompteRequest(data: AcompteCreateRequest): Promise<ApiResponse<AcompteDTO>> {
    return apiClient.post<ApiResponse<AcompteDTO>>('acomptes', data)
  }

  /**
   * Get my acompte requests with filters
   * @param filters - Search filters
   * @returns Promise with paginated acomptes
   */
  async getAcomptes(filters?: AcompteSearchParams): Promise<AcompteSearchResponse> {
    return apiClient.post<AcompteSearchResponse>('acomptes/my', filters || {})
  }

  /**
   * Cancel an acompte request (if pending)
   * @param uuid - Acompte UUID
   * @returns Promise with success message
   */
  async cancelAcompte(uuid: string): Promise<SuccessMessageResponse> {
    return apiClient.delete<SuccessMessageResponse>(`acomptes/${uuid}`)
  }

  // Admin methods

  /**
   * [ADMIN] Create acompte for a user
   * @param data - Acompte data with user UUID
   * @returns Promise with created acompte
   */
  async createAcompteForUser(data: AdminAcompteNewRequest): Promise<ApiResponse<AcompteDTO>> {
    return apiClient.post<ApiResponse<AcompteDTO>>('acomptes/admin/new', data)
  }

  /**
   * [ADMIN] Search and filter acomptes
   * @param filters - Search filters
   * @returns Promise with acomptes search response
   */
  async searchAcomptes(filters?: AcompteSearchParams): Promise<AcompteSearchResponse> {
    return apiClient.post<AcompteSearchResponse>('acomptes/admin/search', filters || {})
  }

  /**
   * [ADMIN] Get acompte by UUID
   * @param uuid - Acompte UUID
   * @returns Promise with acompte details
   */
  async getAcompteById(uuid: string): Promise<ApiResponse<AcompteDTO>> {
    return apiClient.get<ApiResponse<AcompteDTO>>(`acomptes/admin/${uuid}`)
  }

  /**
   * [ADMIN] Update acompte
   * @param uuid - Acompte UUID
   * @param data - Acompte data to update
   * @returns Promise with updated acompte
   */
  async updateAcompte(uuid: string, data: AcompteUpdateRequest): Promise<ApiResponse<AcompteDTO>> {
    return apiClient.put<ApiResponse<AcompteDTO>>(`acomptes/admin/${uuid}`, data)
  }

  /**
   * [ADMIN] Validate or reject an acompte
   * @param uuid - Acompte UUID
   * @param data - Validation data
   * @returns Promise with updated acompte
   */
  async validateAcompte(uuid: string, data: AcompteValidationRequest): Promise<ApiResponse<AcompteDTO>> {
    return apiClient.post<ApiResponse<AcompteDTO>>(`acomptes/admin/${uuid}/validate`, data)
  }

  /**
   * [ADMIN] Reject an acompte (convenience method)
   * @param uuid - Acompte UUID
   * @param rejectionReason - Rejection reason
   * @returns Promise with updated acompte
   */
  async rejectAcompte(uuid: string, rejectionReason?: string): Promise<ApiResponse<AcompteDTO>> {
    return this.validateAcompte(uuid, { approved: false, rejectionReason })
  }

  /**
   * [ADMIN] Delete acompte permanently
   * @param uuid - Acompte UUID
   * @returns Promise with success message
   */
  async deleteAcompte(uuid: string): Promise<SuccessMessageResponse> {
    return apiClient.delete<SuccessMessageResponse>(`acomptes/admin/${uuid}`)
  }
}

/**
 * Singleton instance of AcomptesService
 */
export const acomptesService = new AcomptesService()
