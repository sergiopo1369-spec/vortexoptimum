import { describe, it, expect } from "vitest";
import { PACKS, ADDONS } from "../src/config/pricing";
import { computeQuote, buildRecap, type QuoteSelection } from "../src/lib/quote";

/**
 * Test de NON-RÉGRESSION du calculateur de devis.
 * Exigences : §5.2 (« le total affiché doit toujours correspondre exactement à la
 * somme des lignes cochées ») et §11 (plan de tests — cohérence prix vs. grille §4).
 *
 * Les valeurs ci-dessous sont recopiées À LA MAIN depuis le cahier des charges §4.
 * Si un prix change dans src/config/pricing.ts sans être un changement voulu et
 * documenté (§17.3), ce test doit échouer.
 */

const GRID = {
  starter: { setup: 190, monthly: 19 },
  pro: { setup: 299, monthly: 19 },
  ia: { setup: 49, monthly: 20 },
  "devis-express": { setup: 80, monthly: 0 },
  boutique: { setup: 150, monthly: 10 },
  ads: { setup: 90, monthly: 30 },
} as const;

describe("grille tarifaire (§4) figée", () => {
  for (const [id, expected] of Object.entries(GRID)) {
    it(`${id} = ${expected.setup} € + ${expected.monthly} €/mois`, () => {
      const line = [...PACKS, ...ADDONS].find((l) => l.id === id);
      expect(line, `ligne ${id} absente`).toBeDefined();
      expect(line!.setup).toBe(expected.setup);
      expect(line!.monthly).toBe(expected.monthly);
    });
  }

  it("l'option « au-delà de 15 km » est sur devis, hors total", () => {
    const line = ADDONS.find((l) => l.id === "deplacement-plus-15km");
    expect(line?.quoteOnly).toBe(true);
    expect(line?.setup).toBe(0);
    expect(line?.monthly).toBe(0);
  });
});

describe("computeQuote — total == somme exacte des lignes cochées", () => {
  it("Starter seul", () => {
    const q = computeQuote({ pack: "starter", addons: [] });
    expect(q.setupTotal).toBe(190);
    expect(q.monthlyTotal).toBe(19);
    expect(q.valid).toBe(true);
    expect(q.hasQuoteOnly).toBe(false);
  });

  it("Pro Connecté seul", () => {
    const q = computeQuote({ pack: "pro", addons: [] });
    expect(q.setupTotal).toBe(299);
    expect(q.monthlyTotal).toBe(19);
  });

  it("Pro + IA + boutique + ads + devis-express (toutes options chiffrées)", () => {
    const q = computeQuote({
      pack: "pro",
      addons: ["ia", "boutique", "ads", "devis-express"],
    });
    // 299 + 49 + 150 + 90 + 80
    expect(q.setupTotal).toBe(668);
    // 19 + 20 + 10 + 30 + 0
    expect(q.monthlyTotal).toBe(79);
  });

  it("Starter + option sur devis => total inchangé + drapeau hasQuoteOnly", () => {
    const q = computeQuote({ pack: "starter", addons: ["deplacement-plus-15km"] });
    expect(q.setupTotal).toBe(190);
    expect(q.monthlyTotal).toBe(19);
    expect(q.hasQuoteOnly).toBe(true);
  });

  it("aucun pack => devis invalide, mais les options cochées restent additionnées", () => {
    const q = computeQuote({ pack: null, addons: ["ia"] });
    expect(q.valid).toBe(false);
    expect(q.setupTotal).toBe(49); // IA seule
    expect(q.monthlyTotal).toBe(20);
  });

  it("propriété générale : setupTotal/monthlyTotal = somme des lignes non « sur devis »", () => {
    const selections: QuoteSelection[] = [
      { pack: "starter", addons: [] },
      { pack: "pro", addons: ["ia"] },
      { pack: "starter", addons: ["boutique", "ads"] },
      { pack: "pro", addons: ["ia", "boutique", "ads", "devis-express", "deplacement-plus-15km"] },
    ];
    for (const sel of selections) {
      const q = computeQuote(sel);
      const chargeable = q.lines.filter((l) => !l.quoteOnly);
      expect(q.setupTotal).toBe(chargeable.reduce((s, l) => s + l.setup, 0));
      expect(q.monthlyTotal).toBe(chargeable.reduce((s, l) => s + l.monthly, 0));
    }
  });

  it("ordre des lignes stable : pack puis options dans l'ordre de déclaration", () => {
    const q = computeQuote({ pack: "pro", addons: ["ads", "ia"] });
    expect(q.lines.map((l) => l.id)).toEqual(["pro", "ia", "ads"]);
  });
});

describe("buildRecap", () => {
  it("contient le nom, chaque prestation et les deux totaux", () => {
    const recap = buildRecap({ pack: "pro", addons: ["ia"] }, "Garage Central");
    expect(recap).toContain("Garage Central");
    expect(recap).toContain("Pack Pro Connecté");
    expect(recap).toContain("Booster IA");
    expect(recap).toMatch(/Total installation : .*348/);
    expect(recap).toMatch(/Total mensuel : .*39/);
  });

  it("signale l'absence de pack", () => {
    const recap = buildRecap({ pack: null, addons: [] }, "");
    expect(recap).toContain("Aucun pack de base");
  });
});
