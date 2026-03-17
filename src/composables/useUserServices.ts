/**
 * Composable pour gérer les services utilisateur
 */
import { ref, computed } from 'vue'
import { userServicesService } from '@/services/userServices'
import { usersService } from '@/services/users'

export interface ServiceFilters {
  startDate: string
  endDate: string
  isBreak: boolean | null
  isBreakString: string
  sortBy: string
  sortDirection: 'asc' | 'desc'
}

// Options pour le filtre type (pause/service)
export const typeFilterOptions = [
  { value: 'all', label: 'Tous' },
  { value: 'service', label: 'Services' },
  { value: 'pause', label: 'Pauses' }
]

export interface Pagination {
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export interface ServiceFormData {
  debutDate: string
  debutTime: string
  finDate: string
  finTime: string
  latitude: number | null
  longitude: number | null
  latitudeEnd: number | null
  longitudeEnd: number | null
  isBreak: boolean
}

export interface UserData {
  firstName: string
  lastName: string
  pictureUrl: string | null
  email: string
}

export const useUserServices = (userUuid: string) => {
  // État
  const services = ref<any[]>([])
  const loading = ref(false)
  const error = ref('')
  const userName = ref('')
  const userData = ref<UserData | null>(null)

  // Statut utilisateur
  const userStatus = ref<string>('ABSENT')
  const activeServiceStart = ref<string | null>(null)
  const activeServiceUuid = ref<string | null>(null)
  const actionLoading = ref(false)

  // Filtres
  const showFilters = ref(false)
  const searchFilters = ref<ServiceFilters>({
    startDate: '',
    endDate: '',
    isBreak: null,
    isBreakString: 'all',
    sortBy: 'debut',
    sortDirection: 'desc'
  })

  // Pagination
  const pagination = ref<Pagination>({
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true
  })

  // Computed
  const hasActiveFilters = computed(() => {
    return searchFilters.value.startDate !== '' ||
           searchFilters.value.endDate !== '' ||
           searchFilters.value.isBreakString !== 'all'
  })

  const servicesByDay = computed(() => {
    const grouped: Record<string, { date: string; services: any[] }> = {}

    services.value.forEach(service => {
      const date = new Date(service.debut)
      const dateKey = date.toISOString().split('T')[0] || ''

      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: dateKey,
          services: []
        }
      }

      grouped[dateKey].services.push(service)
    })

    return Object.values(grouped)
      .map(day => {
        const date = new Date(day.date)

        // Tri chronologique mixte (services + pauses mélangés)
        const allServices = [...day.services]
          .sort((a: any, b: any) => new Date(a.debut).getTime() - new Date(b.debut).getTime())

        const workSeconds = day.services
          .filter((s: any) => !s.isBreak)
          .reduce((sum: number, s: any) => sum + (s.duree || 0), 0)
        const breakSeconds = day.services
          .filter((s: any) => s.isBreak)
          .reduce((sum: number, s: any) => sum + (s.duree || 0), 0)
        const totalSeconds = workSeconds - breakSeconds

        const hours = Math.floor(totalSeconds / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const totalHours = minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`

        return {
          date: day.date,
          dayName: date.toLocaleDateString('fr-FR', { weekday: 'long' }),
          dateFormatted: date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
          allServices,
          totalHours,
          totalSeconds
        }
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  })

  // Méthodes
  const loadUserData = async () => {
    try {
      const response = await usersService.getUserById(userUuid)
      // L'API peut retourner soit { data: UserDTO } soit directement UserDTO
      const responseAny = response as any
      const user = responseAny.data || responseAny

      if (user && (user.uuid || user.email)) {
        userName.value = `${user.firstName || ''} ${user.lastName || ''}`
        userData.value = {
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          pictureUrl: user.pictureUrl || null,
          email: user.email || ''
        }
      }
    } catch (err: any) {
      console.error('Error loading user:', err)
    }
  }

  const loadUserStatus = async () => {
    try {
      const response = await userServicesService.getActiveService(userUuid)
      const service = response?.service

      if (response?.success && service) {
        // Service actif trouvé - déterminer si c'est une pause ou un service
        if (service.isBreak) {
          userStatus.value = 'ON_BREAK'
        } else {
          userStatus.value = 'PRESENT'
        }
        activeServiceStart.value = service.debut
        activeServiceUuid.value = service.uuid
      } else {
        // Pas de service actif = absent
        userStatus.value = 'ABSENT'
        activeServiceStart.value = null
        activeServiceUuid.value = null
      }
    } catch (err: any) {
      console.error('Error loading user status:', err)
      // En cas d'erreur (404 par exemple), considérer comme absent
      userStatus.value = 'ABSENT'
      activeServiceStart.value = null
      activeServiceUuid.value = null
    }
  }

  const loadServices = async (page = 0) => {
    try {
      loading.value = true
      error.value = ''

      // Convertir isBreakString en isBreak boolean
      let isBreak: boolean | null = null
      if (searchFilters.value.isBreakString === 'pause') isBreak = true
      else if (searchFilters.value.isBreakString === 'service') isBreak = false

      const filters: any = {
        page: page,
        size: pagination.value.size,
        sortBy: searchFilters.value.sortBy,
        sortDirection: searchFilters.value.sortDirection
      }

      if (searchFilters.value.startDate) {
        filters.startDate = `${searchFilters.value.startDate}T00:00:00`
      }
      if (searchFilters.value.endDate) {
        filters.endDate = `${searchFilters.value.endDate}T23:59:59`
      }
      if (isBreak !== null) {
        filters.isBreak = isBreak
      }

      const response = await userServicesService.searchServices(userUuid, filters)
      services.value = response.content
      pagination.value = {
        page: response.page,
        size: response.size,
        totalElements: response.totalElements,
        totalPages: response.totalPages,
        first: response.page === 0,
        last: response.page === response.totalPages - 1
      }
    } catch (err: any) {
      console.error('Error loading services:', err)
      error.value = 'Erreur lors du chargement des services'
    } finally {
      loading.value = false
    }
  }

  const applyFilters = () => {
    loadServices(0)
  }

  const resetFilters = () => {
    searchFilters.value = {
      startDate: '',
      endDate: '',
      isBreak: null,
      isBreakString: 'all',
      sortBy: 'debut',
      sortDirection: 'desc'
    }
    loadServices(0)
  }

  const goToPage = (page: number) => {
    if (page >= 0 && page < pagination.value.totalPages) {
      loadServices(page)
    }
  }

  // Fonction utilitaire pour obtenir la date/heure actuelle en format ISO
  const getCurrentDateTime = () => {
    return new Date().toISOString()
  }

  const startService = async () => {
    try {
      actionLoading.value = true
      // Créer un nouveau service pour l'utilisateur administré
      await userServicesService.createService({
        userUuid,
        debut: getCurrentDateTime()
      })
      await loadUserStatus()
      await loadServices()
    } catch (err: any) {
      console.error('Error starting service:', err)
      error.value = 'Erreur lors du démarrage du service'
    } finally {
      actionLoading.value = false
    }
  }

  const endService = async () => {
    try {
      actionLoading.value = true
      if (!activeServiceUuid.value) return
      // Mettre à jour le service actif avec une date de fin
      await userServicesService.validateService(activeServiceUuid.value, {
        fin: getCurrentDateTime()
      })
      await loadUserStatus()
      await loadServices()
    } catch (err: any) {
      console.error('Error ending service:', err)
      error.value = 'Erreur lors de la fin du service'
    } finally {
      actionLoading.value = false
    }
  }

  const startBreak = async () => {
    try {
      actionLoading.value = true
      // Créer une pause (le service actif reste ouvert)
      await userServicesService.createService({
        userUuid,
        debut: getCurrentDateTime()
      })
      // Marquer le nouveau service comme pause via validateService
      const response = await userServicesService.getActiveService(userUuid)
      if (response?.service?.uuid) {
        await userServicesService.validateService(response.service.uuid, {
          isBreak: true
        })
      }
      await loadUserStatus()
      await loadServices()
    } catch (err: any) {
      console.error('Error starting break:', err)
      error.value = 'Erreur lors du démarrage de la pause'
    } finally {
      actionLoading.value = false
    }
  }

  const endBreak = async () => {
    try {
      actionLoading.value = true
      if (!activeServiceUuid.value) return
      // Terminer la pause
      await userServicesService.validateService(activeServiceUuid.value, {
        fin: getCurrentDateTime()
      })
      await loadUserStatus()
      await loadServices()
    } catch (err: any) {
      console.error('Error ending break:', err)
      error.value = 'Erreur lors de la fin de la pause'
    } finally {
      actionLoading.value = false
    }
  }

  const deleteService = async (serviceUuid: string) => {
    try {
      await userServicesService.deleteService(serviceUuid)
      await loadUserStatus()
      await loadServices()
    } catch (err: any) {
      console.error('Error deleting service:', err)
      throw err
    }
  }

  const createService = async (formData: ServiceFormData) => {
    const payload = {
      userUuid,
      debut: `${formData.debutDate}T${formData.debutTime}:00`,
      fin: formData.finDate && formData.finTime ? `${formData.finDate}T${formData.finTime}:00` : undefined,
      latitude: formData.latitude || undefined,
      longitude: formData.longitude || undefined,
      latitudeEnd: formData.latitudeEnd || undefined,
      longitudeEnd: formData.longitudeEnd || undefined,
      isBreak: formData.isBreak
    }

    await userServicesService.createService(payload)
    await loadUserStatus()
    await loadServices()
  }

  const updateService = async (serviceUuid: string, formData: ServiceFormData) => {
    const payload = {
      debut: `${formData.debutDate}T${formData.debutTime}:00`,
      fin: formData.finDate && formData.finTime ? `${formData.finDate}T${formData.finTime}:00` : undefined,
      latitude: formData.latitude || undefined,
      longitude: formData.longitude || undefined,
      latitudeEnd: formData.latitudeEnd || undefined,
      longitudeEnd: formData.longitudeEnd || undefined,
      isBreak: formData.isBreak
    }

    await userServicesService.validateService(serviceUuid, payload)
    await loadUserStatus()
    await loadServices()
  }

  // Utilitaires pour le statut
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'present'
      case 'ON_BREAK':
        return 'on-break'
      case 'ABSENT':
        return 'absent'
      default:
        return 'absent'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return '🟢 En service'
      case 'ON_BREAK':
        return '🟡 En pause'
      case 'ABSENT':
        return '⚫ Absent'
      default:
        return '⚫ Absent'
    }
  }

  // Coordonnée GPS "présente" = pas null/undefined
  const hasStartData = (service: any) => {
    return service.latitude != null && service.longitude != null
  }

  const hasEndData = (service: any) => {
    return service.latitudeEnd != null && service.longitudeEnd != null
  }

  // Le service a au moins une donnée de position (même si 0,0)
  const hasLocationData = (service: any) => {
    return hasStartData(service) || hasEndData(service)
  }

  // Coordonnée GPS "valide" = présente ET non-zéro (0,0 = échec géolocalisation)
  const hasValidLocation = (service: any) => {
    return hasStartData(service) && service.latitude !== 0 && service.longitude !== 0
  }

  const hasValidEndLocation = (service: any) => {
    return hasEndData(service) && service.latitudeEnd !== 0 && service.longitudeEnd !== 0
  }

  // Au moins une position a des données invalides (0,0 ou incohérentes)
  const isLocationInvalid = (service: any) => {
    const startInvalid = hasStartData(service) && (service.latitude === 0 || service.longitude === 0)
    const endInvalid = hasEndData(service) && (service.latitudeEnd === 0 || service.longitudeEnd === 0)
    return startInvalid || endInvalid
  }

  return {
    // État
    services,
    loading,
    error,
    userName,
    userData,
    userStatus,
    activeServiceStart,
    activeServiceUuid,
    actionLoading,
    showFilters,
    searchFilters,
    pagination,

    // Computed
    hasActiveFilters,
    servicesByDay,

    // Méthodes
    loadUserData,
    loadUserStatus,
    loadServices,
    applyFilters,
    resetFilters,
    goToPage,
    startService,
    endService,
    startBreak,
    endBreak,
    deleteService,
    createService,
    updateService,
    getStatusClass,
    getStatusText,
    hasLocationData,
    hasValidLocation,
    hasValidEndLocation,
    isLocationInvalid
  }
}
