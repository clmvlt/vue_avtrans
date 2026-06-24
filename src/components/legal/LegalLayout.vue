<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import logoImg from '@/assets/favicon.png'

defineProps<{
  title: string
  subtitle?: string
  lastUpdated?: string
}>()
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <!-- Header -->
    <header class="border-b border-border bg-card/80 backdrop-blur-sm">
      <div class="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
        <RouterLink to="/" class="flex items-center gap-3">
          <img :src="logoImg" alt="AVTRANS Concept" class="size-9 rounded-xl shadow-sm" />
          <div class="flex flex-col">
            <span class="text-base font-bold tracking-tight">AVTRANS</span>
            <span class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Solutions Transport
            </span>
          </div>
        </RouterLink>
        <RouterLink
          to="/"
          class="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft class="size-4" />
          <span class="hidden sm:inline">Retour à l'accueil</span>
        </RouterLink>
      </div>
    </header>

    <!-- Title -->
    <div class="border-b border-border bg-muted/40">
      <div class="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 class="text-3xl font-bold tracking-tight sm:text-4xl">{{ title }}</h1>
        <p v-if="subtitle" class="mt-3 text-base text-muted-foreground">{{ subtitle }}</p>
        <p v-if="lastUpdated" class="mt-4 text-sm text-muted-foreground">
          Dernière mise à jour : {{ lastUpdated }}
        </p>
      </div>
    </div>

    <!-- Content -->
    <main class="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div class="legal-content">
        <slot />
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-border bg-muted/40">
      <div class="mx-auto flex max-w-3xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <p class="text-xs text-muted-foreground">
          &copy; {{ new Date().getFullYear() }} AVTRANS Concept
        </p>
        <nav class="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
          <RouterLink to="/" class="text-muted-foreground transition-colors hover:text-foreground">
            Accueil
          </RouterLink>
          <RouterLink to="/mentions-legales" class="text-muted-foreground transition-colors hover:text-foreground">
            Mentions légales
          </RouterLink>
          <RouterLink to="/politique-confidentialite" class="text-muted-foreground transition-colors hover:text-foreground">
            Politique de confidentialité
          </RouterLink>
        </nav>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.legal-content :deep(h2) {
  margin-top: 2.5rem;
  margin-bottom: 0.75rem;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--foreground);
}

.legal-content :deep(h2:first-child) {
  margin-top: 0;
}

.legal-content :deep(h3) {
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--foreground);
}

.legal-content :deep(p) {
  margin-bottom: 1rem;
  line-height: 1.7;
  color: var(--muted-foreground);
}

.legal-content :deep(ul) {
  margin-bottom: 1rem;
  list-style: disc;
  padding-left: 1.5rem;
  color: var(--muted-foreground);
}

.legal-content :deep(li) {
  margin-bottom: 0.5rem;
  line-height: 1.7;
}

.legal-content :deep(a) {
  color: var(--primary);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.legal-content :deep(strong) {
  color: var(--foreground);
  font-weight: 600;
}

.legal-content :deep(address) {
  margin-bottom: 1rem;
  font-style: normal;
  line-height: 1.7;
  color: var(--muted-foreground);
}

/* Placeholders à compléter par l'éditeur */
.legal-content :deep(.todo) {
  background-color: color-mix(in oklch, var(--warning) 18%, transparent);
  color: var(--foreground);
  padding: 0.05em 0.4em;
  border-radius: 0.25rem;
  font-weight: 500;
  white-space: nowrap;
}
</style>
