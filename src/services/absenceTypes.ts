import { apiClient } from '@/api'
import type { AbsenceTypeDTO } from '@/models'
import type { SuccessMessageResponse, ApiResponse } from '@/types'

/**
 * Absence type create request
 */
export interface AbsenceTypeCreateRequest {
  name: string
  description?: string
  color?: string
}

/**
 * Absence type update request
 */
export interface AbsenceTypeUpdateRequest {
  name?: string
  description?: string
  color?: string
  isActive?: boolean
}

/**
 * Absence types service
 * Handles CRUD operations for absence type definitions
 */
export class AbsenceTypesService {
  /**
   * Get all absence types
   * @returns Promise with list of absence types
   */
  async getAbsenceTypes(): Promise<ApiResponse<AbsenceTypeDTO[]>> {
    return apiClient.get<ApiResponse<AbsenceTypeDTO[]>>('absence-types')
  }

  /**
   * Get absence type by UUID
   * @param uuid - Absence type UUID
   * @returns Promise with absence type details
   */
  async getTypeById(uuid: string): Promise<ApiResponse<AbsenceTypeDTO>> {
    return apiClient.get<ApiResponse<AbsenceTypeDTO>>(`absence-types/${uuid}`)
  }

  /**
   * [ADMIN] Create absence type
   * @param data - Absence type data
   * @returns Promise with created absence type
   */
  async createType(data: AbsenceTypeCreateRequest): Promise<ApiResponse<AbsenceTypeDTO>> {
    return apiClient.post<ApiResponse<AbsenceTypeDTO>>('absence-types', data)
  }

  /**
   * [ADMIN] Update absence type
   * @param uuid - Absence type UUID
   * @param data - Absence type data to update
   * @returns Promise with updated absence type
   */
  async updateType(uuid: string, data: AbsenceTypeUpdateRequest): Promise<ApiResponse<AbsenceTypeDTO>> {
    return apiClient.put<ApiResponse<AbsenceTypeDTO>>(`absence-types/${uuid}`, data)
  }

  /**
   * [ADMIN] Delete absence type
   * @param uuid - Absence type UUID
   * @returns Promise with success message
   */
  async deleteType(uuid: string): Promise<SuccessMessageResponse> {
    return apiClient.delete<SuccessMessageResponse>(`absence-types/${uuid}`)
  }
}

/**
 * Singleton instance of AbsenceTypesService
 */
export const absenceTypesService = new AbsenceTypesService()
