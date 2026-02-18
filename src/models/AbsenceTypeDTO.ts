/**
 * Absence type DTO
 */
export interface AbsenceTypeDTO {
  uuid?: string;
  name?: string;
  color?: string;
  createdAt?: Date | string;
}

/**
 * Absence type create request
 */
export interface AbsenceTypeCreateRequest {
  name: string;
  color?: string;
}
