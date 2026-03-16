<template>
  <div class="min-h-screen bg-background">
    <main class="px-4 py-4 md:px-6 md:py-6">
      <div class="mx-auto max-w-[1400px]">
        <Tabs v-model="activeTab">
          <div class="overflow-hidden rounded-lg border border-border">
            <!-- Header desktop -->
            <div class="relative hidden items-end bg-muted px-4 pt-2 md:flex">
              <div class="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                <Button variant="ghost" size="icon-sm" @click="$router.push('/entretiens')" title="Retour">
                  <ArrowLeft class="size-4" />
                </Button>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-foreground">{{ vehicule?.brand }} {{ vehicule?.model }}</span>
                  <Badge variant="default" class="gap-1">
                    <Gauge class="size-3" />
                    {{ vehicule?.latestKm?.toLocaleString('fr-FR') || 0 }} km
                  </Badge>
                </div>
              </div>
              <TabsList class="mx-auto bg-transparent p-0 gap-0.5">
                <TabsTrigger value="entretiens" class="gap-2 rounded-b-none rounded-t-lg border border-transparent px-5 py-2.5 text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=inactive]:bg-transparent dark:data-[state=active]:border-primary/40 dark:data-[state=active]:border-b-transparent dark:data-[state=active]:bg-primary/10">
                  Entretiens
                </TabsTrigger>
                <TabsTrigger v-if="isMecanicien" value="configurations" class="gap-2 rounded-b-none rounded-t-lg border border-transparent px-5 py-2.5 text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=inactive]:bg-transparent dark:data-[state=active]:border-primary/40 dark:data-[state=active]:border-b-transparent dark:data-[state=active]:bg-primary/10">
                  Configurations
                  <Badge v-if="configurationsEntretien.length" variant="secondary">{{ configurationsEntretien.length }}</Badge>
                </TabsTrigger>
              </TabsList>
              <div class="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                <Button variant="outline" size="sm" @click="goToVehicle">
                  <Truck class="size-3.5" />
                  Voir le véhicule
                </Button>
                <Button v-if="isMecanicien" size="sm" @click="openCreateModal">
                  <Plus class="size-3.5" />
                  Nouvel entretien
                </Button>
              </div>
            </div>

            <!-- Header mobile -->
            <div class="flex flex-col gap-3 bg-muted p-3 md:hidden">
              <!-- Row 1: Back button + Vehicle info + Actions menu -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Button variant="ghost" size="icon-sm" @click="$router.push('/entretiens')" title="Retour">
                    <ArrowLeft class="size-4" />
                  </Button>
                  <div class="flex flex-col">
                    <span class="text-sm font-medium text-foreground">{{ vehicule?.brand }} {{ vehicule?.model }}</span>
                    <Badge variant="default" class="mt-0.5 w-fit gap-1 text-xs">
                      <Gauge class="size-3" />
                      {{ vehicule?.latestKm?.toLocaleString('fr-FR') || 0 }} km
                    </Badge>
                  </div>
                </div>
                <!-- Mobile menu -->
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon-sm">
                      <MoreVertical class="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" class="w-48">
                    <DropdownMenuItem @click="goToVehicle">
                      <Truck class="mr-2 size-4" />
                      Voir le véhicule
                    </DropdownMenuItem>
                    <template v-if="isMecanicien">
                      <DropdownMenuSeparator />
                      <DropdownMenuItem @click="openCreateModal">
                        <Plus class="mr-2 size-4" />
                        Nouvel entretien
                      </DropdownMenuItem>
                    </template>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <!-- Row 2: Tabs -->
              <TabsList class="mx-auto bg-transparent p-0 gap-0.5">
                <TabsTrigger value="entretiens" class="gap-1.5 rounded-lg border border-transparent px-3 py-2 text-xs text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:bg-transparent dark:data-[state=active]:border-primary/40 dark:data-[state=active]:bg-primary/10">
                  Entretiens
                </TabsTrigger>
                <TabsTrigger v-if="isMecanicien" value="configurations" class="gap-1.5 rounded-lg border border-transparent px-3 py-2 text-xs text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:bg-transparent dark:data-[state=active]:border-primary/40 dark:data-[state=active]:bg-primary/10">
                  Config
                  <Badge v-if="configurationsEntretien.length" variant="secondary" class="h-5 px-1.5 text-xs">{{ configurationsEntretien.length }}</Badge>
                </TabsTrigger>
              </TabsList>
            </div>

            <!-- Onglet Entretiens -->
            <TabsContent value="entretiens" class="mt-0 bg-background p-4 md:p-6 space-y-6">
              <!-- Alertes prochains entretiens -->
              <div v-if="prochainsEntretiens && (prochainsEntretiens.prochainEntretienKm || prochainsEntretiens.prochainEntretienDate)" class="space-y-3">
                <!-- Alerte km -->
                <div
                  v-if="prochainsEntretiens.prochainEntretienKm"
                  class="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:gap-4"
                  :class="prochainsEntretiens.prochainEntretienKm.enRetard
                    ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
                    : 'border-green-500 bg-green-50 dark:bg-green-950/30'"
                >
                  <div class="flex items-center gap-3">
                    <span
                      class="flex size-8 shrink-0 items-center justify-center rounded-full"
                      :class="prochainsEntretiens.prochainEntretienKm.enRetard
                        ? 'bg-red-100 text-red-600 dark:bg-red-950/50'
                        : 'bg-green-100 text-green-600 dark:bg-green-950/50'"
                    >
                      <Route class="size-4" />
                    </span>
                    <div class="flex flex-1 flex-col gap-1 md:flex-row md:flex-wrap md:items-center md:gap-3">
                      <strong class="text-foreground">{{ prochainsEntretiens.prochainEntretienKm.typeEntretien?.nom }}</strong>
                      <span class="text-sm text-muted-foreground">à {{ prochainsEntretiens.prochainEntretienKm.prochainKilometrage?.toLocaleString('fr-FR') }} km</span>
                      <span
                        class="text-sm font-medium"
                        :class="(prochainsEntretiens.prochainEntretienKm.kmRestants ?? 0) < 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'"
                      >
                        ({{ prochainsEntretiens.prochainEntretienKm.kmRestants?.toLocaleString('fr-FR') }} km restants)
                      </span>
                    </div>
                    <Badge v-if="prochainsEntretiens.prochainEntretienKm.enRetard" variant="destructive" class="shrink-0 md:hidden">EN RETARD</Badge>
                  </div>
                  <div class="flex items-center justify-end gap-2">
                    <Badge v-if="prochainsEntretiens.prochainEntretienKm.enRetard" variant="destructive" class="hidden md:flex">EN RETARD</Badge>
                    <Button
                      v-if="isMecanicien"
                      size="sm"
                      class="bg-green-600 hover:bg-green-700"
                      @click="validerEntretien(prochainsEntretiens.prochainEntretienKm.typeEntretien)"
                    >
                      <CheckCircle class="size-3.5" />
                      Valider
                    </Button>
                  </div>
                </div>

                <!-- Alerte date -->
                <div
                  v-if="prochainsEntretiens.prochainEntretienDate"
                  class="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:gap-4"
                  :class="prochainsEntretiens.prochainEntretienDate.enRetard
                    ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
                    : 'border-green-500 bg-green-50 dark:bg-green-950/30'"
                >
                  <div class="flex items-center gap-3">
                    <span
                      class="flex size-8 shrink-0 items-center justify-center rounded-full"
                      :class="prochainsEntretiens.prochainEntretienDate.enRetard
                        ? 'bg-red-100 text-red-600 dark:bg-red-950/50'
                        : 'bg-green-100 text-green-600 dark:bg-green-950/50'"
                    >
                      <CalendarDays class="size-4" />
                    </span>
                    <div class="flex flex-1 flex-col gap-1 md:flex-row md:flex-wrap md:items-center md:gap-3">
                      <strong class="text-foreground">{{ prochainsEntretiens.prochainEntretienDate.typeEntretien?.nom }}</strong>
                      <span class="text-sm text-muted-foreground">prévu le {{ formatDate(prochainsEntretiens.prochainEntretienDate.prochaineDateTemporelle) }}</span>
                      <span
                        class="text-sm font-medium"
                        :class="(prochainsEntretiens.prochainEntretienDate.joursRestants ?? 0) < 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'"
                      >
                        ({{ prochainsEntretiens.prochainEntretienDate.joursRestants }} jours)
                      </span>
                    </div>
                    <Badge v-if="prochainsEntretiens.prochainEntretienDate.enRetard" variant="destructive" class="shrink-0 md:hidden">EN RETARD</Badge>
                  </div>
                  <div class="flex items-center justify-end gap-2">
                    <Badge v-if="prochainsEntretiens.prochainEntretienDate.enRetard" variant="destructive" class="hidden md:flex">EN RETARD</Badge>
                    <Button
                      v-if="isMecanicien"
                      size="sm"
                      class="bg-green-600 hover:bg-green-700"
                      @click="validerEntretien(prochainsEntretiens.prochainEntretienDate.typeEntretien)"
                    >
                      <CheckCircle class="size-3.5" />
                      Valider
                    </Button>
                  </div>
                </div>
              </div>

              <!-- Historique des entretiens -->
              <div class="space-y-4">
                <h2 class="text-lg font-semibold text-foreground">Historique des entretiens</h2>

                <!-- Filtres -->
                <SearchFilters
                  v-model="filterValues"
                  :filters="filterConfig"
                  :loading="loadingEntretiens"
                  :columns="4"
                  :hint="`${pagination.totalElements} entretien${pagination.totalElements > 1 ? 's' : ''} trouvé${pagination.totalElements > 1 ? 's' : ''}`"
                  @search="performSearch"
                  @reset="resetFilters"
                />

                <!-- Loading skeleton mobile -->
                <div v-if="loading || loadingEntretiens" class="space-y-3 md:hidden">
                  <div v-for="n in 4" :key="n" class="rounded-lg border bg-card p-4 space-y-3">
                    <div class="flex items-center justify-between">
                      <Skeleton class="h-5 w-16 rounded-full" />
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
                <div v-if="loading || loadingEntretiens" class="hidden overflow-hidden rounded-lg border shadow-sm md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
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
                          <Badge variant="secondary">{{ item.typeEntretien?.nom }}</Badge>
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
                        >
                          <TableCell class="text-sm text-muted-foreground">{{ formatDate(item.dateEntretien) }}</TableCell>
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
                <div v-if="!loading && !loadingEntretiens && pagination.totalPages > 1" class="flex items-center justify-center gap-2 py-4">
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
              </div>
            </TabsContent>

            <!-- Onglet Configurations -->
            <TabsContent v-if="isMecanicien" value="configurations" class="mt-0 bg-background p-4 md:p-6 space-y-4">
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold text-foreground">Configurations d'entretien</h2>
                <Button
                  size="sm"
                  :disabled="typesEntretienDisponibles.length === 0"
                  @click="openConfigModal"
                >
                  <Plus class="size-3.5" />
                  Ajouter
                </Button>
              </div>

              <div v-if="loadingConfigurations" class="flex flex-col items-center justify-center gap-4 py-16">
                <LoaderCircle class="size-10 animate-spin text-primary" />
                <p class="text-lg text-muted-foreground">Chargement...</p>
              </div>

              <div v-else-if="configurationsEntretien.length === 0" class="flex flex-col items-center justify-center gap-4 py-16">
                <Settings class="size-12 text-muted-foreground" />
                <p class="text-lg text-muted-foreground">Aucune configuration d'entretien définie</p>
              </div>

              <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div
                  v-for="config in configurationsEntretien"
                  :key="config.id"
                  class="rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                  :class="{ 'opacity-60': !config.actif }"
                >
                  <div class="mb-3 flex items-center justify-between">
                    <span class="font-medium text-foreground">{{ config.typeEntretien?.nom }}</span>
                    <Badge v-if="!config.actif" variant="secondary">Inactif</Badge>
                  </div>
                  <div class="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays v-if="config.periodiciteType === 'TEMPOREL'" class="size-4" />
                    <Route v-else class="size-4" />
                    <span>{{ formatPeriodicite(config) }}</span>
                  </div>
                  <div class="flex justify-end gap-1">
                    <Button variant="ghost" size="icon-sm" title="Modifier" @click="openEditConfigModal(config)">
                      <Pencil class="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" class="text-destructive hover:text-destructive" title="Supprimer" @click="confirmDeleteConfig(config.id!)">
                      <Trash2 class="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </main>

    <!-- Modal Créer/Modifier Entretien -->
    <Dialog v-model:open="showEntretienModal">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{{ isEditMode ? 'Modifier l\'entretien' : 'Nouvel entretien' }}</DialogTitle>
          <DialogDescription>{{ isEditMode ? 'Modifiez les informations de l\'entretien.' : 'Renseignez les informations du nouvel entretien.' }}</DialogDescription>
        </DialogHeader>

        <form @submit.prevent="submitEntretien" class="flex flex-col gap-4">
          <Select
            v-model="formData.typeEntretienId"
            label="Type d'entretien"
            :options="typeEntretienOptions"
            placeholder="Sélectionner un type"
            :required="true"
            search-placeholder="Rechercher un type..."
          />

          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-foreground">Date *</label>
              <Input v-model="formData.dateEntretien" type="date" required />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-foreground">Kilométrage *</label>
              <input v-model.number="formData.kilometrage" type="number" placeholder="150000" required class="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]" />
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-foreground">Coût HT (€)</label>
            <input v-model.number="formData.cout" type="number" step="0.01" placeholder="0.00" class="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]" />
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-foreground">Commentaire</label>
            <Textarea v-model="formData.commentaire" rows="4" placeholder="Détails sur l'entretien..." />
          </div>

          <!-- Section Fichiers -->
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-foreground">Fichiers</label>

            <!-- Fichiers existants (mode édition) -->
            <div v-if="isEditMode && editModeFiles.length > 0" class="mb-4">
              <p class="mb-2 text-sm font-medium text-muted-foreground">Fichiers existants :</p>
              <div class="flex flex-col gap-2">
                <div v-for="file in editModeFiles" :key="file.id" class="flex items-center gap-3 rounded-md border bg-muted/50 px-3 py-2">
                  <div class="flex size-8 items-center justify-center text-lg text-primary">
                    <font-awesome-icon :icon="getFileIcon(file.mimeType)" />
                  </div>
                  <span class="flex-1 truncate text-sm text-foreground" :title="file.originalName">{{ file.originalName }}</span>
                  <span class="text-xs text-muted-foreground">{{ formatFileSize(file.fileSize) }}</span>
                  <button type="button" @click="deleteEditModeFile(file.id!)" class="flex size-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" title="Supprimer">
                    <Trash2 class="size-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div v-else-if="isEditMode && !loadingEditModeFiles && editModeFiles.length === 0" class="mb-4 flex items-center gap-2 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
              <FolderOpen class="size-4" />
              <span>Aucun fichier attaché</span>
            </div>

            <div v-if="isEditMode && loadingEditModeFiles" class="mb-4 flex items-center gap-2 p-3 text-sm text-muted-foreground">
              <LoaderCircle class="size-4 animate-spin text-primary" />
              <span>Chargement des fichiers...</span>
            </div>

            <!-- Ajout de nouveaux fichiers -->
            <div class="mt-1">
              <p v-if="isEditMode" class="mb-2 text-sm font-medium text-muted-foreground">Ajouter des fichiers :</p>
              <input
                type="file"
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                multiple
                @change="handleFileSelect"
                class="block w-full cursor-pointer rounded-md border-2 border-dashed border-border bg-muted/50 p-3 text-sm text-foreground"
                ref="fileInput"
              />
              <div v-if="selectedFiles.length > 0" class="mt-3 grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-3">
                <div v-for="(file, index) in selectedFiles" :key="index" class="relative flex flex-col items-center gap-2 rounded-md border bg-muted/50 p-2">
                  <div class="flex size-10 items-center justify-center overflow-hidden rounded-sm bg-muted">
                    <img v-if="file.file.type.startsWith('image/')" :src="file.preview" alt="Preview" class="size-full object-cover" />
                    <font-awesome-icon v-else :icon="getFileIcon(file.file.type)" class="text-xl text-primary" />
                  </div>
                  <span class="w-full truncate text-center text-xs text-foreground">{{ file.file.name }}</span>
                  <button type="button" @click="removeFile(index)" class="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-destructive">
                    <X class="size-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" @click="closeEntretienModal">
              Annuler
            </Button>
            <Button type="submit" :disabled="submitting">
              <LoaderCircle v-if="submitting" class="mr-2 size-4 animate-spin" />
              {{ submitting ? 'Enregistrement...' : (isEditMode ? 'Modifier' : 'Créer') }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Modal Fichiers -->
    <Dialog v-model:open="showPhotosModal">
      <DialogContent class="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Fichiers - {{ currentEntretien?.typeEntretien?.nom || '' }}</DialogTitle>
          <DialogDescription>Fichiers attachés à cet entretien.</DialogDescription>
        </DialogHeader>

        <div v-if="loadingFiles" class="flex flex-col items-center justify-center gap-4 py-10">
          <LoaderCircle class="size-10 animate-spin text-primary" />
          <p class="text-muted-foreground">Chargement des fichiers...</p>
        </div>
        <div v-else-if="currentFiles.length === 0" class="flex flex-col items-center justify-center gap-4 py-10 text-muted-foreground">
          <FolderOpen class="size-16 opacity-50" />
          <p>Aucun fichier attaché</p>
        </div>
        <div v-else class="grid grid-cols-2 gap-4 md:grid-cols-3">
          <FileCard
            v-for="file in currentFiles"
            :key="file.id"
            :file="file"
            :deletable="isMecanicien"
            @view-image="openImageFullscreen($event)"
            @view-pdf="openPdfViewer($event)"
            @download="downloadFile($event)"
            @delete="confirmDeleteFile($event)"
          />
        </div>

        <!-- Modal visualisation PDF -->
        <div v-if="showPdfViewer" class="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 p-4" @click.self="closePdfViewer">
          <div class="flex size-full max-h-[90vh] max-w-[1000px] flex-col overflow-hidden rounded-lg bg-background shadow-2xl">
            <div class="flex items-center justify-between border-b bg-muted px-4 py-3">
              <span class="flex-1 truncate text-sm font-semibold text-foreground mr-4">{{ currentPdfFile?.originalName }}</span>
              <div class="flex items-center gap-2">
                <Button variant="outline" size="sm" @click="downloadFile(currentPdfFile!)">
                  <Download class="size-3.5" />
                  Télécharger
                </Button>
                <Button variant="ghost" size="icon-sm" @click="closePdfViewer">
                  <X class="size-4" />
                </Button>
              </div>
            </div>
            <div class="flex-1 overflow-hidden">
              <iframe
                v-if="currentPdfUrl"
                :src="currentPdfUrl"
                class="size-full border-none"
                title="Visualiseur PDF"
              ></iframe>
            </div>
          </div>
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
        <DialogFooter class="flex items-center justify-end sm:justify-end">
          <Button variant="outline" @click="showPhotosModal = false">Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Modal Confirmation Suppression Entretien -->
    <Dialog v-model:open="showDeleteModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmer la suppression</DialogTitle>
          <DialogDescription>Cette action est irréversible.</DialogDescription>
        </DialogHeader>
        <div class="text-center">
          <p class="mb-3 text-foreground">Êtes-vous sûr de vouloir supprimer cet entretien ?</p>
          <p class="flex items-center justify-center gap-2 font-medium text-destructive">
            <AlertCircle class="size-4" />
            Cette action est irréversible.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="closeDeleteModal">Annuler</Button>
          <Button variant="destructive" @click="deleteEntretien">Supprimer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Modal Confirmation Suppression Fichier -->
    <Dialog v-model:open="showDeleteFileModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Supprimer le fichier</DialogTitle>
          <DialogDescription>Cette action est irréversible.</DialogDescription>
        </DialogHeader>
        <div class="text-center">
          <p class="mb-3 text-foreground">Êtes-vous sûr de vouloir supprimer ce fichier ?</p>
          <p class="flex items-center justify-center gap-2 font-medium text-destructive">
            <AlertCircle class="size-4" />
            Cette action est irréversible.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="cancelDeleteFile">Annuler</Button>
          <Button variant="destructive" @click="executeDeleteFile">Supprimer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Modal Confirmation Validation Entretien -->
    <Dialog v-model:open="showValidateModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Valider l'entretien</DialogTitle>
          <DialogDescription>Confirmation de la validation de l'entretien.</DialogDescription>
        </DialogHeader>
        <div class="text-center">
          <p class="text-foreground">Voulez-vous créer un entretien "{{ validationData.typeEntretienNom }}" pour ce véhicule avec la date et le kilométrage actuels ?</p>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="cancelValiderEntretien">Annuler</Button>
          <Button @click="executeValiderEntretien">Valider</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Modal Configuration Entretien -->
    <ConfigEntretienModal
      v-model="showConfigModal"
      :vehicule-id="route.params.id as string"
      :types-entretien="typesEntretien"
      :configurations-existantes="configurationsEntretien"
      :config-to-edit="configToEdit"
      @saved="handleConfigSaved"
    />

    <!-- Modal Confirmation Suppression Configuration -->
    <Dialog v-model:open="showDeleteConfigModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Supprimer la configuration</DialogTitle>
          <DialogDescription>Cette action est irréversible.</DialogDescription>
        </DialogHeader>
        <div class="text-center">
          <p class="mb-3 text-foreground">Êtes-vous sûr de vouloir supprimer cette configuration d'entretien ?</p>
          <p class="flex items-center justify-center gap-2 font-medium text-destructive">
            <AlertCircle class="size-4" />
            Cette action est irréversible.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="cancelDeleteConfig">Annuler</Button>
          <Button variant="destructive" @click="executeDeleteConfig">Supprimer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Image fullscreen -->
    <ImageLightbox
      v-model:open="showImageFullscreen"
      :images="fullscreenImages"
      :initial-index="fullscreenIndex"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { entretiensService, vehiclesService, typesEntretienService, vehiculesTypesEntretienService, dossiersTypesEntretienService } from '@/services'
import { useMessages } from '@/composables/useMessages'
import ConfigEntretienModal from '@/components/maintenance/ConfigEntretienModal.vue'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ImageLightbox } from '@/components/ui/image-lightbox'
import { FileCard } from '@/components/ui/file-card'
import { isImage, getFileUrl } from '@/utils/fileUtils'
import { FileDropzone } from '@/components/ui/file-dropzone'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { SearchFilters, type FilterConfig } from '@/components/ui/search-filters'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft, ArrowUp, ArrowDown, ArrowUpDown, Plus, Pencil, Trash2, LoaderCircle,
  AlertCircle, CheckCircle, Route, CalendarDays, Settings, Truck, Gauge,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ClipboardList,
  FolderOpen, User, X, Download, MoreVertical, Euro,
} from 'lucide-vue-next'

