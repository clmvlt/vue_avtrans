<template>
  <div class="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-muted">
    <div class="w-full max-w-[480px] bg-card border border-border rounded-xl p-6 sm:p-10 shadow-xl text-center">
      <div class="mb-6">
        <span class="text-[48px] sm:text-[64px] inline-block">🚫</span>
      </div>

      <h1 class="text-2xl sm:text-3xl text-destructive mb-4 font-semibold">Accès refusé</h1>

      <p class="text-muted-foreground text-lg mb-6 leading-relaxed">
        Vous n'avez pas les permissions nécessaires pour accéder à cette application.
      </p>

      <div v-if="userRole" class="inline-flex flex-col items-center gap-2 bg-warning/10 border border-warning/30 rounded-lg px-6 py-4 mb-6">
        <span class="text-sm text-muted-foreground uppercase tracking-wider">Votre rôle actuel</span>
        <span class="text-lg text-warning font-semibold">{{ userRole }}</span>
      </div>

      <div class="mb-8">
        <p class="text-muted-foreground text-base leading-relaxed mb-3">
          Seuls les <strong class="text-foreground font-medium">Administrateurs</strong> et les <strong class="text-foreground font-medium">Mécaniciens</strong> peuvent accéder à ce site.
        </p>
        <p class="text-muted-foreground text-base leading-relaxed mb-3">
          Si vous êtes un <strong class="text-foreground font-medium">Utilisateur</strong>, veuillez utiliser l'application mobile pour accéder à vos pointages.
        </p>
        <p class="text-muted-foreground/70 text-sm mt-4">
          Si vous pensez qu'il s'agit d'une erreur, veuillez contacter votre administrateur système.
        </p>
      </div>

      <Button @click="handleLogout" class="w-full">
        Se déconnecter
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'

const router = useRouter()
const authStore = useAuthStore()

const userRole = computed(() => authStore.userRole)

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>
