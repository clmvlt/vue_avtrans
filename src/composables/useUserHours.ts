/**
 * Composable pour gérer les heures travaillées d'un utilisateur
 */
import { ref } from 'vue'
import { userServicesService } from '@/services/userServices'

export interface DateParams {
  year: number
  month: number
  week: number
  day: number | null
  dateString: string
}

export interface Period {
  value: string
  label: string
}

export const useUserHours = (userUuid: string) => {
  // État
  const hours = ref<any>(null)
  const showHoursModal = ref(false)
  const loadingHours = ref(false)
  const hoursError = ref('')
  const hoursData = ref<any>(null)
  const selectedPeriod = ref('all')

  // Dates par défaut
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const currentWeek = Math.ceil(
    (new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) /
    (7 * 24 * 60 * 60 * 1000)
  )

  const dateParams = ref<DateParams>({
    year: currentYear,
    month: currentMonth,
    week: currentWeek,
    day: null,
    dateString: new Date().toISOString().split('T')[0] || ''
  })

  // Périodes disponibles
  const periods: Period[] = [
    { value: 'all', label: 'Toutes' },
    { value: 'day', label: 'Jour' },
    { value: 'week', label: 'Semaine' },
    { value: 'month', label: 'Mois' },
    { value: 'year', label: 'Année' }
  ]

  // Méthodes
  const loadHours = async () => {
    try {
      const response = await userServicesService.getUserWorkedHours(userUuid, {})
      hours.value = response.data
    } catch (err: any) {
      console.error('Error loading hours:', err)
    }
  }

  const openHoursModal = () => {
    showHoursModal.value = true
    loadHoursData()
  }

  const closeHoursModal = () => {
    showHoursModal.value = false
    hoursData.value = null
  }

  const selectPeriod = (period: string) => {
    selectedPeriod.value = period
  }

  const loadHoursData = async () => {
    if (!userUuid) return

    try {
      loadingHours.value = true
      hoursError.value = ''

      const params: any = {}

      if (selectedPeriod.value !== 'all') {
        params.period = selectedPeriod.value
      }

      // Ajouter les paramètres de date selon la période sélectionnée
      if (selectedPeriod.value === 'day' && dateParams.value.dateString) {
        const date = new Date(dateParams.value.dateString)
        params.year = date.getFullYear()
        params.month = date.getMonth() + 1
        params.day = date.getDate()
      } else if (selectedPeriod.value === 'week') {
        params.year = dateParams.value.year
        params.week = dateParams.value.week
      } else if (selectedPeriod.value === 'month') {
        params.year = dateParams.value.year
        params.month = dateParams.value.month
      } else if (selectedPeriod.value === 'year') {
        params.year = dateParams.value.year
      }

      const response = await userServicesService.getUserWorkedHours(
        userUuid,
        params
      )

      hoursData.value = response.data
    } catch (err: any) {
      hoursError.value = err.message || 'Erreur lors du chargement des heures'
    } finally {
      loadingHours.value = false
    }
  }

  return {
    // État
    hours,
    showHoursModal,
    loadingHours,
    hoursError,
    hoursData,
    selectedPeriod,
    dateParams,
    periods,

    // Méthodes
    loadHours,
    openHoursModal,
    closeHoursModal,
    selectPeriod,
    loadHoursData
  }
}
