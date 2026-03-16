import type { AddressDTO } from './AddressDTO';

/**
 * Update profile request
 */
export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  picture?: string;
  /** Adresse de l'utilisateur */
  address?: AddressDTO;
  /** Numéro de permis de conduire */
  driverLicenseNumber?: string;
}
