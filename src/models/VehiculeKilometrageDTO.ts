import { UserDTO } from './UserDTO';

/**
 * DTO représentant un relevé de kilométrage
 */
export interface VehiculeKilometrageDTO {
  /** Identifiant unique du relevé */
  id?: string;
  /** Identifiant du véhicule */
  vehiculeId?: string;
  /** Kilométrage relevé */
  km?: number;
  user?: UserDTO;
  /** Date du relevé */
  createdAt?: Date | string;
}

/**
 * Réponse paginée pour les kilométrages
 */
export interface VehiculeKilometragePageResponse {
  success: boolean;
  kilometrages: VehiculeKilometrageDTO[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/**
 * Requête pour enregistrer un nouveau kilométrage
 */
export interface VehiculeKilometrageCreateRequest {
  /** Identifiant du véhicule */
  vehiculeId?: string;
  /** Kilométrage à enregistrer */
  km?: number;
}

/**
 * Réponse pour le dernier kilométrage de l'utilisateur connecté
 */
export interface UserLastKilometrageResponse {
  /** Dernier relevé de kilométrage de l'utilisateur */
  lastKilometrage: VehiculeKilometrageDTO | null;
  /** Indique si l'utilisateur a déjà saisi un kilométrage aujourd'hui */
  hasEnteredToday: boolean;
}
