/**
 * Configuration centrale de l'identité et des canaux de contact.
 * ⚠️ Les valeurs marquées TODO doivent être confirmées avant mise en production
 *    (voir §7.1 et §17.2 du cahier des charges — mentions légales).
 */

export const SITE = {
  name: "Vortexoptim",
  legalName: "Vortexoptim", // TODO: raison sociale exacte + forme juridique (auto-entrepreneur / SARL…)
  tagline: "Écosystèmes digitaux & agents IA pour les commerces de Reims",
  description:
    "Agence digitale et ingénierie IA de proximité à Reims. Site haute performance, prise de rendez-vous, paiement en ligne et assistant IA — déploiement rapide, contact humain direct.",
  // TODO: domaine définitif. Utilisé pour les URLs canoniques, le sitemap et l'Open Graph.
  url: "https://www.vortexoptim.fr",
  locale: "fr-FR",
  lang: "fr",
  zone: "Reims & Grand Est",
  serviceRadiusKm: 15,
  // Adresse e-mail professionnelle de l'entreprise (§2.4).
  email: "vortex.optimum1@gmail.com",
  siret: "", // TODO: SIRET / SIREN (§17.2)
  legalForm: "", // TODO: statut juridique (§17.2)
  publicationDirector: "", // TODO: directeur de publication (§17.2)
  host: {
    name: "", // TODO: nom de l'hébergeur retenu (§17.2)
    address: "", // TODO
  },
} as const;

/** Canaux de contact direct et engagements de réponse (§2.4). */
export const CONTACT = {
  whatsapp: {
    label: "WhatsApp Pro",
    display: "+33 7 58 18 76 75",
    e164: "+33758187675",
    waMe: "33758187675", // format wa.me (sans +)
    sla: "Réponse < 2h (jours ouvrés, 9h–19h)",
  },
  sms: {
    label: "SMS direct",
    display: "+33 7 45 37 18 62",
    e164: "+33745371862",
    sla: "Réponse < 1h (jours ouvrés, 9h–19h)",
  },
  calcom: {
    label: "Appel découverte (15 min)",
    // TODO: lien Cal.com définitif
    url: "https://cal.com/vortexoptim/decouverte",
    sla: "Créneau proposé sous 72h",
  },
  email: {
    label: "E-mail",
    sla: "Réponse < 24h ouvrées",
  },
  hours: "Jours ouvrés, 9h–19h",
} as const;

/** Réseaux / profils externes (SEO local — §2.4 / §9). */
export const PROFILES = {
  // TODO: URL de la fiche Google Business Profile une fois revendiquée
  googleBusiness: "",
} as const;

export const NAV: { href: string; label: string; lock?: boolean }[] = [
  { href: "/", label: "Accueil" },
  { href: "/offres", label: "Offres & tarifs" },
  { href: "/devis", label: "Devis en ligne" },
  { href: "/blog", label: "Blog" },
  // Espace privé protégé par mot de passe (gate client-side, voir src/pages/3d/index.astro).
  { href: "/3d", label: "Boutique 3D", lock: true },
];

export const LEGAL_NAV: { href: string; label: string }[] = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/politique-de-confidentialite", label: "Confidentialité" },
  { href: "/cgv", label: "CGV" },
];
