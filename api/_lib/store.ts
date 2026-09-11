import { env } from "./env.js";

/**
 * Mémoire des conversations, indexée par numéro WhatsApp.
 *
 * Backend Redis REST (Vercel KV / Upstash) si configuré, sinon mémoire du
 * processus — suffisant pour tester en local, mais perdu à chaque démarrage à
 * froid en production : sans Redis, l'agent redemande le nom à chaque message.
 */

const memory = new Map<string, { value: string; expiresAt: number }>();

async function redis(command: (string | number)[]): Promise<unknown> {
  const url = env.redisUrl;
  const token = env.redisToken;
  if (!url || !token) return undefined;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });
  if (!response.ok) {
    throw new Error(`Redis ${response.status} : ${await response.text()}`);
  }
  const payload = (await response.json()) as { result?: unknown };
  return payload.result;
}

const usingRedis = () => Boolean(env.redisUrl && env.redisToken);

export async function getJson<T>(key: string): Promise<T | undefined> {
  if (usingRedis()) {
    const result = await redis(["GET", key]);
    return typeof result === "string" ? (JSON.parse(result) as T) : undefined;
  }
  const entry = memory.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt < Date.now()) {
    memory.delete(key);
    return undefined;
  }
  return JSON.parse(entry.value) as T;
}

export async function setJson(
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> {
  const serialized = JSON.stringify(value);
  if (usingRedis()) {
    await redis(["SET", key, serialized, "EX", ttlSeconds]);
    return;
  }
  memory.set(key, { value: serialized, expiresAt: Date.now() + ttlSeconds * 1000 });
}

/**
 * Marque un identifiant de message comme traité. Renvoie `true` la première fois
 * seulement : Meta réémet le même webhook tant qu'il n'a pas reçu un 200, et
 * l'appel à Claude dure quelques secondes — sans ce garde-fou, le prospect
 * reçoit deux réponses.
 */
export async function claimMessage(messageId: string): Promise<boolean> {
  const key = `wa:seen:${messageId}`;
  if (usingRedis()) {
    // NX : n'écrit que si la clé n'existe pas. La réponse est null si elle existait.
    const result = await redis(["SET", key, "1", "NX", "EX", 900]);
    return result !== null && result !== undefined;
  }
  if (memory.has(key)) return false;
  memory.set(key, { value: "1", expiresAt: Date.now() + 900_000 });
  return true;
}
