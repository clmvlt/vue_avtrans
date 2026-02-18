# Vue Pointage - AVTRANS

Application web de gestion du personnel et de la flotte vehicules pour AVTRANS.

## Fonctionnalites

- **Pointage** : Suivi des heures de travail des employes
- **Planning** : Visualisation et gestion des plannings
- **Absences** : Gestion des conges et absences
- **Acomptes** : Gestion des avances sur salaire
- **Vehicules** : Gestion de la flotte (fiches, kilometrages, documents)
- **Entretiens** : Suivi de la maintenance des vehicules
- **Signatures** : Validation des feuilles d'heures
- **Notifications** : Alertes en temps reel
- **Export** : Generation de rapports PDF et Excel

## Stack technique

- **Frontend** : Vue 3 (Composition API) + TypeScript
- **Build** : Vite 7
- **UI** : shadcn-vue + Tailwind CSS v4
- **State** : Pinia
- **Routing** : Vue Router
- **Cartes** : Mapbox GL
- **Graphiques** : Chart.js + vue-chartjs
- **Icons** : Lucide Vue

## Installation

```bash
# Cloner le projet
git clone https://github.com/clmvlt/vue_avtrans.git
cd vue_avtrans

# Installer les dependances
npm install

# Copier le fichier d'environnement et configurer
cp .env.example .env.development
# Editer .env.development avec vos valeurs
```

## Configuration

Creer un fichier `.env.development` (ou `.env.production`) a partir de `.env.example` :

```env
VITE_API_URL=http://localhost:8081/
VITE_MAPBOX_TOKEN=votre_token_mapbox
```

## Commandes

```bash
# Serveur de developpement (http://localhost:5173)
npm run dev

# Verification TypeScript
npm run type-check

# Build production
npm run build

# Apercu du build
npm run preview
```

## Structure du projet

```
src/
├── api/            # Client API (fetch + interceptors JWT)
├── components/     # Composants reutilisables (shadcn-vue + domaine)
├── composables/    # Logique reutilisable (hooks Vue)
├── config/         # Configuration (API, cartes, navigation)
├── enums/          # Enumerations TypeScript
├── models/         # Interfaces / DTOs
├── router/         # Routes + guards d'authentification
├── services/       # Services API (un par domaine)
├── stores/         # Stores Pinia (auth)
├── styles/         # Tailwind CSS + theme
├── types/          # Types utilitaires
├── utils/          # Fonctions utilitaires
└── views/          # Pages organisees par domaine
```
