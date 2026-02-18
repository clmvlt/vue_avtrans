/**
 * Changelog data with role-based visibility
 *
 * Role hierarchy:
 * - 'all': visible to everyone
 * - 'user': visible to user, mechanic, admin
 * - 'mechanic': visible to mechanic, admin only
 * - 'admin': visible to admin only
 */

export type ChangeRole = 'all' | 'user' | 'mechanic' | 'admin'
export type ChangeType = 'feature' | 'fix' | 'improvement'

export interface Change {
  role: ChangeRole
  type: ChangeType
  description: string
}

export interface ChangelogEntry {
  version: string
  date: string
  changes: Change[]
}

export const changelog: ChangelogEntry[] = [
  {
    version: '0.0.26',
    date: '2026-02-04',
    changes: [
      { role: 'all', type: 'feature', description: 'Ajout du système de nouveautés.' },
      { role: 'all', type: 'feature', description: 'Mode sombre disponible.' },
      { role: 'all', type: 'fix', description: 'Correction de la navbar sur moible et pc.' },
      { role: 'admin', type: 'feature', description: 'Ajout du clic droit pour accéder aux actions contextuelles.' },
      { role: 'admin', type: 'feature', description: 'Adaptation complète du site sur mobile.' },
      { role: 'all', type: 'fix', description: 'Correction des heures qui continuaient de tourner en pause.' },
    ]
  }
]
