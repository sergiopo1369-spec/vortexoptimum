import type { VercelRequest, VercelResponse } from "@vercel/node";
import { env } from "./_lib/env.js";
import { verifyMetaSignature } from "./_lib/signature.js";
import { claimMessage, getJson, setJson } from "./_lib/store.js";
import { envoyerTexte, marquerCommeLu } from "./_lib/whatsapp.js";
import { repondre, type Tour } from "./_lib/claude.js";
import { extraireFiche, type FicheProspect } from "./_lib/fiche.js";
import {
  actualiserProspect,
  creerProspect,
  notionConfigure,
} from "./_lib/notion.js";

/**
 * Webhook WhatsApp Cloud API → Claude → Notion → alerte équipe.
 *
 * Flux complet documenté dans `docs/agent-whatsapp/README.md` §2, marche à
 * suivre de branchement dans `docs/agent-whatsapp/INSTALLATION.md`.
 */

// L'appel au modèle prend quelques secondes ; la limite par défaut est trop juste.
export const config = { maxDuration: 60 };

/** Historique conservé 30 jours ; au-delà la conversation repart de zéro (§7.3 RGPD). */
const RETENTION_SECONDES = 30 * 24 * 60 * 60;
/** Fenêtre de contexte envoyée au modèle : large de quoi mener une qualification complète. */
const TOURS_MAX = 40;

const MESSAGE_DE_REPLI =
  "Je rencontre un souci technique de mon côté. Votre message est bien arrivé : " +
  "notre équipe vous répondra pendant nos horaires d'ouverture, du lundi au vendredi de 9h à 19h.";

type Etat = { historique: Tour[]; notionPageId?: string };

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
): Promise<void> {
  if (request.method === "GET") {
    verifierWebhook(request, response);
    return;
  }
  if (request.method !== "POST") {
    response.status(405).json({ error: "Méthode non autorisée" });
    return;
  }

  const rawBody = await lireCorpsBrut(request);
  if (
    !verifyMetaSignature(
      rawBody,
      request.headers["x-hub-signature-256"] as string | undefined,
      env.metaAppSecret,
    )
  ) {
    // Requête non signée par Meta : on ne la traite pas, et on n'explique pas pourquoi.
    response.status(401).json({ error: "Signature invalide" });
    return;
  }

  let payload: MetaWebhook;
  try {
    payload = JSON.parse(rawBody.toString("utf8")) as MetaWebhook;
  } catch {
    response.status(400).json({ error: "Corps illisible" });
    return;
  }

  for (const message of messagesEntrants(payload)) {
    try {
      await traiter(message);
    } catch (erreur) {
      console.error("[whatsapp] échec du traitement", erreur);
      await secours(message.from, erreur);
    }
  }

  // Toujours 200 après une signature valide : un non-200 déclenche la réémission
  // du webhook par Meta alors que l'événement est déjà consommé (voir claimMessage).
  response.status(200).json({ received: true });
}

/** Échange de vérification, à l'enregistrement du webhook côté Meta. */
function verifierWebhook(request: VercelRequest, response: VercelResponse): void {
  const mode = request.query["hub.mode"];
  const token = request.query["hub.verify_token"];
  const challenge = request.query["hub.challenge"];

  if (mode === "subscribe" && token === env.metaVerifyToken) {
    response.status(200).send(String(challenge ?? ""));
    return;
  }
  response.status(403).json({ error: "Jeton de vérification invalide" });
}

/**
 * Le corps brut est indispensable : la signature HMAC porte sur les octets reçus,
 * qu'un aller-retour JSON.parse/stringify ne reproduit pas fidèlement.
 */
async function lireCorpsBrut(request: VercelRequest): Promise<Buffer> {
  const dejaLu = (request as { body?: unknown }).body;
  if (Buffer.isBuffer(dejaLu)) return dejaLu;
  if (typeof dejaLu === "string") return Buffer.from(dejaLu, "utf8");

  const morceaux: Buffer[] = [];
  for await (const morceau of request) {
    morceaux.push(Buffer.isBuffer(morceau) ? morceau : Buffer.from(morceau));
  }
  if (morceaux.length > 0) return Buffer.concat(morceaux);

  // Dernier recours : le corps a déjà été consommé et parsé en amont.
  return Buffer.from(dejaLu ? JSON.stringify(dejaLu) : "", "utf8");
}

type MessageEntrant = {
  id: string;
  from: string;
  type: string;
  texte?: string;
};

type MetaWebhook = {
  entry?: {
    changes?: {
      value?: {
        messages?: {
          id: string;
          from: string;
          type: string;
          text?: { body?: string };
        }[];
      };
    }[];
  }[];
};

function messagesEntrants(payload: MetaWebhook): MessageEntrant[] {
  const messages: MessageEntrant[] = [];
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      // Les accusés `statuses` (livré / lu) arrivent par le même webhook : rien à traiter.
      for (const message of change.value?.messages ?? []) {
        messages.push({
          id: message.id,
          from: message.from,
          type: message.type,
          texte: message.text?.body,
        });
      }
    }
  }
  return messages;
}

