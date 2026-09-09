import { describe, it, expect } from "vitest";
import { PACKS, ADDONS } from "../src/config/pricing";
import { computeQuote, buildRecap, type QuoteSelection } from "../src/lib/quote";

/**
 * Test de NON-RÉGRESSION du calculateur de devis.
 * Exigences : §5.2 (« le total affiché doit toujours correspondre exactement à la
 * somme des lignes cochées ») et §11 (plan de tests — cohérence prix vs. grille §4).
 *
 * Les valeurs ci-dessous sont recopiées À LA MAIN depuis le cahier des charges §4
 * (grille « 3 offres », journal des versions §17.3 — v2.1). Si un prix change dans
 * src/config/pricing.ts sans être un changement voulu et documenté (§17.3), ce test
 * doit échouer.
 */

const GRID = {
  starter: { setup: 390, monthly: 39 },
  pro: { setup: 690, monthly: 59 },
  ultime: { setup: 990, monthly: 199 },
  ia: { setup: 140, monthly: 49 },
  "devis-express": { setup: 70, monthly: 15 },
  boutique: { setup: 240, monthly: 29 },
  ads: { setup: 100, monthly: 70 },
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

  it("le Pack Ultime est marqué tout-inclus et référence les 4 options incluses", () => {
    const ultime = PACKS.find((p) => p.id === "ultime");
    expect(ultime?.allInclusive).toBe(true);
    expect(new Set(ultime?.includedAddons)).toEqual(
      new Set(["ia", "devis-express", "boutique", "ads"]),
    );
  });

  it("l'argument « au lieu de » du Pack Ultime = Pro + les 4 options à la carte", () => {
    const ultime = PACKS.find((p) => p.id === "ultime")!;
    const pro = PACKS.find((p) => p.id === "pro")!;
    const carte = ["ia", "devis-express", "boutique", "ads"].map(
      (id) => ADDONS.find((a) => a.id === id)!,
    );
    expect(ultime.compareSetup).toBe(pro.setup + carte.reduce((s, a) => s + a.setup, 0));
    expect(ultime.compareMonthly).toBe(pro.monthly + carte.reduce((s, a) => s + a.monthly, 0));
  });
});

describe("computeQuote — total == somme exacte des lignes cochées", () => {
  it("Starter seul", () => {
    const q = computeQuote({ pack: "starter", addons: [] });
    expect(q.setupTotal).toBe(390);
    expect(q.monthlyTotal).toBe(39);
    expect(q.valid).toBe(true);
    expect(q.hasQuoteOnly).toBe(false);
    expect(q.allInclusive).toBe(false);
  });

  it("Pro Connecté seul", () => {
    const q = computeQuote({ pack: "pro", addons: [] });
    expect(q.setupTotal).toBe(690);
    expect(q.monthlyTotal).toBe(59);
  });

  it("Pro + IA + boutique + ads + devis-express (toutes options chiffrées)", () => {
    const q = computeQuote({
      pack: "pro",
      addons: ["ia", "boutique", "ads", "devis-express"],
    });
    // 690 + 140 + 240 + 100 + 70
    expect(q.setupTotal).toBe(1240);
    // 59 + 49 + 29 + 70 + 15
    expect(q.monthlyTotal).toBe(222);
  });

  it("Starter + option sur devis => total inchangé + drapeau hasQuoteOnly", () => {
    const q = computeQuote({ pack: "starter", addons: ["deplacement-plus-15km"] });
    expect(q.setupTotal).toBe(390);
    expect(q.monthlyTotal).toBe(39);
    expect(q.hasQuoteOnly).toBe(true);
  });

  it("aucun pack => devis invalide, mais les options cochées restent additionnées", () => {
    const q = computeQuote({ pack: null, addons: ["ia"] });
    expect(q.valid).toBe(false);
    expect(q.setupTotal).toBe(140); // IA seule
    expect(q.monthlyTotal).toBe(49);
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

describe("Pack Ultime — tout-inclus : options verrouillées, aucun supplément", () => {
  it("Ultime seul => strictement 990 € + 199 €/mois", () => {
    const q = computeQuote({ pack: "ultime", addons: [] });
    expect(q.setupTotal).toBe(990);
    expect(q.monthlyTotal).toBe(199);
    expect(q.allInclusive).toBe(true);
    expect(q.lines.map((l) => l.id)).toEqual(["ultime"]);
  });

  it("Ultime + toutes les options incluses cochées => total INCHANGÉ (990 / 199)", () => {
    const q = computeQuote({
      pack: "ultime",
      addons: ["ia", "devis-express", "boutique", "ads"],
    });
    expect(q.setupTotal).toBe(990);
    expect(q.monthlyTotal).toBe(199);
    // Les options incluses ne figurent pas comme lignes séparées.
    expect(q.lines.map((l) => l.id)).toEqual(["ultime"]);
  });

  it("Ultime + déplacement > 15 km => reste possible, total inchangé + hasQuoteOnly", () => {
    const q = computeQuote({ pack: "ultime", addons: ["deplacement-plus-15km"] });
    expect(q.setupTotal).toBe(990);
    expect(q.monthlyTotal).toBe(199);
    expect(q.hasQuoteOnly).toBe(true);
    expect(q.lines.map((l) => l.id)).toEqual(["ultime", "deplacement-plus-15km"]);
  });

  it("Starter/Pro ne sont PAS tout-inclus : les options s'ajoutent normalement", () => {
    expect(computeQuote({ pack: "starter", addons: ["ia"] }).allInclusive).toBe(false);
    const q = computeQuote({ pack: "pro", addons: ["boutique"] });
    expect(q.setupTotal).toBe(690 + 240);
    expect(q.monthlyTotal).toBe(59 + 29);
  });
});

describe("buildRecap", () => {
  it("contient le nom, chaque prestation et les deux totaux", () => {
    const recap = buildRecap({ pack: "pro", addons: ["ia"] }, "Garage Central");
    expect(recap).toContain("Garage Central");
    expect(recap).toContain("Pack Pro Connecté");
    expect(recap).toContain("Booster IA");
    expect(recap).toMatch(/Total installation : .*830/);
    expect(recap).toMatch(/Total mensuel : .*108/);
  });

  it("Pack Ultime : mentionne l'inclusion et affiche 990 / 199 même options cochées", () => {
    const recap = buildRecap(
      { pack: "ultime", addons: ["ia", "boutique", "ads", "devis-express"] },
      "Salon Éclat",
    );
    expect(recap).toContain("inclus dans le Pack Ultime");
    expect(recap).toMatch(/Total installation : .*990/);
    expect(recap).toMatch(/Total mensuel : .*199/);
  });

  it("signale l'absence de pack", () => {
    const recap = buildRecap({ pack: null, addons: [] }, "");
    expect(recap).toContain("Aucun pack de base");
  });
});
