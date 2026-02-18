import { createRouter, createWebHistory, type RouteRecordRaw, type NavigationGuardNext, type RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    requiresAdmin?: boolean
    requiresMechanic?: boolean
    requiresCouchette?: boolean
  }
}

/**
 * Returns the default route based on user role
 */
const getDefaultRoute = (): string => {
  const authStore = useAuthStore()

  if (authStore.isAdmin) {
    return '/users'
  }
  if (authStore.isMechanic) {
    return '/vehicules'
  }
  // Regular users
  return '/pointage'
}

const routes: RouteRecordRaw[] = [
  // Common routes
  {
    path: '/',
    redirect: () => getDefaultRoute()
  },
  {
    path: '/unauthorized',
    name: 'Unauthorized',
    component: () => import('../views/common/Unauthorized.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/services',
    name: 'ServicesMonitoring',
    component: () => import('../views/common/ServicesMonitoring.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: () => import('../views/common/Notifications.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/common/Profile.vue'),
    meta: { requiresAuth: true }
  },

  // Authentication routes
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/auth/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/auth/Register.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/verify',
    name: 'Verify',
    component: () => import('../views/auth/Verify.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('../views/auth/ForgotPassword.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/password-reset',
    name: 'PasswordReset',
    component: () => import('../views/auth/ResetPassword.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/add-to-homescreen',
    name: 'AddToHomescreen',
    component: () => import('../views/auth/AddToHomescreen.vue'),
    meta: { requiresAuth: true }
  },

  // User management routes
  {
    path: '/users',
    name: 'Users',
    component: () => import('../views/users/Users.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/users/:uuid',
    name: 'UserEdit',
    component: () => import('../views/users/UserEdit.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/users/:uuid/services',
    name: 'UserServices',
    component: () => import('../views/users/UserServices.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },

  // Absence management routes
  {
    path: '/absences',
    name: 'Absences',
    component: () => import('../views/absences/Absences.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/absence-types',
    name: 'AbsenceTypes',
    component: () => import('../views/absences/AbsenceTypes.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/myabsences',
    name: 'MyAbsences',
    component: () => import('../views/myabsences/MyAbsences.vue'),
    meta: { requiresAuth: true }
  },

  // Hours tracking routes
  {
    path: '/planning',
    name: 'Planning',
    component: () => import('../views/hours/Planning.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/heures',
    name: 'Heures',
    component: () => import('../views/hours/Heures.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/export-hours',
    name: 'ExportHours',
    component: () => import('../views/hours/ExportHours.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/pointage',
    name: 'Pointage',
    component: () => import('../views/hours/Pointage.vue'),
    meta: { requiresAuth: true }
  },

  // Acomptes routes
  {
    path: '/acomptes',
    name: 'Acomptes',
    component: () => import('../views/acomptes/Acomptes.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/myacomptes',
    name: 'MyAcomptes',
    component: () => import('../views/acomptes/MyAcomptes.vue'),
    meta: { requiresAuth: true }
  },

  // Signatures routes
  {
    path: '/signatures',
    name: 'Signatures',
    component: () => import('../views/signatures/Signatures.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },

  // Vehicle management routes
  {
    path: '/vehicules',
    name: 'Vehicules',
    component: () => import('../views/vehicles/Vehicules.vue'),
    meta: { requiresAuth: true, requiresMechanic: true }
  },
  {
    path: '/vehicules/:id',
    name: 'VehiculeDetail',
    component: () => import('../views/vehicles/VehiculeDetail.vue'),
    meta: { requiresAuth: true, requiresMechanic: true }
  },

  // Maintenance routes
  {
    path: '/types-entretien',
    name: 'TypesEntretien',
    component: () => import('../views/maintenance/TypesEntretien.vue'),
    meta: { requiresAuth: true, requiresMechanic: true }
  },
  {
    path: '/entretiens',
    name: 'Entretiens',
    component: () => import('../views/maintenance/Entretiens.vue'),
    meta: { requiresAuth: true, requiresMechanic: true }
  },
  {
    path: '/entretiens/vehicule/:id',
    name: 'EntretiensVehicule',
    component: () => import('../views/maintenance/EntretiensVehicule.vue'),
    meta: { requiresAuth: true, requiresMechanic: true }
  },

  // Stock routes
  {
    path: '/stock',
    name: 'Stock',
    component: () => import('../views/stock/StockItems.vue'),
    meta: { requiresAuth: true, requiresMechanic: true }
  },

  // Couchettes routes
  {
    path: '/couchettes',
    name: 'Couchettes',
    component: () => import('../views/couchettes/Couchettes.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },

  // App Versions routes
  {
    path: '/download',
    name: 'AppDownload',
    component: () => import('../views/app-versions/AppVersionsPublic.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/app-versions',
    name: 'AppVersions',
    component: () => import('../views/app-versions/AppVersions.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },

  // Todos route (accessible to Admin and Mechanic)
  {
    path: '/todos',
    name: 'Todos',
    component: () => import('../views/todos/Todos.vue'),
    meta: { requiresAuth: true, requiresMechanic: true }
  },
  {
    path: '/mycouchettes',
    name: 'MesCouchettes',
    component: () => import('../views/couchettes/MesCouchettes.vue'),
    meta: { requiresAuth: true, requiresCouchette: true }
  },

  // Cartes routes (Admin only)
  {
    path: '/cartes',
    name: 'Cartes',
    component: () => import('../views/cartes/Cartes.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/types-cartes',
    name: 'TypesCartes',
    component: () => import('../views/cartes/TypesCartes.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },

  // 404 route - must be last
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/common/NotFound.vue'),
    meta: { requiresAuth: false }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard pour vérifier l'authentification et les rôles
router.beforeEach((
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const authStore = useAuthStore()

  // Si la route nécessite une authentification
  if (to.meta.requiresAuth) {
    // Vérifier si l'utilisateur est connecté
    if (!authStore.isAuthenticated) {
      next('/login')
      return
    }

    // Vérifier si l'email est vérifié
    if (!authStore.isEmailVerified) {
      authStore.logout()
      next('/login')
      return
    }

    // Vérifier si l'utilisateur est actif (isActif = true)
    if (!authStore.isActive) {
      next('/unauthorized')
      return
    }

    // Vérifier si la route nécessite les droits admin
    if (to.meta.requiresAdmin) {
      if (!authStore.isAdmin) {
        next('/unauthorized')
        return
      }
      // Si en mode vue utilisateur et accès à une page admin, désactiver le mode
      if (authStore.viewAsUser) {
        authStore.setViewMode(false)
      }
    }

    // Vérifier si la route nécessite les droits mechanic (admin OU mécanicien)
    if (to.meta.requiresMechanic) {
      if (!authStore.isAdmin && !authStore.isMechanic) {
        next('/unauthorized')
        return
      }
    }

    // Vérifier si la route nécessite la permission couchette
    if (to.meta.requiresCouchette) {
      if (!authStore.hasCouchettePermission) {
        next('/unauthorized')
        return
      }
    }
  }

  // Si l'utilisateur est connecté et essaie d'accéder à login/register
  if (authStore.isAuthenticated && (to.name === 'Login' || to.name === 'Register')) {
    next(getDefaultRoute())
    return
  }

  next()
})

export default router
