import type { AuthUserDTO } from './UserDTO'

/**
 * Login request
 */
export interface LoginRequest {
  email?: string
  password?: string
}

/**
 * Login response
 */
export interface LoginResponse {
  /** Success flag */
  success: boolean
  /** Response message */
  message: string
  /** User information with authentication token */
  user: AuthUserDTO
  /** Token expiration time in milliseconds */
  expiresIn?: number
  /** JWT authentication token (deprecated - now in user object) */
  token?: string
}

/**
 * Register request
 */
export interface RegisterRequest {
  email?: string
  password?: string
  firstName?: string
  lastName?: string
}

/**
 * Password reset request DTO
 */
export interface PasswordResetRequestDTO {
  email?: string
}

/**
 * Password reset confirm DTO
 */
export interface PasswordResetConfirmDTO {
  token?: string
  newPassword?: string
}

/**
 * Export request - Requête d'export des heures de travail
 */
export interface ExportRequest {
  /** Liste des UUIDs des utilisateurs à exporter */
  userUuids?: string[]
  /** Date de début de la période */
  startDate?: string
  /** Date de fin de la période */
  endDate?: string
}

/**
 * Register response - Réponse d'inscription
 */
export interface RegisterResponse {
  /** Indique si l'opération a réussi */
  success: boolean
  /** Message décrivant le résultat */
  message: string
  /** UUID de l'utilisateur créé */
  userId?: string
}

/**
 * Email verification response - Réponse de vérification d'email
 */
export interface EmailVerificationResponse {
  /** Indique si l'opération a réussi */
  success: boolean
  /** Message décrivant le résultat */
  message: string
  /** Email vérifié */
  email?: string
}
