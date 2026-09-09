---
titre: "Cahier des Charges Maître — Agence Digitale & Ingénierie IA de Proximité"
zone: "Reims & Grand Est"
version: "2.0.0"
statut: "Validé pour exécution"
date_edition: "2026-09-08"
auteur: "[NOM_AGENCE]"
cycle_revision: "Révision trimestrielle ou à chaque évolution tarifaire/technique majeure"
classification: "Usage interne + support commercial client"
---

# 🏛️ CAHIER DES CHARGES MAÎTRE
## Agence Digitale & Ingénierie IA de Proximité — Reims & Grand Est

> **Note de version :** ce document remplace et enrichit le dossier stratégique v1. Toute donnée chiffrée (prix, délais, SLA) engage l'agence dès sa publication sur un support commercial. Toute modification doit incrémenter le numéro de version en en-tête.

---

## 0. Sommaire

1. Résumé exécutif
2. Positionnement, identité de marque & engagements de service
3. Objectifs mesurables & indicateurs de performance (KPI)
4. Architecture tarifaire & structure commerciale
5. Spécifications fonctionnelles & expérience utilisateur (UI/UX)
6. Architecture technique, stack & budget de performance
7. Sécurité, conformité RGPD & mentions légales
8. Micro-CRM & schéma de données
9. Intégrations tierces
10. Ligne éditoriale du blog
11. Plan de tests & assurance qualité
12. Plan de déploiement, environnements & sauvegardes
13. Gestion de projet — jalons & planning type
14. Matrice des risques
15. Critères d'acceptation & recette (Definition of Done)
16. Maintenance, support post-lancement & SLA
17. Annexes

---

## 1. Résumé exécutif

L'agence conçoit et déploie des écosystèmes digitaux complets (site + prise de rendez-vous + paiement + IA conversationnelle + CRM léger) pour les artisans, commerçants et PME de Reims et sa périphérie, avec une promesse de rapidité d'exécution et un ancrage physique fort (déplacement sur site, prise de photo professionnelle, contact humain direct).

Le présent document est la référence unique et opposable pour :
- la définition contractuelle des offres (packs et options) ;
- les exigences techniques, de sécurité et de conformité ;
- les engagements de délai et de support (SLA) ;
- le protocole de recette et de mise en production ;
- la gouvernance éditoriale du blog.

Tout écart entre ce document et un support commercial (site vitrine, plaquette, devis) doit être corrigé dans les 48h ouvrées suivant sa détection.

---

## 2. Positionnement, identité & engagements de service

### 2.1 Positionnement de marque

Partenaire technologique et développeur web de proximité, spécialisé dans la création d'écosystèmes digitaux à haute performance, l'acquisition locale et l'intégration d'agents IA pour artisans, commerçants et PME à Reims.

### 2.2 Engagement de délai — clause de précision

> **Formulation commerciale :** « Déploiement et mise en ligne complète sous 24h à 48h. »

**Clause d'application (obligatoire en interne, à ne jamais omettre dans un devis signé) :**
Ce délai s'applique à la **mise en ligne technique** (hébergement, DNS, SSL, structure du site, formulaires fonctionnels) à compter de la **réception complète et validée** des éléments suivants fournis par le client :
- textes définitifs ou brief de contenu ;
- logo et charte graphique (ou accord pour création par l'agence) ;
- accès ou création du nom de domaine ;
- photos (sauf si prise de vue sur site prévue au pack).

En l'absence d'un ou plusieurs éléments, le délai démarre à réception du dernier élément manquant. Ce point doit être explicité oralement et par écrit (email de confirmation de commande) à chaque signature, afin d'éviter tout litige sur le respect du délai.

### 2.3 Proximité & ancrage physique

- Déplacement sur place **offert jusqu'à 15 km** autour de Reims (audit direct de l'établissement, prise de vue photographique professionnelle sur site, échange humain sans intermédiaire).
- Au-delà de 15 km : frais de déplacement à définir au devis (barème kilométrique fiscal en vigueur + temps de trajet facturé à la demi-heure).

