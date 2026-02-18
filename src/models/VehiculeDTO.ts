/**
 * DTO représentant un véhicule avec ses informations de base et le kilométrage le plus récent
 */
export interface VehiculeDTO {
  /** Identifiant unique du véhicule */
  id?: string;
  /** Immatriculation du véhicule */
  immat?: string;
  /** Date de création du véhicule */
  createdAt?: Date | string;
  /** Modèle du véhicule */
  model?: string;
  /** Marque du véhicule */
  brand?: string;
  /** Commentaire optionnel */
  comment?: string;
  /** Kilométrage le plus récent enregistré */
  latestKm?: number;
  /** Date du kilométrage le plus récent */
  latestKmDate?: Date | string;
  /** URL de la photo de profil du véhicule */
  pictureUrl?: string;
}

/**
 * Requête pour créer un nouveau véhicule
 */
export interface VehiculeCreateRequest {
  /** Immatriculation du véhicule */
  immat?: string;
  /** Modèle du véhicule */
  model?: string;
  /** Marque du véhicule */
  brand?: string;
  /** Commentaire optionnel */
  comment?: string;
  /** Photo de profil en base64 */
  pictureBase64?: string;
}

/**
 * Requête pour modifier un véhicule existant
 */
export interface VehiculeUpdateRequest {
  /** Immatriculation du véhicule */
  immat?: string;
  /** Modèle du véhicule */
  model?: string;
  /** Marque du véhicule */
  brand?: string;
  /** Commentaire optionnel */
  comment?: string;
  /** Photo de profil en base64 */
  pictureBase64?: string;
}
