/**
 * Moteur de calcul du devis — fonction PURE, sans DOM.
 * Partagée par le calculateur navigateur (§5.2) et le test de non-régression
 * `tests/pricing.test.ts`. Aucune dépendance à Astro/au navigateur ici.
 */

import { PACKS, ADDONS, findLine, type PriceLine } from "../config/pricing";

export type QuoteSelection = {
  /** id du pack de base choisi (obligatoire pour un devis complet). */
  pack: string | null;
  /** ids des options additionnelles cochées. */
  addons: string[];
};

export type QuoteResult = {
  lines: { id: string; label: string; setup: number; monthly: number; quoteOnly: boolean }[];
  /** Somme des coûts initiaux des lignes chiffrées. */
  setupTotal: number;
  /** Somme des coûts mensuels des lignes chiffrées. */
  monthlyTotal: number;
  /** true si au moins une ligne « sur devis » est sélectionnée. */
  hasQuoteOnly: boolean;
  valid: boolean;
};

const asLine = (l: PriceLine) => ({
  id: l.id,
  label: l.label,
  setup: l.setup,
  monthly: l.monthly,
  quoteOnly: l.quoteOnly === true,
});

export function computeQuote(selection: QuoteSelection): QuoteResult {
  const lines: QuoteResult["lines"] = [];

  const pack = selection.pack ? PACKS.find((p) => p.id === selection.pack) : undefined;
  if (pack) lines.push(asLine(pack));

  // On respecte l'ordre de déclaration des ADDONS pour un récapitulatif stable.
  for (const addon of ADDONS) {
    if (selection.addons.includes(addon.id)) lines.push(asLine(addon));
  }

  const chargeable = lines.filter((l) => !l.quoteOnly);
  const setupTotal = chargeable.reduce((sum, l) => sum + l.setup, 0);
  const monthlyTotal = chargeable.reduce((sum, l) => sum + l.monthly, 0);

  return {
    lines,
    setupTotal,
    monthlyTotal,
    hasQuoteOnly: lines.some((l) => l.quoteOnly),
    valid: Boolean(pack),
  };
}

/** Formatage monétaire FR homogène (utilisé côté serveur ET client). */
export function euros(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

/** Récapitulatif texte pour WhatsApp / e-mail (§5.2). */
export function buildRecap(selection: QuoteSelection, name: string): string {
  const q = computeQuote(selection);
  const who = name.trim() ? name.trim() : "(nom à préciser)";
  const parts: string[] = [
    `Demande de devis — Vortexoptim`,
    `Client : ${who}`,
    ``,
    `Prestations sélectionnées :`,
    ...q.lines.map(
      (l) =>
        `• ${l.label} — ${l.quoteOnly ? "sur devis" : `${euros(l.setup)} + ${euros(l.monthly)}/mois`}`,
    ),
    ``,
    `Total installation : ${euros(q.setupTotal)}${q.hasQuoteOnly ? " + frais sur devis" : ""}`,
    `Total mensuel : ${euros(q.monthlyTotal)}/mois`,
  ];
  if (!q.valid) parts.push(``, `⚠️ Aucun pack de base sélectionné.`);
  return parts.join("\n");
}

export { findLine };
