/**
 * Composable pour gérer la modal de carte avec Mapbox
 * Mapbox GL (~1.7MB) est chargé dynamiquement à l'ouverture de la carte
 */
import { ref, nextTick, onUnmounted } from 'vue'

import { MAPBOX_TOKEN } from '@/config/map'

// Mapbox chargé à la demande
let mapboxgl: typeof import('mapbox-gl').default | null = null
let mapboxLoaded = false

const loadMapbox = async () => {
  if (mapboxLoaded) return mapboxgl!
  const mod = await import('mapbox-gl')
  await import('mapbox-gl/dist/mapbox-gl.css')
  mapboxgl = mod.default
  mapboxLoaded = true
  return mapboxgl
}

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

    // Charger Mapbox à la demande (~1.7MB)
    const mb = await loadMapbox()

    await nextTick()

    if (!mapContainer.value) {
      console.error('Map container not found')
      return
    }

    // Initialiser la carte
    mb.accessToken = MAPBOX_TOKEN

    // Collecter les points valides
    const points: [number, number][] = []
    if (hasStart) points.push([service.longitude, service.latitude])
    if (hasEnd) points.push([service.longitudeEnd, service.latitudeEnd])

    map = new mb.Map({
      container: mapContainer.value,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: points[0],
      zoom: 14
    })

    map.addControl(new mb.NavigationControl(), 'top-right')

    map.on('load', () => {
      // Marqueur de début (vert)
      if (hasStart) {
        const startMarker = new mb.Marker({ color: '#16a34a' })
          .setLngLat([service.longitude, service.latitude])
          .setPopup(new mb.Popup().setHTML(`
            <strong>Début ${service.isBreak ? 'pause' : 'service'}</strong><br>
            ${formatTimeFn(service.debut)}
          `))
          .addTo(map)
        markers.push(startMarker)
      }

      // Marqueur de fin (violet)
      if (hasEnd) {
        const endMarker = new mb.Marker({ color: '#581c87' })
          .setLngLat([service.longitudeEnd, service.latitudeEnd])
          .setPopup(new mb.Popup().setHTML(`
            <strong>Fin ${service.isBreak ? 'pause' : 'service'}</strong><br>
            ${formatTimeFn(service.fin)}
          `))
          .addTo(map)
        markers.push(endMarker)
      }

      // Ajuster le zoom pour afficher tous les points
      if (points.length >= 2) {
        const bounds = new mb.LngLatBounds()
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
