# Branchement de l'assistant WhatsApp — marche à suivre

Tout le code est écrit et déployé avec le site : la fonction serverless
[`api/whatsapp.ts`](../../api/whatsapp.ts) reçoit les messages WhatsApp, appelle
Claude avec [`prompt-systeme.md`](./prompt-systeme.md), archive la fiche prospect
dans Notion et t'alerte sur ton propre WhatsApp.

**Il ne reste qu'à créer les comptes et à coller cinq valeurs dans Vercel.**
Ce document est la liste complète, dans l'ordre. Compter 45 minutes la première
fois, dont une attente de vérification côté Meta.

> Rien n'est actif tant que l'étape 5 n'est pas faite : tant que le webhook n'est
> pas enregistré chez Meta, la fonction est déployée mais personne ne l'appelle.

---

## Ce qu'il faut avoir sous la main

| Il faut | Où | Coût |
|---|---|---|
| Un compte Meta Business (Facebook Business Manager) | business.facebook.com | gratuit |
| Un numéro de téléphone **qui n'est pas déjà un compte WhatsApp** | carte SIM ou numéro fixe joignable | — |
| Un compte Anthropic avec du crédit | console.anthropic.com | à l'usage, quelques centimes par conversation |
| Le projet déjà déployé sur Vercel | vercel.com | gratuit (offre Hobby) |
| *(facultatif)* Un compte Notion | notion.so | gratuit |

⚠️ **Le numéro utilisé pour le WhatsApp Business API ne peut plus servir dans
l'application WhatsApp normale.** Ne pas utiliser son numéro personnel : prendre
une seconde carte SIM, ou un numéro fixe (Meta appelle pour dicter le code).

---

## 1. Créer l'application Meta

