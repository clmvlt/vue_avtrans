# Audit SEO — landing page `pointage.avtrans-concept.com`

Date : 10 septembre 2026. Périmètre : la landing (`/`) et la page de connexion (`/login`),
seules pages ouvertes aux moteurs de recherche. Tout le reste de l'application est fermé
au crawl (voir `public/robots.txt`).

## 1. Constats avant correction

| # | Constat | Gravité | Impact |
|---|---------|---------|--------|
| 1 | `canonical`, `og:url`, `og:image`, JSON-LD et `Sitemap:` pointaient sur `https://app.avtrans-concept.com`, un hôte qui **ne résout pas** | Critique | Google considère la page comme une copie d'une URL inexistante : indexation instable ou nulle, aperçus sociaux cassés |
| 2 | SPA Vue sans pré-rendu : `index.html` livré vide (`<div id="app"></div>`) | Critique | Le contenu n'existe qu'après exécution du JS. Google le rend avec retard (file d'attente de rendu), Bing/réseaux sociaux/assistants IA ne voient rien |
| 3 | `robots.txt` en liste noire (30 `Disallow`) et sitemap listant `/register` et `/download` | Moyenne | Toute nouvelle route est crawlable par défaut ; des pages sans intérêt sont proposées à l'indexation |
| 4 | Titre de 88 caractères, description de 240 caractères, balise `meta keywords` bourrée de 21 expressions | Moyenne | Titre et description tronqués dans les résultats ; `keywords` est ignoré par Google et signal de spam chez Bing |
| 5 | Images : `expertise-image.jpg` 3,0 Mo, `locaux.jpg` 1,6 Mo (image LCP du hero), `porteur.png` 1,0 Mo, `master.png` 0,7 Mo, sans `width`/`height` | Haute | Core Web Vitals dégradés (LCP > 4 s sur mobile, CLS) — critère de classement |
| 6 | Les 8 icônes PWA étaient le même fichier 1024 px de 185 Ko ; favicon de 185 Ko ; `manifest.json` et `apple-touch-icon` en chemins relatifs (cassés sur `/users/xxx`) | Basse | Poids inutile, manifest invalide sur les routes imbriquées |
| 7 | Image Open Graph = logo carré 512 px, `twitter:card` = `summary` | Moyenne | Aperçus de partage (WhatsApp, LinkedIn, Facebook) pauvres |
| 8 | `/login` et toutes les autres vues portaient le titre, la description et la canonique de la landing | Haute | `/login` vue comme un doublon de `/` (canonique) ; `/register`, `/forgot-password`, 404… indexables → soft 404 |
| 9 | Navigation en `<button>` (aucun lien d'ancre crawlable), pas de `<main>`, `<h4>` dans le footer sans `<h3>`, bouton menu mobile sans `aria-label` | Basse | Structure sémantique et accessibilité perfectibles |
| 10 | JSON-LD (LocalBusiness, WebSite, WebPage) injecté uniquement en JS, avec le mauvais domaine ; `BreadcrumbList` à un seul élément | Moyenne | Données structurées invisibles sans JS, `@id` incohérents |
| 11 | Aucun contenu « longue traîne » (FAQ) | Basse | Peu de prise sur les requêtes conversationnelles (« coursier urgent Saint-Brieuc », « transport palette Lamballe ») |
| 12 | `author` = « AVTRANS Concept SARL » alors que les mentions légales indiquent une EURL | Basse | Incohérence d'entité |

## 2. Corrections apportées

| Sujet | Fichier(s) | Détail |
|-------|------------|--------|
| Domaine | `index.html`, `src/config/seo.ts`, `vite.config.js` | Toutes les URL absolues sur `https://pointage.avtrans-concept.com` |
| Pré-rendu | `scripts/prerender.cjs`, `package.json` (`build`, `prerender`) | Après `vite build`, la landing est ouverte dans Edge/Chrome headless (CDP natif, aucune dépendance npm) ; le HTML rendu (58 Ko : h1, 5 h2, 7 images, FAQ, footer) est injecté dans `dist/index.html` et ses variantes `.gz`/`.br`. Un script inline vide le conteneur sur les autres routes et signale à `Landing.vue` que le contenu est déjà affiché (pas de clignotement des animations `.reveal`). Sans navigateur, le build reste valide avec un avertissement (`PRERENDER_STRICT=1` pour bloquer) |
| robots.txt | `public/robots.txt` | Liste blanche : `Allow: /$`, `Allow: /login$`, ressources statiques autorisées (`/assets/`, `/icons/`, `/.well-known/`…), `Disallow: /` pour le reste, robots SEO tiers bloqués, `Sitemap:` corrigé |
| Sitemap | `vite.config.js` (`sitemapPlugin`) | Généré au build avec `/` et `/login` uniquement, `lastmod` = date du dernier commit des fichiers de la page ; `public/sitemap.xml` statique supprimé |
| Balises | `index.html` | Titre 62 caractères, description 156 caractères, `keywords` supprimé, `author` corrigé, OG/Twitter avec image 1200×630 (`public/og-image.jpg`), `summary_large_image`, `og:image:alt` |
| Données structurées | `index.html`, `src/views/landing/Landing.vue` | `LocalBusiness` (+ `legalName`, `vatID`, `contactPoint`, catalogue de 5 services) et `WebSite` en statique dans `<head>` ; `WebPage` + `FAQPage` injectés par la landing, reliés par `@id` |
| Images | `src/assets/images/*.webp`, `src/assets/logo.png` | WebP : hero 1600 px 282 Ko + variante 800 px 66 Ko en `srcset` (`fetchpriority="high"`), à-propos 224 Ko, fourgon 52 Ko, porteur 100 Ko ; logo 128 px 8 Ko ; `width`/`height`/`loading="lazy"`/`decoding="async"` partout. Anciens JPG/PNG supprimés (−6,4 Mo) |
| Icônes | `public/icons/*`, `public/favicon*.{ico,png}` | Icônes PWA aux vraies tailles (4 à 46 Ko), favicon ICO 16/32/48 + PNG, `apple-touch-icon` 180 px, chemins absolus |
| Métadonnées par page | `src/composables/usePageMeta.ts` + vues publiques | `/login` : titre, description et canonique propres (indexable). `noindex` sur inscription, mot de passe oublié, vérification, réinitialisation, inscription Google, téléchargement, non autorisé, 404 et pages légales (qui utilisaient un code ad hoc) |
| Sémantique | `Landing.vue` | `<main>`, `<nav aria-label>`, liens d'ancre `href="#…"` (défilement doux conservé), logo cliquable vers `/`, `aria-expanded`/`aria-controls` sur le menu mobile, `aria-labelledby` sur les sections, footer en `<h3>`, `rel="nofollow"` sur Inscription / Application mobile |
| Contenu | `Landing.vue` | Section FAQ (5 questions en `<details>` natif, indexable sans JS) reprenant uniquement des faits déjà présents sur la page, entrée « FAQ » dans la navigation |
| Thème | `index.html`, `Landing.vue` | Le script anti-FOUC n'applique plus `.dark` sur `/` (le HTML pré-rendu est en clair) ; la landing relit la préférence pour la restaurer en partant |

Vérifications : `npm run type-check` OK, `npm run build` OK (pré-rendu réussi), captures d'écran de `dist/` avec et sans JavaScript, page de connexion intacte, aucune erreur console.

## 3. À faire hors code (actions à mener après déploiement)

1. **Déployer** (`python deploy/deploy.py`) puis contrôler : `curl -s https://pointage.avtrans-concept.com/ | grep -c "<h1"` doit renvoyer `1` ; `curl https://pointage.avtrans-concept.com/robots.txt` et `/sitemap.xml`.
2. **Google Search Console** : ajouter la propriété `pointage.avtrans-concept.com`, soumettre `sitemap.xml`, lancer « Inspection de l'URL » sur `/` puis « Demander l'indexation ». Vérifier le rendu dans « Tester la page en ligne ».
3. **Test des résultats enrichis** (search.google.com/test/rich-results) sur `/` : `LocalBusiness`, `WebSite`, `WebPage`, `FAQPage` doivent être détectés sans erreur.
4. **Aperçus sociaux** : valider `og-image.jpg` avec le débogueur de partage Facebook et l'inspecteur LinkedIn (les caches de partage sont à purger après déploiement).
5. **Bing Webmaster Tools** : importer la propriété depuis la Search Console, soumettre le sitemap.
6. **Fiche Google Business Profile** : c'est le levier n° 1 pour « coursier Saint-Brieuc » / « transport Lamballe ». Renseigner l'URL de la landing, la catégorie (Service de coursier / Entreprise de transport), les photos (locaux, flotte), les horaires, et garder l'adresse strictement identique à celle des mentions légales (ZA de Pommeret, 22120 Hillion). Collecter des avis clients.
7. **Arbitrer les deux sites** : `avtrans-concept.com` (autre serveur, titre « Transport International à Saint-Brieuc ») et `pointage.avtrans-concept.com` se disputent les mêmes requêtes de marque. Recommandation : une seule vitrine canonique — soit rediriger en 301 l'ancien site vers la landing, soit héberger la landing sur le domaine racine et n'utiliser `pointage.` que pour l'application. En attendant, les deux se référencent mutuellement (`sameAs`, lien « Site vitrine »).
8. **Liens entrants locaux** : annuaires professionnels (Pages Jaunes, Kompass, CCI Côtes-d'Armor, Bretagne Supply Chain), partenaires et clients, avec l'URL canonique exacte.
9. **Apache** : conserver `Cache-Control: no-cache, must-revalidate` sur `index.html` (déjà en place) pour que le nouveau contenu pré-rendu soit pris à chaque déploiement ; vérifier que les variantes `.br`/`.gz` servies sont bien celles régénérées.

## 4. Pistes d'amélioration ultérieures

- Le bundle d'entrée pré-charge le chunk `pdfjs` (87 Ko gzip) sur la landing alors qu'il ne sert qu'aux pages authentifiées : revoir `manualChunks` ou rendre l'import de `usePdfPreview` dynamique.
- Le `preconnect` vers `api.mapbox.com` dans `index.html` est inutile sur la landing.
- Ajouter une photo réelle du chauffeur / d'une livraison pour la section « À propos » (texte alternatif plus descriptif possible).
- Si le nombre de pages publiques augmente (pages par ville, par service), passer à un pré-rendu multi-routes : `scripts/prerender.cjs` ne traite que `/` pour l'instant.
