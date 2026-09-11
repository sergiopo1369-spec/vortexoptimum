import { env } from "./env.js";
import type { FicheProspect } from "./fiche.js";

/**
 * Écriture de la fiche prospect dans la base Notion « Prospects ».
 *
 * Le schéma attendu est décrit dans `docs/agent-whatsapp/README.md` §2. Si une
 * propriété manque côté Notion, l'API renvoie une 400 : l'appelant journalise
 * et continue — perdre l'enregistrement CRM ne doit jamais empêcher la réponse
 * au prospect ni l'alerte à l'équipe.
 */

const NOTION_VERSION = "2022-06-28";

async function notion(
  path: string,
  method: "POST" | "PATCH",
  body: unknown,
): Promise<{ id: string }> {
  const response = await fetch(`https://api.notion.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.notionToken}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Notion ${response.status} : ${await response.text()}`);
  }
  return (await response.json()) as { id: string };
}

const titre = (value: string | null) => ({
  title: [{ text: { content: value ?? "Prospect sans nom" } }],
});
const richText = (value: string | null) => ({
  // Notion refuse au-delà de 2000 caractères par bloc de texte.
  rich_text: value ? [{ text: { content: value.slice(0, 2000) } }] : [],
});
const select = (value: string | null) => ({
  select: value ? { name: value } : null,
});
const multiSelect = (values: string[]) => ({
  multi_select: values.map((name) => ({ name })),
});
const checkbox = (value: boolean | null) => ({ checkbox: value === true });

function proprietes(fiche: FicheProspect, numeroWhatsApp: string) {
  return {
    nom_client: titre(fiche.nom_client),
    enseigne: richText(fiche.enseigne),
    telephone: { phone_number: fiche.telephone ?? null },
    email: { email: fiche.email ?? null },
    type_commerce: select(fiche.type_commerce),
    commune: richText(fiche.commune),
    dans_rayon_15km: checkbox(fiche.dans_rayon_15km),
    besoin: richText(fiche.besoin),
    pack_recommande: select(fiche.pack_recommande),
    options_evoquees: multiSelect(fiche.options_evoquees),
    canal_prefere: select(fiche.canal_prefere),
    creneaux_souhaites: richText(fiche.creneaux_souhaites.join(" · ") || null),
    consentement_rgpd: checkbox(fiche.consentement_rgpd),
    statut_projet: select(fiche.statut_projet),
    escalade: checkbox(fiche.escalade),
    motif_escalade: richText(fiche.motif_escalade),
    notes_privees: richText(fiche.notes_privees),
    resume_pour_equipe: richText(fiche.resume_pour_equipe),
    numero_whatsapp: richText(`+${numeroWhatsApp}`),
  };
}

export function notionConfigure(): boolean {
  return Boolean(env.notionToken && env.notionDatabaseId);
}

/** Crée la page prospect et renvoie son identifiant. */
export async function creerProspect(
  fiche: FicheProspect,
  numeroWhatsApp: string,
): Promise<string> {
  const page = await notion("pages", "POST", {
    parent: { database_id: env.notionDatabaseId },
    properties: proprietes(fiche, numeroWhatsApp),
  });
  return page.id;
}

/** Met à jour une page existante (la fiche est réémise quand une info change). */
export async function actualiserProspect(
  pageId: string,
  fiche: FicheProspect,
  numeroWhatsApp: string,
): Promise<void> {
  await notion(`pages/${pageId}`, "PATCH", {
    properties: proprietes(fiche, numeroWhatsApp),
  });
}
