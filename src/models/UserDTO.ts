import { RoleDTO } from './RoleDTO';
import { NotificationPreferencesDTO } from './NotificationPreferencesDTO';
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
