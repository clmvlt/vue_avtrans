/**
 * Composable pour gérer la modal de carte avec Mapbox
 */
import { ref, nextTick, onUnmounted } from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

import { MAPBOX_TOKEN } from '@/config/map'

export const useMapModal = () => {
  // État
  const showMapModal = ref(false)
  const mapContainer = ref<HTMLElement | null>(null)
  const mapServiceTime = ref('')
  const mapCoords = ref('')

  let map: any = null
  let marker: any = null

  // Méthodes
  const showLocationMap = async (service: any, formatTimeFn: (date: string) => string) => {
    mapServiceTime.value = `${formatTimeFn(service.debut)} → ${formatTimeFn(service.fin)}`
    mapCoords.value = `${service.latitude.toFixed(6)}, ${service.longitude.toFixed(6)}`
    showMapModal.value = true

    await nextTick()

    if (!mapContainer.value) {
      console.error('Map container not found')
      return
    }

    // Initialiser la carte
    mapboxgl.accessToken = MAPBOX_TOKEN

    map = new mapboxgl.Map({
      container: mapContainer.value,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [service.longitude, service.latitude],
      zoom: 15
    })

    // Ajouter les contrôles
    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    // Ajouter le marqueur
    marker = new mapboxgl.Marker({ color: '#581c87' })
      .setLngLat([service.longitude, service.latitude])
      .setPopup(new mapboxgl.Popup().setHTML(`
        <strong>${service.isBreak ? 'Pause' : 'Service'}</strong><br>
        ${formatTimeFn(service.debut)} → ${formatTimeFn(service.fin)}
      `))
      .addTo(map)
  }

  const closeMapModal = () => {
    showMapModal.value = false
    if (map) {
      map.remove()
      map = null
    }
    if (marker) {
      marker = null
    }
  }

  // Nettoyage lors de la destruction
  onUnmounted(() => {
    if (map) {
      map.remove()
      map = null
    }
  })

  return {
    // État
    showMapModal,
    mapContainer,
    mapServiceTime,
    mapCoords,

    // Méthodes
    showLocationMap,
    closeMapModal
  }
}
