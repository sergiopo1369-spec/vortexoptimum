/**
 * Extraction du bloc `FICHE_PROSPECT` émis par l'agent (§4.2 du prompt système).
 *
 * Deux responsabilités, et la seconde est critique : le bloc contient des notes
 * privées (budget évoqué, appréciation commerciale) et ne doit JAMAIS être
 * renvoyé au prospect. Tout ce que cette fonction ne retire pas part sur WhatsApp.
 */

export type TypeCommerce =
  | "garage"
  | "coiffure"
  | "restauration"
  | "btp_artisanat"
  | "autre";
export type PackRecommande = "starter" | "pro" | "ultime";
export type CanalPrefere = "whatsapp" | "sms" | "visite_sur_place";
export type OptionEvoquee =
  | "ia"
  | "devis-express"
  | "boutique"
  | "ads"
  | "deplacement-plus-15km";

export type FicheProspect = {
  nom_client: string | null;
  enseigne: string | null;
  telephone: string | null;
  email: string | null;
  type_commerce: TypeCommerce | null;
  commune: string | null;
  dans_rayon_15km: boolean | null;
  besoin: string | null;
  pack_recommande: PackRecommande | null;
  options_evoquees: OptionEvoquee[];
  canal_prefere: CanalPrefere | null;
  creneaux_souhaites: string[];
  consentement_rgpd: boolean;
  statut_projet: "prospect";
  escalade: boolean;
  motif_escalade: string | null;
  notes_privees: string | null;
  resume_pour_equipe: string | null;
};

const TYPES_COMMERCE: TypeCommerce[] = [
  "garage",
  "coiffure",
  "restauration",
  "btp_artisanat",
  "autre",
];
const PACKS: PackRecommande[] = ["starter", "pro", "ultime"];
const CANAUX: CanalPrefere[] = ["whatsapp", "sms", "visite_sur_place"];
const OPTIONS: OptionEvoquee[] = [
  "ia",
  "devis-express",
  "boutique",
  "ads",
  "deplacement-plus-15km",
];

/**
 * Repère les blocs de code dont l'en-tête mentionne FICHE_PROSPECT.
 * Tolérant sur la forme (```FICHE_PROSPECT, ```json FICHE_PROSPECT, ~~~) parce
 * qu'un bloc mal détecté serait affiché tel quel au prospect.
 */
const BLOC = /(?:^|\n)[ \t]*(```|~~~)[ \t]*(?:json[ \t]+)?FICHE_PROSPECT[ \t]*\r?\n([\s\S]*?)\r?\n[ \t]*\1[ \t]*(?=\n|$)/gi;

export type ExtractionFiche = {
  /** Le texte à envoyer au prospect, bloc retiré et espaces normalisés. */
  reponseClient: string;
  /** La fiche validée, ou `undefined` si absente ou invalide. */
  fiche?: FicheProspect;
  /** Renseigné si un bloc était présent mais inexploitable (JSON cassé…). */
  erreur?: string;
};

export function extraireFiche(reponseModele: string): ExtractionFiche {
  const blocs = [...reponseModele.matchAll(BLOC)];
  const reponseClient = reponseModele
    .replace(BLOC, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (blocs.length === 0) return { reponseClient };

  // Si le modèle en a émis plusieurs, le dernier fait foi (§4.2 : réémission
  // de la fiche complète et mise à jour).
  const brut = blocs[blocs.length - 1][2];
  let parsed: unknown;
  try {
    parsed = JSON.parse(brut);
  } catch (error) {
    return {
      reponseClient,
      erreur: `JSON invalide dans FICHE_PROSPECT : ${(error as Error).message}`,
    };
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { reponseClient, erreur: "FICHE_PROSPECT n'est pas un objet JSON." };
  }

  return { reponseClient, fiche: normaliser(parsed as Record<string, unknown>) };
}

function texte(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function booleen(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function dansListe<T extends string>(value: unknown, liste: T[]): T | null {
  return typeof value === "string" && (liste as string[]).includes(value)
    ? (value as T)
    : null;
}

function listeDeTextes(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(texte).filter((v): v is string => v !== null);
}

/** Normalise un numéro français en E.164 (+33…). Renvoie null si non reconnu. */
export function normaliserTelephone(value: unknown): string | null {
  const brut = texte(value);
  if (!brut) return null;

  const chiffres = brut.replace(/[^\d+]/g, "");
  if (/^\+33[1-9]\d{8}$/.test(chiffres)) return chiffres;
  if (/^0[1-9]\d{8}$/.test(chiffres)) return `+33${chiffres.slice(1)}`;
  if (/^33[1-9]\d{8}$/.test(chiffres)) return `+${chiffres}`;
  // Numéro étranger plausible : on le garde tel quel plutôt que de le perdre.
  if (/^\+\d{8,15}$/.test(chiffres)) return chiffres;
  return null;
}

function normaliser(raw: Record<string, unknown>): FicheProspect {
  const consentement = booleen(raw.consentement_rgpd) === true;

  // §3 étape 5 : sans consentement explicite, aucune coordonnée n'est conservée.
  // La règle est réappliquée ici et pas seulement demandée au modèle : c'est une
  // obligation RGPD, elle ne doit dépendre d'aucune réponse de l'IA.
  const coordonnee = (value: unknown) => (consentement ? texte(value) : null);

  return {
    nom_client: coordonnee(raw.nom_client),
    enseigne: coordonnee(raw.enseigne),
    telephone: consentement ? normaliserTelephone(raw.telephone) : null,
    email: coordonnee(raw.email),
    type_commerce: dansListe(raw.type_commerce, TYPES_COMMERCE),
    commune: texte(raw.commune),
    dans_rayon_15km: booleen(raw.dans_rayon_15km),
    besoin: texte(raw.besoin),
    pack_recommande: dansListe(raw.pack_recommande, PACKS),
    options_evoquees: listeDeTextes(raw.options_evoquees).filter(
      (option): option is OptionEvoquee => (OPTIONS as string[]).includes(option),
    ),
    canal_prefere: dansListe(raw.canal_prefere, CANAUX),
    creneaux_souhaites: listeDeTextes(raw.creneaux_souhaites),
    consentement_rgpd: consentement,
    statut_projet: "prospect",
    escalade: booleen(raw.escalade) === true,
    motif_escalade: texte(raw.motif_escalade),
    notes_privees: texte(raw.notes_privees),
    resume_pour_equipe: texte(raw.resume_pour_equipe),
  };
}
