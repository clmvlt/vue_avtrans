import { UserDTO } from './UserDTO';

/**
 * Notification DTO
 */
export interface NotificationDTO {
  uuid?: string;
  user?: UserDTO;
  title?: string;
  description?: string;
  createdAt?: Date | string;
  isRead?: boolean;
  refType?: string;
  refId?: string;
}

/**
 * Request to create a notification
 */
export interface NotificationCreateRequest {
  /** Notification title */
  title: string;
  /** Notification description */
  description: string;
  /** Reference type (e.g., 'entretien', 'absence', 'acompte') */
  refType?: string;
  /** Reference ID (UUID as string) */
  refId?: string;
}
