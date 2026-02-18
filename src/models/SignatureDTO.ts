import { UserDTO } from './UserDTO';

/**
 * Signature DTO
 */
export interface SignatureDTO {
  uuid?: string;
  signatureBase64?: string;
  date?: Date | string;
  heuresSignees?: number;
  user?: UserDTO;
  createdAt?: Date | string;
}

/**
 * Signature create request
 */
export interface SignatureCreateRequest {
  signatureBase64?: string;
  date?: Date | string;
  heuresSignees?: number;
}

/**
 * Last signature summary DTO
 */
export interface LastSignatureSummaryDTO {
  date?: Date | string;
  heuresSignees?: number;
  needsToSign?: boolean;
  heuresLastMonth?: number;
}

/**
 * User with last signature DTO
 */
export interface UserWithLastSignatureDTO {
  user?: UserDTO;
  lastSignature?: SignatureDTO;
}