### 2.4 Canaux de contact direct & SLA de réponse

| Canal | Coordonnée | Usage | Engagement de réponse (jours ouvrés, 9h–19h) |
|---|---|---|---|
| WhatsApp Pro | +33 7 58 18 76 75 | Demandes courantes, suivi de projet | < 2h |
| SMS direct | +33 7 45 37 18 62 | Urgences, indisponibilité ponctuelle d'un canal | < 1h |
| Cal.com | Module de prise de RDV intégré | Appel découverte de 15 min sans friction | Créneau sous 72h |
| Email | À définir (adresse professionnelle dédiée) | Demandes contractuelles, factures | < 24h ouvrées |

En dehors des horaires listés, la réponse intervient au prochain jour ouvré, sauf souscription à l'option **Assistant IA 24/7** (section 4.A.3), qui couvre l'accueil et la qualification hors horaires humains — sans se substituer au SLA humain ci-dessus.

---

## 3. Objectifs mesurables & indicateurs de performance (KPI)

Ces objectifs cadrent la réussite du projet côté agence et côté client ; ils doivent figurer dans le rapport de recette (section 15) et dans les revues trimestrielles.

| Domaine | Objectif | Indicateur | Cible |
|---|---|---|---|
| Performance technique | Site rapide sur mobile | Score Lighthouse Performance (mobile) | ≥ 90 |
| Accessibilité | Site utilisable par tous | Score Lighthouse Accessibility | ≥ 90 |
| SEO technique | Indexation propre | Score Lighthouse SEO | ≥ 95 |
| Core Web Vitals | Expérience réelle utilisateur | LCP / INP / CLS | LCP < 2,5s · INP < 200ms · CLS < 0,1 |
| Disponibilité | Continuité de service | Uptime hébergement | ≥ 99,9 % mensuel |
| Conversion locale | Génération de contacts | Taux de clic sur CTA (appel/WhatsApp/formulaire) | Suivi mensuel, benchmark après 30 jours |
| Réduction des no-shows | Efficacité du module RDV | Taux de rendez-vous non honorés | -30 % vs. baseline déclarée par le client |
| Satisfaction client | Qualité perçue | Note de recette (section 15) | ≥ 8/10 |

---

## 4. Architecture tarifaire & structure commerciale

> **Règle de gouvernance des prix :** tout prix affiché ci-dessous est HT ou TTC selon le statut fiscal de l'agence — à préciser une fois pour toutes en en-tête de chaque devis. Les tarifs mensuels sont sans engagement de durée minimale sauf mention contraire au contrat-cadre (voir 4.C).

### A. Les Packs Clé en Main

#### A.1 — Pack Starter (Vitrine & Visibilité Locale)
**190 € installation + 19 €/mois**

Inclus :
- Site vitrine responsive haute vitesse (mobile-first, optimisé Core Web Vitals — cibles section 3).
- Nom de domaine personnalisé (1 an) + hébergement sécurisé SSL haute disponibilité.
- SEO local : optimisation sémantique ciblée Reims + synchronisation Google Business Profile (Google Maps).
- Formulaire de contact sécurisé (anti-spam), boutons d'appel, WhatsApp et SMS directs.
- 🎁 Arrière-plan animé / vidéo 3D immersive en page d'accueil (valeur 49 €).
- 🎁 Espace privé client sécurisé (valeur 49 €).
- 🚗 Déplacement sur site inclus dans un rayon de 15 km.

**Exclu (à proposer en upsell) :** rédaction de contenu long format, prise de vue drone, traduction multilingue.

#### A.2 — Pack Pro Connecté (Agenda & Réservations Automatisées)
**299 € installation + 19 €/mois**

