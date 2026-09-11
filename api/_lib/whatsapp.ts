import { env } from "./env.js";

/** Limite d'un message texte WhatsApp. On découpe plutôt que de tronquer. */
const LIMITE_CARACTERES = 4096;

async function graph(path: string, body: unknown): Promise<void> {
  const response = await fetch(
    `https://graph.facebook.com/${env.graphVersion}/${path}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.metaAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  if (!response.ok) {
    throw new Error(
      `Graph API ${response.status} sur ${path} : ${await response.text()}`,
    );
  }
}

/** Découpe sur les sauts de ligne, puis sur les espaces, en dernier recours brutalement. */
export function decouper(texte: string, limite = LIMITE_CARACTERES): string[] {
  if (texte.length <= limite) return [texte];

  const morceaux: string[] = [];
  let reste = texte;
  while (reste.length > limite) {
    const fenetre = reste.slice(0, limite);
    const coupure = Math.max(
      fenetre.lastIndexOf("\n\n"),
      fenetre.lastIndexOf("\n"),
      fenetre.lastIndexOf(" "),
    );
    const index = coupure > limite * 0.5 ? coupure : limite;
    morceaux.push(reste.slice(0, index).trim());
    reste = reste.slice(index).trim();
  }
  if (reste.length > 0) morceaux.push(reste);
  return morceaux;
}

/** Envoie un message texte. `destinataire` est au format E.164 sans « + ». */
export async function envoyerTexte(
  destinataire: string,
  texte: string,
): Promise<void> {
  for (const morceau of decouper(texte)) {
    await graph(`${env.phoneNumberId}/messages`, {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: destinataire,
      type: "text",
      // preview_url: false — un lien vers vortexoptim.fr ne doit pas générer
      // un encart d'aperçu qui noie un message court.
      text: { preview_url: false, body: morceau },
    });
  }
}

/** Accusé de lecture : le prospect voit les deux coches bleues pendant que Claude réfléchit. */
export async function marquerCommeLu(messageId: string): Promise<void> {
  await graph(`${env.phoneNumberId}/messages`, {
    messaging_product: "whatsapp",
    status: "read",
    message_id: messageId,
  });
}
