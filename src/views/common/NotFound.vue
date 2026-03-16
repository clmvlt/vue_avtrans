<template>
  <div class="flex justify-center items-center min-h-screen bg-background p-4 sm:p-6">
    <div class="max-w-[600px] w-full text-center">
      <div class="flex flex-col items-center gap-6 mb-8">
        <h1 class="text-[80px] sm:text-[120px] font-extrabold text-primary m-0 leading-none">404</h1>
        <div>
          <h2 class="text-2xl sm:text-3xl font-bold text-foreground mb-3 mt-0">Page non trouvée</h2>
          <p class="text-base sm:text-lg text-muted-foreground m-0 leading-relaxed">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>
        </div>
      </div>

      <div class="bg-muted border border-border rounded-md p-4 sm:p-6 mb-8 text-left">
        <h3 class="text-lg font-semibold text-foreground mb-4 mt-0">Suggestions :</h3>
        <ul class="list-none p-0 m-0 flex flex-col gap-2">
          <li class="text-base text-muted-foreground pl-6 relative before:content-['•'] before:absolute before:left-3 before:text-primary before:font-bold">Vérifiez l'URL dans la barre d'adresse</li>
          <li class="text-base text-muted-foreground pl-6 relative before:content-['•'] before:absolute before:left-3 before:text-primary before:font-bold">Retournez à la page précédente</li>
          <li v-if="isAuthenticated" class="text-base text-muted-foreground pl-6 relative before:content-['•'] before:absolute before:left-3 before:text-primary before:font-bold">Accédez au tableau de bord</li>
          <li v-else class="text-base text-muted-foreground pl-6 relative before:content-['•'] before:absolute before:left-3 before:text-primary before:font-bold">Connectez-vous à votre compte</li>
        </ul>
      </div>

      <div class="flex gap-3 justify-center flex-wrap max-sm:flex-col max-sm:w-full">
        <Button
          @click="handleGoBack"
        >
          <ArrowLeft class="size-4" />
          Retour
        </Button>

        <Button
          v-if="isAuthenticated"
          variant="secondary"
          @click="$router.push('/vehicules')"
        >
          <Home class="size-4" />
          Tableau de bord
        </Button>

        <Button
          v-else
          variant="secondary"
          @click="$router.push('/login')"
        >
          <LogIn class="size-4" />
          Se connecter
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Home, LogIn } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const isAuthenticated = computed(() => authStore.isAuthenticated)

const handleGoBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push(isAuthenticated.value ? '/vehicules' : '/login')
  }
}
</script>
