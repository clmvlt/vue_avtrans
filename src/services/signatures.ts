import { apiClient } from '@/api'
import type { SignatureDTO } from '@/models'
import type { SuccessMessageResponse, ApiResponse } from '@/types'

/**
 * Signature create request
 */
export interface SignatureCreateRequest {
  signatureImage: string
  latitude?: number
  longitude?: number
}

/**
 * User with last signature DTO
 */
export interface UserWithLastSignatureDTO {
  user: {
    uuid: string
    firstName: string
    lastName: string
    email: string
    role: {
      uuid: string
      nom: string
      color?: string
    }
  }
  lastSignature?: SignatureDTO
}

/**
 * Signature summary DTO (without base64 image)
 */
export interface SignatureSummaryDTO {
  uuid: string
  date: string
  location?: {
    latitude: number
    longitude: number
  }
}

/**
 * Digital signatures service
 * Handles signature creation, retrieval, and management
 */
export class SignaturesService {
  /**
   * Create a signature
   * @param data - Signature data with base64 image
   * @returns Promise with created signature
   */
  async createSignature(data: SignatureCreateRequest): Promise<ApiResponse<SignatureDTO>> {
    return apiClient.post<ApiResponse<SignatureDTO>>('signatures', data)
  }

  /**
   * Get all my signatures
   * @returns Promise with list of signatures
   */
  async getSignatures(): Promise<ApiResponse<SignatureDTO[]>> {
    return apiClient.get<ApiResponse<SignatureDTO[]>>('signatures')
  }

  /**
   * Get my last signature with Base64 image
   * @returns Promise with last signature (includes full image data)
   */
  async getLastSignature(): Promise<ApiResponse<SignatureDTO>> {
    return apiClient.get<ApiResponse<SignatureDTO>>('signatures/last')
  }

  /**
   * Get my last signature summary (without Base64 image)
   * @returns Promise with last signature summary
   */
  async getLastSignatureSummary(): Promise<ApiResponse<SignatureSummaryDTO>> {
    return apiClient.get<ApiResponse<SignatureSummaryDTO>>('signatures/last/summary')
  }

  /**
   * Get signature history for current user
   * @returns Promise with list of signatures
   */
  async getSignatureHistory(): Promise<ApiResponse<SignatureDTO[]>> {
    return this.getSignatures()
  }

  // Admin methods

  /**
   * [ADMIN] Get all users with their last signature
   * @returns Promise with list of users and their last signatures
   */
  async getAllSignatures(): Promise<ApiResponse<UserWithLastSignatureDTO[]>> {
    return apiClient.get<ApiResponse<UserWithLastSignatureDTO[]>>('signatures/all-users')
  }

  /**
   * [ADMIN] Get signatures for a specific user
   * @param userUuid - User UUID
   * @returns Promise with list of user signatures
   */
  async getUserSignatures(userUuid: string): Promise<ApiResponse<SignatureDTO[]>> {
    return apiClient.get<ApiResponse<SignatureDTO[]>>(`signatures/user/${userUuid}`)
  }

  /**
   * [ADMIN] Delete signature
   * @param signatureUuid - Signature UUID
   * @returns Promise with success message
   */
  async deleteSignature(signatureUuid: string): Promise<SuccessMessageResponse> {
    return apiClient.delete<SuccessMessageResponse>(`signatures/${signatureUuid}`)
  }
}

/**
 * Singleton instance of SignaturesService
 */
export const signaturesService = new SignaturesService()
