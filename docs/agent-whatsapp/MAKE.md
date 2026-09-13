# Assistant WhatsApp — montage du scénario Make

Architecture retenue le 11/09/2026 : **Make orchestre**, de la réception du
webhook Meta jusqu'à l'écriture dans Notion. La fonction Vercel
[`api/whatsapp.ts`](../../api/whatsapp.ts) reste dans le dépôt comme
implémentation de référence et solution de repli, mais **n'est pas branchée** :
Meta n'accepte qu'une seule URL de rappel par application, et c'est Make qui la
détient.

> **Conséquence à assumer.** Le prompt et les règles RGPD vivent désormais dans
> l'interface de Make, hors du dépôt et hors des tests. Les deux gestes
> d'entretien du bas de page ne sont pas facultatifs.

---

## État au 11/09/2026

Scénario **« Integration Webhooks »** (zone `eu1`, organisation 8934484, équipe
2723946, scénario 7360472, webhook 3703656). Il contenait une maquette de tuyau —
un texte figé envoyé à Claude, un autre texte figé renvoyé à WhatsApp, la réponse
du modèle jamais utilisée. Il a été réécrit par l'API Make.

**Étape 1 — en place et vérifiée dans le blueprint enregistré :**

| Module | État |
|---|---|
| `[1]` Custom webhook | inchangé — l'URL déjà déclarée chez Meta reste valable |
| `[2]` Webhook response | renvoie `{{1.hub.challenge}}` : vérification Meta **et** accusé rapide sur les POST |
| `[5]` Anthropic → Create a Message | `claude-sonnet-5`, prompt système complet (27 816 caractères) + contexte temporel calculé à chaque exécution, message du prospect en entrée, filtre « seulement un message texte » |
| `[6]` HTTP → Graph API | répond **à l'expéditeur réel**, bloc `FICHE_PROSPECT` retiré, texte échappé par `toJSON()`, plus un filtre de sécurité qui bloque l'envoi si le bloc survit |

**Étape 2 — à monter, dans cet ordre d'importance :**

1. **La mémoire** (§1, §5, §10). Sans elle l'agent oublie tout entre deux messages
   et redemande le nom à chaque phrase : la qualification ne peut pas aboutir.
   C'est le premier manque à combler.
2. L'anti-doublon (§4).
3. L'extraction de la fiche et l'écriture Notion (§11, §12) — aucune connexion
   Notion n'existe encore côté Make.
4. L'alerte équipe (§13).

### Diagnostic du 13/09/2026

Une injection d'un faux webhook Meta directement sur l'URL du hook
(`https://hook.eu1.make.com/slnx95qamd7vufa7lednfiw41imiwu9b`) a exécuté **4
opérations** : webhook → réponse → Claude → HTTP. Le modèle répond donc bien avec
le prompt complet ; seul le dernier module échoue. Deux causes, indépendantes :

1. **Le jeton WhatsApp avait expiré** (le 11/09 à 06:00 PDT — c'était le jeton
   temporaire de 24h). La Graph API répond `OAuthException 190`. Tant qu'il n'est
   pas remplacé par le jeton permanent de l'étape 2 d'[`INSTALLATION.md`](./INSTALLATION.md),
   l'agent lit et réfléchit mais ne peut rien envoyer.
2. **Meta ne livre aucun webhook** : aucune exécution entre le 11/09 11:41 et
   l'injection manuelle, alors que le hook Make est `enabled`, non `gone`, file
   d'attente vide. À vérifier côté Meta — l'URL de rappel, et surtout
   l'abonnement au champ `messages`, qui est une case à cocher **distincte** de
   la vérification de l'URL. Vérifier l'URL n'abonne à rien.

> ⚠️ **Ne pas rouvrir le mappage du module `[6]` dans l'interface Make.** Une
> édition du 11/09 a enregistré les chemins sous leurs **étiquettes localisées**
> — `{{1.Entrada[1].Cambios[1].value.messages[1].de}}` au lieu de
> `{{1.entry[].changes[].value.messages[].from}}` — qui ne résolvent vers rien :
> le destinataire partait vide. La même édition a remplacé l'expression du corps
> par `{{5.content}}`, ce qui supprimait le retrait du bloc `FICHE_PROSPECT` :
> les notes internes seraient parties chez le prospect. Corrigé le 13/09 par
> l'API. En cas de doute, comparer avec le corps de référence du §9.

