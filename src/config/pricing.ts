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
    id: "essentiel",
    label: "Pack Essentiel — Site Détaillé & Sécurisé",
    setup: 600,
    monthly: 29,
    description:
      "Site web multi-pages détaillé, domaine .fr/.com, photos personnalisées de votre commerce ou artisanat, antivirus professionnel, sécurité renforcée, boutons WhatsApp/SMS et configuration complète de A à Z.",
    includes: [
      "Site web multi-pages détaillé et responsive (mobile-first)",
      "Nom de domaine .fr/.com personnalisé (1 an)",
      "Photos personnalisées de votre commerce ou artisanat",
      "Antivirus professionnel + sécurité renforcée",
      "Boutons WhatsApp, SMS et appel direct intégrés",
      "Configuration complète de A à Z (sans rien à faire de votre côté)",
    ],
    freebies: [
      "Espace privé client sécurisé (valeur 49 €)",
      "Déplacement sur site inclus dans un rayon de 15 km",
    ],
    exclusions: [
      "Blog de niche local",
      "Photos en haute définition (HD)",
      "Module interactif Devis + Photo",
    ],
  },
  {
    id: "pro",
    label: "Pack Pro — Référencement & Haute Définition",
    setup: 900,
    monthly: 39,
    badge: "Le plus populaire",
    variant: "featured",
    description:
      "Tout le Pack Essentiel, plus un site détaillé avancé, un blog de niche local pour Reims, des photos personnalisées en HD, un antivirus et pare-feu avancés, et une optimisation SEO complète pour votre positionnement Google.",
    includes: [
      "Tout le contenu du Pack Essentiel",
      "Site web détaillé avancé (pages riches et optimisées)",
      "Blog de niche locale (positionnement Reims & Grand Est)",
      "Photos personnalisées en haute définition (HD)",
      "Antivirus + pare-feu avancés",
      "Optimisation SEO complète et positionnement sur Google",
    ],
    freebies: [
      "Espace privé client sécurisé (valeur 49 €)",
      "Déplacement sur site inclus dans un rayon de 15 km",
    ],
    exclusions: [
      "Module interactif Devis + Photo",
      "Boutique en ligne e-commerce",
    ],
  },
  {
    id: "avance",
    label: "Pack Avancé — Ultra-Détaillé & Sécurité Maximale",
    setup: 1300,
    monthly: 49,
    badge: "Solution complète",
    variant: "ultimate",
    allInclusive: true,
    includedAddons: ["boutique-ecommerce"],
    compareSetup: 1490,
    compareMonthly: 59,
    description:
      "L'offre la plus complète : tout le Pack Pro, un site ultra-détaillé, le module interactif « Devis + Photo », une sécurité maximale avec antivirus dédié et des sauvegardes automatiques quotidiennes — tout inclus, sans surprise.",
    includes: [
      "Tout le Pack Pro",
      "Site web ultra-détaillé (contenu approfondi, pages riches)",
      "Module interactif « Devis + Photo » intégré",
      "Sécurité maximale + antivirus dédié",
      "Sauvegardes automatiques quotidiennes",
      "Déplacement sur site inclus (Reims et 15 km)",
    ],
    freebies: [
      "Option e-commerce offerte (valeur 190 €)",
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
 */
export const ADDONS: PriceLine[] = [
  {
    id: "boutique-ecommerce",
    label: "Option Révolutionnaire : Boutique E-commerce + Paiement CB",
    setup: 190,
    monthly: 10,
    description:
      "Moteur boutique e-commerce avec paiement par carte bancaire sécurisé (Stripe). Ajoutez une boutique à n'importe quel pack. Inclut la gestion des flux bancaires, l'antivirus e-commerce et la sécurité Stripe/CB. Prix promotionnel.",
  },
  {
    id: "ia",
    label: "Booster IA / Assistant 24/7",
    setup: 140,
    monthly: 49,
    description:
      "Agent conversationnel IA sur-mesure (WhatsApp et/ou widget web) : qualification des prospects, réponses aux questions fréquentes, disponibilités, 24h/24 7j/7. L'agent ne prend aucun engagement financier ferme et redirige vers un humain hors périmètre.",
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
