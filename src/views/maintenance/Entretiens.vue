<template>
  <div class="min-h-screen bg-background" @click="contextMenu.close">
    <main class="px-4 py-4 md:px-6 md:py-6">
      <div class="mx-auto max-w-[1400px]">
        <Tabs v-model="activeTab">
          <div class="overflow-hidden rounded-lg border border-border">
            <!-- Header desktop -->
            <div class="relative hidden items-end bg-muted px-4 pt-2 md:flex">
              <div class="absolute left-4 top-1/2 -translate-y-1/2">
                <Button variant="ghost" size="icon-sm" @click="handleGoBack" title="Retour">
                  <ArrowLeft class="size-4" />
                </Button>
              </div>
              <TabsList class="mx-auto bg-transparent p-0 gap-0.5">
                <TabsTrigger value="prochains" class="gap-2 rounded-b-none rounded-t-lg border border-transparent px-5 py-2.5 text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=inactive]:bg-transparent dark:data-[state=active]:border-primary/40 dark:data-[state=active]:border-b-transparent dark:data-[state=active]:bg-primary/10">
                  Prochains entretiens
                  <Badge v-if="vehiculesProchains.length > 0" variant="secondary">{{ vehiculesProchains.length }}</Badge>
                </TabsTrigger>
                <TabsTrigger value="historique" class="gap-2 rounded-b-none rounded-t-lg border border-transparent px-5 py-2.5 text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=inactive]:bg-transparent dark:data-[state=active]:border-primary/40 dark:data-[state=active]:border-b-transparent dark:data-[state=active]:bg-primary/10">
                  Tous les entretiens
                  <Badge v-if="pagination.totalElements > 0" variant="secondary">{{ pagination.totalElements }}</Badge>
                </TabsTrigger>
              </TabsList>
              <div v-if="isMecanicien" class="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                <Button variant="outline" size="sm" @click="$router.push('/types-entretien')">
                  <Settings class="size-3.5" />
                  Types d'entretien
                </Button>
                <Button variant="outline" size="sm" @click="$router.push('/stock')">
                  <Package class="size-3.5" />
                  Stock
                </Button>
                <Button size="sm" @click="openCreateModal">
                  <Plus class="size-3.5" />
                  Nouvel entretien
                </Button>
              </div>
            </div>

            <!-- Header mobile -->
            <div class="flex flex-col gap-3 bg-muted p-3 md:hidden">
              <div class="flex items-center justify-between">
                <Button variant="ghost" size="icon-sm" @click="handleGoBack" title="Retour">
                  <ArrowLeft class="size-4" />
                </Button>
                <TabsList class="bg-transparent p-0 gap-0.5">
                  <TabsTrigger value="prochains" class="gap-1.5 rounded-lg border border-transparent px-3 py-2 text-xs text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:bg-transparent dark:data-[state=active]:border-primary/40 dark:data-[state=active]:bg-primary/10">
                    Prochains
                    <Badge v-if="vehiculesProchains.length > 0" variant="secondary" class="h-5 px-1.5 text-xs">{{ vehiculesProchains.length }}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="historique" class="gap-1.5 rounded-lg border border-transparent px-3 py-2 text-xs text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:bg-transparent dark:data-[state=active]:border-primary/40 dark:data-[state=active]:bg-primary/10">
                    Tous
                    <Badge v-if="pagination.totalElements > 0" variant="secondary" class="h-5 px-1.5 text-xs">{{ pagination.totalElements }}</Badge>
                  </TabsTrigger>
                </TabsList>
                <!-- Mobile menu for mécanicien -->
                <DropdownMenu v-if="isMecanicien">
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon-sm">
                      <MoreVertical class="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" class="w-48">
                    <DropdownMenuItem @click="$router.push('/types-entretien')">
                      <Settings class="mr-2 size-4" />
                      Types d'entretien
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="$router.push('/stock')">
                      <Package class="mr-2 size-4" />
                      Stock
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem @click="openCreateModal">
                      <Plus class="mr-2 size-4" />
                      Nouvel entretien
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div v-else class="w-8" />
              </div>
            </div>

            <TabsContent value="prochains" class="mt-0 bg-background p-6">
          <div v-if="loading" class="space-y-6">
            <!-- Skeleton section header -->
            <div class="flex items-center gap-3">
              <Skeleton class="size-8 rounded-full" />
              <Skeleton class="h-5 w-28" />
              <Skeleton class="h-5 w-8 rounded-full" />
            </div>
            <!-- Skeleton cards grid -->
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div v-for="n in 6" :key="n" class="rounded-lg border bg-card p-4 space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Skeleton class="h-4 w-28" />
                    <Skeleton class="h-4 w-20" />
                  </div>
                  <Skeleton class="size-5 rounded-full" />
                </div>
                <div class="space-y-2">
                  <Skeleton class="h-4 w-36" />
                  <Skeleton class="h-3.5 w-44" />
                </div>
                <div class="flex gap-2 pt-1">
                  <Skeleton class="h-8 w-28 rounded-md" />
                  <Skeleton class="h-8 w-24 rounded-md" />
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="vehiculesProchains.length === 0" class="flex flex-col items-center justify-center gap-4 py-16">
            <Car class="size-12 text-muted-foreground" />
            <p class="text-lg text-muted-foreground">Aucun véhicule trouvé</p>
          </div>

          <div v-else class="space-y-6">
            <!-- Section En retard -->
            <div v-if="vehiculesEnRetard.length > 0">
              <div class="mb-4 flex items-center gap-3">
                <span class="flex size-8 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/50">
                  <AlertCircle class="size-4" />
                </span>
                <h2 class="text-lg font-semibold text-foreground">En retard</h2>
                <Badge variant="destructive">{{ vehiculesEnRetard.length }}</Badge>
              </div>
              <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div
                  v-for="item in vehiculesEnRetard"
                  :key="item.id"
                  class="rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div class="mb-3 flex items-center justify-between">
                    <div>
                      <span class="font-medium text-foreground">{{ item.vehicule.brand }} {{ item.vehicule.model }}</span>
                      <span class="ml-2 text-sm text-muted-foreground">{{ item.vehicule.immat }}</span>
                    </div>
                    <AlertTriangle class="size-5 text-red-500" />
                  </div>
                  <div class="space-y-2">
                    <div v-for="(alert, idx) in item.alerts" :key="idx">
                      <h4 class="text-sm font-medium text-foreground">{{ alert.typeEntretien.nom }}</h4>
                      <p class="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
                        <Route v-if="alert.type === 'KM'" class="size-3.5" />
                        <CalendarDays v-else class="size-3.5" />
                        <template v-if="alert.type === 'KM'">
                          En retard de <strong>{{ Math.abs(alert.remaining).toLocaleString('fr-FR') }} km</strong>
                        </template>
                        <template v-else>
                          En retard de <strong>{{ Math.abs(alert.remaining) }} jours</strong>
                        </template>
                      </p>
                    </div>
                  </div>
                  <div class="mt-4 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" @click="$router.push(`/vehicules/${item.vehicule.id}`)">
                      <Truck class="size-3.5" />
                      Voir véhicule
                    </Button>
                    <Button variant="destructive" size="sm" @click="$router.push(`/entretiens/vehicule/${item.vehicule.id}`)">
                      <List class="size-3.5" />
                      Entretiens
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Section À venir -->
            <div v-if="vehiculesAVenir.length > 0">
              <div class="mb-4 flex items-center gap-3">
                <span class="flex size-8 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/50">
                  <Clock class="size-4" />
                </span>
                <h2 class="text-lg font-semibold text-foreground">À venir</h2>
                <Badge variant="outline" class="border-amber-500/50 text-amber-600 dark:text-amber-400">{{ vehiculesAVenir.length }}</Badge>
              </div>
              <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div
                  v-for="item in vehiculesAVenir"
                  :key="item.id"
                  class="rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div class="mb-3 flex items-center justify-between">
                    <div>
                      <span class="font-medium text-foreground">{{ item.vehicule.brand }} {{ item.vehicule.model }}</span>
                      <span class="ml-2 text-sm text-muted-foreground">{{ item.vehicule.immat }}</span>
                    </div>
                    <Clock class="size-5 text-amber-500" />
                  </div>
                  <div class="space-y-2">
                    <div v-for="(alert, idx) in item.alerts" :key="idx">
                      <h4 class="text-sm font-medium text-foreground">{{ alert.typeEntretien.nom }}</h4>
                      <p class="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Route v-if="alert.type === 'KM'" class="size-3.5" />
                        <CalendarDays v-else class="size-3.5" />
                        <template v-if="alert.type === 'KM'">
                          Dans <strong>{{ Math.abs(alert.remaining).toLocaleString('fr-FR') }} km</strong>
                        </template>
                        <template v-else>
                          Dans <strong>{{ Math.abs(alert.remaining) }} jours</strong>
                        </template>
                      </p>
                    </div>
                  </div>
                  <div class="mt-4 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" @click="$router.push(`/vehicules/${item.vehicule.id}`)">
                      <Truck class="size-3.5" />
                      Voir véhicule
                    </Button>
                    <Button variant="outline" size="sm" class="border-amber-500/50 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30" @click="$router.push(`/entretiens/vehicule/${item.vehicule.id}`)">
                      <List class="size-3.5" />
                      Entretiens
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Section À jour -->
            <div v-if="vehiculesOK.length > 0">
              <div class="mb-4 flex cursor-pointer items-center gap-3" @click="showAJour = !showAJour">
                <span class="flex size-8 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-950/50">
                  <CheckCircle class="size-4" />
                </span>
                <h2 class="text-lg font-semibold text-foreground">À jour</h2>
                <Badge variant="outline" class="border-green-500/50 text-green-600 dark:text-green-400">{{ vehiculesOK.length }}</Badge>
                <ChevronDown :class="['size-5 text-muted-foreground transition-transform', showAJour && 'rotate-180']" />
              </div>
              <div v-show="showAJour" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div
                  v-for="item in vehiculesOK"
                  :key="item.id"
                  class="rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div class="mb-3 flex items-center justify-between">
                    <div>
                      <span class="font-medium text-foreground">{{ item.vehicule.brand }} {{ item.vehicule.model }}</span>
                      <span class="ml-2 text-sm text-muted-foreground">{{ item.vehicule.immat }}</span>
                    </div>
                    <CheckCircle class="size-5 text-green-500" />
                  </div>
                  <div class="space-y-2">
                    <div v-if="item.alerts.length > 0">
                      <div v-for="(alert, idx) in item.alerts" :key="idx">
                        <h4 class="text-sm font-medium text-foreground">{{ alert.typeEntretien.nom }}</h4>
                        <p class="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Route v-if="alert.type === 'KM'" class="size-3.5" />
                          <CalendarDays v-else class="size-3.5" />
                          <template v-if="alert.type === 'KM'">
                            Dans <strong>{{ Math.abs(alert.remaining).toLocaleString('fr-FR') }} km</strong>
                          </template>
                          <template v-else>
                            Dans <strong>{{ Math.abs(alert.remaining) }} jours</strong>
                          </template>
                        </p>
                      </div>
                    </div>
                    <p v-else class="text-sm text-muted-foreground">Aucun entretien à prévoir</p>
                  </div>
                  <div class="mt-4 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" @click="$router.push(`/vehicules/${item.vehicule.id}`)">
                      <Truck class="size-3.5" />
                      Voir véhicule
                    </Button>
                    <Button variant="outline" size="sm" class="border-green-500/50 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/30" @click="$router.push(`/entretiens/vehicule/${item.vehicule.id}`)">
                      <List class="size-3.5" />
                      Entretiens
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty if all categories empty -->
            <div v-if="vehiculesEnRetard.length === 0 && vehiculesAVenir.length === 0 && vehiculesOK.length === 0" class="flex flex-col items-center justify-center gap-4 py-16">
              <Car class="size-12 text-muted-foreground" />
              <p class="text-lg text-muted-foreground">Aucun véhicule avec des entretiens configurés</p>
            </div>
          </div>
          </TabsContent>

          <TabsContent value="historique" class="mt-0 bg-background space-y-4 p-6">
          <!-- Quick search -->
          <div class="relative">
            <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              v-model="searchQuery"
              type="search"
              placeholder="Recherche rapide par immatriculation, type, mécanicien, commentaire..."
              class="pl-9"
              @keyup.enter="performSearch"
            />
          </div>

          <!-- Filters -->
          <SearchFilters
            v-model="filterValues"
            :filters="filterConfig"
            :loading="loading"
            :columns="4"
            :hint="`${pagination.totalElements} entretien${pagination.totalElements > 1 ? 's' : ''} trouvé${pagination.totalElements > 1 ? 's' : ''}`"
            @search="performSearch"
            @reset="resetFilters"
          />

          <!-- Loading skeleton mobile -->
          <div v-if="loading" class="space-y-3 md:hidden">
            <div v-for="n in 4" :key="n" class="rounded-lg border bg-card p-4 space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Skeleton class="h-5 w-24" />
                  <Skeleton class="h-5 w-16 rounded-full" />
                </div>
                <Skeleton class="size-6 rounded" />
              </div>
              <Skeleton class="h-4 w-28" />
              <div class="grid grid-cols-2 gap-2">
                <Skeleton class="h-4 w-20" />
                <Skeleton class="h-4 w-16" />
              </div>
            </div>
          </div>

          <!-- Loading skeleton desktop -->
          <div v-if="loading" class="hidden overflow-hidden rounded-lg border shadow-sm md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Véhicule</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead class="text-right">Km</TableHead>
                  <TableHead>Commentaire</TableHead>
                  <TableHead>Mécanicien</TableHead>
                  <TableHead class="text-right">Coût HT</TableHead>
                  <TableHead class="text-center">Fichiers</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="n in 8" :key="n">
                  <TableCell><Skeleton class="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton class="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton class="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell class="text-right"><Skeleton class="ml-auto h-4 w-16" /></TableCell>
                  <TableCell><Skeleton class="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton class="h-4 w-20" /></TableCell>
                  <TableCell class="text-right"><Skeleton class="ml-auto h-4 w-16" /></TableCell>
                  <TableCell class="text-center"><Skeleton class="mx-auto h-4 w-6" /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <!-- Empty -->
          <div v-else-if="sortedEntretiens.length === 0" class="flex flex-col items-center justify-center gap-4 py-16">
            <ClipboardList class="size-12 text-muted-foreground" />
            <p class="text-lg text-muted-foreground">Aucun entretien trouvé</p>
          </div>

          <!-- Content -->
          <div v-else>
            <!-- Mobile Cards View -->
            <div class="space-y-3 md:hidden">
              <p class="text-sm text-muted-foreground">{{ pagination.totalElements }} entretien(s)</p>

              <div
                v-for="item in sortedEntretiens"
                :key="item.id"
                class="rounded-lg border bg-card p-4 shadow-sm"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <span class="font-semibold uppercase tracking-wide text-foreground">{{ item.vehiculeImmat }}</span>
                      <Badge variant="secondary">{{ item.typeEntretien?.nom }}</Badge>
                    </div>
                    <p class="mt-1 text-sm text-muted-foreground">{{ formatDate(item.dateEntretien) }}</p>
                  </div>

                  <!-- Actions dropdown -->
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" size="icon-sm">
                        <MoreVertical class="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" class="w-44">
                      <DropdownMenuItem v-if="(item as any).files?.length" @click="openPhotosModal(item)">
                        <FolderOpen class="mr-2 size-4" />
                        Voir fichiers ({{ (item as any).files.length }})
                      </DropdownMenuItem>
                      <template v-if="isMecanicien">
                        <DropdownMenuItem @click="openEditModal(item)">
                          <Pencil class="mr-2 size-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem class="text-destructive focus:text-destructive" @click="confirmDelete(item)">
                          <Trash2 class="mr-2 size-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </template>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <!-- Info grid -->
                <div class="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div class="flex items-center gap-1.5 text-muted-foreground">
                    <Route class="size-3.5" />
                    <span class="font-mono">{{ item.kilometrage?.toLocaleString('fr-FR') }} km</span>
                  </div>
                  <div v-if="item.cout" class="flex items-center gap-1.5 text-muted-foreground">
                    <Euro class="size-3.5" />
                    <span>{{ item.cout.toLocaleString('fr-FR') }} € HT</span>
                  </div>
                  <div class="col-span-2 flex items-center gap-1.5 text-muted-foreground">
                    <User class="size-3.5" />
                    <span>{{ item.mecanicien?.firstName }} {{ item.mecanicien?.lastName }}</span>
                  </div>
                </div>

                <!-- Comment -->
                <p v-if="item.commentaire" class="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {{ item.commentaire }}
                </p>

                <!-- Files indicator -->
                <div v-if="(item as any).files?.length" class="mt-2">
                  <button
                    class="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-primary transition-colors hover:bg-accent"
                    @click="openPhotosModal(item)"
                  >
                    <FolderOpen class="size-3.5" />
                    <span>{{ (item as any).files.length }} fichier(s)</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Total cost header -->
            <div v-if="sortedEntretiens.length > 0 && totalCoutHT > 0" class="mb-2 flex justify-end gap-2 rounded-lg border bg-card px-4 py-3">
              <span class="text-sm font-medium text-muted-foreground">Total coût HT :</span>
              <span class="text-sm font-semibold text-foreground">{{ totalCoutHT.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} €</span>
            </div>

            <!-- Desktop Table View -->
            <div class="hidden overflow-hidden rounded-lg border shadow-sm md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead class="w-[100px] cursor-pointer select-none" @click="toggleSort('dateEntretien')">
                      <div class="flex items-center gap-1">
                        Date
                        <ArrowUp v-if="sortKey === 'dateEntretien' && sortDirection === 'asc'" class="size-3.5 text-foreground" />
                        <ArrowDown v-else-if="sortKey === 'dateEntretien' && sortDirection === 'desc'" class="size-3.5 text-foreground" />
                        <ArrowUpDown v-else class="size-3.5 text-muted-foreground/50" />
                      </div>
                    </TableHead>
                    <TableHead class="cursor-pointer select-none" @click="toggleSort('vehiculeImmat')">
                      <div class="flex items-center gap-1">
                        Véhicule
                        <ArrowUp v-if="sortKey === 'vehiculeImmat' && sortDirection === 'asc'" class="size-3.5 text-foreground" />
                        <ArrowDown v-else-if="sortKey === 'vehiculeImmat' && sortDirection === 'desc'" class="size-3.5 text-foreground" />
                        <ArrowUpDown v-else class="size-3.5 text-muted-foreground/50" />
                      </div>
                    </TableHead>
                    <TableHead class="cursor-pointer select-none" @click="toggleSort('type')">
                      <div class="flex items-center gap-1">
                        Type
                        <ArrowUp v-if="sortKey === 'type' && sortDirection === 'asc'" class="size-3.5 text-foreground" />
                        <ArrowDown v-else-if="sortKey === 'type' && sortDirection === 'desc'" class="size-3.5 text-foreground" />
                        <ArrowUpDown v-else class="size-3.5 text-muted-foreground/50" />
                      </div>
                    </TableHead>
                    <TableHead class="w-[100px] cursor-pointer select-none" @click="toggleSort('kilometrage')">
                      <div class="flex items-center justify-end gap-1">
                        Km
                        <ArrowUp v-if="sortKey === 'kilometrage' && sortDirection === 'asc'" class="size-3.5 text-foreground" />
                        <ArrowDown v-else-if="sortKey === 'kilometrage' && sortDirection === 'desc'" class="size-3.5 text-foreground" />
                        <ArrowUpDown v-else class="size-3.5 text-muted-foreground/50" />
                      </div>
                    </TableHead>
                    <TableHead>Commentaire</TableHead>
                    <TableHead class="w-[120px] cursor-pointer select-none" @click="toggleSort('mecanicien')">
                      <div class="flex items-center gap-1">
                        Mécanicien
                        <ArrowUp v-if="sortKey === 'mecanicien' && sortDirection === 'asc'" class="size-3.5 text-foreground" />
                        <ArrowDown v-else-if="sortKey === 'mecanicien' && sortDirection === 'desc'" class="size-3.5 text-foreground" />
                        <ArrowUpDown v-else class="size-3.5 text-muted-foreground/50" />
                      </div>
                    </TableHead>
                    <TableHead class="w-[100px] cursor-pointer select-none" @click="toggleSort('cout')">
                      <div class="flex items-center justify-end gap-1">
                        Coût HT
                        <ArrowUp v-if="sortKey === 'cout' && sortDirection === 'asc'" class="size-3.5 text-foreground" />
                        <ArrowDown v-else-if="sortKey === 'cout' && sortDirection === 'desc'" class="size-3.5 text-foreground" />
                        <ArrowUpDown v-else class="size-3.5 text-muted-foreground/50" />
                      </div>
                    </TableHead>
                    <TableHead class="w-[80px] text-center">Fichiers</TableHead>
                    <TableHead v-if="isMecanicien" class="w-[80px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow
                    v-for="item in sortedEntretiens"
                    :key="item.id"
                    :class="isMecanicien && 'cursor-pointer'"
                    @click="isMecanicien ? openEditModal(item) : undefined"
                    @contextmenu="contextMenu.open($event, item)"
                  >
                    <TableCell class="text-sm text-muted-foreground">{{ formatDate(item.dateEntretien) }}</TableCell>
                    <TableCell>
                      <span class="font-medium">{{ item.vehiculeImmat }}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{{ item.typeEntretien?.nom }}</Badge>
                    </TableCell>
                    <TableCell class="text-right font-mono text-sm">{{ item.kilometrage?.toLocaleString('fr-FR') }} km</TableCell>
                    <TableCell>
                      <span v-if="item.commentaire" class="max-w-[200px] truncate text-sm" :title="item.commentaire">{{ item.commentaire }}</span>
                      <span v-else class="text-muted-foreground">-</span>
                    </TableCell>
                    <TableCell>
                      <div class="flex items-center gap-1.5 text-sm">
                        <User class="size-3.5 text-muted-foreground" />
                        <span>{{ item.mecanicien?.firstName }} {{ item.mecanicien?.lastName?.charAt(0) }}.</span>
                      </div>
                    </TableCell>
                    <TableCell class="text-right text-sm">
                      <span v-if="item.cout">{{ item.cout.toLocaleString('fr-FR') }} € HT</span>
                      <span v-else class="text-muted-foreground">-</span>
                    </TableCell>
                    <TableCell class="text-center">
                      <button
                        v-if="(item as any).files?.length"
                        class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-primary transition-colors hover:bg-accent"
                        @click.stop="openPhotosModal(item)"
                        :title="`Voir ${(item as any).files.length} fichier(s)`"
                      >
                        <FolderOpen class="size-3.5" />
                        <span>{{ (item as any).files.length }}</span>
                      </button>
                      <span v-else class="text-muted-foreground">-</span>
                    </TableCell>
                    <TableCell v-if="isMecanicien" class="text-right">
                      <div class="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" title="Modifier" @click.stop="openEditModal(item)">
                          <Pencil class="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" class="text-destructive hover:text-destructive" title="Supprimer" @click.stop="confirmDelete(item)">
                          <Trash2 class="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

          </div>

          <!-- Pagination -->
          <div v-if="!loading && pagination.totalPages > 1" class="flex items-center justify-center gap-2 py-4">
            <Button variant="outline" size="icon-sm" :disabled="pagination.first" @click="goToPage(0)">
              <ChevronsLeft class="size-4" />
            </Button>
            <Button variant="outline" size="icon-sm" :disabled="pagination.first" @click="goToPage(pagination.page - 1)">
              <ChevronLeft class="size-4" />
            </Button>
            <span class="px-3 text-sm text-muted-foreground">
              Page {{ pagination.page + 1 }} sur {{ pagination.totalPages }}
              <span class="hidden sm:inline">({{ pagination.totalElements }} entretiens)</span>
            </span>
            <Button variant="outline" size="icon-sm" :disabled="pagination.last" @click="goToPage(pagination.page + 1)">
              <ChevronRight class="size-4" />
            </Button>
            <Button variant="outline" size="icon-sm" :disabled="pagination.last" @click="goToPage(pagination.totalPages - 1)">
              <ChevronsRight class="size-4" />
            </Button>
          </div>
          </TabsContent>
          </div>
        </Tabs>
      </div>
    </main>

    <!-- Modal Create/Edit Entretien -->
    <Dialog v-model:open="showEntretienModal">
      <DialogContent class="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{{ isEditMode ? 'Modifier l\'entretien' : 'Nouvel entretien' }}</DialogTitle>
        </DialogHeader>
        <form @submit.prevent="submitEntretien" class="space-y-4">
          <Select
            v-model="formData.vehiculeId"
            label="Véhicule"
            :options="vehiculeOptions"
            placeholder="Sélectionner un véhicule"
            :disabled="isEditMode"
            :required="true"
            search-placeholder="Rechercher un véhicule..."
          />

          <!-- Hierarchical picker: Folder > Maintenance type -->
          <div ref="typePickerWrapperRef" class="relative">
            <label class="mb-2 block text-sm font-medium text-foreground">
              Type d'entretien
              <span class="ml-1 text-destructive">*</span>
            </label>
            <button
              ref="typePickerTriggerRef"
              type="button"
              :class="[
                'flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors outline-none',
                'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                isTypePickerOpen && 'border-ring ring-ring/50 ring-[3px]',
                !formData.typeEntretienId && 'text-muted-foreground',
              ]"
              @click="toggleTypePicker"
            >
              <span class="flex-1 truncate text-left">
                <template v-if="formData.typeEntretienId && selectedTypeLabel">
                  <span class="flex items-center gap-1.5">
                    <span class="text-muted-foreground">{{ selectedDossierLabel }}</span>
                    <ChevronRight class="size-3 text-muted-foreground" />
                    <span class="text-foreground">{{ selectedTypeLabel }}</span>
                  </span>
                </template>
                <template v-else>
                  Sélectionner un type d'entretien
                </template>
              </span>
              <ChevronDown :class="['size-4 shrink-0 text-muted-foreground transition-transform', isTypePickerOpen && 'rotate-180']" />
            </button>

            <!-- Teleported dropdown -->
            <Teleport to="body">
              <Transition
                enter-active-class="transition duration-150 ease-out"
                enter-from-class="opacity-0 scale-95"
                enter-to-class="opacity-100 scale-100"
                leave-active-class="transition duration-100 ease-in"
                leave-from-class="opacity-100 scale-100"
                leave-to-class="opacity-0 scale-95"
              >
                <div
                  v-if="isTypePickerOpen"
                  ref="typePickerDropdownRef"
                  data-floating-content
                  class="overflow-hidden rounded-md border bg-popover shadow-lg"
                  :style="typePickerDropdownStyle"
                  @pointerdown.stop
                >
                  <!-- Back button if folder selected -->
                  <div v-if="formData.dossierId" class="flex items-center gap-2 border-b px-3 py-2">
                    <button type="button" class="flex items-center gap-1.5 rounded-sm px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" @click.stop="goBackToDossiers">
                      <ArrowLeft class="size-3.5" />
                      <span>Retour</span>
                    </button>
                    <span class="text-sm font-medium text-foreground">{{ selectedDossierLabel }}</span>
                  </div>

                  <!-- Search -->
                  <div class="border-b p-2">
                    <div class="relative">
                      <Search class="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                      <input
                        ref="typePickerSearchRef"
                        v-model="typePickerSearch"
                        type="text"
                        class="h-8 w-full rounded-sm border border-input bg-transparent pl-8 pr-8 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                        :placeholder="formData.dossierId ? 'Rechercher un type...' : 'Rechercher un dossier...'"
                        @click.stop
                      />
                      <button
                        v-if="typePickerSearch"
                        type="button"
                        class="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                        @click.stop="typePickerSearch = ''"
                      >
                        <X class="size-3.5" />
                      </button>
                    </div>
                  </div>

                  <!-- Folders or types list -->
                  <ul class="max-h-60 overflow-y-auto py-1">
                    <!-- Folders -->
                    <template v-if="!formData.dossierId">
                      <li
                        v-for="dossier in filteredDossierOptions"
                        :key="dossier.value"
                        class="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-accent"
                        @click.stop="selectDossier(dossier.value)"
                      >
                        <Folder class="size-4 text-amber-500" />
                        <span class="flex-1">{{ dossier.label }}</span>
                        <ChevronRight class="size-4 text-muted-foreground" />
                      </li>
                      <li v-if="filteredDossierOptions.length === 0" class="px-3 py-6 text-center text-sm text-muted-foreground">
                        Aucun dossier trouvé
                      </li>
                    </template>

                    <!-- Types in selected folder -->
                    <template v-else>
                      <li
                        v-for="type in filteredTypeOptions"
                        :key="type.value"
                        class="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-accent"
                        @click.stop="selectTypeAndClose(type.value)"
                      >
                        <Wrench class="size-4 text-primary" />
                        <span class="flex-1">{{ type.label }}</span>
                      </li>
                      <li v-if="filteredTypeOptions.length === 0" class="px-3 py-6 text-center text-sm text-muted-foreground">
                        Aucun type trouvé
                      </li>
                    </template>
                  </ul>
                </div>
              </Transition>
            </Teleport>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm font-medium text-foreground">
                Date <span class="text-destructive">*</span>
              </label>
              <Input v-model="formData.dateEntretien" type="date" required />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium text-foreground">
                Kilométrage <span class="text-destructive">*</span>
              </label>
              <Input :model-value="formData.kilometrage ?? undefined" type="number" placeholder="150000" required @update:model-value="formData.kilometrage = $event ? Number($event) : null" />
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground">Coût HT (€)</label>
            <Input :model-value="formData.cout ?? undefined" type="number" step="0.01" placeholder="0.00" @update:model-value="formData.cout = $event ? Number($event) : null" />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground">Commentaire</label>
            <textarea
              v-model="formData.commentaire"
              rows="4"
              placeholder="Détails sur l'entretien..."
              class="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
            ></textarea>
          </div>

          <div v-if="!isEditMode" class="flex flex-col gap-2">
            <label class="text-sm font-medium text-foreground">Fichiers</label>
            <input
              type="file"
              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
              multiple
              @change="handleFileSelect"
              ref="fileInput"
              class="w-full rounded-md border-2 border-dashed border-input bg-muted/50 px-3 py-2 text-sm cursor-pointer"
            />
            <div v-if="selectedFiles.length > 0" class="mt-2 flex flex-col gap-2">
              <div v-for="(file, index) in selectedFiles" :key="index" class="flex items-center gap-3 rounded-md border bg-muted/50 px-3 py-2">
                <div class="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-muted">
                  <img v-if="file.file.type.startsWith('image/')" :src="file.preview" alt="Preview" class="size-full object-cover" />
                  <font-awesome-icon v-else :icon="getFileIcon(file.file.type)" class="text-lg text-primary" />
                </div>
                <span class="flex-1 truncate text-sm text-foreground">{{ file.file.name }}</span>
                <button
                  type="button"
                  @click="removeFile(index)"
                  class="flex size-7 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <X class="size-3" />
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" @click="closeEntretienModal">Annuler</Button>
            <Button type="submit" :disabled="submitting">
              <LoaderCircle v-if="submitting" class="size-3.5 animate-spin" />
              {{ submitting ? 'Enregistrement...' : (isEditMode ? 'Modifier' : 'Créer') }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Modal Files -->
    <Dialog v-model:open="showPhotosModal">
      <DialogContent class="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Fichiers - {{ currentEntretien?.vehiculeImmat || 'Véhicule' }}</DialogTitle>
        </DialogHeader>
        <div v-if="loadingFiles" class="flex flex-col items-center justify-center gap-4 py-8">
          <LoaderCircle class="size-10 animate-spin text-primary" />
          <p class="text-muted-foreground">Chargement des fichiers...</p>
        </div>
        <div v-else-if="currentFiles.length === 0" class="flex flex-col items-center justify-center gap-4 py-8">
          <FolderOpen class="size-12 text-muted-foreground" />
          <p class="text-muted-foreground">Aucun fichier attaché</p>
        </div>
        <div v-else class="grid grid-cols-2 gap-4 md:grid-cols-3">
          <FileCard
            v-for="file in currentFiles"
            :key="file.id"
            :file="file"
            :deletable="isMecanicien"
            @view-image="openImageFullscreen($event)"
            @download="downloadFile($event)"
            @delete="deleteFileFromEntretien($event)"
          />
        </div>
        <div v-if="isMecanicien" class="border-t pt-4">
          <FileDropzone
            compact
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
            :multiple="false"
            placeholder-title="Ajouter un fichier"
            placeholder-subtitle="glissez ou cliquez"
            @files-selected="handleDropzoneAddFile($event)"
          />
        </div>
      </DialogContent>
    </Dialog>

    <!-- Modal Delete Entretien -->
    <Dialog v-model:open="showDeleteModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmer la suppression</DialogTitle>
          <DialogDescription>Cette action est irréversible.</DialogDescription>
        </DialogHeader>
        <p class="text-sm text-muted-foreground">Êtes-vous sûr de vouloir supprimer cet entretien ?</p>
        <p class="flex items-center gap-2 text-sm text-destructive">
          <AlertTriangle class="size-4" />
          Cette action est irréversible.
        </p>
        <DialogFooter>
          <Button variant="outline" @click="closeDeleteModal">Annuler</Button>
          <Button variant="destructive" @click="deleteEntretien">Supprimer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Modal Delete File -->
    <Dialog v-model:open="showDeleteFileModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Supprimer le fichier</DialogTitle>
          <DialogDescription>Cette action est irréversible.</DialogDescription>
        </DialogHeader>
        <p class="text-sm text-muted-foreground">Voulez-vous vraiment supprimer ce fichier ?</p>
        <p class="flex items-center gap-2 text-sm text-destructive">
          <AlertTriangle class="size-4" />
          Cette action est irréversible.
        </p>
        <DialogFooter>
          <Button variant="outline" @click="cancelDeleteFile">Annuler</Button>
          <Button variant="destructive" @click="executeDeleteFile">Supprimer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Modal Validate Entretien -->
    <Dialog v-model:open="showValidateModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Valider l'entretien</DialogTitle>
        </DialogHeader>
        <p class="text-sm text-muted-foreground">
          Voulez-vous créer un entretien "{{ validationData.typeEntretienNom }}" pour ce véhicule avec la date et le kilométrage actuels ?
        </p>
        <DialogFooter>
          <Button variant="outline" @click="cancelValiderEntretien">Annuler</Button>
          <Button @click="executeValiderEntretien">Valider</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Modal History -->
    <Dialog v-model:open="showHistoriqueModal">
      <DialogContent class="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Historique - {{ selectedVehicule?.brand || '' }} {{ selectedVehicule?.model || '' }} ({{ selectedVehicule?.immat || '' }})
          </DialogTitle>
        </DialogHeader>

        <div v-if="isMecanicien" class="flex justify-end">
          <Button size="sm" @click="openCreateEntretienForVehicule">
            <Plus class="size-3.5" />
            Nouvel entretien
          </Button>
        </div>

        <div v-if="loadingHistorique" class="flex flex-col items-center justify-center gap-4 py-8">
          <LoaderCircle class="size-10 animate-spin text-primary" />
          <p class="text-muted-foreground">Chargement...</p>
        </div>

        <div v-else-if="historiqueEntretiens.length === 0" class="flex flex-col items-center justify-center gap-4 py-8">
          <ClipboardList class="size-12 text-muted-foreground" />
          <p class="text-muted-foreground">Aucun entretien effectué</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="entretien in historiqueEntretiens"
            :key="entretien.id"
            class="rounded-lg border bg-card p-4 transition-shadow hover:shadow-sm"
          >
            <div class="mb-3 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Badge variant="default">{{ entretien.typeEntretien?.nom || 'Type inconnu' }}</Badge>
                <span class="text-sm text-muted-foreground">{{ formatDate(entretien.dateEntretien) }}</span>
              </div>
              <div v-if="isMecanicien" class="flex gap-1">
                <Button variant="ghost" size="icon-sm" title="Modifier" @click="openEditModal(entretien)">
                  <Pencil class="size-3.5" />
                </Button>
                <Button variant="ghost" size="icon-sm" title="Supprimer" @click="confirmDelete(entretien)">
                  <Trash2 class="size-3.5" />
                </Button>
              </div>
            </div>

            <div class="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div class="flex items-center gap-1.5">
                <Ruler class="size-3.5" />
                <span>{{ entretien.kilometrage?.toLocaleString('fr-FR') || 0 }} km</span>
              </div>
              <div class="flex items-center gap-1.5">
                <User class="size-3.5" />
                <span>{{ entretien.mecanicien?.firstName }} {{ entretien.mecanicien?.lastName }}</span>
              </div>
              <div v-if="entretien.cout" class="flex items-center gap-1.5">
                <Euro class="size-3.5" />
                <span>{{ entretien.cout?.toLocaleString('fr-FR') || 0 }} € HT</span>
              </div>
            </div>

            <p v-if="entretien.commentaire" class="mt-2 rounded-md bg-muted p-2 text-sm text-muted-foreground">
              {{ entretien.commentaire }}
            </p>

            <div class="mt-3">
              <Button variant="outline" size="sm" @click="openPhotosModal(entretien)">
                <FolderOpen class="size-3.5" />
                Voir les fichiers
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Image fullscreen -->
    <ImageLightbox
      v-model:open="showImageFullscreen"
      :images="fullscreenImages"
      :initial-index="fullscreenIndex"
    />

    <!-- Context menu (right-click) -->
    <ContextMenuPopover
      ref="contextMenuRef"
      :show="contextMenu.state.value.show"
      :x="contextMenu.state.value.x"
      :y="contextMenu.state.value.y"
      :title="contextMenu.state.value.entity?.vehiculeImmat"
      @close="contextMenu.close"
    >
      <ContextMenuItem v-if="(contextMenu.state.value.entity as any)?.files?.length" @click="contextMenu.handleAction('files', handleContextAction)">
        <template #icon><FolderOpen class="size-4" /></template>
        Voir fichiers ({{ (contextMenu.state.value.entity as any)?.files?.length }})
      </ContextMenuItem>
      <template v-if="isMecanicien">
        <ContextMenuSeparator v-if="(contextMenu.state.value.entity as any)?.files?.length" />
        <ContextMenuItem @click="contextMenu.handleAction('edit', handleContextAction)">
          <template #icon><Pencil class="size-4" /></template>
          Modifier
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem destructive @click="contextMenu.handleAction('delete', handleContextAction)">
          <template #icon><Trash2 class="size-4" /></template>
          Supprimer
        </ContextMenuItem>
      </template>
    </ContextMenuPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { entretiensService, vehiclesService, typesEntretienService, dossiersTypesEntretienService } from '@/services'
import { useMessages } from '@/composables/useMessages'
import { useContextMenu } from '@/composables/useContextMenu'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { SearchFilters, type FilterConfig } from '@/components/ui/search-filters'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ImageLightbox } from '@/components/ui/image-lightbox'
import { FileCard } from '@/components/ui/file-card'
import { isImage, getFileUrl } from '@/utils/fileUtils'
import { FileDropzone } from '@/components/ui/file-dropzone'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search, Plus, Pencil, Trash2, LoaderCircle, Settings, Package,
  AlertCircle, Clock, CheckCircle, ChevronDown, ChevronRight, ChevronLeft,
  ChevronsLeft, ChevronsRight, Truck, List, Route, CalendarDays,
  Wrench, Folder, ArrowLeft, X, FolderOpen, User, Ruler, Euro,
  AlertTriangle, ClipboardList, Car, ArrowUpDown, ArrowUp, ArrowDown,
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