Tout le contenu du Pack Starter, plus :
- Module de prise de RDV / réservation connecté.
- Synchronisation bidirectionnelle en direct avec l'agenda du commerçant (Google Calendar, Apple iCal, Outlook).
- Passerelle vers outils tiers déjà utilisés (Planity, Treatwell...) ou solution native (Cal.com).
- Notifications automatiques de confirmation et rappels (réduction des no-shows — cible KPI section 3).

#### A.3 — Option Booster IA / Assistant 24/7 (add-on)
**+49 € installation + 20 €/mois**

- Déploiement et entraînement sur-mesure d'un agent conversationnel IA (WhatsApp et/ou widget web).
- Qualification automatique des prospects, réponses aux questions fréquentes, tarifs, disponibilités, 24h/24 7j/7.
- **Limite contractuelle à préciser au client :** l'agent IA ne prend pas d'engagement financier ferme au nom du client et redirige vers un humain pour toute demande hors périmètre (litige, réclamation, urgence sécurité).

### B. Configurateur de devis « à la carte » (options modulaires)

| Option | Coût initial | Coût mensuel | Description |
|---|---|---|---|
| Module Devis Express avec upload photo | +80 € | 0 € | Réception immédiate de photos (carte grise, panne, modèle) pour devis rapide — garages, salons, artisans. |
| Boutique en ligne & paiement CB sécurisé | +150 € | +10 €/mois | Stripe, Apple Pay, Google Pay, gestion des commandes, Click & Collect. |
| Gestion publicitaire locale (Google Ads / Meta Ads) | +90 € | +30 €/mois | Campagnes géolocalisées Reims, pixel de suivi, optimisation des enchères, reporting mensuel du coût par prospect. |

### C. Conditions commerciales générales (à formaliser en CGV séparées)

- **Facturation :** installation à la commande (ou 50/50 à la signature et à la mise en ligne pour les packs > 250 €) ; abonnement mensuel prélevé à date anniversaire.
- **Durée d'engagement :** sans engagement sur l'abonnement, résiliable avec préavis de 30 jours ; le montant d'installation n'est pas remboursable une fois le développement engagé.
- **Propriété :** le nom de domaine est déposé au nom du client ; le code source et les contenus créés par l'agence restent sa propriété jusqu'à solde complet des factures, puis sont cédés au client.
- **Portabilité :** en cas de résiliation, export des données du micro-CRM et du contenu du site fourni au client sous 15 jours ouvrés.
- **Révision tarifaire :** toute hausse d'abonnement notifiée avec un préavis de 60 jours.

---

## 5. Spécifications fonctionnelles & expérience utilisateur (UI/UX)

### 5.1 Boutique 3D Privée (Concept Store Interactif)

**User story visiteur :** *« En tant que visiteur, je découvre une vitrine 3D élégante verrouillée par défaut, avec un message clair d'accès restreint, afin de comprendre que l'offre est exclusive/sur demande. »*

- Interface verrouillée par défaut : vitrine 3D aux reflets métalliques, cadenas holographique.
- Mention obligatoire : « Boutique Éphémère Privée — Accès restreint ou démo exclusive sur demande ».

**User story propriétaire :** *« En tant que commerçant, je veux ouvrir/fermer ma boutique et ajouter un article en moins d'une minute depuis mon téléphone. »*

- Panneau d'administration mobile sécurisé (authentification requise).
- Interrupteur d'ouverture/fermeture en temps réel.
- Ajout d'article : photo directe (caméra du téléphone), titre, prix en euros — 3 champs obligatoires maximum pour rester sous la cible d'1 minute.

