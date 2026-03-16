import type { AddressDTO } from './AddressDTO';

/**
 * Requête de mise à jour d'un utilisateur
 * PUT /users/{uuid}
 */
export interface UpdateUserRequest {
  /** Prénom de l'utilisateur */
  firstName?: string;
  /** Nom de l'utilisateur */
  lastName?: string;
  /** Indique si l'utilisateur est actif */
  isActive?: boolean;
  /** UUID du rôle de l'utilisateur */
  roleUuid?: string;
  /** Indique si l'utilisateur a la permission couchette */
  isCouchette?: boolean;
  /** Adresse de l'utilisateur */
  address?: AddressDTO;
  /** Numéro de permis de conduire */
  driverLicenseNumber?: string;
  /** Heures mensuelles du contrat */
  heureContrat?: number | null;
}
