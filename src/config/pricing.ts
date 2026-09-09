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

/** Pack clé en main — choix de base mutuellement exclusif (§4.A). */
export type Pack = PriceLine & {
  includes: string[];
  freebies: string[];
  exclusions: string[];
  /** Badge commercial affiché sur la carte (ex: « Le plus populaire »). */
  badge?: string;
  /** Variante visuelle de la carte : "featured" (mise en avant) | "ultimate" (offre complète). */
  variant?: "featured" | "ultimate";
  /**
   * true = pack tout-inclus : toutes les options `includedAddons` sont déjà
   * comprises. Le calculateur verrouille ces options et n'ajoute aucun supplément ;
   * le total est strictement celui du pack.
   */
  allInclusive?: boolean;
  /** ids d'ADDONS déjà compris dans le pack (uniquement si allInclusive). */
  includedAddons?: string[];
  /** Prix « à la carte » équivalent, pour l'argument d'économie (barré sur la carte). */
  compareSetup?: number;
  compareMonthly?: number;
};

export const PACKS: Pack[] = [
  {
    id: "starter",
    label: "Pack Starter — Vitrine & Visibilité Locale",
    setup: 390,
    monthly: 39,
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
    setup: 690,
    monthly: 59,
    badge: "Le plus populaire",
    variant: "featured",
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
  {
    id: "ultime",
    label: "Pack Ultime — Tout-en-un & Automatisation IA",
    setup: 990,
    monthly: 199,
    badge: "Solution complète",
    variant: "ultimate",
    allInclusive: true,
    includedAddons: ["ia", "devis-express", "boutique", "ads"],
    compareSetup: 1240,
    compareMonthly: 222,
    description:
      "L'écosystème digital complet : tout le Pack Pro Connecté, un assistant IA disponible en continu, le devis express par photo, la boutique en ligne et la gestion publicitaire locale — déploiement et déplacement inclus.",
    includes: [
      "Tout le Pack Pro Connecté",
      "Assistant IA 24/7 sur WhatsApp et sur le site web",
      "Module Devis Express avec scan photo (carte grise / pièces)",
      "Boutique en ligne & paiement CB sécurisé (Stripe)",
      "Gestion publicitaire locale (Google Ads & Meta Ads)",
      "Déplacement sur site inclus (Reims et 15 km)",
    ],
    freebies: [
      "Audit & configuration de l'assistant IA offerts (valeur 190 €)",
      "Arrière-plan animé / vidéo 3D immersive en page d'accueil (valeur 49 €)",
      "Espace privé client sécurisé (valeur 49 €)",
    ],
    exclusions: [
      "Production vidéo / drone",
      "Rédaction éditoriale au long cours",
      "Développements sur-mesure hors périmètre",
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
    setup: 140,
    monthly: 49,
    description:
      "Agent conversationnel IA sur-mesure (WhatsApp et/ou widget web) : qualification des prospects, réponses aux questions fréquentes, disponibilités, 24h/24 7j/7. L'agent ne prend aucun engagement financier ferme et redirige vers un humain hors périmètre.",
  },
  {
    id: "devis-express",
    label: "Module Devis Express avec upload photo",
    setup: 70,
    monthly: 15,
    description:
      "Réception immédiate de photos (carte grise, panne, modèle) pour un devis rapide — garages, salons, artisans.",
  },
  {
    id: "boutique",
    label: "Boutique en ligne & paiement CB sécurisé",
    setup: 240,
    monthly: 29,
    description:
      "Stripe, Apple Pay, Google Pay, gestion des commandes, Click & Collect. Aucune donnée bancaire stockée en base propre (délégation intégrale à Stripe).",
  },
  {
    id: "ads",
    label: "Gestion publicitaire locale (Google Ads / Meta Ads)",
    setup: 100,
    monthly: 70,
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
