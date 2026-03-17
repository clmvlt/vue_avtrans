<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, type Component } from 'vue'
import { RouterLink } from 'vue-router'
import {
  Truck, Snowflake, PawPrint, MapPin, Warehouse, Clock,
  Phone, Mail, ChevronDown, ArrowRight, Menu, X,
  Shield, Zap, Globe, Package, Locate, Smartphone,
  Sun, Moon
} from 'lucide-vue-next'
import { useTheme } from '@/composables/useTheme'
import FleetViewer from '@/components/landing/FleetViewer.vue'

import locauxImg from '@/assets/images/locaux.jpg'
import expertiseImg from '@/assets/images/expertise-image.jpg'
import masterImg from '@/assets/images/master.png'
import logoImg from '@/assets/favicon.png'

// --- State ---
const isScrolled = ref(false)
const mobileMenuOpen = ref(false)
const { isDark, toggleTheme } = useTheme()
const themeToggleRef = ref<HTMLButtonElement | null>(null)
const isTransitioning = ref(false)
let observer: IntersectionObserver | null = null
let statsObserver: IntersectionObserver | null = null

// --- Parallax ---
const scrollY = ref(0)
const parallaxEnabled = ref(false)
let rafId: number | null = null

const parallaxBg = computed(() => parallaxEnabled.value ? `translateY(${scrollY.value * 0.3}px)` : '')
const parallaxBadge = computed(() => parallaxEnabled.value ? `translateY(${scrollY.value * -0.15}px)` : '')
const parallaxHeadline = computed(() => parallaxEnabled.value ? `translateY(${scrollY.value * 0.1}px)` : '')
const parallaxCta = computed(() => parallaxEnabled.value ? `translateY(${scrollY.value * 0.05}px)` : '')

// --- Floating CTA ---
const showFloatingCta = ref(false)

// --- Theme toggle with circular propagation ---
// Build an organic blob clip-path at a given scale, centered on (cx, cy)
const buildBlob = (cx: number, cy: number, radius: number, seed: number): string => {
  const points = 10
  const pts: string[] = []
  for (let i = 0; i < points; i++) {
    const angle = (Math.PI * 2 * i) / points
    // Randomize radius per point for organic wobble (±25%)
    const wobble = 0.75 + 0.5 * Math.abs(Math.sin(seed * 7.3 + i * 2.1 + angle * 1.7))
    const r = radius * wobble
    const px = cx + Math.cos(angle) * r
    const py = cy + Math.sin(angle) * r
    pts.push(`${px}px ${py}px`)
  }
  return `polygon(${pts.join(', ')})`
}

const handleThemeToggle = async () => {
  if (isTransitioning.value) return

  if (!document.startViewTransition) {
    toggleTheme()
    return
  }

  isTransitioning.value = true

  const btn = themeToggleRef.value
  if (!btn) {
    toggleTheme()
    isTransitioning.value = false
    return
  }

  const rect = btn.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2

  const maxRadius = Math.hypot(
    Math.max(cx, window.innerWidth - cx),
    Math.max(cy, window.innerHeight - cy)
  ) * 1.3

  // Random seed for this toggle so each click feels different
  const seed = Math.random() * 100

  // Build keyframes with organic blob shapes at different scales
  const steps = 8
  const keyframes: Keyframe[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    // Ease-out cubic for smooth deceleration
    const eased = 1 - Math.pow(1 - t, 3)
    const r = eased * maxRadius
    keyframes.push({ clipPath: buildBlob(cx, cy, r, seed + i * 0.5) })
  }

  const transition = document.startViewTransition(() => {
    toggleTheme()
    return nextTick()
  })

  transition.ready.then(() => {
    document.documentElement.animate(keyframes, {
      duration: 650,
      easing: 'linear',
      pseudoElement: '::view-transition-new(root)'
    })
  })

  transition.finished.then(() => {
    isTransitioning.value = false
  })
}

// --- Scroll handling ---
const onScroll = () => {
  isScrolled.value = window.scrollY > 50

  // Floating CTA: visible after hero, hidden near contact section
  const contactSection = document.getElementById('contact')
  if (contactSection) {
    const contactTop = contactSection.getBoundingClientRect().top
    showFloatingCta.value = window.scrollY > window.innerHeight && contactTop > window.innerHeight * 0.5
  }

  // Parallax: rAF-throttled scroll update
  if (parallaxEnabled.value && rafId === null) {
    rafId = requestAnimationFrame(() => {
      scrollY.value = Math.min(window.scrollY, window.innerHeight)
      rafId = null
    })
  }
}

const scrollTo = (id: string) => {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
    mobileMenuOpen.value = false
  }
}

