/*
  Mise en forme et validation d'une demande de rendez-vous.

  Isolé du composant pour être testable sans navigateur : la validation et la
  construction des liens sont des fonctions pures, couvertes par tests/rendezvous.test.ts.

  Aucune persistance ici. Le CRM (PocketBase/Supabase, §8 du cahier des charges)
  n'existe pas encore dans ce projet et le site est en sortie statique : une route
  API ne tournerait pas. Le point d'accroche est prévu — voir `construireCharge`,
  dont la sortie est directement le corps JSON à POSTER le jour où le CRM existe.
*/

export type Demande = {
  nomComplet: string;
  telephone: string;
  email: string;
  secteur: string;
  situation: string;
  objectifs: string[];
  interet: string;
  typeReunion: string;
  lieu: string;
  creneau: string;
  date: string;
  consentement: boolean;
};

/** Messages d'erreur affichés sous les champs — explicites, jamais « champ invalide ». */
export type Erreurs = Partial<Record<keyof Demande, string>>;

/**
 * Téléphone au format E.164 : un « + », un indicatif, 8 à 14 chiffres ensuite.
 * Les espaces et points de séparation sont tolérés à la saisie puis retirés.
 */
export function normaliserTelephone(brut: string): string {
  return brut.replace(/[\s.\-()]/g, "");
}

export function telephoneValide(brut: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(normaliserTelephone(brut));
}

export function emailValide(valeur: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(valeur.trim());
}

/**
 * Une date de rendez-vous doit être future et tomber un jour ouvré.
 * `aujourdHui` est injectable pour que les tests ne dépendent pas de l'horloge.
 */
export function dateValide(iso: string, aujourdHui = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [a, m, j] = iso.split("-").map(Number);
  // Construite en heure locale à midi : évite qu'un décalage de fuseau ne
  // fasse basculer la date d'un jour et n'invalide un vendredi en samedi.
  const d = new Date(a, m - 1, j, 12, 0, 0);
  if (d.getFullYear() !== a || d.getMonth() !== m - 1 || d.getDate() !== j) return false;

  const jour = d.getDay();
  if (jour === 0 || jour === 6) return false;

  const borne = new Date(aujourdHui);
  borne.setHours(0, 0, 0, 0);
  return d.getTime() >= borne.getTime();
}

/** Première date ouvrée à partir d'aujourd'hui, au format AAAA-MM-JJ. */
export function premierJourOuvre(aujourdHui = new Date()): string {
  const d = new Date(aujourdHui);
  d.setHours(12, 0, 0, 0);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Valide une étape donnée. Retourne les erreurs par champ, vide si l'étape passe. */
export function validerEtape(n: number, d: Partial<Demande>, aujourdHui = new Date()): Erreurs {
  const e: Erreurs = {};

  if (n === 1) {
    const nom = (d.nomComplet ?? "").trim();
    if (nom.length < 2) e.nomComplet = "Indiquez votre nom, au moins 2 caractères.";
    else if (nom.length > 120) e.nomComplet = "Ce nom dépasse 120 caractères.";

    if (!(d.telephone ?? "").trim()) e.telephone = "Indiquez un numéro pour être rappelé sur WhatsApp.";
    else if (!telephoneValide(d.telephone!))
      e.telephone = "Numéro au format international attendu, par exemple +33 6 12 34 56 78.";

    if (!(d.email ?? "").trim()) e.email = "Indiquez une adresse e-mail.";
    else if (!emailValide(d.email!)) e.email = "Cette adresse e-mail semble incomplète.";
  }

  if (n === 2) {
    if (!d.secteur) e.secteur = "Choisissez votre secteur d'activité.";
    if (!d.situation) e.situation = "Indiquez votre situation actuelle.";
    if (!d.objectifs?.length) e.objectifs = "Sélectionnez au moins un objectif.";
  }

  if (n === 3) {
    if (!d.typeReunion) e.typeReunion = "Choisissez le format du rendez-vous.";
    if (d.typeReunion === "presentiel" && !(d.lieu ?? "").trim())
      e.lieu = "Indiquez l'adresse ou la zone du local pour que nous puissions nous déplacer.";
  }

  if (n === 4) {
    if (!d.creneau) e.creneau = "Choisissez une plage horaire.";
    if (!d.date) e.date = "Choisissez une date.";
    else if (!dateValide(d.date, aujourdHui))
      e.date = "Choisissez un jour ouvré à venir, du lundi au vendredi.";
    if (!d.consentement) e.consentement = "Votre accord est nécessaire pour traiter la demande.";
  }

  return e;
}

/** Récapitulatif texte, repris tel quel dans WhatsApp et dans l'e-mail. */
export function construireRecap(d: Demande, libelles: Record<string, string>): string {
  const l = (v: string) => libelles[v] ?? v;
  const lignes = [
    "Nouvelle demande de rendez-vous — Vortexoptimum",
    "",
    `Nom : ${d.nomComplet}`,
    `Téléphone : ${d.telephone}`,
    `E-mail : ${d.email}`,
    `Secteur : ${l(d.secteur)}`,
    `Situation : ${l(d.situation)}`,
    `Objectifs : ${d.objectifs.map(l).join(", ")}`,
  ];
  if (d.interet) lignes.push(`Formule envisagée : ${l(d.interet)}`);
  lignes.push(`Format : ${l(d.typeReunion)}${d.lieu ? ` — ${d.lieu}` : ""}`);
  lignes.push(`Disponibilité : ${l(d.creneau)} — ${d.date}`);
  return lignes.join("\n");
}

export function lienWhatsApp(numero: string, recap: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(recap)}`;
}

export function lienEmail(destinataire: string, d: Demande, recap: string): string {
  const sujet = `Demande de rendez-vous — ${d.nomComplet}`;
  return `mailto:${destinataire}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(recap)}`;
}

/*
  Point d'accroche CRM. Cette fonction ne fait qu'assembler l'objet ; personne ne
  l'envoie aujourd'hui. Le jour où le micro-CRM existe, il suffira d'un
  `fetch("/api/qualification", { method: "POST", body: JSON.stringify(construireCharge(d)) })`
  côté client et d'une route serveur qui insère avec une clé de service — jamais
  une clé publique dans le navigateur. La sortie suit déjà le mapping §5.2 :
  nomComplet → nom_client, telephone → telephone, secteur → type_commerce,
  statut_projet fixé à « prospect », consentement → consentement_rgpd.
*/
export function construireCharge(d: Demande): Record<string, unknown> {
  return {
    nom_client: d.nomComplet,
    telephone: normaliserTelephone(d.telephone),
    email: d.email.trim(),
    type_commerce: d.secteur,
    statut_projet: "prospect",
    consentement_rgpd: d.consentement,
    qualification: {
      situation: d.situation,
      objectifs: d.objectifs,
      interet: d.interet || null,
      type_reunion: d.typeReunion,
      lieu: d.lieu || null,
      creneau: d.creneau,
      date_souhaitee: d.date,
    },
  };
}
