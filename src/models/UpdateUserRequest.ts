/**
 * Requête de mise à jour d'un utilisateur
 */
export interface UpdateUserRequest {
  /** Prénom de l'utilisateur */
  firstName?: string;
  /** Nom de l'utilisateur */
  lastName?: string;
  /** Email de l'utilisateur */
  email?: string;
  /** Indique si l'utilisateur est actif */
  isActive?: boolean;
  /** UUID du rôle de l'utilisateur */
  roleUuid?: string;
  /** Indique si l'utilisateur a la permission couchette */
  isCouchette?: boolean;
}
