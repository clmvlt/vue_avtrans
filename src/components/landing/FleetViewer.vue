<script setup lang="ts">
import { ref } from 'vue'
import { TresCanvas } from '@tresjs/core'
import { OrbitControls, ContactShadows, GLTFModel } from '@tresjs/cientos'
import { RotateCw, Loader2 } from 'lucide-vue-next'

type VehicleType = 'fourgon' | 'porteur'

const activeVehicle = ref<VehicleType>('fourgon')
const displayedVehicle = ref<VehicleType>('fourgon')
const isVehicleTransitioning = ref(false)

const switchVehicle = (key: VehicleType) => {
  if (key === activeVehicle.value || isVehicleTransitioning.value) return
  isVehicleTransitioning.value = true
  activeVehicle.value = key

  setTimeout(() => {
    displayedVehicle.value = key
    setTimeout(() => {
      isVehicleTransitioning.value = false
    }, 100)
  }, 300)
}

const DRACO_CDN = 'https://www.gstatic.com/draco/versioned/decoders/1.5.6/'

const vehicleConfigs: Record<VehicleType, {
  label: string
  subtitle: string
  path: string
  scale: [number, number, number]
  position: [number, number, number]
  rotation: [number, number, number]
}> = {
  fourgon: {
    label: 'Fourgon',
    subtitle: 'Renault Master',
    path: '/models/fourgon.glb',
    scale: [0.005, 0.005, 0.005],
    position: [0, 0, 0],
    rotation: [-Math.PI / 2, 0, Math.PI * 0.75],
  },
  porteur: {
    label: 'Porteur',
    subtitle: 'Renault Premium DXI',
    path: '/models/porteur.glb',
    scale: [0.35, 0.35, 0.35],
    position: [0, 0.8, 0],
    rotation: [0, Math.PI * 0.75, 0],
  }
}
</script>

<template>
  <div class="fleet-container relative overflow-hidden rounded-2xl border border-white/10 bg-[#0f172a]">

    <!-- Vehicle tabs -->
    <div class="absolute left-4 top-4 z-10 flex gap-2">
      <button
        v-for="(cfg, key) in vehicleConfigs"
        :key="key"
        @click="switchVehicle(key as VehicleType)"
        class="rounded-lg px-4 py-2 text-sm font-medium backdrop-blur-md transition-all"
        :class="activeVehicle === key
          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
          : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'"
      >
        {{ cfg.label }}
      </button>
    </div>

    <!-- Vehicle info -->
    <div class="absolute right-4 top-4 z-10 text-right">
      <p class="text-sm font-semibold text-white">{{ vehicleConfigs[activeVehicle].label }}</p>
      <p class="text-xs text-white/50">{{ vehicleConfigs[activeVehicle].subtitle }}</p>
    </div>

    <!-- Transition spinner overlay -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isVehicleTransitioning"
        class="absolute inset-0 z-10 flex items-center justify-center bg-[#0f172a]/60 backdrop-blur-sm"
      >
        <Loader2 class="size-8 animate-spin text-primary" />
      </div>
    </Transition>

    <!-- 3D Canvas -->
    <div
      class="h-[350px] transition-opacity duration-300 sm:h-[450px] lg:h-[550px]"
      :class="isVehicleTransitioning ? 'opacity-30' : 'opacity-100'"
    >
      <TresCanvas clear-color="#0f172a">
        <TresPerspectiveCamera :position="[5, 3, 5]" :fov="40" />

        <TresAmbientLight :intensity="1" />
        <TresDirectionalLight :position="[10, 15, 10]" :intensity="2" />
        <TresDirectionalLight :position="[-8, 8, -5]" :intensity="0.6" />
        <TresPointLight :position="[0, 5, 0]" :intensity="0.5" color="#a78bfa" />

        <Suspense>
          <GLTFModel
            :key="displayedVehicle"
            :path="vehicleConfigs[displayedVehicle].path"
            :draco="true"
            :decoder-path="DRACO_CDN"
            :scale="vehicleConfigs[displayedVehicle].scale"
            :position="vehicleConfigs[displayedVehicle].position"
            :rotation="vehicleConfigs[displayedVehicle].rotation"
          />
        </Suspense>

        <TresGridHelper :args="[20, 20, '#1e293b', '#1e293b']" />

        <ContactShadows
          :blur="3"
          :opacity="0.5"
          :scale="15"
          :far="5"
          :resolution="256"
        />

        <OrbitControls
          make-default
          :enable-damping="true"
          :damping-factor="0.05"
          :auto-rotate="true"
          :auto-rotate-speed="2"
          :min-distance="2"
          :max-distance="15"
          :max-polar-angle="Math.PI / 2.1"
          :enable-pan="false"
          :target="[0, 0.5, 0]"
        />
      </TresCanvas>
    </div>

    <!-- Interaction hint -->
    <div class="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center">
      <div class="flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 backdrop-blur-sm">
        <RotateCw class="size-3.5 text-white/40" />
        <span class="text-xs text-white/40">Glissez pour tourner le véhicule</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Dark mode ambient glow on fleet viewer */
:global(.dark) .fleet-container {
  box-shadow: 0 0 40px rgba(139, 92, 246, 0.1), 0 0 80px rgba(139, 92, 246, 0.05);
}
</style>