// --- Count-up animation for stats ---
const animateCountUp = () => {
  const duration = 2000
  const startTime = performance.now()

  const tick = (now: number) => {
    const elapsed = now - startTime
    const t = Math.min(elapsed / duration, 1)
    const eased = 1 - Math.pow(1 - t, 3) // ease-out cubic
    stats.value.forEach(stat => {
      stat.current = Math.round(eased * stat.target)
    })
    if (t < 1) requestAnimationFrame(tick)
  }

  requestAnimationFrame(tick)
}

// --- JSON-LD Structured Data for SEO ---
let jsonLdScript: HTMLScriptElement | null = null

const injectJsonLd = () => {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LocalBusiness',
        '@id': 'https://app.avtrans-concept.com/#business',
        name: 'AVTRANS Concept',
        alternateName: 'AVTRANS',
        description: 'Coursier et transporteur en Bretagne. Messagerie express, fret, température dirigée et transport d\'animaux vivants. Service disponible 24h/24, 7j/7 à Saint-Brieuc, Lamballe, Pommeret et dans tout le Grand Ouest.',
        url: 'https://app.avtrans-concept.com',
        telephone: '+33257770777',
        email: 'contact@avtrans-concept.com',
        image: 'https://app.avtrans-concept.com/icons/icon-512x512.png',
        logo: 'https://app.avtrans-concept.com/icons/icon-512x512.png',
        priceRange: '€€',
        currenciesAccepted: 'EUR',
        paymentAccepted: 'Virement, Chèque, Carte bancaire',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Pommeret',
          addressLocality: 'Pommeret',
          postalCode: '22120',
          addressRegion: 'Bretagne',
          addressCountry: 'FR'
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 48.4614,
          longitude: -2.6989
        },
        openingHoursSpecification: {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          opens: '00:00',
          closes: '23:59'
        },
        areaServed: [
          { '@type': 'AdministrativeArea', name: 'Bretagne' },
          { '@type': 'AdministrativeArea', name: 'Côtes-d\'Armor' },
          { '@type': 'City', name: 'Saint-Brieuc' },
          { '@type': 'City', name: 'Lamballe' },
          { '@type': 'City', name: 'Pommeret' },
          { '@type': 'City', name: 'Dinan' },
          { '@type': 'City', name: 'Guingamp' },
          { '@type': 'City', name: 'Lannion' },
          { '@type': 'City', name: 'Loudéac' },
          { '@type': 'City', name: 'Rennes' },
          { '@type': 'City', name: 'Brest' },
          { '@type': 'City', name: 'Vannes' },
          { '@type': 'City', name: 'Lorient' },
          { '@type': 'AdministrativeArea', name: 'Grand Ouest' },
          { '@type': 'Country', name: 'France' }
        ],
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Services de transport AVTRANS',
          itemListElement: [
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'Coursier & Messagerie Express',
                description: 'Service de coursier et messagerie express en Bretagne. Du simple pli à la palette de 1000 kg, livraisons locales, nationales et internationales.'
              }
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'Transport sous Température Dirigée',
                description: 'Transport frigorifique et chaîne du froid pour produits pharmaceutiques et marchandises sensibles en Bretagne et Grand Ouest.'
              }
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'Transport d\'Animaux Vivants',
                description: 'Transport réglementé d\'animaux domestiques et de rente jusqu\'à 30 kg avec soins adaptés.'
              }
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'Fret & Affrètement',
                description: 'Solutions de fret routier et affrètement depuis la Bretagne vers la France et l\'international.'
              }
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'Stockage & Entreposage',
                description: 'Entrepôt sécurisé dans les Côtes-d\'Armor pour solutions de stockage ponctuelles ou récurrentes.'
              }
            }
          ]
        },
        sameAs: [
          'https://avtrans-concept.com'
        ]
      },
      {
        '@type': 'WebSite',
        '@id': 'https://app.avtrans-concept.com/#website',
        url: 'https://app.avtrans-concept.com',
        name: 'AVTRANS Concept — Coursier & Transport Bretagne',
        publisher: { '@id': 'https://app.avtrans-concept.com/#business' },
        inLanguage: 'fr-FR'
      },
      {
        '@type': 'WebPage',
        '@id': 'https://app.avtrans-concept.com/#webpage',
        url: 'https://app.avtrans-concept.com/',
        name: 'AVTRANS Concept — Coursier & Transport en Bretagne | Saint-Brieuc, Lamballe',
        description: 'Coursier et transporteur en Bretagne. Messagerie express, fret, température dirigée, transport d\'animaux. 24h/24 à Saint-Brieuc, Lamballe et Grand Ouest.',
        isPartOf: { '@id': 'https://app.avtrans-concept.com/#website' },
        about: { '@id': 'https://app.avtrans-concept.com/#business' },
        inLanguage: 'fr-FR'
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Accueil',
            item: 'https://app.avtrans-concept.com/'
          }
        ]
      }
    ]
  }

  jsonLdScript = document.createElement('script')
  jsonLdScript.type = 'application/ld+json'
  jsonLdScript.textContent = JSON.stringify(schema)
  document.head.appendChild(jsonLdScript)
}