**Un point reste à confirmer par un vrai message entrant :** la sortie du module
Anthropic de Make est supposée être `{{5.content[].text}}`, par analogie avec la
réponse de l'API. Si le prospect reçoit un message vide, c'est ce mappage — et
lui seul — qu'il faut corriger, dans le corps du module `[6]`.

**Deux limites connues de ce montage :**

- Le module natif Make n'expose pas `cache_control` : le prompt est refacturé en
  entier à chaque message (≈ 0,02 € au lieu de ≈ 0,002 €). Pour récupérer le
  cache il faudrait remplacer le module par un appel HTTP direct.
- `thinking` est resté sur `disabled`, comme dans la maquette. À passer sur
  `adaptive` si l'agent se montre approximatif sur les règles du prompt.

---

## Vue d'ensemble

```
Meta ──> Webhook Make
          ├─ (1) GET de vérification ──> Webhook response : hub.challenge
          └─ (2) POST message
                ├─ filtre : ignorer les accusés `statuses`
                ├─ Data store : message déjà vu ? → stop
                ├─ Data store : relire l'historique du numéro
                ├─ Create JSON  → corps de la requête Anthropic
                ├─ HTTP         → api.anthropic.com/v1/messages
                ├─ retirer le bloc FICHE_PROSPECT du texte
                ├─ HTTP         → graph.facebook.com (réponse au prospect)
                ├─ Data store   → écrire l'historique mis à jour
                └─ si fiche : Notion (créer la page) + WhatsApp (alerte équipe)
```

---

## 1. Préparer les trois Data stores

Make → *Data stores* → **Add**. Ce sont trois tables minuscules ; sans elles
l'agent n'a aucune mémoire et répond deux fois au même message.

| Data store | Clé | Champs | Rôle |
|---|---|---|---|
| `wa_prompt` | `id` (texte) | `contenu` (texte long) | Contient le prompt système. Une seule ligne, clé `v1`. |
| `wa_conversations` | `numero` (texte) | `historique` (texte long), `notion_page_id` (texte) | Mémoire par numéro. |
| `wa_messages_vus` | `message_id` (texte) | `vu` (booléen) | Anti-doublon : Meta réémet tant qu'il n'a pas de réponse. |

Dans `wa_prompt`, créer la ligne `v1` et **coller le contenu intégral de
[`prompt-a-coller.txt`](./prompt-a-coller.txt)** dans le champ `contenu`.

> Pourquoi un Data store et pas le texte directement dans le module HTTP : le
> prompt fait 28 000 caractères avec des guillemets et des sauts de ligne. Collé
> tel quel dans un corps JSON brut, il casse le JSON. Passé par un Data store puis
> par le module *Create JSON*, il est échappé automatiquement.

## 2. Module 1 — Webhook, et la vérification Meta

Ajouter **Webhooks → Custom webhook** → *Add* → nom `whatsapp-vortexoptimum` →
copier l'URL fournie.

Dans les réglages du webhook : **Show advanced settings** → cocher
**Get request headers** et **Get request method**.

Meta commence par un `GET` avec `hub.mode`, `hub.verify_token` et `hub.challenge`,
et attend en retour **le challenge en texte brut, rien d'autre**. Make ne le fait
pas tout seul. Juste après le webhook, poser un **Router** avec deux branches :

**Branche A — vérification.** Filtre : `Method` *equals* `GET`.
→ module **Webhooks → Webhook response**
  - *Status* : `200`
  - *Body* : `{{1.hub.challenge}}`
  - *Custom headers* : `Content-Type` = `text/plain`

**Branche B — messages.** Filtre : `Method` *equals* `POST`. C'est la suite du
document. Y ajouter tout de suite une **Webhook response** en tête, statut `200`,
corps vide : Meta veut un accusé rapide, sinon il réémet le message pendant que
Claude réfléchit encore.

Coller ensuite l'URL du webhook Make dans Meta → WhatsApp → *Configuration* →
Webhook, avec le jeton de vérification de ton choix, puis s'abonner au champ
**`messages`** uniquement.

## 3. Ignorer ce qui n'est pas un message

Meta envoie aussi les accusés de livraison et de lecture par le même webhook.
Sur la branche B, avant tout le reste, poser un filtre :

```
Condition : {{1.entry[].changes[].value.messages}}   Exists
```

Puis un **Iterator** sur `{{1.entry[].changes[].value.messages}}` : un webhook
peut contenir plusieurs messages.

Variables utiles à partir d'ici :

- numéro du prospect : `{{3.from}}`
- texte reçu : `{{3.text.body}}`
- identifiant du message : `{{3.id}}`
- type : `{{3.type}}` — ne traiter que `text` (filtre), et répondre aux autres
  « Je ne peux lire que les messages écrits pour le moment. »

