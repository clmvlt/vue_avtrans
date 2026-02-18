import { apiClient } from '@/api'
import type {
  VehiculeDTO,
  VehiculeKilometrageDTO,
  VehiculePictureDTO,
  VehiculeFileDTO,
  VehiculeAdjustInfoDTO
} from '@/models'
import type { SuccessMessageResponse } from '@/types'

/**
 * Vehicle create request
 */
export interface VehiculeCreateRequest {
  immat: string
  model: string
  brand: string
  comment?: string
}

/**
 * Vehicle update request
 */
export interface VehiculeUpdateRequest {
  immat?: string
  model?: string
  brand?: string
  comment?: string
}

/**
 * Kilometrage create request
 */
export interface KilometrageCreateRequest {
  vehiculeId: string
  km: number
}

/**
 * [ADMIN] Kilometrage create request with optional custom date
 */
export interface AdminKilometrageCreateRequest {
  vehiculeId: string
  km: number
  userUuid?: string
  createdAt?: string  // ISO 8601 format (e.g., "2025-01-15T14:20:00+01:00")
}

/**
 * [ADMIN] Kilometrage update request
 */
export interface AdminKilometrageUpdateRequest {
  km: number
  createdAt?: string  // ISO 8601 format
}

/**
 * Adjust info create request
 */
export interface AdjustInfoCreateRequest {
  vehiculeId: string
  comment: string
  picturesB64?: string[]
}

/**
 * Vehicle picture create request
 */
export interface VehiculePictureCreateRequest {
  pictureB64: string
}

// API Response interfaces matching actual API structure
export interface VehiculesListResponse {
  success: boolean
  vehicules: VehiculeDTO[]
}

export interface VehiculeResponse {
  success: boolean
  message?: string
  vehicule: VehiculeDTO
}