async function traiter(message: MessageEntrant): Promise<void> {
  if (!(await claimMessage(message.id))) {
    console.log(`[whatsapp] message ${message.id} déjà traité, ignoré`);
    return;
  }

  // Accusé de lecture : agréable côté prospect, jamais bloquant.
  marquerCommeLu(message.id).catch((erreur) =>
    console.warn("[whatsapp] accusé de lecture impossible", erreur),
  );

  if (message.type !== "text" || !message.texte?.trim()) {
    await envoyerTexte(
      message.from,
      "Je ne peux lire que les messages écrits pour le moment. " +
        "Pouvez-vous m'écrire votre demande en quelques mots ?",
    );
    return;
  }

  const cle = `wa:conv:${message.from}`;
  const etat = (await getJson<Etat>(cle)) ?? { historique: [] };
  const tourEntrant: Tour = { role: "user", content: message.texte.trim() };
  const historique: Tour[] = [...etat.historique, tourEntrant].slice(-TOURS_MAX);

  const reponseModele = await repondre(historique);
  const { reponseClient, fiche, erreur } = extraireFiche(reponseModele);

  if (erreur) console.warn(`[whatsapp] ${erreur}`);
  if (reponseClient) await envoyerTexte(message.from, reponseClient);

  const notionPageId = fiche
    ? await enregistrer(fiche, message.from, etat.notionPageId)
    : etat.notionPageId;

  // On mémorise la réponse COMPLÈTE, bloc fiche compris : c'est ainsi que l'agent
  // sait qu'il a déjà émis une fiche et ne la réémet qu'en cas de changement
  // (§4.2). Seul le prospect ne voit jamais ce bloc.
  const tourSortant: Tour = { role: "assistant", content: reponseModele };
  await setJson(
    cle,
    {
      historique: [...historique, tourSortant].slice(-TOURS_MAX),
      notionPageId,
    } satisfies Etat,
    RETENTION_SECONDES,
  );
}

/** Notion puis alerte équipe. Un échec CRM ne doit pas faire perdre le lead. */
async function enregistrer(
  fiche: FicheProspect,
  numero: string,
  pageIdExistant: string | undefined,
): Promise<string | undefined> {
  let pageId = pageIdExistant;

  if (notionConfigure()) {
    try {
      if (pageId) {
        await actualiserProspect(pageId, fiche, numero);
      } else {
        pageId = await creerProspect(fiche, numero);
      }
    } catch (erreur) {
      console.error("[whatsapp] écriture Notion impossible", erreur);
    }
  }

  await alerterEquipe(fiche, numero);
  return pageId;
}

async function alerterEquipe(
  fiche: FicheProspect,
  numero: string,
): Promise<void> {
  if (!env.teamNumber) return;

  const horsRayon = fiche.dans_rayon_15km === false ? " (hors rayon 15 km)" : "";
  const lignes = [
    fiche.escalade ? "🚨 *Escalade demandée*" : "✅ *Nouveau lead WhatsApp*",
    `*${fiche.nom_client ?? "Nom non communiqué"}* — ${fiche.enseigne ?? "enseigne inconnue"}`,
    fiche.commune ? `Commune : ${fiche.commune}${horsRayon}` : null,
    fiche.telephone ? `Téléphone : ${fiche.telephone}` : `WhatsApp : +${numero}`,
    fiche.pack_recommande ? `Pack évoqué : ${fiche.pack_recommande}` : null,
    fiche.canal_prefere ? `Canal souhaité : ${fiche.canal_prefere}` : null,
    fiche.creneaux_souhaites.length > 0
      ? `Créneaux : ${fiche.creneaux_souhaites.join(" · ")}`
      : null,
    fiche.motif_escalade ? `Motif : ${fiche.motif_escalade}` : null,
    fiche.resume_pour_equipe ?? fiche.besoin,
    fiche.consentement_rgpd
      ? null
      : "⚠️ Consentement RGPD refusé : aucune coordonnée enregistrée, pas de relance.",
  ].filter((ligne): ligne is string => Boolean(ligne));

  try {
    await envoyerTexte(env.teamNumber, lignes.join("\n"));
  } catch (erreur) {
    console.error("[whatsapp] alerte équipe impossible", erreur);
  }
}

/** Le prospect ne reste jamais sans réponse, et l'équipe est prévenue de la panne. */
async function secours(numero: string, erreur: unknown): Promise<void> {
  try {
    await envoyerTexte(numero, MESSAGE_DE_REPLI);
  } catch (echec) {
    console.error("[whatsapp] message de repli non envoyé", echec);
  }

  if (!env.teamNumber) return;
  try {
    await envoyerTexte(
      env.teamNumber,
      `⚠️ Assistant WhatsApp en erreur sur la conversation +${numero}.\n` +
        `${erreur instanceof Error ? erreur.message : String(erreur)}\n` +
        "Le prospect a reçu le message de repli : à rappeler.",
    );
  } catch (echec) {
    console.error("[whatsapp] alerte panne non envoyée", echec);
  }
}
