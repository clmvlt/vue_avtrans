<template>
  <div class="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-muted">
    <div class="w-full max-w-[480px] bg-card border border-border rounded-lg p-6 sm:p-8 shadow-lg">
      <!-- Loading State -->
      <div v-if="loading" class="text-center">
        <div class="inline-flex items-center justify-center size-20 sm:size-[100px] bg-gradient-to-br from-info to-info/80 rounded-full mb-5">
          <font-awesome-icon :icon="['fas', 'spinner']" spin class="text-[40px] sm:text-[48px] text-white" />
        </div>
        <h1 class="text-xl sm:text-2xl font-bold text-foreground mb-3 mt-0">Vérification en cours...</h1>
        <p class="text-muted-foreground text-base leading-relaxed mb-6 mt-0">
          Veuillez patienter pendant que nous vérifions votre email.
        </p>
      </div>

      <!-- Success State -->
      <div v-else-if="successMessage" class="text-center">
        <div class="inline-flex items-center justify-center size-20 sm:size-[100px] bg-gradient-to-br from-success to-success/80 rounded-full mb-5">
          <font-awesome-icon :icon="['fas', 'check-circle']" class="text-[40px] sm:text-[48px] text-white" />
        </div>
        <h1 class="text-xl sm:text-2xl font-bold text-foreground mb-3 mt-0">Email vérifié avec succès !</h1>
        <p class="text-muted-foreground text-base leading-relaxed mb-6 mt-0">{{ successMessage }}</p>

        <div class="flex gap-4 p-5 bg-warning/10 border-2 border-warning/30 rounded-md mb-5 text-left">
          <div class="flex items-center justify-center size-12 bg-gradient-to-br from-warning to-warning/80 rounded-full text-white text-xl flex-shrink-0">
            <font-awesome-icon :icon="['fas', 'user-shield']" />
          </div>
          <div class="flex-1">
            <h3 class="text-base font-bold text-warning mb-2 mt-0">Activation du compte requise</h3>
            <p class="text-sm text-muted-foreground leading-relaxed mb-2 mt-0">
              Votre adresse email a été vérifiée, mais un <strong class="text-warning font-semibold">administrateur doit activer votre compte</strong> avant que vous puissiez vous connecter.
            </p>
            <p class="text-sm text-muted-foreground leading-relaxed m-0">
              Vous recevrez une notification par email dès que votre compte sera activé.
            </p>
          </div>
        </div>

        <p class="flex items-center justify-center gap-2 text-muted-foreground text-sm mb-4 mt-0">
          <font-awesome-icon :icon="['fas', 'clock']" />
          Redirection automatique dans quelques secondes...
        </p>
        <Button
          @click="router.push('/login')"
          class="w-full"
        >
          Retour à la connexion
        </Button>
      </div>

      <!-- Error State -->
      <div v-else-if="errorMessage" class="text-center">
        <div class="inline-flex items-center justify-center size-20 sm:size-[100px] bg-gradient-to-br from-destructive to-destructive/80 rounded-full mb-5">
          <font-awesome-icon :icon="['fas', 'times-circle']" class="text-[40px] sm:text-[48px] text-white" />
        </div>
        <h1 class="text-xl sm:text-2xl font-bold text-foreground mb-3 mt-0">Erreur de vérification</h1>
        <p class="text-destructive text-base leading-relaxed mb-6 mt-0">{{ errorMessage }}</p>
        <div class="flex flex-col gap-3">
          <Button
            @click="router.push('/register')"
            class="w-full"
          >
            Retour à l'inscription
          </Button>
          <Button
            variant="outline"
            @click="router.push('/login')"
            class="w-full"
          >
            Se connecter
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authService } from '@/services/auth'
import { Button } from '@/components/ui/button'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const successMessage = ref('')
const errorMessage = ref('')

onMounted(async () => {
  const token = route.query.token

  if (!token || typeof token !== 'string') {
    errorMessage.value = 'Token de vérification manquant'
    loading.value = false
    return
  }

  try {
    const response = await authService.verifyEmail(token)

    if (response.success) {
      successMessage.value = response.message || 'Votre email a été vérifié avec succès.'

      // Redirection automatique après 3 secondes
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    }
  } catch (error: any) {
    errorMessage.value = error.message || 'Token invalide ou expiré'
  } finally {
    loading.value = false
  }
})
</script>
