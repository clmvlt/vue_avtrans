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
  const mapCoordsEnd = ref('')
  const mapHasEndLocation = ref(false)

  let map: any = null
  let markers: any[] = []

  // Méthodes
  const showLocationMap = async (service: any, formatTimeFn: (date: string) => string) => {
    // Un coord est "valide" si non-null, non-undefined et non-zéro (0 = échec géoloc)
    const hasStart = !!(service.latitude && service.longitude && service.latitude !== 0 && service.longitude !== 0)
    const hasEnd = !!(service.latitudeEnd && service.longitudeEnd && service.latitudeEnd !== 0 && service.longitudeEnd !== 0)

    if (!hasStart && !hasEnd) return // Aucune position valide

    mapServiceTime.value = `${formatTimeFn(service.debut)} → ${formatTimeFn(service.fin)}`
    const hasStartData = service.latitude != null && service.longitude != null
    mapCoords.value = hasStart
      ? `${service.latitude.toFixed(6)}, ${service.longitude.toFixed(6)}`
      : hasStartData ? 'Position non disponible' : ''
    const hasEndData = service.latitudeEnd != null && service.longitudeEnd != null
    mapCoordsEnd.value = hasEnd
      ? `${service.latitudeEnd.toFixed(6)}, ${service.longitudeEnd.toFixed(6)}`
      : hasEndData ? 'Position non disponible' : ''
    mapHasEndLocation.value = !!hasEnd
    showMapModal.value = true

    await nextTick()

    if (!mapContainer.value) {
      console.error('Map container not found')
      return
    }

    // Initialiser la carte
    mapboxgl.accessToken = MAPBOX_TOKEN

    // Collecter les points valides
    const points: [number, number][] = []
    if (hasStart) points.push([service.longitude, service.latitude])
    if (hasEnd) points.push([service.longitudeEnd, service.latitudeEnd])

    map = new mapboxgl.Map({
      container: mapContainer.value,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: points[0],
      zoom: 14
    })

    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    map.on('load', () => {
      // Marqueur de début (vert)
      if (hasStart) {
        const startMarker = new mapboxgl.Marker({ color: '#16a34a' })
          .setLngLat([service.longitude, service.latitude])
          .setPopup(new mapboxgl.Popup().setHTML(`
            <strong>Début ${service.isBreak ? 'pause' : 'service'}</strong><br>
            ${formatTimeFn(service.debut)}
          `))
          .addTo(map)
        markers.push(startMarker)
      }

      // Marqueur de fin (violet)
      if (hasEnd) {
        const endMarker = new mapboxgl.Marker({ color: '#581c87' })
          .setLngLat([service.longitudeEnd, service.latitudeEnd])
          .setPopup(new mapboxgl.Popup().setHTML(`
            <strong>Fin ${service.isBreak ? 'pause' : 'service'}</strong><br>
            ${formatTimeFn(service.fin)}
          `))
          .addTo(map)
        markers.push(endMarker)
      }

      // Ajuster le zoom pour afficher tous les points
      if (points.length >= 2) {
        const bounds = new mapboxgl.LngLatBounds()
        for (const p of points) bounds.extend(p)
        map.fitBounds(bounds, { padding: 80, maxZoom: 16 })
      }
    })
  }

  const closeMapModal = () => {
    showMapModal.value = false
    if (map) {
      map.remove()
      map = null
    }
    markers = []
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
    mapCoordsEnd,
    mapHasEndLocation,

    // Méthodes
    showLocationMap,
    closeMapModal
  }
}