// Context menu for desktop right-click
import {
  ContextMenuPopover,
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/ui/context-menu-popover'

import type {
  TypeEntretienDTO,
  VehiculeDTO,
  EntretienDTO,
  VehiculeProchainEntretienDTO,
  EntretienFileDTO,
  DossierTypeEntretienDTO
} from '@/models'

const messages = useMessages()
const router = useRouter()

const handleGoBack = () => {
  const historyState = window.history.state
  if (historyState && historyState.position > 0) {
    router.back()
  } else {
    router.push('/vehicules')
  }
}

interface SelectedFile {
  file: File
  preview: string
  base64: string
}

const authStore = useAuthStore()

// Computed
const isMecanicien = computed(() => authStore.userRoleUuid === 'c10523af-a4ab-47e2-8025-5ef4e241ef08')

// Context menu
const contextMenu = useContextMenu<EntretienDTO>()
const contextMenuRef = ref<InstanceType<typeof ContextMenuPopover> | null>(null)

watch(() => contextMenuRef.value?.menuElement, (el) => {
  contextMenu.menuRef.value = el ?? null
})

const handleContextAction = (entretien: EntretienDTO, action: string) => {
  switch (action) {
    case 'files':
      openPhotosModal(entretien)
      break
    case 'edit':
      openEditModal(entretien)
      break
    case 'delete':
      confirmDelete(entretien)
      break
  }
}

// State
const loading = ref(false)
const loadingHistorique = ref(false)
const submitting = ref(false)
const activeTab = ref('prochains')
const showAJour = ref(false)

// Data
const entretiens = ref<EntretienDTO[]>([])
const vehiculesProchains = ref<VehiculeProchainEntretienDTO[]>([])
const vehicules = ref<VehiculeDTO[]>([])
const typesEntretien = ref<TypeEntretienDTO[]>([])
const dossiers = ref<DossierTypeEntretienDTO[]>([])
const historiqueEntretiens = ref<EntretienDTO[]>([])
const selectedVehicule = ref<VehiculeDTO | null>(null)

// Sorting
type SortKey = 'dateEntretien' | 'vehiculeImmat' | 'type' | 'kilometrage' | 'mecanicien' | 'cout'
type SortDirection = 'asc' | 'desc'
const sortKey = ref<SortKey | null>(null)
const sortDirection = ref<SortDirection>('asc')

const toggleSort = (key: SortKey) => {
  if (sortKey.value === key) {
    if (sortDirection.value === 'asc') {
      sortDirection.value = 'desc'
    } else {
      sortKey.value = null
      sortDirection.value = 'asc'
    }
  } else {
    sortKey.value = key
    sortDirection.value = 'asc'
  }
}

// Pagination
const pagination = ref({
  page: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: false
})

// Filters - unified object for SearchFilters
const filterValues = ref<Record<string, unknown>>({
  vehiculeId: '',
  dossierId: '',
  typeEntretienId: '',
  sortBy: 'dateEntretien',
  sortDirection: 'desc',
  startDate: '',
  endDate: '',
  kmMin: '',
  kmMax: '',
  coutMin: '',
  coutMax: ''
})

// Fleet Dashboard Interface
interface FleetVehicleStatus {
  id: string
  vehicule: VehiculeDTO
  status: 'OK' | 'WARNING' | 'DANGER'
  alerts: FleetAlert[]
}

interface FleetAlert {
  type: 'KM' | 'DATE'
  typeEntretien: TypeEntretienDTO
  targetValue: number | string | Date
  remaining: number
  isLate: boolean
  message: string
}

const fleetStatusList = computed<FleetVehicleStatus[]>(() => {
  const alertsMap = new Map<string, VehiculeProchainEntretienDTO>()
  vehiculesProchains.value.forEach(item => {
    if (item.vehicule?.id) {
      alertsMap.set(item.vehicule.id, item)
    }
  })

  const dashboard = vehicules.value.map(vehicule => {
    if (!vehicule.id) return null

    const alerts: FleetAlert[] = []
    let hasLate = false

    const alertData = alertsMap.get(vehicule.id)

    if (alertData) {
      if (alertData.prochainEntretienKm) {
        alerts.push({
          type: 'KM',
          typeEntretien: alertData.prochainEntretienKm.typeEntretien!,
          targetValue: alertData.prochainEntretienKm.prochainKilometrage || 0,
          remaining: alertData.prochainEntretienKm.kmRestants || 0,
          isLate: alertData.prochainEntretienKm.enRetard || false,
          message: alertData.prochainEntretienKm.message || ''
        })
        if (alertData.prochainEntretienKm.enRetard) hasLate = true
      }

      if (alertData.prochainEntretienDate) {
        alerts.push({
          type: 'DATE',
          typeEntretien: alertData.prochainEntretienDate.typeEntretien!,
          targetValue: alertData.prochainEntretienDate.prochaineDateTemporelle || '',
          remaining: alertData.prochainEntretienDate.joursRestants || 0,
          isLate: alertData.prochainEntretienDate.enRetard || false,
          message: alertData.prochainEntretienDate.message || ''
        })
        if (alertData.prochainEntretienDate.enRetard) hasLate = true
      }
    }

    let status: 'OK' | 'WARNING' | 'DANGER' = 'OK'
    if (hasLate) {
      status = 'DANGER'
    } else if (alerts.length > 0) {
      const hasUrgentAlert = alerts.some(alert => {
        if (alert.type === 'KM') {
          return alert.remaining >= 0 && alert.remaining <= 10000
        } else {
          return alert.remaining >= 0 && alert.remaining <= 90
        }
      })
      if (hasUrgentAlert) status = 'WARNING'
    }

    alerts.sort((a, b) => {
      if (a.isLate && !b.isLate) return -1
      if (!a.isLate && b.isLate) return 1
      return 0
    })

    return {
      id: vehicule.id,
      vehicule,
      status,
      alerts
    }
  }).filter(item => item !== null) as FleetVehicleStatus[]

  return dashboard.sort((a, b) => {
    const score = (status: string) => {
      if (status === 'DANGER') return 3
      if (status === 'WARNING') return 2
      return 1
    }
    return score(b.status) - score(a.status)
  })
})

const vehiculesEnRetard = computed(() =>
  fleetStatusList.value.filter(v => v.status === 'DANGER')
)

const vehiculesAVenir = computed(() =>
  fleetStatusList.value.filter(v => v.status === 'WARNING')
)

const vehiculesOK = computed(() =>
  fleetStatusList.value.filter(v => v.status === 'OK')
)

// Search query (separate for quick search)
const searchQuery = ref('')

// Total cost
const totalCoutHT = computed(() => {
  return filteredEntretiens.value.reduce((sum, e) => sum + (e.cout || 0), 0)
})

// Filtered types for filter dossier
const filteredTypesEntretien = computed(() => {
  const selectedDossierId = filterValues.value.dossierId as string
  if (!selectedDossierId) {
    return typesEntretien.value
  }
  return typesEntretien.value.filter(t => t.dossier?.id === selectedDossierId)
})

// Filter configuration for SearchFilters
const filterConfig = computed<FilterConfig[]>(() => [
  {
    key: 'vehiculeId',
    label: 'Véhicule',
    type: 'select',
    placeholder: 'Tous les véhicules',
    options: vehicules.value.map(v => ({
      value: v.id || '',
      label: `${v.brand} ${v.model} (${v.immat})`
    }))
  },
  {
    key: 'dossierId',
    label: 'Dossier',
    type: 'select',
    placeholder: 'Tous les dossiers',
    options: dossiers.value.map(d => ({
      value: d.id || '',
      label: d.nom || ''
    }))
  },
  {
    key: 'typeEntretienId',
    label: 'Type d\'entretien',
    type: 'select',
    placeholder: 'Tous les types',
    options: filteredTypesEntretien.value.map(t => ({
      value: t.id || '',
      label: t.nom || ''
    }))
  },
  {
    key: 'sortBy',
    label: 'Trier par',
    type: 'select',
    options: [
      { value: 'dateEntretien', label: 'Date d\'entretien' },
      { value: 'kilometrage', label: 'Kilométrage' },
      { value: 'cout', label: 'Coût HT' }
    ]
  },
  {
    key: 'sortDirection',
    label: 'Ordre',
    type: 'select',
    options: [
      { value: 'desc', label: 'Décroissant' },
      { value: 'asc', label: 'Croissant' }
    ]
  },
  {
    key: 'startDate',
    label: 'Date de début',
    type: 'date'
  },
  {
    key: 'endDate',
    label: 'Date de fin',
    type: 'date'
  },
  {
    key: 'kmMin',
    label: 'Kilométrage min',
    type: 'number',
    placeholder: 'Ex: 50000'
  },
  {
    key: 'kmMax',
    label: 'Kilométrage max',
    type: 'number',
    placeholder: 'Ex: 100000'
  },
  {
    key: 'coutMin',
    label: 'Coût HT minimum (€)',
    type: 'number',
    placeholder: '0.00'
  },
  {
    key: 'coutMax',
    label: 'Coût HT maximum (€)',
    type: 'number',
    placeholder: '500.00'
  }
])

// Reset type when dossier changes (filters)
watch(() => filterValues.value.dossierId, (newDossierId) => {
  const currentTypeId = filterValues.value.typeEntretienId as string
  if (currentTypeId && newDossierId) {
    const typeExists = filteredTypesEntretien.value.some(t => t.id === currentTypeId)
    if (!typeExists) {
      filterValues.value.typeEntretienId = ''
    }
  }
})

// Modals
const showEntretienModal = ref(false)
const showPhotosModal = ref(false)
const showDeleteModal = ref(false)
const showDeleteFileModal = ref(false)
const showValidateModal = ref(false)
const showHistoriqueModal = ref(false)
const isEditMode = ref(false)

// Type Picker state
const isTypePickerOpen = ref(false)
const typePickerSearch = ref('')
const typePickerWrapperRef = ref<HTMLElement | null>(null)
const typePickerTriggerRef = ref<HTMLButtonElement | null>(null)
const typePickerDropdownRef = ref<HTMLElement | null>(null)
const typePickerSearchRef = ref<HTMLInputElement | null>(null)
const typePickerPosition = ref({ top: 0, left: 0, width: 0 })

// Form
const formData = ref({
  vehiculeId: '',
  dossierId: '',
  typeEntretienId: '',
  dateEntretien: '',
  kilometrage: null as number | null,
  cout: null as number | null,
  commentaire: ''
})

// Reset type when dossier changes (form)
watch(() => formData.value.dossierId, () => {
  formData.value.typeEntretienId = ''
})

const selectedFiles = ref<SelectedFile[]>([])
const currentEntretien = ref<EntretienDTO | null>(null)
const entretienToDelete = ref<EntretienDTO | null>(null)
const currentFiles = ref<EntretienFileDTO[]>([])
const loadingFiles = ref(false)
const fileToDelete = ref<string | null>(null)

// Validation data
const validationData = ref<{
  vehicule: VehiculeDTO | null
  typeEntretien: TypeEntretienDTO | null
  typeEntretienNom: string
}>({
  vehicule: null,
  typeEntretien: null,
  typeEntretienNom: ''
})

// Options for Select
const vehiculeOptions = computed(() => {
  return vehicules.value
    .filter(v => v.id)
    .map(v => ({
      value: v.id!,
      label: `${v.brand} ${v.model} (${v.immat})`
    }))
})

// Dossier options for form
const dossierOptions = computed(() => {
  return dossiers.value
    .filter(d => d.id && d.nom)
    .map(d => ({
      value: d.id!,
      label: d.nom!
    }))
})

// Types filtered by selected dossier in form
const typeEntretienOptions = computed(() => {
  const selectedDossierId = formData.value.dossierId
  if (!selectedDossierId) {
    return []
  }
  return typesEntretien.value
    .filter(t => t.id && t.nom && t.dossier?.id === selectedDossierId)
    .map(t => ({
      value: t.id!,
      label: t.nom!
    }))
})

// Labels for hierarchical picker
const selectedDossierLabel = computed(() => {
  const dossier = dossiers.value.find(d => d.id === formData.value.dossierId)
  return dossier?.nom || ''
})

const selectedTypeLabel = computed(() => {
  const type = typesEntretien.value.find(t => t.id === formData.value.typeEntretienId)
  return type?.nom || ''
})

// Filtered options for search
const filteredDossierOptions = computed(() => {
  if (!typePickerSearch.value.trim()) {
    return dossierOptions.value
  }
  const query = typePickerSearch.value.toLowerCase().trim()
  return dossierOptions.value.filter(d => d.label.toLowerCase().includes(query))
})

const filteredTypeOptions = computed(() => {
  if (!typePickerSearch.value.trim()) {
    return typeEntretienOptions.value
  }
  const query = typePickerSearch.value.toLowerCase().trim()
  return typeEntretienOptions.value.filter(t => t.label.toLowerCase().includes(query))
})

// Dropdown style (position)
const typePickerDropdownStyle = computed(() => ({
  position: 'fixed' as const,
  top: `${typePickerPosition.value.top}px`,
  left: `${typePickerPosition.value.left}px`,
  width: `${typePickerPosition.value.width}px`,
  zIndex: 9999,
  pointerEvents: 'auto' as const,
}))

// Calculate type picker position
const calculateTypePickerPosition = () => {
  if (!typePickerTriggerRef.value) return
  const rect = typePickerTriggerRef.value.getBoundingClientRect()
  typePickerPosition.value = {
    top: rect.bottom + 4,
    left: rect.left,
    width: rect.width
  }
}

// Type picker methods
const toggleTypePicker = () => {
  if (isTypePickerOpen.value) {
    closeTypePicker()
  } else {
    openTypePicker()
  }
}

const openTypePicker = () => {
  calculateTypePickerPosition()
  isTypePickerOpen.value = true
  typePickerSearch.value = ''
  nextTick(() => {
    typePickerSearchRef.value?.focus()
  })
}

const closeTypePicker = () => {
  isTypePickerOpen.value = false
  typePickerSearch.value = ''
}

const selectDossier = (dossierId: string) => {
  formData.value.dossierId = dossierId
  typePickerSearch.value = ''
  nextTick(() => {
    typePickerSearchRef.value?.focus()
  })
}

const selectTypeAndClose = (typeId: string) => {
  formData.value.typeEntretienId = typeId
  closeTypePicker()
}

const goBackToDossiers = () => {
  formData.value.dossierId = ''
  formData.value.typeEntretienId = ''
  typePickerSearch.value = ''
  nextTick(() => {
    typePickerSearchRef.value?.focus()
  })
}

// Click outside for type picker
const handleTypePickerClickOutside = (event: MouseEvent) => {
  if (!isTypePickerOpen.value) return
  const target = event.target as Node
  const isOutsideWrapper = typePickerWrapperRef.value && !typePickerWrapperRef.value.contains(target)
  const isOutsideDropdown = typePickerDropdownRef.value && !typePickerDropdownRef.value.contains(target)
  if (isOutsideWrapper && isOutsideDropdown) {
    closeTypePicker()
  }
}

// Handle scroll and resize
const handleTypePickerScroll = () => {
  if (isTypePickerOpen.value) {
    calculateTypePickerPosition()
  }
}

// Client-side search filter
const filteredEntretiens = computed(() => {
  if (!searchQuery.value) {
    return entretiens.value
  }

  const query = searchQuery.value.toLowerCase()
  return entretiens.value.filter(e =>
    e.vehiculeImmat?.toLowerCase().includes(query) ||
    e.typeEntretien?.nom?.toLowerCase().includes(query) ||
    (e.mecanicien?.firstName + ' ' + e.mecanicien?.lastName).toLowerCase().includes(query) ||
    e.commentaire?.toLowerCase().includes(query)
  )
})

const sortedEntretiens = computed(() => {
  const list = filteredEntretiens.value
  if (!sortKey.value) return list

  const key = sortKey.value
  const dir = sortDirection.value === 'asc' ? 1 : -1

  return [...list].sort((a, b) => {
    let valA: string | number | undefined
    let valB: string | number | undefined

    switch (key) {
      case 'dateEntretien':
        valA = a.dateEntretien ? String(a.dateEntretien) : ''
        valB = b.dateEntretien ? String(b.dateEntretien) : ''
        break
      case 'vehiculeImmat':
        valA = a.vehiculeImmat?.toLowerCase() ?? ''
        valB = b.vehiculeImmat?.toLowerCase() ?? ''
        break
      case 'type':
        valA = a.typeEntretien?.nom?.toLowerCase() ?? ''
        valB = b.typeEntretien?.nom?.toLowerCase() ?? ''
        break
      case 'kilometrage':
        valA = a.kilometrage ?? 0
        valB = b.kilometrage ?? 0
        break
      case 'mecanicien':
        valA = `${a.mecanicien?.firstName ?? ''} ${a.mecanicien?.lastName ?? ''}`.toLowerCase()
        valB = `${b.mecanicien?.firstName ?? ''} ${b.mecanicien?.lastName ?? ''}`.toLowerCase()
        break
      case 'cout':
        valA = a.cout ?? 0
        valB = b.cout ?? 0
        break
    }

    if (valA === valB) return 0
    if (valA === undefined) return 1
    if (valB === undefined) return -1
    return valA < valB ? -dir : dir
  })
})

// Methods
const loadData = async () => {
  loading.value = true
  try {
    const vehiculesData = await entretiensService.getEntretiensAVenir()
    vehiculesProchains.value = vehiculesData.data || []

    const allVehiculesData = await vehiclesService.getVehicles()
    vehicules.value = allVehiculesData.vehicules || []

    const typesData = await typesEntretienService.getTypesEntretien()
    typesEntretien.value = (typesData as any).typesEntretien || typesData.data || []

    try {
      const dossiersData = await dossiersTypesEntretienService.getDossiers()
      dossiers.value = dossiersData.dossiers || []
    } catch {
      dossiers.value = []
    }

    await loadHistoriqueEntretiens()
  } catch {
    messages.error('Erreur lors du chargement des données')
  } finally {
    loading.value = false
  }
}

const loadHistoriqueEntretiens = async () => {
  try {
    const f = filterValues.value
    const searchParams: Record<string, unknown> = {
      page: pagination.value.page,
      size: pagination.value.size,
      sortBy: f.sortBy || 'dateEntretien',
      sortDirection: f.sortDirection || 'desc'
    }

    if (f.vehiculeId) searchParams.vehiculeId = f.vehiculeId
    if (f.dossierId) searchParams.dossierId = f.dossierId
    if (f.typeEntretienId) searchParams.typeEntretienId = f.typeEntretienId
    if (f.startDate) searchParams.startDate = f.startDate
    if (f.endDate) searchParams.endDate = f.endDate
    if (f.kmMin) searchParams.kmMin = Number(f.kmMin)
    if (f.kmMax) searchParams.kmMax = Number(f.kmMax)
    if (f.coutMin) searchParams.coutMin = Number(f.coutMin)
    if (f.coutMax) searchParams.coutMax = Number(f.coutMax)

    const response = await entretiensService.searchHistory(searchParams)

    entretiens.value = response.content || []

    pagination.value = {
      page: response.page,
      size: response.size,
      totalElements: response.totalElements,
      totalPages: response.totalPages,
      first: response.first,
      last: response.last
    }
  } catch {
    messages.error('Erreur lors du chargement de l\'historique')
  }
}

const goToPage = (page: number) => {
  pagination.value.page = page
  loadHistoriqueEntretiens()
}

const performSearch = () => {
  pagination.value.page = 0
  loadHistoriqueEntretiens()
}

const resetFilters = () => {
  searchQuery.value = ''
  filterValues.value = {
    vehiculeId: '',
    dossierId: '',
    typeEntretienId: '',
    sortBy: 'dateEntretien',
    sortDirection: 'desc',
    startDate: '',
    endDate: '',
    kmMin: '',
    kmMax: '',
    coutMin: '',
    coutMax: ''
  }
  pagination.value.page = 0
  loadHistoriqueEntretiens()
}

const loadHistoriqueVehicule = async (vehiculeId: string) => {
  loadingHistorique.value = true
  try {
    const response = await entretiensService.getHistory(vehiculeId)
    historiqueEntretiens.value = (response.entretiens || []).sort((a, b) =>
      new Date(b.dateEntretien || '').getTime() - new Date(a.dateEntretien || '').getTime()
    )
  } catch {
    messages.error('Erreur lors du chargement de l\'historique')
  } finally {
    loadingHistorique.value = false
  }
}

const formatDate = (dateValue?: string | Date) => {
  if (!dateValue) return ''
  const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Modal handlers
const openCreateModal = () => {
  isEditMode.value = false
  formData.value = {
    vehiculeId: '',
    dossierId: '',
    typeEntretienId: '',
    dateEntretien: new Date().toISOString().split('T')[0] || '',
    kilometrage: null,
    cout: null,
    commentaire: ''
  }
  selectedFiles.value = []
  showEntretienModal.value = true
}

const openEditModal = (entretien: EntretienDTO) => {
  isEditMode.value = true
  currentEntretien.value = entretien

  let dateForInput = ''
  if (entretien.dateEntretien) {
    const date = typeof entretien.dateEntretien === 'string'
      ? new Date(entretien.dateEntretien)
      : entretien.dateEntretien
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    dateForInput = `${year}-${month}-${day}`
  }

  const typeEntretien = typesEntretien.value.find(t => t.id === entretien.typeEntretien?.id)

  formData.value = {
    vehiculeId: entretien.vehiculeId || '',
    dossierId: typeEntretien?.dossier?.id || '',
    typeEntretienId: entretien.typeEntretien?.id || '',
    dateEntretien: dateForInput,
    kilometrage: entretien.kilometrage ?? null,
    cout: entretien.cout ?? null,
    commentaire: entretien.commentaire || ''
  }
  showEntretienModal.value = true
}

const closeEntretienModal = () => {
  showEntretienModal.value = false
  currentEntretien.value = null
  selectedFiles.value = []
}

const openPhotosModal = async (entretien: EntretienDTO) => {
  currentEntretien.value = entretien
  showPhotosModal.value = true
  if (entretien.id) {
    await loadEntretienFiles(entretien.id)
  }
}

const loadEntretienFiles = async (entretienId: string) => {
  loadingFiles.value = true
  try {
    const response = await entretiensService.getEntretienFiles(entretienId)
    currentFiles.value = response.files || []
  } catch {
    currentFiles.value = []
  } finally {
    loadingFiles.value = false
  }
}

const downloadFile = (file: EntretienFileDTO) => {
  if (file.fileB64) {
    const link = document.createElement('a')
    link.href = `data:${file.mimeType};base64,${file.fileB64}`
    link.download = file.originalName || 'fichier'
    link.click()
  }
}

const confirmDelete = (entretien: EntretienDTO) => {
  entretienToDelete.value = entretien
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  entretienToDelete.value = null
}

const openCreateEntretienForVehicule = () => {
  const vehiculeId = selectedVehicule.value?.id
  if (!vehiculeId) return
  isEditMode.value = false
  formData.value = {
    vehiculeId,
    dossierId: '',
    typeEntretienId: '',
    dateEntretien: new Date().toISOString().split('T')[0] || '',
    kilometrage: null,
    cout: null,
    commentaire: ''
  }
  selectedFiles.value = []
  showEntretienModal.value = true
}

// File handling
const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])

  for (const file of files) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      const base64Part = result.split(',')[1]
      if (base64Part) {
        selectedFiles.value.push({
          file,
          preview: result,
          base64: base64Part
        })
      }
    }
    reader.readAsDataURL(file)
  }
}