// DropdownMenu for mobile actions
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type {
  VehiculeDTO,
  TypeEntretienDTO,
  EntretienDTO,
  EntretienFileDTO,
  VehiculeProchainEntretienDTO,
  VehiculeTypeEntretienDTO,
  DossierTypeEntretienDTO
} from '@/models'

const messages = useMessages()

interface SelectedFile {
  file: File
  preview: string
  base64: string
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// Computed
const isMecanicien = computed(() => {
  const roleUuid = authStore.userRoleUuid
  return roleUuid === 'c10523af-a4ab-47e2-8025-5ef4e241ef08' || // Admin
         roleUuid === 'ccbd448a-0eef-4277-b53b-91be340b080f'    // Mécanicien
})

// Tabs
const activeTab = ref<string>('entretiens')

// State
const loading = ref(false)
const loadingEntretiens = ref(false)
const submitting = ref(false)

// Data
const vehicule = ref<VehiculeDTO | null>(null)
const prochainsEntretiens = ref<VehiculeProchainEntretienDTO | null>(null)
const entretiens = ref<EntretienDTO[]>([])
const typesEntretien = ref<TypeEntretienDTO[]>([])
const dossiers = ref<DossierTypeEntretienDTO[]>([])

// Sorting (client-side)
type SortKey = 'dateEntretien' | 'type' | 'kilometrage' | 'mecanicien' | 'cout'
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

const sortedEntretiens = computed(() => {
  const list = entretiens.value
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

// Total coût HT des entretiens affichés
const totalCoutHT = computed(() => {
  return sortedEntretiens.value.reduce((sum, e) => sum + (e.cout || 0), 0)
})

// Types d'entretien filtrés par dossier sélectionné
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

// Options pour Select
const typeEntretienOptions = computed(() => {
  return typesEntretien.value
    .filter(t => t.id && t.nom)
    .map(t => ({
      value: t.id!,
      label: t.nom!
    }))
})

// Réinitialiser le type d'entretien sélectionné quand le dossier change
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
const isEditMode = ref(false)

// Form
const formData = ref({
  vehiculeId: route.params.id as string,
  typeEntretienId: '',
  dateEntretien: '',
  kilometrage: null as number | null,
  cout: null as number | null,
  commentaire: ''
})

const selectedFiles = ref<SelectedFile[]>([])
const currentEntretien = ref<EntretienDTO | null>(null)
const entretienToDelete = ref<EntretienDTO | null>(null)

// Files
const currentFiles = ref<EntretienFileDTO[]>([])
const loadingFiles = ref(false)
const fileToDelete = ref<string | null>(null)

// Files for edit mode (in entretien modal)
const editModeFiles = ref<EntretienFileDTO[]>([])
const loadingEditModeFiles = ref(false)

// Validation data
const validationData = ref<{
  typeEntretien: TypeEntretienDTO | null
  typeEntretienNom: string
}>({
  typeEntretien: null,
  typeEntretienNom: ''
})

// PDF Viewer
const showPdfViewer = ref(false)
const currentPdfFile = ref<EntretienFileDTO | null>(null)
const currentPdfUrl = ref<string>('')

// Configurations d'entretien
const configurationsEntretien = ref<VehiculeTypeEntretienDTO[]>([])
const loadingConfigurations = ref(false)
const showConfigModal = ref(false)
const showDeleteConfigModal = ref(false)
const configToDelete = ref<string | null>(null)
const configToEdit = ref<VehiculeTypeEntretienDTO | null>(null)

// Types d'entretien disponibles (non encore configurés pour ce véhicule)
const typesEntretienDisponibles = computed(() => {
  const configuredIds = configurationsEntretien.value.map(c => c.typeEntretien?.id)
  return typesEntretien.value.filter(t => !configuredIds.includes(t.id))
})

// Methods
const loadData = async () => {
  loading.value = true
  try {
    const vehiculeId = route.params.id as string

    // Load vehicule info
    const vehiculeData = await vehiclesService.getVehicleById(vehiculeId)
    vehicule.value = vehiculeData.vehicule

    // Load prochains entretiens via la nouvelle route
    try {
      const prochainsData = await entretiensService.getVehicleUpcomingMaintenance(vehiculeId)
      prochainsEntretiens.value = prochainsData.data || null
    } catch {
      prochainsEntretiens.value = null
    }

    // Load types
    const typesData = await typesEntretienService.getTypesEntretien()
    typesEntretien.value = (typesData as any).typesEntretien || typesData.data || []

    // Load dossiers
    try {
      const dossiersData = await dossiersTypesEntretienService.getDossiers()
      dossiers.value = dossiersData.dossiers || []
    } catch {
      dossiers.value = []
    }

    // Load entretiens avec pagination
    await loadEntretiens()
  } catch {
    messages.error('Erreur lors du chargement des données')
  } finally {
    loading.value = false
  }
}

const loadEntretiens = async () => {
  loadingEntretiens.value = true
  try {
    const vehiculeId = route.params.id as string
    const f = filterValues.value
    const searchParams: Record<string, unknown> = {
      page: pagination.value.page,
      size: pagination.value.size,
      sortBy: f.sortBy || 'dateEntretien',
      sortDirection: f.sortDirection || 'desc',
      vehiculeId: vehiculeId
    }

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
    messages.error('Erreur lors du chargement des entretiens')
  } finally {
    loadingEntretiens.value = false
  }
}

const goToPage = (page: number) => {
  pagination.value.page = page
  loadEntretiens()
}

const performSearch = () => {
  pagination.value.page = 0
  loadEntretiens()
}

const resetFilters = () => {
  filterValues.value = {
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
  loadEntretiens()
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

// Navigation
const goToVehicle = () => {
  router.push(`/vehicules/${route.params.id}`)
}

// Modal handlers
const openCreateModal = () => {
  isEditMode.value = false
  formData.value = {
    vehiculeId: route.params.id as string,
    typeEntretienId: '',
    dateEntretien: new Date().toISOString().split('T')[0] || '',
    kilometrage: null,
    cout: null,
    commentaire: ''
  }
  selectedFiles.value = []
  showEntretienModal.value = true
}

const openEditModal = async (entretien: EntretienDTO) => {
  isEditMode.value = true
  currentEntretien.value = entretien
  const dateStr = typeof entretien.dateEntretien === 'string'
    ? entretien.dateEntretien
    : entretien.dateEntretien?.toISOString() || ''
  formData.value = {
    vehiculeId: route.params.id as string,
    typeEntretienId: entretien.typeEntretien?.id || '',
    dateEntretien: dateStr.split('T')[0] || '',
    kilometrage: entretien.kilometrage ?? null,
    cout: entretien.cout ?? null,
    commentaire: entretien.commentaire || ''
  }
  showEntretienModal.value = true

  // Load existing files for this entretien
  if (entretien.id) {
    await loadEditModeFiles(entretien.id)
  }
}

const loadEditModeFiles = async (entretienId: string) => {
  loadingEditModeFiles.value = true
  try {
    const response = await entretiensService.getEntretienFiles(entretienId)
    editModeFiles.value = response.files || []
  } catch {
    editModeFiles.value = []
  } finally {
    loadingEditModeFiles.value = false
  }
}

const closeEntretienModal = () => {
  showEntretienModal.value = false
  currentEntretien.value = null
  selectedFiles.value = []
  editModeFiles.value = []
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

const confirmDeleteFile = (fileId: string) => {
  fileToDelete.value = fileId
  showDeleteFileModal.value = true
}

const executeDeleteFile = async () => {
  if (!fileToDelete.value) return
  if (!currentEntretien.value || !currentEntretien.value.id) return

  try {
    await entretiensService.deleteFile(fileToDelete.value)
    await loadEntretienFiles(currentEntretien.value.id)
    await loadEntretiens()
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

// Delete file in edit mode (within entretien modal)
const deleteEditModeFile = async (fileId: string) => {
  if (!currentEntretien.value?.id) return

  try {
    await entretiensService.deleteFile(fileId)
    editModeFiles.value = editModeFiles.value.filter(f => f.id !== fileId)
    messages.success('Fichier supprimé')
  } catch {
    messages.error('Erreur lors de la suppression du fichier')
  }
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

// PDF Viewer
const openPdfViewer = (file: EntretienFileDTO) => {
  currentPdfFile.value = file
  if (file.fileB64) {
    currentPdfUrl.value = `data:application/pdf;base64,${file.fileB64}`
  }
  showPdfViewer.value = true
}

const closePdfViewer = () => {
  showPdfViewer.value = false
  currentPdfFile.value = null
  currentPdfUrl.value = ''
}

// File utilities
const getFileIcon = (mimeType?: string): [string, string] => {
  if (!mimeType) return ['fas', 'file']
  if (mimeType.startsWith('image/')) return ['fas', 'file-image']
  if (mimeType === 'application/pdf') return ['fas', 'file-pdf']
  if (mimeType.includes('word')) return ['fas', 'file-word']
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return ['fas', 'file-excel']
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return ['fas', 'file-powerpoint']
  if (mimeType.startsWith('video/')) return ['fas', 'file-video']
  if (mimeType.startsWith('audio/')) return ['fas', 'file-audio']
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar') || mimeType.includes('compressed')) return ['fas', 'file-archive']
  if (mimeType.startsWith('text/')) return ['fas', 'file-alt']
  return ['fas', 'file']
}

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

// Valider un entretien directement
const validerEntretien = (typeEntretien: TypeEntretienDTO | undefined) => {
  if (!vehicule.value || !vehicule.value.id || !typeEntretien || !typeEntretien.id) {
    messages.error('Informations véhicule ou type d\'entretien manquantes')
    return
  }

  validationData.value = {
    typeEntretien,
    typeEntretienNom: typeEntretien.nom || ''
  }
  showValidateModal.value = true
}

const executeValiderEntretien = async () => {
  const { typeEntretien } = validationData.value
  if (!vehicule.value || !vehicule.value.id || !typeEntretien || !typeEntretien.id) return

  try {
    const today = new Date()
    const isoDate = `${today.toISOString().split('T')[0]}T12:00:00`

    const dataToSend = {
      vehiculeId: vehicule.value.id,
      typeEntretienId: typeEntretien.id,
      dateEntretien: isoDate,
      kilometrage: vehicule.value.latestKm || 0,
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
    typeEntretien: null,
    typeEntretienNom: ''
  }
}

// CRUD operations
const submitEntretien = async () => {
  submitting.value = true
  try {
    const dateObj = new Date(formData.value.dateEntretien)
    const isoDate = dateObj.toISOString().replace('Z', '+01:00')

    if (isEditMode.value && currentEntretien.value && currentEntretien.value.id) {
      const dataToUpdate = {
        typeEntretienId: formData.value.typeEntretienId,
        dateEntretien: isoDate,
        kilometrage: formData.value.kilometrage ?? undefined,
        cout: formData.value.cout ?? undefined,
        commentaire: formData.value.commentaire
      }
      await entretiensService.updateEntretien(currentEntretien.value.id, dataToUpdate)

      // Upload new files if any were selected
      if (selectedFiles.value.length > 0) {
        for (const file of selectedFiles.value) {
          await entretiensService.addFile(currentEntretien.value.id, {
            fileB64: file.base64,
            originalName: file.file.name,
            mimeType: file.file.type
          })
        }
      }

      messages.success('Entretien modifié avec succès')
    } else {
      const files = selectedFiles.value.map(f => ({
        fileB64: f.base64,
        originalName: f.file.name,
        mimeType: f.file.type
      }))

      const dataToSend = {
        vehiculeId: route.params.id as string,
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
    await loadData()
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
    await loadData()
  } catch {
    messages.error('Erreur lors de la suppression de l\'entretien')
  }
}

// Gestion des configurations d'entretien
const loadConfigurations = async () => {
  const vehiculeId = route.params.id as string
  if (!vehiculeId) return

  loadingConfigurations.value = true
  try {
    const response = await vehiculesTypesEntretienService.getByVehiculeId(vehiculeId)
    configurationsEntretien.value = (response as any).vehiculeTypesEntretien || response.data || []
  } catch {
    configurationsEntretien.value = []
  } finally {
    loadingConfigurations.value = false
  }
}

const openConfigModal = () => {
  configToEdit.value = null
  showConfigModal.value = true
}

const openEditConfigModal = (config: VehiculeTypeEntretienDTO) => {
  configToEdit.value = config
  showConfigModal.value = true
}

const handleConfigSaved = async () => {
  await loadConfigurations()
  await loadData()
}

const confirmDeleteConfig = (configId: string) => {
  configToDelete.value = configId
  showDeleteConfigModal.value = true
}

const cancelDeleteConfig = () => {
  showDeleteConfigModal.value = false
  configToDelete.value = null
}

const executeDeleteConfig = async () => {
  if (!configToDelete.value) return

  try {
    await vehiculesTypesEntretienService.delete(configToDelete.value)
    messages.success('Configuration supprimée avec succès')
    showDeleteConfigModal.value = false
    configToDelete.value = null
    await loadConfigurations()
    await loadData()
  } catch {
    messages.error('Erreur lors de la suppression de la configuration')
  }
}

const formatPeriodicite = (config: VehiculeTypeEntretienDTO): string => {
  if (!config.periodiciteValeur) return ''
  if (config.periodiciteType === 'TEMPOREL') {
    const jours = config.periodiciteValeur
    if (jours >= 365) {
      const annees = Math.floor(jours / 365)
      const resteJours = jours % 365
      if (resteJours === 0) return `${annees} an${annees > 1 ? 's' : ''}`
      return `${annees} an${annees > 1 ? 's' : ''} et ${resteJours} jour${resteJours > 1 ? 's' : ''}`
    }
    if (jours >= 30) {
      const mois = Math.floor(jours / 30)
      return `${mois} mois`
    }
    return `${jours} jour${jours > 1 ? 's' : ''}`
  }
  return `${config.periodiciteValeur.toLocaleString('fr-FR')} km`
}

// Lifecycle
onMounted(() => {
  loadData()
  loadConfigurations()
})
</script>
