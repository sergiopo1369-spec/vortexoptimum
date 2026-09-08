/**
 * Grille tarifaire — source de vérité unique (§4 du cahier des charges).
 *
 * RÈGLE DE GOUVERNANCE (§4) : tout prix affiché sur un support commercial engage
 * l'agence. Toute modification ici doit être répercutée dans le journal des
 * versions (§17.3) et vérifiée par le test de non-régression `tests/pricing.test.ts`
 * (exigence §5.2 : « le total affiché doit toujours correspondre exactement à la
 * somme des lignes cochées »).
 *
 * Devise : EUR. Statut fiscal (HT/TTC) : à préciser en en-tête de chaque devis (§4).
 */

export type PriceLine = {
  id: string;
  label: string;
  /** Coût initial (installation / setup) en euros. */
  setup: number;
  /** Coût récurrent mensuel en euros. */
  monthly: number;
  description: string;
  /** true = ligne informative chiffrée « sur devis », exclue du total. */
  quoteOnly?: boolean;
};

/** Packs clé en main — choix de base mutuellement exclusif (§4.A). */
export const PACKS: (PriceLine & { includes: string[]; freebies: string[]; exclusions: string[] })[] = [
  {
    id: "starter",
    label: "Pack Starter — Vitrine & Visibilité Locale",
    setup: 190,
    monthly: 19,
    description:
      "Site vitrine responsive haute vitesse, nom de domaine (1 an) + hébergement SSL, SEO local Reims + Google Business Profile, formulaire sécurisé et boutons d'appel / WhatsApp / SMS.",
    includes: [
      "Site vitrine responsive mobile-first optimisé Core Web Vitals",
      "Nom de domaine personnalisé (1 an) + hébergement sécurisé SSL haute disponibilité",
      "SEO local : optimisation sémantique Reims + synchronisation Google Business Profile",
      "Formulaire de contact sécurisé anti-spam, boutons appel / WhatsApp / SMS",
    ],
    freebies: [
      "Arrière-plan animé / vidéo 3D immersive en page d'accueil (valeur 49 €)",
      "Espace privé client sécurisé (valeur 49 €)",
      "Déplacement sur site inclus dans un rayon de 15 km",
    ],
    exclusions: [
      "Rédaction de contenu long format",
      "Prise de vue drone",
      "Traduction multilingue",
    ],
  },
  {
    id: "pro",
    label: "Pack Pro Connecté — Agenda & Réservations",
    setup: 299,
    monthly: 19,
    description:
      "Tout le Pack Starter, plus un module de prise de RDV connecté avec synchronisation bidirectionnelle de l'agenda et notifications automatiques de rappel.",
    includes: [
      "Tout le contenu du Pack Starter",
      "Module de prise de RDV / réservation connecté",
      "Synchronisation bidirectionnelle en direct (Google Calendar, Apple iCal, Outlook)",
      "Passerelle vers outils tiers (Planity, Treatwell…) ou solution native Cal.com",
      "Notifications automatiques de confirmation et rappels (réduction des no-shows)",
    ],
    freebies: [
      "Arrière-plan animé / vidéo 3D immersive en page d'accueil (valeur 49 €)",
      "Espace privé client sécurisé (valeur 49 €)",
      "Déplacement sur site inclus dans un rayon de 15 km",
    ],
    exclusions: [
      "Rédaction de contenu long format",
      "Prise de vue drone",
      "Traduction multilingue",
    ],
  },
];

/**
 * Options additionnelles cumulables (§4.A.3 + §4.B).
 * L'add-on IA est listé ici car il se configure comme une option au devis.
 */
export const ADDONS: PriceLine[] = [
  {
    id: "ia",
    label: "Booster IA / Assistant 24/7",
    setup: 49,
    monthly: 20,
    description:
      "Agent conversationnel IA sur-mesure (WhatsApp et/ou widget web) : qualification des prospects, réponses aux questions fréquentes, disponibilités, 24h/24 7j/7. L'agent ne prend aucun engagement financier ferme et redirige vers un humain hors périmètre.",
  },
  {
    id: "devis-express",
    label: "Module Devis Express avec upload photo",
    setup: 80,
    monthly: 0,
    description:
      "Réception immédiate de photos (carte grise, panne, modèle) pour un devis rapide — garages, salons, artisans.",
  },
  {
    id: "boutique",
    label: "Boutique en ligne & paiement CB sécurisé",
    setup: 150,
    monthly: 10,
    description:
      "Stripe, Apple Pay, Google Pay, gestion des commandes, Click & Collect. Aucune donnée bancaire stockée en base propre (délégation intégrale à Stripe).",
  },
  {
    id: "ads",
    label: "Gestion publicitaire locale (Google Ads / Meta Ads)",
    setup: 90,
    monthly: 30,
    description:
      "Campagnes géolocalisées Reims, pixel de suivi (soumis au consentement cookies), optimisation des enchères, reporting mensuel du coût par prospect.",
  },
  {
    id: "deplacement-plus-15km",
    label: "Déplacement au-delà de 15 km",
    setup: 0,
    monthly: 0,
    quoteOnly: true,
    description:
      "Barème kilométrique fiscal en vigueur + temps de trajet facturé à la demi-heure. Chiffré au devis.",
  },
];

export const ALL_LINES: PriceLine[] = [...PACKS, ...ADDONS];

export function findLine(id: string): PriceLine | undefined {
  return ALL_LINES.find((l) => l.id === id);
}