const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1)
}

const getFileIcon = (mimeType?: string): [string, string] => {
  if (!mimeType) return ['fas', 'file']
  if (mimeType.startsWith('image/')) return ['fas', 'file-image']
  if (mimeType === 'application/pdf') return ['fas', 'file-pdf']
  if (mimeType.includes('word')) return ['fas', 'file-word']
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return ['fas', 'file-excel']
  return ['fas', 'file']
}
const handleDropzoneAddFile = (files: FileList) => {

  const file = files[0]
  if (!file || !currentEntretien.value || !currentEntretien.value.id) return

  const entretienId = currentEntretien.value.id
  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const result = e.target?.result as string
      const base64 = result.split(',')[1]
      if (!base64) return
      const fileData = {
        fileB64: base64,
        originalName: file.name,
        mimeType: file.type
      }
      await entretiensService.addFile(entretienId, fileData)
      await loadEntretienFiles(entretienId)
      messages.success('Fichier ajoute avec succes')
    } catch {
      messages.error('Erreur lors de l\'ajout du fichier')
    }
  }
  reader.readAsDataURL(file)
}

const deleteFileFromEntretien = (fileId: string) => {
  fileToDelete.value = fileId
  showDeleteFileModal.value = true
}

const executeDeleteFile = async () => {
  if (!fileToDelete.value || !currentEntretien.value || !currentEntretien.value.id) return

  try {
    await entretiensService.deleteFile(fileToDelete.value)
    await loadEntretienFiles(currentEntretien.value.id)
    messages.success('Fichier supprimé avec succès')
    showDeleteFileModal.value = false
    fileToDelete.value = null
  } catch {
    messages.error('Erreur lors de la suppression du fichier')
  }
}

