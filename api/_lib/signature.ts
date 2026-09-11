import crypto from "node:crypto";

/**
 * Vérifie la signature `X-Hub-Signature-256` que Meta joint à chaque webhook.
 *
 * Sans cette vérification, n'importe qui connaissant l'URL publique pourrait
 * injecter de faux messages — donc faire parler l'agent au nom de l'agence et
 * créer de fausses fiches prospect. Comparaison à temps constant.
 */
export function verifyMetaSignature(
  rawBody: Buffer,
  headerValue: string | undefined,
  appSecret: string,
): boolean {
  if (!headerValue?.startsWith("sha256=")) return false;

  const expected = crypto
    .createHmac("sha256", appSecret)
    .update(rawBody)
    .digest("hex");
  const received = headerValue.slice("sha256=".length);

  // timingSafeEqual exige des longueurs égales : on écarte d'abord le cas trivial.
  if (received.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}
