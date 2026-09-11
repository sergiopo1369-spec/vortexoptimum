import Anthropic from "@anthropic-ai/sdk";
import { env } from "./env.js";
import { SYSTEM_PROMPT } from "./prompt.generated.js";

export type Tour = { role: "user" | "assistant"; content: string };

let client: Anthropic | undefined;
function getClient(): Anthropic {
  // Instancié à la demande : la clé n'est lue qu'au premier appel, ce qui laisse
  // la vérification du webhook (GET) fonctionner même si ANTHROPIC_API_KEY manque.
  client ??= new Anthropic({ apiKey: env.anthropicKey });
  return client;
}

/**
 * Contexte temporel injecté à chaque appel.
 *
 * Placé dans un SECOND bloc système, après le point de cache : le prompt système
 * (≈ 9 000 jetons) reste identique d'un appel à l'autre et donc mis en cache,
 * alors qu'une date collée dans le bloc principal invaliderait le cache à chaque
 * message (voir `shared/prompt-caching.md` : le cache est un préfixe exact).
 */
function contexteTemporel(maintenant: Date): string {
  const formate = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    dateStyle: "full",
    timeStyle: "short",
  }).format(maintenant);

  const dansVingtQuatreHeures = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    dateStyle: "full",
  }).format(new Date(maintenant.getTime() + 24 * 60 * 60 * 1000));

  return [
    `Date et heure actuelles (Europe/Paris) : ${formate}.`,
    `Aucun créneau ne peut être proposé avant le ${dansVingtQuatreHeures} (délai minimum de 24h, §2.2).`,
    "Calcule les jours de la semaine à partir de cette date ; ne propose jamais un samedi, un dimanche ou un jour férié français.",
  ].join("\n");
}

export async function repondre(
  historique: Tour[],
  maintenant = new Date(),
): Promise<string> {
  const response = await getClient().messages.create({
    model: env.anthropicModel,
    max_tokens: 4000,
    thinking: { type: "adaptive" },
    output_config: {
      effort: env.anthropicEffort as "low" | "medium" | "high" | "xhigh" | "max",
    },
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
      { type: "text", text: contexteTemporel(maintenant) },
    ],
    messages: historique.map((tour) => ({
      role: tour.role,
      content: tour.content,
    })),
  });

  if (response.stop_reason === "refusal") {
    // Le modèle a décliné : on ne renvoie rien d'inventé au prospect, l'appelant
    // bascule sur le message de repli et l'équipe est alertée.
    throw new Error(
      `Réponse refusée par le modèle (${response.stop_details?.category ?? "sans catégorie"}).`,
    );
  }

  const texte = response.content
    .filter((bloc): bloc is Anthropic.TextBlock => bloc.type === "text")
    .map((bloc) => bloc.text)
    .join("\n")
    .trim();

  if (!texte) throw new Error("Réponse vide du modèle.");
  return texte;
}