// --- Intersection Observer for reveal animations ---
onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })

  // Inject structured data for SEO
  injectJsonLd()

  // Parallax detection
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  parallaxEnabled.value = !prefersReducedMotion && window.innerWidth >= 1024

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed')
          observer?.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  )

  document.querySelectorAll('.reveal').forEach((el) => {
    observer?.observe(el)
  })

  // Stats count-up observer
  statsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCountUp()
          statsObserver?.disconnect()
        }
      })
    },
    { threshold: 0.3 }
  )

  const statsSection = document.querySelector('[data-stats-section]')
  if (statsSection) statsObserver.observe(statsSection)
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  observer?.disconnect()
  statsObserver?.disconnect()
  if (rafId !== null) cancelAnimationFrame(rafId)
  if (jsonLdScript) jsonLdScript.remove()
})

// --- Data ---
const navLinks = [
  { id: 'services', label: 'Services' },
  { id: 'about', label: 'À propos' },
  { id: 'fleet', label: 'Notre flotte' },
  { id: 'contact', label: 'Contact' }
]

interface ServiceItem {
  icon: Component
  title: string
  description: string
  animation: string
}

const services: ServiceItem[] = [
  {
    icon: Package,
    title: 'Fret & Messagerie',
    description: 'Du simple pli à la palette de 1000 kg. Livraisons locales, nationales et internationales.',
    animation: 'anim-bounce'
  },
  {
    icon: Snowflake,
    title: 'Température Dirigée',
    description: 'Chaîne du froid irréprochable pour vos produits pharmaceutiques et marchandises sensibles.',
    animation: 'anim-spin'
  },
  {
    icon: PawPrint,
    title: 'Animaux Vivants',
    description: 'Transport réglementé avec soins adaptés pour animaux domestiques et de rente jusqu\'à 30 kg.',
    animation: 'anim-wiggle'
  },
  {
    icon: Locate,
    title: 'Suivi en Temps Réel',
    description: 'Géolocalisation de chaque envoi et traçabilité complète à chaque étape du transport.',
    animation: 'anim-ping'
  },
  {
    icon: Warehouse,
    title: 'Stockage & Affrètement',
    description: 'Entrepôt sécurisé pour vos solutions de stockage ponctuelles ou récurrentes.',
    animation: 'anim-lift'
  },
  {
    icon: Clock,
    title: 'Disponibilité 24/7',
    description: 'Service continu jour et nuit, 7 jours sur 7, pour répondre à toutes vos urgences.',
    animation: 'anim-rotate'
  }
]

interface FeatureItem {
  icon: Component
  title: string
  description: string
}

const aboutFeatures: FeatureItem[] = [
  { icon: Shield, title: 'Fiabilité', description: 'Chauffeurs qualifiés et flotte entretenue' },
  { icon: Zap, title: 'Réactivité', description: 'Courses urgentes et livraisons express' },
  { icon: Globe, title: 'Couverture', description: 'Bretagne, Grand Ouest et international' },
  { icon: Truck, title: 'Flotte variée', description: 'Fourgons et porteurs de 1m³ à 60m³' }
]

interface StatItem {
  target: number
  suffix: string
  current: number
  label: string
}

const stats = ref<StatItem[]>([
  { target: 7, suffix: '+', current: 0, label: 'Années d\'expérience' },
  { target: 24, suffix: '/7', current: 0, label: 'Disponibilité totale' },
  { target: 60, suffix: 'm³', current: 0, label: 'Capacité véhicule max' },
  { target: 100, suffix: '%', current: 0, label: 'Traçabilité des envois' }
])