## 4. Anti-doublon

**Data store → Get a record**, store `wa_messages_vus`, clé `{{3.id}}`.
Puis un filtre : `{{4.vu}}` *Does not exist*.
Juste après, **Data store → Add/replace a record**, clé `{{3.id}}`, `vu` = `true`.

Sans cette paire, un prospect reçoit deux à trois fois la même réponse : l'appel
à Claude dure quelques secondes, et Meta réémet pendant ce temps.

## 5. Relire l'historique

**Data store → Get a record**, store `wa_conversations`, clé `{{3.from}}`.

Le champ `historique` contient un tableau JSON sérialisé. Le transformer en
tableau exploitable, module **JSON → Parse JSON**, avec pour source :

```
{{ifempty(5.historique; "[]")}}
```

## 6. Construire le corps de la requête Anthropic

**JSON → Create JSON**, structure `requete_claude` :

| Champ | Type | Valeur |
|---|---|---|
| `model` | text | `claude-sonnet-5` |
| `max_tokens` | number | `4000` |
| `thinking` | collection | `type` = `adaptive` |
| `output_config` | collection | `effort` = `medium` |
| `system` | array of collection | voir ci-dessous |
| `messages` | array of collection | voir ci-dessous |

**`system`** — deux éléments, dans cet ordre :

1. `type` = `text`, `text` = `{{2.contenu}}` (la ligne `v1` de `wa_prompt`),
   `cache_control` = collection `{ type: "ephemeral" }`
2. `type` = `text`, `text` = le contexte temporel :

```
Date et heure actuelles (Europe/Paris) : {{formatDate(now; "dddd D MMMM YYYY HH:mm"; "Europe/Paris"; "fr")}}.
Aucun créneau ne peut être proposé avant le {{formatDate(addDays(now; 1); "dddd D MMMM YYYY"; "Europe/Paris"; "fr")}} (délai minimum de 24h).
Ne propose jamais un samedi, un dimanche ou un jour férié français.
```

> L'ordre compte : le prompt figé d'abord avec `cache_control`, la date **après**.
> Une date placée dans le premier bloc invalide le cache à chaque message et
> multiplie la facture Anthropic par dix.

**`messages`** — l'historique parsé à l'étape 5, suivi du message reçu :

```
{{add(6.messages; ...)}}
```
En pratique : mapper le tableau issu de *Parse JSON*, puis ajouter un élément
`{ role: "user", content: {{3.text.body}} }`.

## 7. Appeler Claude

**HTTP → Make a request**

- *URL* : `https://api.anthropic.com/v1/messages`
- *Method* : `POST`
- *Headers* :
  - `x-api-key` : la clé `sk-ant-…`
  - `anthropic-version` : `2023-06-01`
  - `content-type` : `application/json`
- *Body type* : `Raw` · *Content type* : `JSON (application/json)`
- *Request content* : `{{6.requete_claude}}` (la sortie de *Create JSON*)
- *Parse response* : **oui**

Le texte de la réponse se trouve dans `{{7.data.content[].text}}` — filtrer les
blocs dont `type` vaut `text`.

En cas de `stop_reason` = `refusal` : ne rien envoyer au prospect, prévenir
l'équipe. Un routeur avec un filtre sur `{{7.data.stop_reason}}` suffit.

## 8. ⚠️ Retirer le bloc FICHE_PROSPECT — l'étape à ne pas rater

Le bloc contient les notes internes (budget évoqué, appréciation commerciale).
**Il ne doit jamais partir chez le prospect.** Module **Tools → Set variable** :

- Nom : `reponse_client`
- Valeur :

