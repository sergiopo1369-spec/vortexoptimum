/**
 * Variables d'environnement de l'assistant WhatsApp.
 *
 * Toutes se règlent dans Vercel → Settings → Environment Variables.
 * Aucune n'est jamais committée : ce fichier ne contient que des noms.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Variable d'environnement manquante : ${name}`);
  return value;
}

function optional(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

export const env = {
  /** Jeton arbitraire choisi par nous, recopié dans la config du webhook Meta. */
  get metaVerifyToken() {
    return required("META_VERIFY_TOKEN");
  },
  /** App Secret Meta — sert à vérifier la signature de chaque requête reçue. */
  get metaAppSecret() {
    return required("META_APP_SECRET");
  },
  /** Jeton d'accès permanent du compte système WhatsApp Business. */
  get metaAccessToken() {
    return required("WHATSAPP_TOKEN");
  },
  /** Identifiant du numéro expéditeur (Phone number ID, pas le numéro lui-même). */
  get phoneNumberId() {
    return required("WHATSAPP_PHONE_NUMBER_ID");
  },
  /** Version de l'API Graph. Épinglée : Meta déprécie les versions au fil du temps. */
  get graphVersion() {
    return process.env.WHATSAPP_GRAPH_VERSION ?? "v21.0";
  },
  /** Numéro de l'équipe, au format E.164 sans « + », qui reçoit les alertes lead. */
  get teamNumber() {
    return optional("TEAM_WHATSAPP_NUMBER");
  },

  get anthropicKey() {
    return required("ANTHROPIC_API_KEY");
  },
  /** Modèle : arbitrage qualité/latence/prix documenté dans le README §1. */
  get anthropicModel() {
    return process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";
  },
  /** Profondeur de raisonnement : low | medium | high | xhigh | max. */
  get anthropicEffort() {
    return process.env.ANTHROPIC_EFFORT ?? "medium";
  },

  /** Jeton d'intégration interne Notion (base « Prospects »). Optionnel. */
  get notionToken() {
    return optional("NOTION_TOKEN");
  },
  /** Identifiant de la base de données Notion « Prospects ». Optionnel. */
  get notionDatabaseId() {
    return optional("NOTION_DATABASE_ID");
  },

  /** Redis (Upstash/Vercel KV) : mémoire des conversations. Optionnel mais recommandé. */
  get redisUrl() {
    return optional("KV_REST_API_URL") ?? optional("UPSTASH_REDIS_REST_URL");
  },
  get redisToken() {
    return optional("KV_REST_API_TOKEN") ?? optional("UPSTASH_REDIS_REST_TOKEN");
  },
};