const cancelDeleteFile = () => {
  showDeleteFileModal.value = false
  fileToDelete.value = null
}

const showImageFullscreen = ref(false)
const fullscreenImages = ref<string[]>([])
const fullscreenIndex = ref(0)

const openImageFullscreen = (url: string) => {
  const imageFiles = currentFiles.value.filter(f => isImage(f))
  const imageUrls = imageFiles.map(f => getFileUrl(f))
  const idx = imageUrls.indexOf(url)
  if (imageUrls.length > 0) {
    fullscreenImages.value = imageUrls
    fullscreenIndex.value = idx >= 0 ? idx : 0
  } else {
    fullscreenImages.value = [url]
    fullscreenIndex.value = 0
  }
  showImageFullscreen.value = true
}

const executeValiderEntretien = async () => {
  const { vehicule, typeEntretien } = validationData.value
  if (!vehicule || !vehicule.id || !typeEntretien || !typeEntretien.id) return

  try {
    const today = new Date()
    const isoDate = `${today.toISOString().split('T')[0]}T12:00:00`

    const dataToSend = {
      vehiculeId: vehicule.id,
      typeEntretienId: typeEntretien.id,
      dateEntretien: isoDate,
      kilometrage: vehicule.latestKm || 0,
      cout: undefined,
      commentaire: '',
      files: undefined
    }

    await entretiensService.createEntretien(dataToSend)
    messages.success('Entretien créé avec succès')
    showValidateModal.value = false
    await loadData()
  } catch {
    messages.error('Erreur lors de la création de l\'entretien')
  }
}

