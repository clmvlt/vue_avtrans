import { apiClient } from '@/api'
import type { RapportVehiculeDTO } from '@/models'
import type { SuccessMessageResponse, ApiResponse } from '@/types'

/**
 * Vehicle report create request
 */
export interface RapportVehiculeCreateRequest {
  vehiculeId: string
  commentaire: string
  picturesB64?: string[]
}

/**
 * Vehicle report picture DTO
 */
export interface RapportPictureDTO {
  id: string
  pictureUrl: string
  createdAt: string
}

/**
 * Vehicle report picture create request
 */
export interface RapportPictureCreateRequest {
  pictureB64: string
}

/**
 * Paginated response for vehicle reports
 */
export interface RapportsListResponse {
  success: boolean
  message?: string
  data: RapportVehiculeDTO[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

/**
 * Vehicle reports service
 * Handles vehicle inspection reports and pictures
 */
export class RapportsService {
  /**
   * Create a vehicle report
   * @param data - Report data
   * @returns Promise with created report
   */
  async createRapport(data: RapportVehiculeCreateRequest): Promise<ApiResponse<RapportVehiculeDTO>> {
    return apiClient.post<ApiResponse<RapportVehiculeDTO>>('rapports', data)
  }

  /**
   * Get current user's latest report
   * @returns Promise with latest report
   */
  async getMyLatestRapport(): Promise<ApiResponse<RapportVehiculeDTO>> {
    return apiClient.get<ApiResponse<RapportVehiculeDTO>>('rapports/me/latest')
  }

  /**
   * [MECHANIC] Get all reports for a vehicle (paginated)
   * @param vehiculeId - Vehicle ID
   * @param page - Page number (0-indexed)
   * @param size - Page size (max 50, use -1 to retrieve all)
   * @returns Promise with paginated list of reports
   */
  async getRapports(vehiculeId: string, page: number = 0, size: number = 10): Promise<RapportsListResponse> {
    return apiClient.get<RapportsListResponse>(`rapports/${vehiculeId}?page=${page}&size=${size}`)
  }

  /**
   * Get report by ID
   * @param id - Report ID
   * @returns Promise with report details
   */
  async getRapportById(id: string): Promise<ApiResponse<RapportVehiculeDTO>> {
    return apiClient.get<ApiResponse<RapportVehiculeDTO>>(`rapports/${id}`)
  }

  /**
   * Get report pictures
   * @param id - Report ID
   * @returns Promise with list of pictures
   */
  async getRapportPictures(id: string): Promise<ApiResponse<RapportPictureDTO[]>> {
    return apiClient.get<ApiResponse<RapportPictureDTO[]>>(`rapports/${id}/pictures`)
  }

  /**
   * Add picture to a report
   * @param id - Report ID
   * @param pictureData - Picture data (base64)
   * @returns Promise with created picture
   */
  async addPicture(id: string, pictureData: RapportPictureCreateRequest): Promise<ApiResponse<RapportPictureDTO>> {
    return apiClient.post<ApiResponse<RapportPictureDTO>>(`rapports/${id}/pictures`, pictureData)
  }

  /**
   * [MECHANIC] Delete report picture
   * @param pictureId - Picture ID
   * @returns Promise with success message
   */
  async deletePicture(pictureId: string): Promise<SuccessMessageResponse> {
    return apiClient.delete<SuccessMessageResponse>(`rapports/pictures/${pictureId}`)
  }
}

/**
 * Singleton instance of RapportsService
 */
export const rapportsService = new RapportsService()
