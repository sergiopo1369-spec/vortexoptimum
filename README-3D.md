# Boutique privée `/3d`

Section **indépendante** du site : layout propre (`src/layouts/Layout3D.astro`),
aucun lien depuis la nav / le footer / le sitemap, `noindex, nofollow` +
`Disallow: /3d` dans `robots.txt`.

## État actuel : protection **client-side** (dissuasive)

Le site est en rendu **100 % statique** (`output: static`, aucun adapter serveur).
Le gate de `/3d` est donc vérifié **dans le navigateur** :

- mot de passe → `SHA-256` → comparé au hash `PUBLIC_SHOP_3D_HASH` (variable d'env,
  jamais de mot de passe en clair dans le code) ;
- déverrouillage mémorisé en `sessionStorage` ;
- 5 échecs → blocage 60 s (contournable par rechargement — friction, pas sécurité).

### Limite à connaître

Le HTML de la page (structure + placeholders) est **téléchargeable** par qui
connaît l'URL, avant toute vérification. Le hash est présent dans le JS livré
(brute-force / dictionnaire possible). **Ne mettez aucune donnée réellement
confidentielle** tant que l'option ci-dessous n'est pas activée. Aujourd'hui
la page ne contient que des placeholders — aucun produit, prix ou description réel.

## Passer à une vraie protection (au déploiement)

Choisir **une** des deux options selon l'hébergeur retenu :

### A. Auth au niveau hébergeur (le plus simple)

- **Netlify** : `[[headers]]` + plugin `netlify-plugin-http-auth`, ou
  Netlify Identity, ou un simple `_headers` avec Basic-Auth selon le plan.
- **Cloudflare Pages** : **Cloudflare Access** (Zero Trust) sur le chemin `/3d*`
  → e-mail à usage unique / SSO, zéro code.
- **Vercel** : `vercel.json` `"headers"` + une fonction edge de Basic-Auth,
  ou Vercel Authentication (préviews) / un middleware.

La page `/3d` reste telle quelle ; l'hébergeur bloque la requête en amont.

### B. Rendu serveur Astro

Ajouter `@astrojs/node` (ou `@astrojs/vercel` / `@astrojs/netlify`),
`output: 'server'`, un `src/middleware.ts` qui protège `/3d/*` :
cookie de session signé (HMAC `SESSION_SECRET`, `httpOnly` + `Secure` +
`SameSite=Strict`), comparaison `crypto.timingSafeEqual`, rate-limit par IP.
⚠️ change le mode de déploiement (runtime Node/serverless requis, plus de
simple dossier `dist/`).

## Configuration

```bash
cp .env.example .env
# éditer .env : PUBLIC_SHOP_3D_HASH = SHA-256 de votre mot de passe
node -e "console.log(require('crypto').createHash('sha256').update('VOTRE_MDP').digest('hex'))"
```

Sans `PUBLIC_SHOP_3D_HASH`, le gate refuse tout (fail-closed).