```
{{trim(replace(7.data.content[1].text; "/(?:```|~~~)(?:json\s+)?FICHE_PROSPECT[\s\S]*?(?:```|~~~)/g"; emptystring))}}
```

C'est cette variable, et elle seule, qui part sur WhatsApp à l'étape 9.

Poser juste après un **filtre de sécurité** avant l'envoi :
`{{reponse_client}}` *Does not contain* `FICHE_PROSPECT`. Si un jour le modèle
change de balisage, le prospect ne reçoit rien plutôt que les notes internes.

## 9. Répondre au prospect

**HTTP → Make a request**

- *URL* : `https://graph.facebook.com/v21.0/<PHONE_NUMBER_ID>/messages`
- *Method* : `POST`
- *Headers* : `Authorization` = `Bearer <WHATSAPP_TOKEN>`
- *Body type* : `Raw` · JSON, construit par un **Create JSON** :

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "{{3.from}}",
  "type": "text",
  "text": { "preview_url": false, "body": "{{reponse_client}}" }
}
```

Au-delà de 4 096 caractères WhatsApp refuse le message : rare ici, le prompt
impose des réponses courtes, mais prévoir un filtre de longueur si ça arrive.

## 10. Mémoriser la conversation

**Data store → Add/replace a record**, store `wa_conversations`, clé `{{3.from}}` :

- `historique` : le tableau de l'étape 6 **plus** la réponse du modèle
  (`{ role: "assistant", content: ... }`), sérialisé en JSON.
- `notion_page_id` : celui de l'étape 12, s'il existe déjà.

**Mémoriser la réponse COMPLÈTE, bloc fiche compris.** C'est ainsi que l'agent
sait qu'il a déjà émis une fiche et ne la réémet qu'en cas de changement. Seul le
prospect ne voit jamais ce bloc.

## 11. Extraire la fiche

**Text parser → Match pattern**, sur `{{7.data.content[1].text}}` :

```
(?:```|~~~)(?:json\s+)?FICHE_PROSPECT\s*([\s\S]*?)(?:```|~~~)
```

Puis **JSON → Parse JSON** sur le groupe capturé. Si rien ne correspond, la suite
du scénario ne s'exécute pas : c'est le comportement voulu, toutes les
conversations n'aboutissent pas à une fiche.

## 12. ⚠️ Écrire dans Notion — avec le garde-fou RGPD

Base **« Prospects — Assistant WhatsApp »** :
<https://app.notion.com/p/258f63d359f444589c63840f3c8e720e>

Module **Notion → Create a Database Item**. Les colonnes attendues sont listées
dans le [README](./README.md) §2.

**Sans consentement explicite, aucune coordonnée ne doit être enregistrée (§7.3).**
Dans la fonction Vercel c'était garanti par le code et couvert par des tests ; ici
c'est à toi de le poser, sur **chacun** des quatre champs identifiants
(`nom_client`, `enseigne`, `telephone`, `email`) :

```
{{if(11.consentement_rgpd = true; 11.nom_client; emptystring)}}
```

Les autres champs (`besoin`, `commune`, `type_commerce`…) n'identifient personne
et se mappent directement.

Le `telephone` doit partir en E.164. Si le modèle a rendu `06 12 34 56 78` :

```
{{if(substring(replace(11.telephone; "/[^0-9+]/g"; emptystring); 0; 1) = "0"; "+33" + substring(replace(11.telephone; "/[^0-9+]/g"; emptystring); 1); replace(11.telephone; "/[^0-9+]/g"; emptystring))}}
```

## 13. Alerter l'équipe

**HTTP → Make a request** vers Graph, comme à l'étape 9, avec `to` =
`33758187675` et un corps résumant la fiche : nom, enseigne, commune, téléphone,
pack évoqué, canal souhaité, créneaux, et la mention
`⚠️ Consentement RGPD refusé` quand `consentement_rgpd` vaut `false`.

⚠️ Avec le numéro de test Meta, ce numéro doit figurer dans la liste des
destinataires autorisés, sinon l'alerte part en erreur.

---

## Recette avant ouverture

Les 8 scénarios du [README](./README.md) §4, plus deux propres à ce montage :

| # | Test | Attendu |
|---|---|---|
| 9 | Envoyer deux messages très rapprochés | Une seule réponse par message, pas de doublon (étape 4). |
| 10 | Provoquer une fiche, puis relire la conversation côté prospect | Aucune trace de `FICHE_PROSPECT`, `notes_privees` ni du budget (étape 8). |

## Entretien — les deux gestes qui ne sont pas facultatifs

| Quand | Geste |
|---|---|
| Après **toute** modification de [`prompt-systeme.md`](./prompt-systeme.md) | `npm run agent:prompt`, puis **recoller `prompt-a-coller.txt` dans la ligne `v1` du Data store `wa_prompt`**. Sans ce second geste, Make continue de servir l'ancien prompt — donc potentiellement d'anciens tarifs. |
| Après toute modification de `src/config/pricing.ts` | Répercuter dans `prompt-systeme.md` §2.3 le jour même, puis le geste ci-dessus. |

C'est le prix du montage dans Make : la chaîne `pricing.ts` → prompt → production
n'est plus automatique et aucun test ne la surveille. Le jour où un prospect se
voit annoncer un tarif périmé, c'est ce maillon qu'il faut regarder en premier.