export interface KilometragesListResponse {
  success: boolean
  kilometrages: VehiculeKilometrageDTO[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface KilometrageResponse {
  success: boolean
  message?: string
  kilometrage: VehiculeKilometrageDTO
}

export interface PicturesListResponse {
  success: boolean
  pictures: VehiculePictureDTO[]
}

export interface PictureResponse {
  success: boolean
  message?: string
  picture: VehiculePictureDTO
}

export interface AdjustInfosListResponse {
  success: boolean
  adjustInfos: VehiculeAdjustInfoDTO[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface AdjustInfoResponse {
  success: boolean
  message?: string
  adjustInfo: VehiculeAdjustInfoDTO
}

/**
 * Vehicle file upload request
 */
export interface VehiculeFileUploadRequest {
  fileB64: string
  originalName: string
  mimeType: string
}

export interface FilesListResponse {
  success: boolean
  files: VehiculeFileDTO[]
}

export interface FileResponse {
  success: boolean
  message?: string
  file: VehiculeFileDTO
}

/**
 * Vehicle management service
 * Handles vehicle CRUD operations, kilometrage tracking, pictures, and adjustment info
 */
export class VehiclesService {
  /**
   * Get all vehicles
   * @returns Promise with list of vehicles
   */
  async getVehicles(): Promise<VehiculesListResponse> {
    return apiClient.get<VehiculesListResponse>('vehicules')
  }

  /**
   * Get vehicle by ID
   * @param id - Vehicle ID
   * @returns Promise with vehicle details
   */
  async getVehicleById(id: string): Promise<VehiculeResponse> {
    return apiClient.get<VehiculeResponse>(`vehicules/${id}`)
  }

  /**
   * [MECHANIC] Create vehicle
   * @param vehicleData - Vehicle data
   * @returns Promise with created vehicle
   */
  async createVehicle(vehicleData: VehiculeCreateRequest): Promise<VehiculeResponse> {
    return apiClient.post<VehiculeResponse>('vehicules', vehicleData)
  }

  /**
   * [MECHANIC] Update vehicle
   * @param id - Vehicle ID
   * @param vehicleData - Vehicle data to update
   * @returns Promise with updated vehicle
   */
  async updateVehicle(id: string, vehicleData: VehiculeUpdateRequest): Promise<VehiculeResponse> {
    return apiClient.put<VehiculeResponse>(`vehicules/${id}`, vehicleData)
  }

  /**
   * [MECHANIC] Delete vehicle
   * @param id - Vehicle ID
   * @returns Promise with success message
   */
  async deleteVehicle(id: string): Promise<SuccessMessageResponse> {
    return apiClient.delete<SuccessMessageResponse>(`vehicules/${id}`)
  }

  /**
   * Add vehicle kilometrage
   * @param data - Kilometrage data
   * @returns Promise with created kilometrage
   */
  async addKilometrage(data: KilometrageCreateRequest): Promise<KilometrageResponse> {
    return apiClient.post<KilometrageResponse>('vehicules/kilometrages', data)
  }

  /**
   * Get vehicle kilometrage history (paginated)
   * @param id - Vehicle ID
   * @param page - Page number (0-indexed)
   * @param size - Page size (max 300, use -1 to retrieve all)
   * @returns Promise with paginated list of kilometrages
   */
  async getKilometrageHistory(id: string, page: number = 0, size: number = -1): Promise<KilometragesListResponse> {
    return apiClient.get<KilometragesListResponse>(`vehicules/${id}/kilometrages?page=${page}&size=${size}`)
  }

  /**
   * [ADMIN] Add vehicle kilometrage with optional custom date/time
   * @param data - Kilometrage data with optional date
   * @returns Promise with created kilometrage
   */
  async addKilometrageAdmin(data: AdminKilometrageCreateRequest): Promise<KilometrageResponse> {
    return apiClient.post<KilometrageResponse>('vehicules/admin/kilometrages', data)
  }

  /**
   * [ADMIN] Update vehicle kilometrage
   * @param id - Kilometrage record UUID
   * @param data - Updated kilometrage data
   * @returns Promise with updated kilometrage
   */
  async updateKilometrageAdmin(id: string, data: AdminKilometrageUpdateRequest): Promise<KilometrageResponse> {
    return apiClient.put<KilometrageResponse>(`vehicules/admin/kilometrages/${id}`, data)
  }

  /**
   * [MECHANIC] Add vehicle picture
   * @param id - Vehicle ID
   * @param pictureData - Picture data (base64)
   * @returns Promise with created picture
   */
  async addPicture(id: string, pictureData: VehiculePictureCreateRequest): Promise<PictureResponse> {
    return apiClient.post<PictureResponse>(`vehicules/${id}/pictures`, pictureData)
  }

  /**
   * Get vehicle pictures
   * @param id - Vehicle ID
   * @returns Promise with list of pictures
   */
  async getVehiclePictures(id: string): Promise<PicturesListResponse> {
    return apiClient.get<PicturesListResponse>(`vehicules/${id}/pictures`)
  }

  /**
   * [MECHANIC] Delete vehicle picture
   * @param pictureId - Picture ID
   * @returns Promise with success message
   */
  async deletePicture(pictureId: string): Promise<SuccessMessageResponse> {
    return apiClient.delete<SuccessMessageResponse>(`vehicules/pictures/${pictureId}`)
  }

  /**
   * Get vehicle files (images, PDFs, documents)
   * @param id - Vehicle ID
   * @returns Promise with list of files
   */
  async getVehicleFiles(id: string): Promise<FilesListResponse> {
    return apiClient.get<FilesListResponse>(`vehicules/${id}/files`)
  }

  /**
   * [MECHANIC] Add file to vehicle
   * @param id - Vehicle ID
   * @param fileData - File data (base64, name, mime type)
   * @returns Promise with created file
   */
  async addFile(id: string, fileData: VehiculeFileUploadRequest): Promise<FileResponse> {
    return apiClient.post<FileResponse>(`vehicules/${id}/files`, fileData)
  }

  /**
   * [MECHANIC] Delete vehicle file
   * @param fileId - File ID
   * @returns Promise with success message
   */
  async deleteFile(fileId: string): Promise<SuccessMessageResponse> {
    return apiClient.delete<SuccessMessageResponse>(`vehicules/files/${fileId}`)
  }

  /**
   * Create vehicle adjustment info
   * @param data - Adjustment info data
   * @returns Promise with created adjustment info
   */
  async createAdjustInfo(data: AdjustInfoCreateRequest): Promise<AdjustInfoResponse> {
    return apiClient.post<AdjustInfoResponse>('vehicules/adjust-infos', data)
  }

  /**
   * Get vehicle adjustment info (paginated)
   * @param id - Vehicle ID
   * @param page - Page number (0-indexed)
   * @param size - Page size (max 50)
   * @returns Promise with paginated list of adjustment infos
   */
  async getAdjustInfo(id: string, page: number = 0, size: number = 10): Promise<AdjustInfosListResponse> {
    return apiClient.get<AdjustInfosListResponse>(`vehicules/${id}/adjust-infos?page=${page}&size=${size}`)
  }

  /**
   * Get adjustment info pictures
   * @param adjustInfoId - Adjustment info ID
   * @returns Promise with list of pictures
   */
  async getAdjustInfoPictures(adjustInfoId: string): Promise<PicturesListResponse> {
    return apiClient.get<PicturesListResponse>(`vehicules/adjust-infos/${adjustInfoId}/pictures`)
  }
}

/**
 * Singleton instance of VehiclesService
 */
export const vehiclesService = new VehiclesService()