1. Aller sur [developers.facebook.com/apps](https://developers.facebook.com/apps) → **Créer une application**.
2. Cas d'usage : **Autre** → type : **Entreprise** → associer le portefeuille Business.
3. Dans le tableau de bord de l'app : **Ajouter un produit** → **WhatsApp** → *Configurer*.
4. Meta crée automatiquement un numéro de test. Il sert à tout tester avant
   d'enregistrer le vrai numéro (étape 6).

Noter tout de suite deux valeurs :

- **Clé secrète de l'application** : Paramètres de l'app → *Général* → *Clé secrète*
  → *Afficher*. → variable `META_APP_SECRET`
- **Identifiant du numéro de téléphone** (« Phone number ID ») : WhatsApp → *Configuration de l'API*.
  C'est un long nombre, **ce n'est pas le numéro de téléphone**. → variable `WHATSAPP_PHONE_NUMBER_ID`

### 1 bis. Travailler avec le numéro de test (phase de développement)

Le numéro de test fourni par Meta permet de tout valider sans engager le numéro
professionnel. Trois contraintes à connaître :

- **Il ne peut écrire qu'à des numéros déclarés.** WhatsApp → *Configuration de
  l'API* → champ **À** → *Gérer la liste de numéros* → ajouter jusqu'à 5 numéros,
  chacun confirmé par un code SMS. **Y inclure `TEAM_WHATSAPP_NUMBER`**, sinon
  l'alerte lead part en erreur (journalisée, sans casser la réponse au prospect).
- **Il ne reçoit que des messages venant de ces mêmes numéros.**
- **Il change d'identifiant** le jour où le vrai numéro est enregistré (étape 6) :
  `WHATSAPP_PHONE_NUMBER_ID` est à remplacer à ce moment-là.

Le jeton temporaire affiché sur cette page suffit pour le premier essai, mais il
**expire au bout de 24 heures**. Dès que le premier aller-retour fonctionne,
passer au jeton permanent de l'étape 2 : c'est la même variable `WHATSAPP_TOKEN`.

## 2. Créer un jeton d'accès **permanent**

Le jeton affiché sur la page de configuration expire au bout de 24 heures : il
n'est bon que pour un essai. Pour le jeton définitif :

1. [business.facebook.com/settings](https://business.facebook.com/settings) →
   *Utilisateurs* → **Utilisateurs système** → **Ajouter**.
2. Nom : `assistant-whatsapp`, rôle : **Administrateur**.
3. Sur cet utilisateur système : **Ajouter des ressources** → *Applications* →
   l'app créée à l'étape 1 → cocher **Gérer l'application**.
4. **Générer un nouveau token** → choisir l'app → cocher les autorisations
   `whatsapp_business_messaging` et `whatsapp_business_management` → *Expiration : jamais*.
5. Copier le jeton **immédiatement** : il n'est plus jamais affiché.
   → variable `WHATSAPP_TOKEN`

## 3. Récupérer la clé Anthropic

[console.anthropic.com](https://console.anthropic.com) → *API keys* → **Create key**.
Copier la valeur (`sk-ant-…`). → variable `ANTHROPIC_API_KEY`

Créditer le compte dans *Billing* : sans crédit, l'agent répond le message de
repli et l'équipe reçoit une alerte de panne.

## 4. Renseigner les variables dans Vercel

Vercel → le projet → *Settings* → *Environment Variables*. Pour chacune :
environnements **Production, Preview et Development** cochés.

**Déjà en place** (posées le 11/09/2026, rien à faire) : `META_VERIFY_TOKEN`,
`WHATSAPP_GRAPH_VERSION`, `ANTHROPIC_MODEL`, `ANTHROPIC_EFFORT`,
`NOTION_DATABASE_ID`, `TEAM_WHATSAPP_NUMBER` (= `33758187675`).
Les relire à tout moment : `npx vercel env ls production`.

**Restent à poser**, parce qu'elles viennent d'un compte tiers :

| Variable | Valeur |
|---|---|
| `META_APP_SECRET` | étape 1 |
| `WHATSAPP_TOKEN` | étape 2 (ou le jeton temporaire de l'étape 1 bis pour le premier essai) |
| `WHATSAPP_PHONE_NUMBER_ID` | étape 1 |
| `ANTHROPIC_API_KEY` | étape 3 |

Par l'interface, ou en ligne de commande — la valeur est demandée dans le
terminal et ne transite nulle part ailleurs :

```bash
npx vercel env add META_APP_SECRET production
```

Puis **Storage** → *Create Database* → **Redis** (Upstash, offre gratuite) →
*Connect to project*. Vercel injecte les variables tout seul : rien à recopier.
Selon l'intégration, elles s'appellent `KV_REST_API_URL` / `KV_REST_API_TOKEN`
ou `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — le code accepte les
deux jeux de noms, aucune importance.

> Sans Redis la fonction marche quand même, mais elle perd la mémoire entre deux
> messages — l'agent redemande le nom à chaque phrase. C'est donc obligatoire en
> pratique.

Redéployer (*Deployments* → dernier déploiement → *Redeploy*) : les variables ne
sont lues qu'au déploiement.

## 5. Enregistrer le webhook chez Meta

Dans l'app Meta : **WhatsApp** → *Configuration* → section **Webhook** → *Modifier*.

- **URL de rappel** : `https://www.vortexoptim.fr/api/whatsapp`
- **Jeton de vérification** : exactement la valeur mise dans `META_VERIFY_TOKEN`

Cliquer **Vérifier et enregistrer**. Meta appelle l'URL en `GET` ; la fonction lui
renvoie le défi. Si le bouton refuse : la variable n'est pas identique, ou le
redéploiement de l'étape 4 n'a pas eu lieu.

> **À vérifier avant de cliquer**, pour savoir de quel côté est le problème :
> ouvrir dans un navigateur
> `https://www.vortexoptim.fr/api/whatsapp?hub.mode=subscribe&hub.verify_token=LE_JETON&hub.challenge=bonjour`
> La page doit afficher `bonjour`, et rien d'autre. Si elle affiche une erreur de
> jeton, c'est Vercel ; si elle n'existe pas, la fonction n'est pas déployée.

Puis, juste en dessous : **Gérer** → s'abonner au champ **`messages`**.
*(Ne pas s'abonner à tous les champs : le reste est du bruit.)*

**Test immédiat** : depuis un téléphone personnel, écrire au numéro de test Meta.
L'agent doit répondre en quelques secondes. En cas de silence, Vercel →
*Deployments* → *Functions* → `api/whatsapp` → *Logs*.

## 6. Enregistrer le vrai numéro

WhatsApp → *Configuration de l'API* → **Ajouter un numéro de téléphone** → saisir
le numéro professionnel → recevoir le code par SMS ou par appel → valider.

⚠️ **Le `WHATSAPP_PHONE_NUMBER_ID` change** : c'est celui du nouveau numéro. Le
remplacer dans Vercel et redéployer.

Renseigner aussi, dans le gestionnaire WhatsApp : nom affiché, description,
catégorie, logo. Meta valide le nom affiché sous quelques heures.

## 7. Sortir du mode développement

Tant que l'app est en **développement**, l'agent ne peut écrire qu'aux numéros
inscrits comme testeurs. Pour ouvrir à tout le monde : tableau de bord de l'app →
bascule **Développement → En ligne**. Cela demande une vérification de l'entreprise
(Business Verification : Kbis, justificatif d'adresse, site web) — compter quelques
jours côté Meta.

**Ne pas ouvrir le canal au public avant d'avoir passé les 8 scénarios de recette
du [README](./README.md) §4.**

## 8. *(facultatif)* Archivage Notion

La base **« Prospects — Assistant WhatsApp »** est **déjà créée** dans l'espace
Notion, avec les 21 colonnes exactes attendues par le code (11/09/2026) :
<https://app.notion.com/p/258f63d359f444589c63840f3c8e720e>

Elle est pour l'instant une page privée : la déplacer dans l'espace d'équipe si
elle doit être partagée.

1. [notion.so/my-integrations](https://www.notion.so/my-integrations) → **New integration**
   → nom `Vortexoptimum CRM` → copier le *Internal Integration Secret* (`ntn_…`).
   → variable `NOTION_TOKEN`
2. Ouvrir la base → menu `⋯` → *Connexions* → ajouter `Vortexoptimum CRM`.
   **Sans cette autorisation, l'intégration ne voit pas la base** et Notion
   répond « object not found » : c'est l'oubli le plus fréquent.
3. → variable `NOTION_DATABASE_ID` = `258f63d359f444589c63840f3c8e720e`

Ne jamais renommer une colonne sans la renommer aussi dans
[`api/_lib/notion.ts`](../../api/_lib/notion.ts) : Notion refuse la page entière
si une propriété manque.

Redéployer. Sans ces deux variables, l'agent répond et alerte l'équipe
normalement : seul l'archivage CRM est sauté.

---

## Ce qui se passe ensuite, sans rien faire

À chaque message reçu :

1. La signature Meta est vérifiée — une requête non signée est rejetée.
2. Le message est dédoublonné (Meta réémet tant qu'il n'a pas de réponse).
3. L'historique du numéro est relu dans Redis, le message y est ajouté.
4. Claude répond avec le prompt système ; le bloc `FICHE_PROSPECT` est **retiré**
   avant l'envoi au prospect (il contient les notes internes).
5. Si une fiche est présente : page Notion créée ou mise à jour, et alerte
   WhatsApp envoyée sur `TEAM_WHATSAPP_NUMBER`.
6. En cas de panne : le prospect reçoit un message de repli, l'équipe une alerte.

**Sans consentement RGPD explicite, la fonction efface elle-même nom, enseigne,
téléphone et e-mail avant tout enregistrement** — la règle n'est pas seulement
demandée au modèle, elle est appliquée dans le code
([`api/_lib/fiche.ts`](../../api/_lib/fiche.ts)) et couverte par les tests.

## Entretien courant

| Geste | Commande |
|---|---|
| Modifier ce que dit l'agent | éditer `prompt-systeme.md`, puis `npm run agent:prompt`, puis committer |
| Vérifier que rien n'est cassé | `npm run verify` |
| Voir les erreurs en production | Vercel → *Deployments* → *Functions* → `api/whatsapp` → *Logs* |
| Couper l'agent immédiatement | Meta → WhatsApp → *Configuration* → Webhook → se désabonner du champ `messages` |

Le prompt et le code sont deux fichiers distincts : changer le discours
commercial ne demande jamais de toucher au code, mais demande toujours
`npm run agent:prompt` (sinon la fonction continue de servir l'ancienne version).
