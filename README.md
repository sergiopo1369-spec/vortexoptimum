# Vortexoptim — site vitrine

Agence digitale & ingénierie IA de proximité — Reims & Grand Est.
Implémentation du **cahier des charges maître v2** ([`docs/cahier-des-charges.md`](docs/cahier-des-charges.md)).

Livraison en cours : **frontend statique** (site complet). Le backend (mini-CRM,
capture de formulaires, paiement, agent IA) est spécifié mais hors périmètre de
cette phase — les formulaires pointent vers WhatsApp / e-mail.

## Stack

| Couche | Choix |
|---|---|
| Framework | [Astro](https://astro.build) 5 (statique) |
| Styles | Tailwind CSS 4 (`@tailwindcss/vite`) + design tokens dans `src/styles/global.css` |
| Contenu blog | Content Collections (`src/content/blog/*.md`) |
| Tests | Vitest (`tests/`) |
| Médias hero | générés par `ffmpeg-static` (`npm run media`) |

## Démarrage

```bash
npm install
npm run media      # génère public/media/hero.{mp4,webm} + hero-poster.jpg
npm run dev        # http://localhost:4321
```

## Scripts

| Commande | Effet |
|---|---|
| `npm run dev` | serveur de dev |
| `npm run build` | build statique dans `dist/` |
| `npm run preview` | sert le build |
| `npm run check` | `astro check` (types + diagnostics Astro) |
| `npm test` | tests Vitest (non-régression tarifaire — §5.2 / §11) |
| `npm run verify` | `astro check` + tests, à lancer avant chaque mise en production |
| `npm run media` | (re)génère les médias du hero ; `-- --force` pour ignorer le cache |

## Architecture

```
src/
  config/
    site.ts       identité, canaux de contact, navigation  ← À COMPLÉTER (SIRET, domaine, e-mail…)
    pricing.ts    grille tarifaire §4 — SOURCE DE VÉRITÉ unique
  lib/
    quote.ts      moteur de calcul de devis PUR (partagé navigateur + tests)
  layouts/        BaseLayout (SEO, JSON-LD, cookies) · LegalLayout
  components/     Hero (vidéo différée) · QuoteCalculator · PackCard · CookieConsent · …
  content/blog/   6 articles (§10)
  pages/          index · offres · devis · blog/ · mentions-legales · politique-de-confidentialite · cgv · 404
```

### Points clés de conformité au cahier des charges

- **Délai 24–48h** : formulé partout comme *mise en ligne technique à réception des
  contenus validés* (clause §2.2), jamais comme délai sec.
- **Budget de performance §6.2** : rendu statique, CSS inliné (`inlineStylesheets`),
  vidéo hero chargée **après** le `load`, jamais dans le LCP ; respect de
  `prefers-reduced-motion` et `navigator.connection.saveData`.
- **RGPD §7** : bandeau de consentement **opt-in** (`CookieConsent.astro`, aucun
  cookie non essentiel avant accord), pages mentions légales / confidentialité / CGV,
  registre des sous-traitants et durées de conservation dans la politique.
- **Contrastes §5.3** : palette sombre avec teintes de *texte* dédiées (`--color-*-text`)
  visant WCAG AA ; les teintes vives ne servent qu'au décor.
- **Calculateur §5.2** : logique pure `computeQuote`, testée en non-régression contre
  la grille §4 (`tests/pricing.test.ts`).
- **SEO §10** : `sitemap`, `robots.txt`, JSON-LD `ProfessionalService` global +
  `BlogPosting` par article, métadonnées Open Graph.

## Avant mise en production — reste à faire

1. **Identité** (`src/config/site.ts` + `astro.config.mjs`) : raison sociale, forme
   juridique, SIRET, adresse, e-mail professionnel, domaine définitif, lien Cal.com,
   URL de la fiche Google Business.
2. **Mentions légales / confidentialité** : remplacer tous les blocs `⟨à compléter⟩`
   (hébergeur, directeur de publication, responsable de traitement).
3. **Images conceptuelles du blog** (§10) : remplacer les couvertures dégradées
   (`PostCover.astro`) par les visuels finaux + Open Graph image par article.
4. **Backend** (phase suivante) : mini-CRM PocketBase/Supabase (schéma §8),
   endpoint de capture des formulaires, Stripe, Cal.com, agent IA.
5. **Recette** : exécuter le plan de tests §11 (Lighthouse mobile ≥ 90, cross-browser
   dont iOS Safari, RGPD) et consigner le rapport (§15).
6. **CGV** : validation par un conseil juridique.

## Fichiers sources non applicatifs

- `docs/cahier-des-charges.md` — le cahier des charges maître.
- `assets-src/` — rushes vidéo 3D d'origine. Seul `hero-source.mp4` est versionné
  (reproductibilité de `npm run media`). Le reste est ignoré par git.