**Mode déverrouillé (critère d'acceptation) :**
- Cartes produits 3D interactives réagissant au gyroscope (mobile) ou à la souris (desktop), avec repli automatique en affichage statique si l'appareil ne supporte pas l'accéléromètre (dégradation gracieuse obligatoire).
- Parcours d'achat simulé ou connecté au module de paiement (section 4.B) selon le pack souscrit.

### 5.2 Calculateur de devis dynamique en temps réel

- Sélection modulaire par cases à cocher, recalcul instantané (< 100 ms perçu) du coût initial et de la mensualité.
- Bouton d'action générant un récapitulatif formaté (nom, options cochées, total) envoyé vers WhatsApp (lien `wa.me` pré-rempli) ou par email en un clic.
- **Critère d'acceptation :** le total affiché doit toujours correspondre exactement à la somme des lignes cochées définies en section 4 — un test de non-régression sur cette cohérence est obligatoire avant chaque mise en production (voir section 11).

### 5.3 Direction artistique & design système

- **Esthétique :** Dark Luxury Glassmorphism — fond sombre profond `#080C14`, cartes translucides dépolies (`backdrop-blur-xl`), bordures fines à micro-dégradés lumineux, accents cyan / émeraude / améthyste.
- **Accessibilité des contrastes :** malgré l'esthétique sombre, tout texte doit respecter un ratio de contraste WCAG AA (≥ 4,5:1 pour le texte courant, ≥ 3:1 pour le texte large) — à vérifier systématiquement, les designs "dark glassmorphism" étant à risque sur ce point.
- **Stack technique :** Astro + Tailwind CSS (voir section 6).
- **Responsive :** breakpoints mobile (< 640px), tablette (640–1024px), desktop (> 1024px) ; mobile-first obligatoire.

---

## 6. Architecture technique, stack & budget de performance

### 6.1 Stack retenue

| Couche | Choix | Justification |
|---|---|---|
| Frontend | Astro + Tailwind CSS | Rendu statique/hybride léger, excellent score Core Web Vitals par défaut. |
| Hébergement | Hébergeur SSL haute disponibilité (à nommer au contrat) | Cible uptime ≥ 99,9 % (section 3). |
| Base de données CRM | PocketBase ou Supabase | Léger, auto-hébergeable ou managé, adapté au volume TPE/PME. |
| Paiement | Stripe (+ Apple Pay / Google Pay) | Conformité PCI-DSS déléguée au prestataire, pas de manipulation de données bancaires en direct. |
| RDV / Agenda | Cal.com natif ou passerelle Planity/Treatwell | Double option selon les outils déjà utilisés par le client. |
| IA conversationnelle | Agent entraîné sur WhatsApp Business API et/ou widget web | Voir limites contractuelles section 4.A.3. |

### 6.2 Budget de performance (non négociable en recette)

- Poids total de page d'accueil (hors vidéo 3D) : < 1,5 Mo transféré.
- Nombre de requêtes HTTP à first paint : < 40.
- Images : formats modernes (WebP/AVIF), lazy-loading systématique sous la ligne de flottaison.
- Vidéo 3D immersive : chargement différé (ne bloque jamais le LCP de la page d'accueil).

### 6.3 Compatibilité & tests navigateurs

- Navigateurs cibles : 2 dernières versions de Chrome, Safari, Firefox, Edge (desktop et mobile).
- Test obligatoire sur iOS Safari (rendu souvent divergent sur le glassmorphism et le blur).

---

## 7. Sécurité, conformité RGPD & mentions légales

> Point critique absent du dossier v1 : toute collecte de données (formulaire de contact, micro-CRM, module de paiement, agent IA) engage la responsabilité du client en tant que responsable de traitement, et de l'agence en tant que sous-traitant au sens RGPD. Ce chapitre est **contractuellement obligatoire** pour tout site livré en France.

### 7.1 Obligations documentaires du site livré

Chaque site livré doit inclure, sans exception :
- **Mentions légales** (identité de l'éditeur, hébergeur, directeur de publication, SIRET).
- **Politique de confidentialité** (finalités de traitement, durées de conservation, droits d'accès/rectification/suppression, contact DPO ou référent).
- **CGV/CGU** si vente en ligne ou prise de RDV payante.
- **Bandeau de consentement cookies** (opt-in explicite avant tout dépôt de cookie non essentiel, notamment pixels Google Ads / Meta Ads — section 4.B).

### 7.2 Sous-traitance des données (registre à tenir)

| Sous-traitant | Donnée traitée | Localisation | Base légale |
|---|---|---|---|
| Hébergeur | Contenu du site, logs serveur | UE de préférence | Exécution du contrat |
| PocketBase/Supabase | Données du micro-CRM (section 8) | À documenter au contrat | Intérêt légitime / consentement |
| Stripe | Données de paiement | UE/US (clauses contractuelles types) | Exécution du contrat |
| Cal.com / Planity / Treatwell | Données de rendez-vous | À documenter | Exécution du contrat |
| Fournisseur IA conversationnelle | Historique de conversation | À documenter | Consentement / intérêt légitime |

### 7.3 Durées de conservation recommandées (CNIL)

- Prospect non converti (`statut_projet = "Prospect"`) sans activité : **3 ans** maximum à compter du dernier contact, puis suppression ou anonymisation.
- Client actif (`statut_projet = "Déployé & En Ligne"`) : durée de la relation contractuelle + délais légaux de prescription comptable (10 ans pour les pièces justificatives liées à `statut_facture`).
- Documents/photos liés à un devis non signé : suppression sous 12 mois.

### 7.4 Sécurité applicative minimale

- HTTPS forcé (HSTS) sur l'intégralité du site.
- Authentification du panneau d'administration (5.1) : mot de passe fort + option 2FA recommandée dès le Pack Pro Connecté.
- Sauvegardes chiffrées du micro-CRM (fréquence définie en section 12.3).
- Aucune donnée de carte bancaire stockée en base propre (délégation intégrale à Stripe).

---

## 8. Micro-CRM & schéma de données

**Outil :** PocketBase ou Supabase — gestion interne ultra-légère, saisie d'un prospect en moins de 30 secondes depuis un smartphone.

### 8.1 Schéma de la table `clients`

| Champ | Type | Obligatoire | Validation / Enum | Notes |
|---|---|---|---|---|
| `id` | UUID | Auto | — | Clé primaire |
| `nom_client` | string | Oui | 2–120 car. | Nom du contact + enseigne commerciale |
| `telephone` | string | Oui | Format E.164 (+33...) | Passerelle WhatsApp directe |
| `email` | string | Non | Format email valide | — |
| `type_commerce` | enum | Oui | `garage` / `coiffure` / `restauration` / `btp_artisanat` / `autre` | Filtrage rapide |
| `statut_facture` | enum | Oui | `avec_facture_tva` / `sans_facture_direct` | Attention : conserver une trace conforme aux obligations comptables (10 ans) quel que soit le statut |
| `montant_total` | decimal(10,2) | Oui | ≥ 0 | Setup facturé |
| `mensualite` | decimal(10,2) | Non | ≥ 0 | Maintenance récurrente |
| `documents_photos` | array\<file\> | Non | Max 10 Mo/fichier | Devis, cartes grises, cartes de visite, reçus |
| `statut_projet` | enum | Oui | `prospect` / `devis_transmis` / `en_production` / `deploye_en_ligne` | Pipeline de suivi |
| `notes_privees` | text | Non | — | Historique des échanges, spécificités convenues sur site |
| `date_creation` | timestamp | Auto | — | Horodatage création |
| `date_derniere_activite` | timestamp | Auto | — | Utilisé pour la purge RGPD (section 7.3) |
| `consentement_rgpd` | boolean | Oui | `true`/`false` | Traçabilité de la base légale de collecte |

### 8.2 Règles d'intégrité

- Un enregistrement sans `consentement_rgpd = true` ne peut pas recevoir de communication marketing (newsletter, relance commerciale automatisée) — usage limité au suivi contractuel strict.
- Index recommandés : `telephone`, `statut_projet`, `date_derniere_activite` (pour les jobs de purge automatique).
- Sauvegarde quotidienne, rétention 30 jours glissants (voir section 12.3).

---

## 9. Intégrations tierces

| Intégration | Fonction | Pack minimum requis | Point de vigilance technique |
|---|---|---|---|
| Google Business Profile / Maps | SEO local | Starter | Synchronisation manuelle initiale, vérification propriétaire obligatoire |
| Google Calendar / Apple iCal / Outlook | Sync bidirectionnelle agenda | Pro Connecté | Gestion des conflits de créneaux, fuseau horaire unique (Europe/Paris) |
| Cal.com | RDV natif | Pro Connecté | Webhook de confirmation à sécuriser (signature de payload) |
| Planity / Treatwell | Passerelle RDV existante | Pro Connecté (option) | Dépendance à la disponibilité de l'API tierce — SLA hors contrôle de l'agence |
| WhatsApp Business API | Contact direct + agent IA | Starter (contact) / Booster IA (agent) | Coûts de conversation WhatsApp à répercuter si volume élevé |
| Stripe / Apple Pay / Google Pay | Paiement en ligne | Option Boutique | Webhooks de confirmation de commande, gestion des remboursements |
| Google Ads / Meta Ads | Acquisition payante | Option Ads | Pixel de tracking soumis au consentement cookies (section 7.1) |

---

## 10. Ligne éditoriale du blog — stratégies locales, Google Ads & IA

**Règle de production :** chaque article dépasse 1 000 caractères, est accompagné d'une image conceptuelle marquante favorisant le clic et le partage, et intègre un balisage `schema.org` (Article + LocalBusiness le cas échéant) pour préparer le référencement dans les moteurs génératifs (voir article 6).

| # | Titre | Image conceptuelle | Thèse |
|---|---|---|---|
| 1 | Google Ads pour Artisans & PME : la Stratégie plutôt que le Budget | Panneau d'artisan illuminé par un laser doré dans une ruelle sombre | Pourquoi 80 % des commerces gaspillent leur budget et comment 5 réglages simples génèrent des appels qualifiés quotidiens à Reims sans gros investissement. |
| 2 | Google Business & Maps : l'angle mort des commerces rémois | Carte holographique 3D de Reims avec repères lumineux | Analyse des opportunités manquées par manque d'optimisation locale et captation du flux d'acheteurs dans un rayon de 5 km. |
| 3 | L'IA invisible : éradiquer les no-shows et automatiser l'accueil | Vitrine rémoise traversée par des flux de lumière interconnectés | Comment les SMS de relance intelligents et les assistants WhatsApp libèrent 15h/semaine aux gérants tout en augmentant le chiffre d'affaires. |
| 4 | L'IA dans l'espace : les algorithmes aux portes du cosmos | Télescope en orbite pointé vers une nébuleuse, maillé de réseaux neuronaux | Traitement des signaux interstellaires et navigation autonome des rovers martiens, en parallèle de la puissance des technologies appliquées au web moderne. |
| 5 | Créativité synthétique : pourquoi les vidéos 3D captivent | Sculpture en verre fragmenté traversée par des ondes de lumière néon | L'importance des 3 premières secondes sur l'attention des visiteurs et l'impact d'un accueil 3D face aux sites génériques. |
| 6 | SEO & moteurs génératifs : être recommandé par Google SGE | Interface de recherche futuriste analysant un commerce local | Structuration des données (`schema.org`) et préparation des entreprises locales aux moteurs de réponse IA de nouvelle génération. |

**Cadence recommandée :** 1 article toutes les 2 semaines minimum pour maintenir un signal SEO local actif ; suivi du trafic organique par article dans le rapport mensuel.

---

## 11. Plan de tests & assurance qualité

À exécuter avant **toute** mise en production, packs Starter et Pro Connecté inclus.

| Type de test | Portée | Seuil de validation |
|---|---|---|
| Performance | Lighthouse (mobile + desktop) | Cibles section 3 (Performance ≥ 90, etc.) |
| Fonctionnel | Formulaires, calculateur de devis, boutons d'appel/WhatsApp/SMS | 0 erreur bloquante |
| Cross-browser | Chrome, Safari, Firefox, Edge (2 dernières versions) + iOS Safari | Rendu conforme à la maquette validée |
| Sécurité de base | HTTPS/HSTS, absence de fuite de clé API en frontend, en-têtes de sécurité | 0 vulnérabilité critique |
| RGPD | Bandeau cookies fonctionnel, formulaire avec case consentement | Conformité section 7 |
| Non-régression calculateur | Cohérence prix affichés vs. grille section 4 | Correspondance exacte |
| Recette client (UAT) | Parcours complet côté client final | Validation écrite du client (section 15) |

---

## 12. Plan de déploiement, environnements & sauvegardes

### 12.1 Environnements

- **Développement (local/preview)** : utilisé pour la construction initiale, non accessible publiquement.
- **Staging** : environnement de recette identique à la production, utilisé pour la validation client avant bascule DNS.
- **Production** : environnement final, domaine du client, SSL actif.

### 12.2 Procédure de mise en ligne

1. Recette complète en staging (section 11).
2. Validation écrite du client (email ou signature électronique du procès-verbal de recette).
3. Bascule DNS / pointage du domaine.
4. Vérification post-bascule (SSL actif, formulaires fonctionnels, tracking actif).
5. Notification de mise en ligne au client avec accès à l'espace privé (5.1) et aux identifiants d'administration.

### 12.3 Sauvegardes & plan de reprise

- Sauvegarde automatique quotidienne du micro-CRM et du contenu du site.
- Rétention : 30 jours glissants minimum.
- Procédure de restauration testée au moins une fois par trimestre.
- Temps de restauration cible (RTO) : < 4h ouvrées en cas d'incident critique.

---

## 13. Gestion de projet — jalons & planning type

Planning de référence pour un Pack Starter ou Pro Connecté, à ajuster selon la réactivité du client sur la fourniture des contenus (clause 2.2).

| Jalon | Délai indicatif | Responsable |
|---|---|---|
| Signature du devis + acompte | J0 | Client |
| Appel de cadrage (15 min, Cal.com) | J0 à J+2 | Agence + Client |
| Collecte des contenus / prise de vue sur site | J0 à J+2 | Agence (déplacement) + Client |
| Construction du site en staging | J+1 à J+2 | Agence |
| Recette client (UAT, section 11) | J+2 à J+3 | Client |
| Mise en ligne production | J+2 à J+4 (cible 24–48h dès contenus reçus) | Agence |
| Formation à l'espace privé / panneau admin | J+4 à J+7 | Agence |
| Revue de performance à 30 jours | J+30 | Agence + Client |

---

## 14. Matrice des risques

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Retard de fourniture des contenus par le client | Élevée | Moyen | Clause 2.2 explicite au devis ; relance automatisée à J+2 sans réponse |
| Indisponibilité d'une API tierce (Planity, Treatwell) | Moyenne | Moyen | Solution native Cal.com en repli systématique |
| Non-conformité RGPD constatée après mise en ligne | Faible | Élevé | Checklist section 7 intégrée au protocole de recette (section 11) |
| Dérive du périmètre ("scope creep") sur le sur-mesure | Élevée | Moyen | Toute demande hors périmètre du pack fait l'objet d'un avenant chiffré avant exécution |
| Rendu visuel dégradé sur iOS Safari (glassmorphism) | Moyenne | Faible | Test dédié obligatoire (section 6.3 et 11) |
| Dépendance à un seul développeur/agence (bus factor) | Moyenne | Élevé | Documentation technique à jour + accès hébergement/domaine partagés avec le client |
| Sur-sollicitation de l'agent IA hors périmètre (conseil juridique, litige) | Faible | Moyen | Garde-fous conversationnels + redirection humaine (clause 4.A.3) |

---

## 15. Critères d'acceptation & recette (Definition of Done)

Un livrable n'est considéré "Déployé & En Ligne" (section 8, `statut_projet`) que si l'ensemble des conditions suivantes sont réunies :

- [ ] Tous les tests de la section 11 sont passés avec succès.
- [ ] Les mentions légales, la politique de confidentialité et le bandeau cookies sont en ligne (section 7.1).
- [ ] Le domaine pointe correctement et le certificat SSL est actif.
- [ ] Le calculateur de devis (si applicable) reflète exactement la grille tarifaire en vigueur (section 4).
- [ ] Les canaux de contact (appel, WhatsApp, SMS, formulaire) sont fonctionnels et testés en conditions réelles.
- [ ] Le client a reçu ses identifiants d'administration et une formation minimale (section 12.2, étape 5).
- [ ] Le client a signé ou confirmé par écrit le procès-verbal de recette.
- [ ] La fiche client dans le micro-CRM est à jour (section 8) avec `statut_projet = deploye_en_ligne`.

---

## 16. Maintenance, support post-lancement & SLA

| Niveau | Exemple | Délai de première réponse | Délai de résolution cible |
|---|---|---|---|
| P1 — Critique | Site inaccessible, paiement bloqué | < 4h (jours ouvrés) | < 24h |
| P2 — Majeur | Fonctionnalité clé en panne (formulaire, RDV) | < 24h | < 72h |
| P3 — Mineur | Modification de contenu, ajustement esthétique | < 5 jours ouvrés | Selon charge, communiqué au client |

- Les abonnements mensuels (section 4) couvrent l'hébergement, les mises à jour de sécurité et le support P1/P2.
- Les demandes P3 récurrentes ou volumineuses peuvent faire l'objet d'un forfait de maintenance évolutive additionnel.
- Revue de performance et de sécurité recommandée tous les 6 mois (mise à jour des dépendances, vérification RGPD).

---

## 17. Annexes

### 17.1 Glossaire

- **RTO (Recovery Time Objective)** : durée maximale acceptable pour restaurer un service après incident.
- **UAT (User Acceptance Testing)** : tests de recette réalisés par le client final avant mise en production.
- **Core Web Vitals** : indicateurs Google mesurant l'expérience utilisateur réelle (LCP, INP, CLS).
- **SGE (Search Generative Experience)** : moteurs de recherche génératifs basés sur l'IA (successeurs du SEO classique).

### 17.2 Checklist mentions légales à collecter côté client

- SIRET / SIREN.
- Statut juridique (auto-entrepreneur, SARL, etc.).
- Nom de l'hébergeur retenu.
- Coordonnées du directeur de publication.

### 17.3 Journal des versions

| Version | Date | Modifications |
|---|---|---|
| 1.0 | Antérieure | Dossier stratégique initial (positionnement, packs, UX, éditorial, CRM). |
| 2.0 | 2026-09-08 | Ajout : objectifs mesurables, RGPD/légal, architecture technique détaillée, plan de tests, déploiement, planning, matrice de risques, critères d'acceptation, SLA support. Clarification de la clause de délai 24–48h et des schémas de données. |
| 2.1 | 2026-09-09 | Grille tarifaire « 3 offres » : Starter 390 €/39 €, Pro Connecté 690 €/59 €, nouveau Pack Ultime 990 €/199 € (tout-inclus). Options réajustées : Booster IA 140 €/49 €, Devis Express 70 €/15 €, Boutique Stripe 240 €/29 €, Gestion Ads 100 €/70 €. Règle calculateur : un pack tout-inclus verrouille ses options incluses (aucun supplément, total strict). |

---

*Document maître — toute duplication à des fins commerciales doit référencer la version en vigueur (voir en-tête).*
