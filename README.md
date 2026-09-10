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

## Deploiement

Le deploiement se fait via `deploy/deploy.py` (script local ignore par git, il contient les acces SSH) :

```bash
pip install paramiko

python deploy/deploy.py            # bump patch + build + upload SSH
python deploy/deploy.py --minor    # bump minor (ou --major)
python deploy/deploy.py --no-bump  # redeploie la version courante (sans bump ni tag)
python deploy/deploy.py --no-git   # bump + deploiement, sans commit ni tag
python deploy/deploy.py --dry-run  # build + etat distant, sans rien modifier
```

Flux conseille : committer le travail, lancer le script, puis `git push --follow-tags`.

### Versionning

- `package.json` est la source unique de la version (semver `X.Y.Z`).
- `deploy/deploy.py` incremente la version, lance le build, deploie, verifie le site en ligne
  (version servie + en-tetes de cache), puis cree le commit `chore: bump version X.Y.Z` et le
  tag annote `vX.Y.Z` (sans push). En cas d'echec avant la mise en ligne, le bump est annule
  et le site distant restaure depuis son backup.
- Vite injecte la version dans le bundle (`__APP_VERSION__`, voir `src/config/version.ts`) et
  ecrit `dist/version.json` (`version`, `buildTime`, `commit`).
- Cote client, `useVersionCheck` compare la version du bundle a `/version.json` au chargement,
  au retour au premier plan, au focus, au retour en ligne, a chaque navigation et toutes les
  5 minutes (au plus une verification par minute). Au chargement, l'application se recharge
  d'elle-meme si elle est perimee ; ensuite un bandeau propose la mise a jour. La version qui
  tourne est affichee dans le menu avatar.
- Le serveur doit servir `index.html` et `version.json` sans cache navigateur : directives
  Apache dans `deploy/apache-cache-headers.conf`, installees sur le VPS par
  `python deploy/install_apache_headers.py` (idempotent, `--dry-run` disponible) et verifiees
  par `deploy.py` apres chaque deploiement.
- Le popup « Nouveautes » (`src/data/changelog.ts`) est independant de la version deployee :
  il s'affiche quand une nouvelle entree est ajoutee a ce fichier.

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