const cancelValiderEntretien = () => {
  showValidateModal.value = false
  validationData.value = {
    vehicule: null,
    typeEntretien: null,
    typeEntretienNom: ''
  }
}

// CRUD operations
const submitEntretien = async () => {
  submitting.value = true
  try {
    const isoDate = `${formData.value.dateEntretien}T12:00:00`

    if (isEditMode.value && currentEntretien.value && currentEntretien.value.id) {
      const dataToUpdate = {
        typeEntretienId: formData.value.typeEntretienId,
        dateEntretien: isoDate,
        kilometrage: formData.value.kilometrage ?? undefined,
        cout: formData.value.cout ?? undefined,
        commentaire: formData.value.commentaire
      }
      await entretiensService.updateEntretien(currentEntretien.value.id, dataToUpdate)
      messages.success('Entretien modifié avec succès')
    } else {
      const files = selectedFiles.value.map(f => ({
        fileB64: f.base64,
        originalName: f.file.name,
        mimeType: f.file.type
      }))

      const dataToSend = {
        vehiculeId: formData.value.vehiculeId,
        typeEntretienId: formData.value.typeEntretienId,
        dateEntretien: isoDate,
        kilometrage: formData.value.kilometrage ?? 0,
        cout: formData.value.cout ?? undefined,
        commentaire: formData.value.commentaire,
        files: files.length > 0 ? files : undefined
      }
      await entretiensService.createEntretien(dataToSend)
      messages.success('Entretien créé avec succès')
    }

    closeEntretienModal()
    await loadHistoriqueEntretiens()

    if (showHistoriqueModal.value && selectedVehicule.value && selectedVehicule.value.id) {
      await loadHistoriqueVehicule(selectedVehicule.value.id)
    }
  } catch {
    messages.error('Erreur lors de l\'enregistrement de l\'entretien')
  } finally {
    submitting.value = false
  }
}

const deleteEntretien = async () => {
  if (!entretienToDelete.value || !entretienToDelete.value.id) return

  try {
    await entretiensService.deleteEntretien(entretienToDelete.value.id)
    messages.success('Entretien supprimé avec succès')
    closeDeleteModal()
    await loadHistoriqueEntretiens()

    if (showHistoriqueModal.value && selectedVehicule.value && selectedVehicule.value.id) {
      await loadHistoriqueVehicule(selectedVehicule.value.id)
    }
  } catch {
    messages.error('Erreur lors de la suppression de l\'entretien')
  }
}

// Lifecycle
onMounted(() => {
  loadData()
  document.addEventListener('click', handleTypePickerClickOutside, true)
  window.addEventListener('scroll', handleTypePickerScroll, true)
  window.addEventListener('resize', handleTypePickerScroll)
})

onUnmounted(() => {
  document.removeEventListener('click', handleTypePickerClickOutside, true)
  window.removeEventListener('scroll', handleTypePickerScroll, true)
  window.removeEventListener('resize', handleTypePickerScroll)
})
</script>
