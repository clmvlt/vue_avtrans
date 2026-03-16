import { UserDTO } from './UserDTO';
import { AbsenceTypeDTO } from './AbsenceTypeDTO';

/**
 * Absence DTO
 */
export interface AbsenceDTO {
  uuid?: string;
  user?: UserDTO;
  startDate?: string;
  endDate?: string;
  reason?: string;
  absenceType?: AbsenceTypeDTO;
  customType?: string;
  period?: string;
  status?: string;
  validatedBy?: UserDTO;
  validatedAt?: Date | string;
  rejectionReason?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * Absence create request
 */
export interface AbsenceCreateRequest {
  startDate: string;
  endDate: string;
  reason?: string;
  absenceTypeUuid?: string;
  customType?: string;
  period?: string;
}

/**
 * Admin absence create request
 */
export interface AdminAbsenceCreateRequest {
  userUuid: string;
  startDate: string;
  endDate: string;
  reason?: string;
  absenceTypeUuid?: string;
  customType?: string;
  period?: string;
  approved?: boolean;
}

/**
 * Absence validation request
 */
export interface AbsenceValidationRequest {
  approved: boolean;
  rejectionReason?: string;
}

/**
 * Absence search request
 */
export interface AbsenceSearchRequest {
  startDate?: string;
  endDate?: string;
  status?: string;
  absenceTypeUuid?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: string;
  includePast?: boolean;
}

/**
 * Planning user DTO
 */
export interface PlanningUserDTO {
  uuid?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: import('./RoleDTO').RoleDTO;
  pictureUrl?: string;
  /** Indique si l'utilisateur a la permission couchette */
  isCouchette?: boolean;
  absences?: AbsenceDTO[];
}