const footerServices = [
  'Coursier express',
  'Fret & Messagerie',
  'Température dirigée',
  'Transport d\'animaux',
  'Suivi temps réel',
  'Stockage & Affrètement'
]
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">

    <!-- ════════════════════════ HEADER ════════════════════════ -->
    <header
      :class="[
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-background/80 shadow-sm backdrop-blur-xl border-b border-border/50'
          : ''
      ]"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 items-center justify-between lg:h-20">

          <!-- Logo -->
          <div class="flex items-center gap-3">
            <img :src="logoImg" alt="AVTRANS Concept — Coursier et transport en Bretagne" class="size-10 rounded-xl shadow-lg" />
            <div class="flex flex-col">
              <span
                class="text-lg font-bold tracking-tight transition-colors duration-300"
                :class="isScrolled ? 'text-foreground' : 'text-white'"
              >
                AVTRANS
              </span>
              <span
                class="text-[11px] font-medium uppercase tracking-wider transition-colors duration-300"
                :class="isScrolled ? 'text-muted-foreground' : 'text-white/60'"
              >
                Solutions Transport
              </span>
            </div>
          </div>

          <!-- Desktop Navigation -->
          <nav class="hidden items-center gap-1 lg:flex">
            <button
              v-for="link in navLinks"
              :key="link.id"
              @click="scrollTo(link.id)"
              class="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              :class="isScrolled
                ? 'text-muted-foreground hover:text-foreground hover:bg-accent'
                : 'text-white/70 hover:text-white hover:bg-white/10'"
            >
              {{ link.label }}
            </button>
          </nav>

          <!-- Desktop CTA -->
          <div class="hidden items-center gap-3 lg:flex">
            <!-- Theme toggle -->
            <button
              ref="themeToggleRef"
              @click="handleThemeToggle"
              class="relative inline-flex size-9 items-center justify-center rounded-lg transition-all"
              :class="isScrolled
                ? 'text-foreground hover:bg-accent'
                : 'text-white/70 hover:text-white hover:bg-white/10'"
              aria-label="Changer le thème"
            >
              <Transition
                enter-active-class="transition duration-300 ease-out"
                enter-from-class="rotate-90 scale-0 opacity-0"
                enter-to-class="rotate-0 scale-100 opacity-100"
                leave-active-class="transition duration-200 ease-in absolute"
                leave-from-class="rotate-0 scale-100 opacity-100"
                leave-to-class="-rotate-90 scale-0 opacity-0"
                mode="out-in"
              >
                <Sun v-if="isDark" class="size-[18px]" />
                <Moon v-else class="size-[18px]" />
              </Transition>
            </button>

            <RouterLink to="/login">
              <button
                class="rounded-lg px-4 py-2 text-sm font-medium transition-all border"
                :class="isScrolled
                  ? 'text-foreground border-border hover:bg-accent'
                  : 'text-white border-white/25 hover:bg-white/10'"
              >
                Connexion
              </button>
            </RouterLink>
            <a href="https://avtrans.ypsium.com" target="_blank" rel="noopener">
              <button
                class="rounded-lg px-5 py-2 text-sm font-semibold transition-all"
                :class="isScrolled
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-white text-gray-900 hover:bg-white/90'"
              >
                Espace Client
              </button>
            </a>
          </div>

          <!-- Mobile Menu Toggle -->
          <button
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="inline-flex items-center justify-center rounded-lg p-2 transition-colors lg:hidden"
            :class="isScrolled
              ? 'text-foreground hover:bg-accent'
              : 'text-white hover:bg-white/10'"
          >
            <component :is="mobileMenuOpen ? X : Menu" class="size-6" />
          </button>
        </div>
      </div>

      <!-- Mobile Menu -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div v-if="mobileMenuOpen" class="border-b border-border bg-background/95 backdrop-blur-xl lg:hidden">
          <div class="mx-auto max-w-7xl space-y-1 px-4 py-4">
            <button
              v-for="link in navLinks"
              :key="link.id"
              @click="scrollTo(link.id)"
              class="block w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              {{ link.label }}
            </button>
            <!-- Mobile theme toggle -->
            <button
              @click="handleThemeToggle"
              class="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <Sun v-if="isDark" class="size-4" />
              <Moon v-else class="size-4" />
              {{ isDark ? 'Mode clair' : 'Mode sombre' }}
            </button>
            <div class="my-3 h-px bg-border" />
            <div class="flex gap-3 px-4">
              <RouterLink to="/login" class="flex-1">
                <button class="w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent">
                  Connexion
                </button>
              </RouterLink>
              <a href="https://avtrans.ypsium.com" target="_blank" rel="noopener" class="flex-1">
                <button class="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                  Espace Client
                </button>
              </a>
            </div>
          </div>
        </div>
      </Transition>
    </header>

    <!-- ════════════════════════ HERO ════════════════════════ -->
    <section class="relative flex min-h-[100dvh] items-center overflow-hidden">
      <!-- Background -->
      <div class="absolute inset-0">
        <div
          :style="parallaxEnabled ? { transform: parallaxBg } : {}"
          :class="parallaxEnabled ? 'absolute inset-[-5%]' : 'absolute inset-0'"
        >
          <img
            :src="locauxImg"
            alt="Flotte de véhicules AVTRANS Concept devant les locaux à Pommeret, Côtes-d'Armor — coursier et transport Bretagne"
            class="hero-bg size-full object-cover object-center"
          />
        </div>
        <div class="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-gray-900/70 to-gray-900/40" />
        <div class="absolute inset-0 bg-gradient-to-t from-gray-900/50 via-transparent to-gray-900/20" />
        <!-- Dark mode violet overlay -->
        <div
          class="absolute inset-0 hidden dark:block"
          style="background: radial-gradient(ellipse at 30% 50%, rgba(124, 58, 237, 0.15), transparent 70%)"
        />
      </div>

      <!-- Content -->
      <div class="relative mx-auto max-w-7xl px-4 pt-32 pb-24 sm:px-6 lg:px-8">
        <div class="max-w-2xl">

          <!-- Badge -->
          <div :style="parallaxEnabled ? { transform: parallaxBadge } : {}">
            <div class="reveal mb-8 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 backdrop-blur-sm">
              <span class="relative flex size-2">
                <span class="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span class="relative inline-flex size-2 rounded-full bg-emerald-400" />
              </span>
              <span class="text-sm font-medium text-white/90">Disponible 24h/24 — 7j/7</span>
            </div>
          </div>

          <!-- Headline + Service tags -->
          <div :style="parallaxEnabled ? { transform: parallaxHeadline } : {}">
            <h1 class="reveal mb-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Coursier &amp; transport
              <span class="bg-gradient-to-r from-violet-300 to-purple-200 bg-clip-text text-transparent">
                en Bretagne
              </span>
            </h1>

            <p class="reveal mb-4 flex flex-wrap items-center gap-2 text-sm font-semibold uppercase tracking-widest text-white/50 sm:gap-3 sm:text-base">
              <span>Coursier</span>
              <span class="size-1 rounded-full bg-violet-400" />
              <span>Messagerie</span>
              <span class="size-1 rounded-full bg-violet-400" />
              <span>Fret</span>
              <span class="size-1 rounded-full bg-violet-400" />
              <span>Température dirigée</span>
            </p>
          </div>

          <!-- Description + CTA -->
          <div :style="parallaxEnabled ? { transform: parallaxCta } : {}">
            <p class="reveal mb-10 max-w-xl text-lg leading-relaxed text-white/70 sm:text-xl">
              Coursier et messagerie express depuis Saint-Brieuc, Lamballe et les Côtes-d'Armor
              vers la France entière. Fret, température dirigée et transport d'animaux vivants — 24h/24, 7j/7.
            </p>

            <div class="reveal flex flex-col gap-4 sm:flex-row">
              <button
                @click="scrollTo('services')"
                class="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-gray-900 shadow-lg shadow-white/10 transition-all hover:shadow-xl hover:shadow-white/20 hover:bg-white/90"
              >
                Découvrir nos services
                <ArrowRight class="size-5 transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                @click="scrollTo('contact')"
                class="inline-flex items-center justify-center gap-2.5 rounded-xl border border-white/20 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/10"
              >
                <Phone class="size-5" />
                Nous contacter
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Scroll indicator -->
      <div class="absolute inset-x-0 bottom-8 flex justify-center">
        <button
          @click="scrollTo('services')"
          class="animate-bounce text-white/40 transition-colors hover:text-white/70"
          aria-label="Défiler vers le bas"
        >
          <ChevronDown class="size-8" />
        </button>
      </div>
    </section>

    <!-- ════════════════════════ SERVICES ════════════════════════ -->
    <section id="services" class="scroll-mt-20 bg-background py-24 sm:py-32">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <!-- Section Header -->
        <div class="reveal mx-auto mb-16 max-w-2xl text-center sm:mb-20">
          <span class="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
            <Truck class="size-4" />
            Nos services
          </span>
          <h2 class="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Coursier, messagerie et transport en Bretagne
          </h2>
          <p class="text-lg text-muted-foreground">
            Du simple pli à la palette de 1000 kg, de la course urgente au transport frigorifique.
            Votre coursier à Saint-Brieuc, Lamballe et dans tout le Grand Ouest.
          </p>
        </div>

        <!-- Grid -->
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="(service, index) in services"
            :key="service.title"
            class="reveal group service-card rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 dark:hover:shadow-xl dark:hover:shadow-primary/10"
            :style="{ transitionDelay: `${index * 80}ms` }"
          >
            <div :class="['mb-5 inline-flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground', service.animation]">
              <component :is="service.icon" class="size-6" />
            </div>
            <h3 class="mb-2 text-lg font-semibold text-foreground">{{ service.title }}</h3>
            <p class="text-sm leading-relaxed text-muted-foreground">{{ service.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ════════════════════════ ABOUT ════════════════════════ -->
    <section id="about" class="scroll-mt-20 border-y border-border bg-muted/50 py-24 sm:py-32">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">

          <!-- Image -->
          <div class="reveal relative">
            <div class="overflow-hidden rounded-2xl shadow-2xl">
              <img :src="expertiseImg" alt="Livraison AVTRANS en Bretagne — coursier express Côtes-d'Armor" class="size-full object-cover" />
            </div>
            <!-- Floating badge -->
            <div class="absolute -bottom-6 -right-2 rounded-xl border border-border bg-card p-4 shadow-xl sm:-right-6">
              <div class="flex items-center gap-3">
                <div class="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <Shield class="size-5 text-primary" />
                </div>
                <div>
                  <p class="text-sm font-semibold text-foreground">Certifié & Assuré</p>
                  <p class="text-xs text-muted-foreground">Archivage 7 ans</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Content -->
          <div class="reveal">
            <span class="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
              À propos
            </span>
            <h2 class="mb-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Votre coursier et transporteur en Bretagne
            </h2>
            <p class="mb-8 text-lg leading-relaxed text-muted-foreground">
              Implantée à Pommeret dans les Côtes-d'Armor, entre Saint-Brieuc et Lamballe,
              AVTRANS Concept est votre partenaire pour le transport et la messagerie express.
              Nous collaborons étroitement avec vous pour fournir des solutions sur mesure,
              de la course urgente au fret régulier.
            </p>
            <p class="mb-8 text-base leading-relaxed text-muted-foreground">
              Coursier quotidien de Saint-Brieuc à Rennes, de Lamballe à Dinan, en passant
              par Guingamp, Lannion et Loudéac. Transport de marchandises sensibles — produits
              pharmaceutiques sous température dirigée, animaux vivants — avec suivi en temps réel
              par géolocalisation sur les quatre départements bretons, le Grand Ouest et l'international.
            </p>

            <!-- Feature grid -->
            <div class="grid gap-4 sm:grid-cols-2">
              <div
                v-for="feature in aboutFeatures"
                :key="feature.title"
                class="flex items-start gap-3"
              >
                <div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <component :is="feature.icon" class="size-4 text-primary" />
                </div>
                <div>
                  <p class="text-sm font-semibold text-foreground">{{ feature.title }}</p>
                  <p class="text-xs text-muted-foreground">{{ feature.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ════════════════════════ FLEET ════════════════════════ -->
    <section id="fleet" class="scroll-mt-20 bg-background py-24 sm:py-32">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <!-- Section Header -->
        <div class="reveal mx-auto mb-16 max-w-2xl text-center">
          <span class="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
            <Truck class="size-4" />
            Notre flotte
          </span>
          <h2 class="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Flotte de véhicules pour coursier et fret en Bretagne
          </h2>
          <p class="text-lg text-muted-foreground">
            Fourgons et porteurs de 1m³ à 60m³, équipés pour la messagerie express,
            le fret standard et le transport sous température dirigée dans tout le Grand Ouest.
          </p>
        </div>

        <!-- 3D Fleet Viewer + Specs -->
        <div class="grid gap-6 lg:grid-cols-3">
          <!-- Interactive 3D viewer -->
          <div class="reveal lg:col-span-2">
            <FleetViewer />
          </div>

          <!-- Specs sidebar -->
          <div class="reveal flex flex-col gap-6">
            <!-- Real fleet photo -->
            <div class="overflow-hidden rounded-2xl border border-border">
              <img
                :src="masterImg"
                alt="Camion AVTRANS Concept pour livraison et messagerie en Bretagne"
                class="size-full object-cover transition-transform duration-500 hover:scale-[1.02]"
              />
            </div>

            <!-- Fleet specs card -->
            <div class="flex-1 rounded-2xl border border-border bg-card p-6">
              <h3 class="mb-4 text-base font-semibold text-foreground">Caractéristiques</h3>
              <ul class="space-y-3">
                <li class="flex items-center gap-3 text-sm text-muted-foreground">
                  <div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Package class="size-4 text-primary" />
                  </div>
                  De 1m³ à 60m³ de capacité
                </li>
                <li class="flex items-center gap-3 text-sm text-muted-foreground">
                  <div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Snowflake class="size-4 text-primary" />
                  </div>
                  Véhicules frigorifiques disponibles
                </li>
                <li class="flex items-center gap-3 text-sm text-muted-foreground">
                  <div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Locate class="size-4 text-primary" />
                  </div>
                  Géolocalisation embarquée
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ════════════════════════ STATS ════════════════════════ -->
    <section data-stats-section class="relative overflow-hidden bg-primary py-20 sm:py-24">
      <!-- Decorative background -->
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_70%)]" />
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.05),transparent_50%)]" />

      <div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="reveal grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div v-for="stat in stats" :key="stat.label" class="text-center">
            <p class="stat-value text-4xl font-extrabold text-primary-foreground sm:text-5xl">{{ stat.current }}{{ stat.suffix }}</p>
            <p class="mt-2 text-sm font-medium text-primary-foreground/70">{{ stat.label }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ════════════════════════ CONTACT CTA ════════════════════════ -->
    <section id="contact" class="scroll-mt-20 border-t border-border bg-muted/50 py-24 sm:py-32">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="reveal mx-auto max-w-3xl text-center">
          <h2 class="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Besoin d'un coursier ou d'un transport en Bretagne ?
          </h2>
          <p class="mb-10 text-lg text-muted-foreground">
            Contactez AVTRANS Concept pour un devis gratuit. Notre équipe de coursiers
            est disponible 24h/24, 7j/7 à Saint-Brieuc, Lamballe et dans toute la Bretagne.
          </p>

          <!-- Contact cards -->
          <div class="mb-10 grid gap-6 sm:grid-cols-3">
            <div class="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/20">
              <div class="flex size-12 items-center justify-center rounded-full bg-primary/10">
                <Phone class="size-5 text-primary" />
              </div>
              <div class="text-center">
                <p class="text-sm font-semibold text-foreground">Téléphone</p>
                <a href="tel:+33257770777" class="text-sm text-muted-foreground transition-colors hover:text-primary">
                  02 57 77 07 77
                </a>
              </div>
            </div>

            <div class="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/20">
              <div class="flex size-12 items-center justify-center rounded-full bg-primary/10">
                <Smartphone class="size-5 text-primary" />
              </div>
              <div class="text-center">
                <p class="text-sm font-semibold text-foreground">Mobile</p>
                <a href="tel:+33666581321" class="text-sm text-muted-foreground transition-colors hover:text-primary">
                  06 66 58 13 21
                </a>
              </div>
            </div>

            <div class="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/20">
              <div class="flex size-12 items-center justify-center rounded-full bg-primary/10">
                <MapPin class="size-5 text-primary" />
              </div>
              <div class="text-center">
                <p class="text-sm font-semibold text-foreground">Adresse</p>
                <address class="text-sm not-italic text-muted-foreground">Pommeret, 22120<br />Côtes-d'Armor, Bretagne</address>
              </div>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a href="tel:+33257770777">
              <button class="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30">
                <Phone class="size-5" />
                Appeler maintenant
              </button>
            </a>
            <a href="mailto:contact@avtrans-concept.com">
              <button class="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-8 py-3.5 text-base font-semibold text-foreground transition-all hover:bg-accent">
                <Mail class="size-5" />
                Envoyer un email
              </button>
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- ════════════════════════ FOOTER ════════════════════════ -->
    <footer class="border-t border-border bg-background py-12 sm:py-16">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">

          <!-- Brand -->
          <div class="sm:col-span-2 lg:col-span-1">
            <div class="mb-4 flex items-center gap-3">
              <img :src="logoImg" alt="AVTRANS Concept — Coursier Bretagne" class="size-10 rounded-xl" />
              <div>
                <span class="text-lg font-bold text-foreground">AVTRANS</span>
                <p class="text-xs text-muted-foreground">Coursier &amp; Transport</p>
              </div>
            </div>
            <p class="text-sm leading-relaxed text-muted-foreground">
              Coursier et transporteur spécialisé : messagerie express, fret, température dirigée
              et transport d'animaux vivants. Votre partenaire logistique à Saint-Brieuc, Lamballe
              et dans toute la Bretagne.
            </p>
          </div>

          <!-- Services -->
          <div>
            <h4 class="mb-4 text-sm font-semibold text-foreground">Services</h4>
            <ul class="space-y-2.5">
              <li v-for="service in footerServices" :key="service">
                <span class="text-sm text-muted-foreground">{{ service }}</span>
              </li>
            </ul>
          </div>

          <!-- Zones desservies (Local SEO) -->
          <div>
            <h4 class="mb-4 text-sm font-semibold text-foreground">Zones desservies</h4>
            <ul class="space-y-2.5">
              <li class="text-sm text-muted-foreground">Saint-Brieuc</li>
              <li class="text-sm text-muted-foreground">Lamballe</li>
              <li class="text-sm text-muted-foreground">Pommeret</li>
              <li class="text-sm text-muted-foreground">Dinan</li>
              <li class="text-sm text-muted-foreground">Guingamp</li>
              <li class="text-sm text-muted-foreground">Lannion &amp; Loudéac</li>
              <li class="text-sm text-muted-foreground">Rennes &amp; Grand Ouest</li>
              <li class="text-sm text-muted-foreground">National &amp; International</li>
            </ul>
          </div>

          <!-- Quick links -->
          <div>
            <h4 class="mb-4 text-sm font-semibold text-foreground">Accès rapide</h4>
            <ul class="space-y-2.5">
              <li>
                <RouterLink to="/login" class="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Connexion
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/register" class="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Inscription
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/download" class="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Application mobile
                </RouterLink>
              </li>
              <li>
                <a href="https://avtrans-concept.com" target="_blank" rel="noopener" class="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Site vitrine
                </a>
              </li>
              <li>
                <a href="https://avtrans.ypsium.com" target="_blank" rel="noopener" class="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Espace Client
                </a>
              </li>
            </ul>
          </div>

          <!-- Contact -->
          <div>
            <h4 class="mb-4 text-sm font-semibold text-foreground">Contact</h4>
            <address class="not-italic">
              <ul class="space-y-2.5">
                <li class="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin class="size-4 shrink-0" />
                  Pommeret, 22120
                </li>
                <li>
                  <a href="tel:+33257770777" class="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                    <Phone class="size-4 shrink-0" />
                    02 57 77 07 77
                  </a>
                </li>
                <li>
                  <a href="tel:+33666581321" class="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                    <Smartphone class="size-4 shrink-0" />
                    06 66 58 13 21
                  </a>
                </li>
                <li>
                  <a href="mailto:contact@avtrans-concept.com" class="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                    <Mail class="size-4 shrink-0" />
                    contact@avtrans-concept.com
                  </a>
                </li>
              </ul>
            </address>
          </div>
        </div>

        <!-- Bottom -->
        <div class="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p class="text-xs text-muted-foreground">
            &copy; {{ new Date().getFullYear() }} AVTRANS Concept — SARL au capital de 3 000 &euro; — SIREN 845 350 347
          </p>
          <p class="text-xs text-muted-foreground">
            Siège social : Hillion, Côtes-d'Armor (22)
          </p>
        </div>
      </div>
    </footer>

    <!-- ════════════════════════ FLOATING CTA ════════════════════════ -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-full opacity-0"
    >
      <a
        v-if="showFloatingCta"
        href="tel:+33257770777"
        class="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-primary p-4 text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/40 sm:px-6 sm:py-3.5"
      >
        <Phone class="size-5 animate-pulse" />
        <span class="hidden text-sm font-semibold sm:inline">Nous contacter</span>
      </a>
    </Transition>
  </div>
</template>

<style scoped>
/* Hero image slow zoom */
.hero-bg {
  animation: hero-zoom 25s ease-out forwards;
}

@keyframes hero-zoom {
  from {
    transform: scale(1.08);
  }
  to {
    transform: scale(1);
  }
}

/* Scroll reveal animation */
.reveal {
  opacity: 0;
  transform: translateY(24px);
  transition:
    opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}

.revealed {
  opacity: 1;
  transform: translateY(0);
}

/* ── Service icon micro-interactions ── */
.group:hover .anim-bounce :deep(svg) {
  animation: bounce-icon 0.5s ease;
}
.group:hover .anim-spin :deep(svg) {
  animation: spin-icon 0.8s ease;
}
.group:hover .anim-wiggle :deep(svg) {
  animation: wiggle-icon 0.5s ease;
}
.group:hover .anim-ping :deep(svg) {
  animation: ping-icon 0.6s ease;
}
.group:hover .anim-lift :deep(svg) {
  animation: lift-icon 0.5s ease;
}
.group:hover .anim-rotate :deep(svg) {
  animation: rotate-icon 0.6s ease;
}

@keyframes bounce-icon {
  0%, 100% { transform: translateY(0); }
  40% { transform: translateY(-6px); }
  60% { transform: translateY(-3px); }
}

@keyframes spin-icon {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes wiggle-icon {
  0%, 100% { transform: rotate(0deg); }
  20% { transform: rotate(-12deg); }
  40% { transform: rotate(12deg); }
  60% { transform: rotate(-8deg); }
  80% { transform: rotate(8deg); }
}

@keyframes ping-icon {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

@keyframes lift-icon {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes rotate-icon {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(180deg); }
}

/* ── Dark mode storytelling ── */
:global(.dark) .stat-value {
  text-shadow: 0 0 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(139, 92, 246, 0.2);
}

:global(.dark) .service-card:hover {
  box-shadow: 0 0 30px rgba(139, 92, 246, 0.08), 0 20px 25px -5px rgba(139, 92, 246, 0.1);
}
</style>
