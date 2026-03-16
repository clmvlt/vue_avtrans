import { RoleDTO } from './RoleDTO';
import { NotificationPreferencesDTO } from './NotificationPreferencesDTO';
import { AddressDTO } from './AddressDTO';
import { UserStatus } from '../enums';

/**
 * User DTO
 */
export interface UserDTO {
  uuid?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  isMailVerified?: boolean;
  isActive?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  role?: RoleDTO;
  pictureUrl?: string;
  /** Indique si l'utilisateur a la permission couchette */
  isCouchette?: boolean;
  /** Préférences de notification de l'utilisateur */
  notificationPreferences?: NotificationPreferencesDTO;
  /** Statut de présence de l'utilisateur */
  status?: UserStatus;
  /** Adresse de l'utilisateur */
  address?: AddressDTO;
  /** Numéro de permis de conduire */
  driverLicenseNumber?: string;
  /** Heures mensuelles du contrat */
  heureContrat?: number | null;
}

/**
 * Authenticated User DTO (includes token)
 * Used only in /auth/login and /auth/me responses
 */
export interface AuthUserDTO extends UserDTO {
  token?: string;
  /** Indique si l'utilisateur a la permission couchette (redéclaré pour clarté) */
  isCouchette?: boolean;
}
