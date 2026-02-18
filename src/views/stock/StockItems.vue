<template>
  <div class="min-h-screen bg-background">
    <main class="flex-1">
      <!-- Loading -->
      <div v-if="loading" class="flex flex-col items-center justify-center gap-4 py-16">
        <LoaderCircle class="size-10 animate-spin text-primary" />
        <p class="text-lg text-muted-foreground">Chargement...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="m-4 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
        {{ error }}
      </div>

      <!-- Content avec sidebar -->
      <div v-else class="mx-auto grid w-full max-w-[1600px] grid-cols-1 md:grid-cols-[280px_1fr]">
        <!-- Sidebar des catégories -->
        <aside class="border-b bg-background md:sticky md:top-0 md:h-screen md:border-b-0 md:border-r md:flex md:flex-col">
          <div class="flex items-center justify-between border-b p-4">
            <div class="flex items-center gap-2">
              <Button variant="ghost" size="icon-sm" class="size-7" @click="goBack" title="Retour">
                <ArrowLeft class="size-4" />
              </Button>
              <h2 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Catégories</h2>
            </div>
            <Button
              v-if="isMecanicien"
              variant="default"
              size="icon-sm"
              @click="openCreateCategoryModal"
              title="Créer une catégorie"
            >
              <Plus class="size-3.5" />
            </Button>
          </div>

          <div class="flex flex-wrap gap-2 overflow-y-auto p-2 md:flex-col md:flex-nowrap md:gap-0">
            <!-- Tous les articles -->
            <div
              class="mb-2 flex cursor-pointer items-center gap-3 rounded-md px-3 py-3 transition-colors"
              :class="[
                selectedCategoryId === null
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              ]"
              @click="selectCategory(null)"
            >
              <List class="size-5 shrink-0" :class="selectedCategoryId === null ? 'text-primary-foreground' : 'text-primary'" />
              <span class="flex-1 truncate text-sm font-medium">Tous</span>
              <span
                class="min-w-6 shrink-0 rounded-full px-2 py-0.5 text-center text-xs"
                :class="selectedCategoryId === null ? 'bg-white/20 text-primary-foreground' : 'bg-muted text-muted-foreground'"
              >
                {{ stockItems.length }}
              </span>
            </div>

            <!-- Catégories -->
            <div
              v-for="category in categories"
              :key="category.id"
              class="group relative flex cursor-pointer items-center gap-3 rounded-md px-3 py-3 transition-colors md:mb-1"
              :class="[
                selectedCategoryId === category.id
                  ? 'bg-primary text-primary-foreground'
                  : dragOverCategoryId === category.id
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'hover:bg-accent'
              ]"
              @click="selectCategory(category.id!)"
              @dragover.prevent="handleDragOver(category.id!)"
              @dragleave="handleDragLeave"
              @drop="handleDrop(category.id!)"
            >
              <Tag class="size-5 shrink-0" :class="selectedCategoryId === category.id || dragOverCategoryId === category.id ? 'text-primary-foreground' : 'text-amber-500'" />
              <span class="flex-1 truncate text-sm font-medium">{{ category.nom }}</span>
              <span
                class="min-w-6 shrink-0 rounded-full px-2 py-0.5 text-center text-xs transition-opacity group-hover:md:opacity-0"
                :class="selectedCategoryId === category.id || dragOverCategoryId === category.id ? 'bg-white/20 text-primary-foreground' : 'bg-muted text-muted-foreground'"
              >
                {{ getItemCountForCategory(category.id!) }}
              </span>
              <!-- Desktop actions (hover) -->
              <div v-if="isMecanicien" class="absolute right-3 hidden gap-1 md:group-hover:flex">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  class="size-6"
                  :class="selectedCategoryId === category.id ? 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/20' : ''"
                  @click.stop="openEditCategoryModal(category)"
                  title="Modifier"
                >
                  <Pencil class="size-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  class="size-6"
                  :class="selectedCategoryId === category.id ? 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/20' : 'hover:text-destructive'"
                  @click.stop="confirmDeleteCategory(category)"
                  title="Supprimer"
                >
                  <Trash2 class="size-3" />
                </Button>
              </div>
              <!-- Mobile actions (dropdown) -->
              <DropdownMenu v-if="isMecanicien">
                <DropdownMenuTrigger as-child class="md:hidden">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    class="size-6 shrink-0"
                    :class="selectedCategoryId === category.id ? 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/20' : ''"
                    @click.stop
                  >
                    <MoreVertical class="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-40">
                  <DropdownMenuItem @click.stop="openEditCategoryModal(category)">
                    <Pencil class="mr-2 size-4" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem class="text-destructive focus:text-destructive" @click.stop="confirmDeleteCategory(category)">
                    <Trash2 class="mr-2 size-4" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <!-- Non classés -->
            <div
              class="mt-0 border-t pt-3 md:mt-2"
              :class="[
                'flex cursor-pointer items-center gap-3 rounded-md px-3 py-3 transition-colors',
                selectedCategoryId === 'unclassified'
                  ? 'bg-primary text-primary-foreground'
                  : dragOverCategoryId === 'unclassified'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'hover:bg-accent'
              ]"
              @click="selectCategory('unclassified')"
              @dragover.prevent="handleDragOver('unclassified')"
              @dragleave="handleDragLeave"
              @drop="handleDrop('unclassified')"
            >
              <Inbox class="size-5 shrink-0" :class="selectedCategoryId === 'unclassified' || dragOverCategoryId === 'unclassified' ? 'text-primary-foreground' : 'text-muted-foreground'" />
              <span class="flex-1 truncate text-sm font-medium">Non classés</span>
              <span
                class="min-w-6 shrink-0 rounded-full px-2 py-0.5 text-center text-xs"
                :class="selectedCategoryId === 'unclassified' || dragOverCategoryId === 'unclassified' ? 'bg-white/20 text-primary-foreground' : 'bg-muted text-muted-foreground'"
              >
                {{ unclassifiedItems.length }}
              </span>
            </div>
          </div>
        </aside>

        <!-- Liste des articles -->
        <div class="flex flex-col gap-4 p-4 md:p-6">
          <!-- Barre de recherche + Ajouter -->
          <div class="flex items-center gap-3">
            <div class="relative flex-1">
              <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                v-model="searchQuery"
                type="search"
                placeholder="Rechercher par nom, référence ou description..."
                class="pl-9"
              />
            </div>
            <div
              v-if="isMecanicien && filteredItems.length > 0"
              class="group/hint relative hidden shrink-0 cursor-default text-muted-foreground/40 transition-colors hover:text-muted-foreground md:block"
            >
              <Info class="size-3.5" />
              <div class="pointer-events-none absolute right-0 top-full z-50 mt-2 hidden rounded-md border bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md whitespace-nowrap group-hover/hint:block">
                Glissez-déposez les articles vers une catégorie
              </div>
            </div>
            <Button v-if="isMecanicien" size="sm" class="shrink-0" @click="openCreateItemModal">
              <Plus class="mr-1.5 size-4" />
              Ajouter un article
            </Button>
          </div>

          <!-- Liste des articles -->
          <div class="flex flex-col gap-3">
            <div
              v-for="item in filteredItems"
              :key="item.id"
              class="flex items-start gap-3 rounded-lg border bg-card p-4 transition-colors hover:shadow-sm"
              :class="isMecanicien ? 'cursor-grab active:cursor-grabbing' : ''"
              :draggable="isMecanicien"
              @dragstart="handleDragStart(item)"
              @dragend="handleDragEnd"
            >
              <div v-if="isMecanicien" class="hidden cursor-grab p-1 text-muted-foreground active:cursor-grabbing md:block">
                <GripVertical class="size-4" />
              </div>
              <div class="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Package class="size-5" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="mb-1 flex flex-wrap items-center gap-2">
                  <span class="font-mono text-sm tracking-wide text-primary">{{ item.reference }}</span>
                  <span class="font-semibold text-foreground">{{ item.nom }}</span>
                  <Badge v-if="item.category && selectedCategoryId === null" variant="outline" class="gap-1">
                    <Tag class="size-3" />
                    {{ item.category.nom }}
                  </Badge>
                </div>
                <p v-if="item.description" class="mb-2 text-sm leading-relaxed text-muted-foreground">
                  {{ truncateText(item.description, 100) }}
                </p>
                <div class="flex items-center gap-3">
                  <div v-if="isMecanicien" class="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      class="size-7 hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
                      :disabled="(item.quantite || 0) <= 0 || updatingQuantity === item.id"
                      @click.stop="updateQuantity(item, -1)"
                      title="Retirer 1"
                    >
                      <Minus class="size-3" />
                    </Button>
                    <span
                      class="min-w-10 text-center text-base font-bold"
                      :class="(item.quantite || 0) <= 5 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'"
                    >
                      {{ item.quantite }}
                    </span>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      class="size-7 hover:border-green-500 hover:bg-green-500/10 hover:text-green-600"
                      :disabled="updatingQuantity === item.id"
                      @click.stop="updateQuantity(item, 1)"
                      title="Ajouter 1"
                    >
                      <Plus class="size-3" />
                    </Button>
                    <span class="text-sm text-muted-foreground">{{ item.unite }}</span>
                  </div>
                  <span v-else class="text-sm font-semibold" :class="(item.quantite || 0) <= 5 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'">
                    {{ item.quantite }} {{ item.unite }}
                  </span>
                </div>
              </div>
              <!-- Desktop actions -->
              <div v-if="isMecanicien" class="hidden shrink-0 gap-1 md:flex">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  @click="openEditItemModal(item)"
                  title="Modifier"
                >
                  <Pencil class="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  @click="confirmDeleteItem(item)"
                  title="Supprimer"
                >
                  <Trash2 class="size-3.5" />
                </Button>
              </div>
              <!-- Mobile actions -->
              <DropdownMenu v-if="isMecanicien">
                <DropdownMenuTrigger as-child class="md:hidden">
                  <Button variant="ghost" size="icon-sm">
                    <MoreVertical class="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-40">
                  <DropdownMenuItem @click="openEditItemModal(item)">
                    <Pencil class="mr-2 size-4" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem class="text-destructive focus:text-destructive" @click="confirmDeleteItem(item)">
                    <Trash2 class="mr-2 size-4" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <!-- État vide -->
            <div v-if="filteredItems.length === 0" class="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <PackageOpen class="mb-4 size-12 opacity-50" />
              <p v-if="searchQuery">Aucun article trouvé pour "{{ searchQuery }}"</p>
              <p v-else-if="selectedCategoryId === 'unclassified'">Aucun article non classé</p>
              <p v-else-if="selectedCategoryId">Cette catégorie est vide</p>
              <p v-else>Aucun article en stock</p>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal création/édition article -->
    <Dialog v-model:open="showItemModal">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{{ isEditItemMode ? 'Modifier l\'article' : 'Nouvel article' }}</DialogTitle>
        </DialogHeader>

        <div v-if="itemFormError" class="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {{ itemFormError }}
        </div>

        <form @submit.prevent="handleItemFormSubmit" class="space-y-4">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <label for="reference" class="text-sm font-medium text-foreground">Référence *</label>
              <Input
                id="reference"
                v-model="itemFormData.reference"
                type="text"
                placeholder="FRN-PAD-001"
                :disabled="savingItem"
                required
              />
            </div>

            <div class="space-y-2">
              <label for="nom" class="text-sm font-medium text-foreground">Nom *</label>
              <Input
                id="nom"
                v-model="itemFormData.nom"
                type="text"
                placeholder="Plaquettes de frein"
                :disabled="savingItem"
                required
              />
            </div>
          </div>

          <div class="space-y-2">
            <label for="description" class="text-sm font-medium text-foreground">Description</label>
            <textarea
              id="description"
              v-model="itemFormData.description"
              placeholder="Description de l'article..."
              :disabled="savingItem"
              rows="2"
              class="flex min-h-[60px] w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none disabled:cursor-not-allowed disabled:opacity-50"
            ></textarea>
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div class="space-y-2">
              <label for="quantite" class="text-sm font-medium text-foreground">Quantité *</label>
              <Input
                id="quantite"
                v-model.number="itemFormData.quantite"
                type="number"
                placeholder="0"
                :disabled="savingItem"
                required
              />
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium text-foreground">Unité *</label>
              <Select
                v-model="itemFormData.unite"
                :options="uniteOptions"
                placeholder="Sélectionner..."
                :disabled="savingItem"
              />
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium text-foreground">Catégorie</label>
              <Select
                v-model="itemFormData.categoryId"
                :options="categoryOptionsForForm"
                placeholder="Aucune catégorie"
                :searchable="true"
                :clearable="true"
                :disabled="savingItem"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" @click="closeItemModal">
              Annuler
            </Button>
            <Button type="submit" :disabled="savingItem">
              <LoaderCircle v-if="savingItem" class="mr-1.5 size-4 animate-spin" />
              {{ savingItem ? 'Enregistrement...' : 'Enregistrer' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Modal création/édition catégorie -->
    <Dialog v-model:open="showCategoryModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ isEditCategoryMode ? 'Modifier la catégorie' : 'Nouvelle catégorie' }}</DialogTitle>
        </DialogHeader>

        <div v-if="categoryFormError" class="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {{ categoryFormError }}
        </div>

        <form @submit.prevent="handleCategoryFormSubmit" class="space-y-4">
          <div class="space-y-2">
            <label for="categoryNom" class="text-sm font-medium text-foreground">Nom *</label>
            <Input
              id="categoryNom"
              v-model="categoryFormData.nom"
              type="text"
              placeholder="Freins"
              :disabled="savingCategory"
              required
            />
          </div>

          <div class="space-y-2">
            <label for="categoryDescription" class="text-sm font-medium text-foreground">Description</label>
            <textarea
              id="categoryDescription"
              v-model="categoryFormData.description"
              placeholder="Pièces liées au système de freinage"
              :disabled="savingCategory"
              rows="2"
              class="flex min-h-[60px] w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none disabled:cursor-not-allowed disabled:opacity-50"
            ></textarea>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" @click="closeCategoryModal">
              Annuler
            </Button>
            <Button type="submit" :disabled="savingCategory">
              <LoaderCircle v-if="savingCategory" class="mr-1.5 size-4 animate-spin" />
              {{ savingCategory ? 'Enregistrement...' : 'Enregistrer' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Modal suppression article -->
    <Dialog v-model:open="showDeleteItemModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Supprimer l'article</DialogTitle>
          <DialogDescription>Cette action est irréversible.</DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          <p class="text-foreground">
            Êtes-vous sûr de vouloir supprimer l'article <strong>{{ itemToDelete?.nom }}</strong> ?
          </p>

          <div class="rounded-md bg-muted p-4 text-center">
            <div class="font-mono text-sm tracking-wider text-primary">{{ itemToDelete?.reference }}</div>
            <div class="mt-1 text-sm text-muted-foreground">{{ itemToDelete?.quantite }} {{ itemToDelete?.unite }}</div>
          </div>

          <div class="space-y-2">
            <label for="confirmInput" class="text-sm text-muted-foreground">
              Pour confirmer, tapez <strong class="text-foreground">CONFIRMER</strong> ci-dessous :
            </label>
            <Input
              id="confirmInput"
              v-model="confirmText"
              type="text"
              placeholder="Tapez CONFIRMER"
              autocomplete="off"
              class="text-center font-medium tracking-widest"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showDeleteItemModal = false">Annuler</Button>
          <Button
            variant="destructive"
            :disabled="confirmText !== 'CONFIRMER' || deletingItem"
            @click="deleteItem"
          >
            <LoaderCircle v-if="deletingItem" class="mr-1.5 size-4 animate-spin" />
            {{ deletingItem ? 'Suppression...' : 'Supprimer' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Modal suppression catégorie -->
    <Dialog v-model:open="showDeleteCategoryModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Supprimer la catégorie</DialogTitle>
          <DialogDescription>Cette action est irréversible.</DialogDescription>
        </DialogHeader>

        <div class="space-y-3">
          <p class="text-foreground">
            Êtes-vous sûr de vouloir supprimer la catégorie <strong>{{ categoryToDelete?.nom }}</strong> ?
          </p>
          <p class="text-sm text-muted-foreground">
            Les articles de cette catégorie seront déplacés vers "Non classés".
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showDeleteCategoryModal = false">Annuler</Button>
          <Button
            variant="destructive"
            :disabled="deletingCategory"
            @click="deleteCategory"
          >
            <LoaderCircle v-if="deletingCategory" class="mr-1.5 size-4 animate-spin" />
            {{ deletingCategory ? 'Suppression...' : 'Supprimer' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { stockItemsService, stockCategoriesService } from '@/services'
import { useMessages } from '@/composables/useMessages'
import type { StockItemDTO, StockCategoryDTO } from '@/models'

// shadcn components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// Lucide icons
import {
  ArrowLeft,
  Plus,
  Minus,
  Search,
  LoaderCircle,
  Pencil,
  Trash2,
  Tag,
  List,
  Inbox,
  Package,
  PackageOpen,
  GripVertical,
  Info,
  MoreVertical,
} from 'lucide-vue-next'

// DropdownMenu for mobile actions
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'



const router = useRouter()
const authStore = useAuthStore()
const messages = useMessages()

const goBack = () => {
  const historyState = window.history.state
  if (historyState && historyState.position > 0) {
    router.back()
  } else {
    router.push('/entretiens')
  }
}

// État principal
const stockItems = ref<StockItemDTO[]>([])
const categories = ref<StockCategoryDTO[]>([])
const loading = ref(true)
const error = ref('')
const searchQuery = ref('')
const selectedCategoryId = ref<string | null>(null)

// Drag & Drop
const draggedItem = ref<StockItemDTO | null>(null)
const dragOverCategoryId = ref<string | null>(null)

// Vérifier si l'utilisateur est mécanicien ou admin
const isMecanicien = computed(() => {
  const roleUuid = authStore.userRoleUuid
  return roleUuid === 'c10523af-a4ab-47e2-8025-5ef4e241ef08' || // Admin
         roleUuid === 'ccbd448a-0eef-4277-b53b-91be340b080f'    // Mécanicien
})

// Modal article
const showItemModal = ref(false)
const isEditItemMode = ref(false)
const itemToEdit = ref<StockItemDTO | null>(null)
const savingItem = ref(false)
const itemFormError = ref('')
const itemFormData = ref({
  reference: '',
  nom: '',
  description: '',
  quantite: 0,
  unite: 'pièce',
  categoryId: ''
})

// Modal catégorie
const showCategoryModal = ref(false)
const isEditCategoryMode = ref(false)
const categoryToEdit = ref<StockCategoryDTO | null>(null)
const savingCategory = ref(false)
const categoryFormError = ref('')
const categoryFormData = ref({
  nom: '',
  description: ''
})

// Suppression article
const showDeleteItemModal = ref(false)
const itemToDelete = ref<StockItemDTO | null>(null)
const deletingItem = ref(false)
const confirmText = ref('')

// Suppression catégorie
const showDeleteCategoryModal = ref(false)
const categoryToDelete = ref<StockCategoryDTO | null>(null)
const deletingCategory = ref(false)

// Mise à jour quantité
const updatingQuantity = ref<string | null>(null)

// Options d'unités
const uniteOptions = [
  { value: 'pièce', label: 'Pièce' },
  { value: 'litre', label: 'Litre' },
  { value: 'kg', label: 'Kilogramme' },
  { value: 'mètre', label: 'Mètre' },
  { value: 'boîte', label: 'Boîte' },
  { value: 'lot', label: 'Lot' },
  { value: 'unité', label: 'Unité' }
]

// Articles non classés
const unclassifiedItems = computed(() =>
  stockItems.value.filter(item => !item.category)
)

// Options pour le formulaire de catégorie (utilise l'ID comme valeur)
const categoryOptionsForForm = computed(() =>
  categories.value
    .filter(c => c.id && c.nom)
    .map(c => ({ value: c.id!, label: c.nom! }))
)

// Articles filtrés selon la catégorie sélectionnée et la recherche
const filteredItems = computed(() => {
  let result = stockItems.value

  // Filtre par catégorie
  if (selectedCategoryId.value === 'unclassified') {
    result = result.filter(item => !item.category)
  } else if (selectedCategoryId.value) {
    result = result.filter(item => item.category?.id === selectedCategoryId.value)
  }

  // Filtre par recherche texte
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(item => {
      return (item.reference?.toLowerCase().includes(query)) ||
             (item.nom?.toLowerCase().includes(query)) ||
             (item.description?.toLowerCase().includes(query))
    })
  }

  return result
})

// Compter les articles par catégorie
const getItemCountForCategory = (categoryId: string) => {
  return stockItems.value.filter(item => item.category?.id === categoryId).length
}

// Chargement des données
const loadCategories = async () => {
  try {
    const response = await stockCategoriesService.getCategories()
    categories.value = response.categories || []
  } catch (err) {
    console.error('Erreur lors du chargement des catégories:', err)
  }
}

const loadStockItems = async () => {
  try {
    loading.value = true
    error.value = ''
    const response = await stockItemsService.getStockItems()
    stockItems.value = response.stockItems || []
  } catch (err) {
    console.error('Erreur lors du chargement du stock:', err)
    error.value = err instanceof Error ? err.message : 'Erreur lors du chargement'
  } finally {
    loading.value = false
  }
}

// Sélection catégorie
const selectCategory = (categoryId: string | null) => {
  selectedCategoryId.value = categoryId
}

// Drag & Drop handlers
const handleDragStart = (item: StockItemDTO) => {
  draggedItem.value = item
}

const handleDragEnd = () => {
  draggedItem.value = null
  dragOverCategoryId.value = null
}

const handleDragOver = (categoryId: string) => {
  if (draggedItem.value) {
    dragOverCategoryId.value = categoryId
  }
}

const handleDragLeave = () => {
  dragOverCategoryId.value = null
}

const handleDrop = async (targetCategoryId: string) => {
  if (!draggedItem.value || !draggedItem.value.id) return

  const item = draggedItem.value
  const newCategoryId = targetCategoryId === 'unclassified' ? undefined : targetCategoryId

  // Ne pas faire de requête si la catégorie n'a pas changé
  const currentCategoryId = item.category?.id
  if (currentCategoryId === newCategoryId) {
    handleDragEnd()
    return
  }

  try {
    await stockItemsService.updateStockItem(item.id!, { categoryId: newCategoryId })

    // Recharger les données pour avoir l'objet category complet
    await loadStockItems()

    const categoryLabel = targetCategoryId === 'unclassified'
      ? 'Non classés'
      : categories.value.find(c => c.id === targetCategoryId)?.nom || 'la catégorie'

    messages.success(`Article déplacé vers "${categoryLabel}"`, 'Succès')
  } catch (err) {
    messages.error('Erreur lors du déplacement', 'Erreur')
    console.error(err)
  } finally {
    handleDragEnd()
  }
}

// Utilitaires
const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Mise à jour rapide de la quantité
const updateQuantity = async (item: StockItemDTO, delta: number) => {
  if (!item.id) return

  const newQuantity = (item.quantite || 0) + delta
  if (newQuantity < 0) return

  try {
    updatingQuantity.value = item.id
    await stockItemsService.updateStockItem(item.id, { quantite: newQuantity })

    // Mettre à jour localement
    const index = stockItems.value.findIndex(i => i.id === item.id)
    if (index !== -1) {
      stockItems.value[index] = { ...stockItems.value[index]!, quantite: newQuantity }
    }
  } catch (err) {
    messages.error('Erreur lors de la mise à jour', 'Erreur')
    console.error(err)
  } finally {
    updatingQuantity.value = null
  }
}

// Gestion modal article
const openCreateItemModal = () => {
  isEditItemMode.value = false
  itemToEdit.value = null

  // Pré-sélectionner la catégorie si on est dans une catégorie
  let preselectedCategoryId = ''
  if (selectedCategoryId.value && selectedCategoryId.value !== 'unclassified') {
    preselectedCategoryId = selectedCategoryId.value
  }

  itemFormData.value = {
    reference: '',
    nom: '',
    description: '',
    quantite: 0,
    unite: 'pièce',
    categoryId: preselectedCategoryId
  }
  itemFormError.value = ''
  showItemModal.value = true
}

const openEditItemModal = (item: StockItemDTO) => {
  isEditItemMode.value = true
  itemToEdit.value = item
  itemFormData.value = {
    reference: item.reference || '',
    nom: item.nom || '',
    description: item.description || '',
    quantite: item.quantite || 0,
    unite: item.unite || 'pièce',
    categoryId: item.category?.id || ''
  }
  itemFormError.value = ''
  showItemModal.value = true
}

const closeItemModal = () => {
  showItemModal.value = false
  itemToEdit.value = null
  itemFormError.value = ''
}

const handleItemFormSubmit = async () => {
  itemFormError.value = ''

  try {
    savingItem.value = true

    const dataToSend = {
      reference: itemFormData.value.reference,
      nom: itemFormData.value.nom,
      description: itemFormData.value.description || undefined,
      quantite: itemFormData.value.quantite,
      unite: itemFormData.value.unite,
      categoryId: itemFormData.value.categoryId || undefined
    }

    if (isEditItemMode.value && itemToEdit.value?.id) {
      const response = await stockItemsService.updateStockItem(itemToEdit.value.id, dataToSend)
      const updatedItem = response.stockItem
      const index = stockItems.value.findIndex(i => i.id === itemToEdit.value?.id)
      if (index !== -1 && updatedItem) {
        stockItems.value[index] = updatedItem
      }
      messages.success('Article modifié avec succès !', 'Succès')
    } else {
      const response = await stockItemsService.createStockItem(dataToSend)
      const newItem = response.stockItem
      if (newItem) {
        stockItems.value.push(newItem)
      }
      messages.success('Article créé avec succès !', 'Succès')
    }

    closeItemModal()
  } catch (err) {
    itemFormError.value = err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement'
  } finally {
    savingItem.value = false
  }
}

// Gestion modal catégorie
const openCreateCategoryModal = () => {
  isEditCategoryMode.value = false
  categoryToEdit.value = null
  categoryFormData.value = { nom: '', description: '' }
  categoryFormError.value = ''
  showCategoryModal.value = true
}

const openEditCategoryModal = (category: StockCategoryDTO) => {
  isEditCategoryMode.value = true
  categoryToEdit.value = category
  categoryFormData.value = {
    nom: category.nom || '',
    description: category.description || ''
  }
  categoryFormError.value = ''
  showCategoryModal.value = true
}

const closeCategoryModal = () => {
  showCategoryModal.value = false
  categoryToEdit.value = null
  categoryFormError.value = ''
}

const handleCategoryFormSubmit = async () => {
  categoryFormError.value = ''

  try {
    savingCategory.value = true

    if (isEditCategoryMode.value && categoryToEdit.value?.id) {
      const response = await stockCategoriesService.updateCategory(
        categoryToEdit.value.id,
        categoryFormData.value
      )
      const index = categories.value.findIndex(c => c.id === categoryToEdit.value?.id)
      if (index !== -1 && response.category) {
        categories.value[index] = response.category
      }
      // Recharger les articles pour avoir les catégories à jour
      await loadStockItems()
      messages.success('Catégorie modifiée avec succès !', 'Succès')
    } else {
      const response = await stockCategoriesService.createCategory(categoryFormData.value)
      if (response.category) {
        categories.value.push(response.category)
      }
      messages.success('Catégorie créée avec succès !', 'Succès')
    }

    closeCategoryModal()
  } catch (err) {
    categoryFormError.value = err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement'
  } finally {
    savingCategory.value = false
  }
}

// Suppression article
const confirmDeleteItem = (item: StockItemDTO) => {
  itemToDelete.value = item
  confirmText.value = ''
  showDeleteItemModal.value = true
}

const deleteItem = async () => {
  if (!itemToDelete.value?.id || confirmText.value !== 'CONFIRMER') return

  try {
    deletingItem.value = true
    await stockItemsService.deleteStockItem(itemToDelete.value.id)
    stockItems.value = stockItems.value.filter(i => i.id !== itemToDelete.value?.id)
    showDeleteItemModal.value = false
    itemToDelete.value = null
    confirmText.value = ''
    messages.success('Article supprimé avec succès !', 'Succès')
  } catch (err) {
    messages.error('Erreur lors de la suppression', 'Erreur')
  } finally {
    deletingItem.value = false
  }
}

// Suppression catégorie
const confirmDeleteCategory = (category: StockCategoryDTO) => {
  categoryToDelete.value = category
  showDeleteCategoryModal.value = true
}

const deleteCategory = async () => {
  if (!categoryToDelete.value?.id) return

  try {
    deletingCategory.value = true
    const categoryId = categoryToDelete.value.id
    await stockCategoriesService.deleteCategory(categoryId)

    categories.value = categories.value.filter(c => c.id !== categoryId)

    // Si on était sur cette catégorie, revenir à "Tous"
    if (selectedCategoryId.value === categoryId) {
      selectedCategoryId.value = null
    }

    // Recharger les articles pour avoir les catégories à jour
    await loadStockItems()

    showDeleteCategoryModal.value = false
    categoryToDelete.value = null
    messages.success('Catégorie supprimée avec succès !', 'Succès')
  } catch (err) {
    messages.error('Erreur lors de la suppression', 'Erreur')
  } finally {
    deletingCategory.value = false
  }
}

onMounted(async () => {
  await loadCategories()
  await loadStockItems()
})
</script>
