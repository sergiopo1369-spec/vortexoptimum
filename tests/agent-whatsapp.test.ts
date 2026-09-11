import { describe, it, expect } from "vitest";
import { extraireFiche, normaliserTelephone } from "../api/_lib/fiche";
import { verifyMetaSignature } from "../api/_lib/signature";
import { decouper } from "../api/_lib/whatsapp";
import crypto from "node:crypto";

/**
 * Tests de l'assistant WhatsApp (§4.A.3 du cahier des charges).
 *
 * L'exigence n°1 : le bloc FICHE_PROSPECT contient des notes internes (budget
 * évoqué, appréciation commerciale) et ne doit JAMAIS partir chez le prospect.
 * Tout ce que `extraireFiche` ne retire pas est envoyé tel quel sur WhatsApp.
 */

const FICHE_VALIDE = JSON.stringify({
  nom_client: "Jean Dupont",
  enseigne: "Garage Dupont",
  telephone: "06 12 34 56 78",
  email: null,
  type_commerce: "garage",
  commune: "Tinqueux",
  dans_rayon_15km: true,
  besoin: "Site vitrine + prise de rendez-vous",
  pack_recommande: "pro",
  options_evoquees: [],
  canal_prefere: "visite_sur_place",
  creneaux_souhaites: ["mardi 14h-16h", "jeudi matin"],
  consentement_rgpd: true,
  statut_projet: "prospect",
  escalade: false,
  motif_escalade: null,
  notes_privees: "Budget évoqué : environ 700 €.",
  resume_pour_equipe: "Garagiste à Tinqueux, veut arrêter de gérer les RDV au téléphone.",
});

const reponseAvecFiche = (corps = FICHE_VALIDE, entete = "```FICHE_PROSPECT") =>
  `Je récapitule : *Jean Dupont — Garage Dupont*\n\nJe transmets à l'équipe.\n\n${entete}\n${corps}\n\`\`\``;

describe("extraction du bloc FICHE_PROSPECT", () => {
  it("retire le bloc de la réponse envoyée au prospect", () => {
    const { reponseClient } = extraireFiche(reponseAvecFiche());
    expect(reponseClient).not.toContain("FICHE_PROSPECT");
    expect(reponseClient).not.toContain("notes_privees");
    expect(reponseClient).not.toContain("700");
    expect(reponseClient).toContain("Je transmets à l'équipe.");
  });

  it("tolère les variantes de balisage sans jamais laisser fuiter le bloc", () => {
    for (const entete of ["```FICHE_PROSPECT", "```json FICHE_PROSPECT", "~~~FICHE_PROSPECT"]) {
      const brut = reponseAvecFiche(FICHE_VALIDE, entete).replace(
        /```$/,
        entete.startsWith("~~~") ? "~~~" : "```",
      );
      const { reponseClient, fiche } = extraireFiche(brut);
      expect(reponseClient, entete).not.toContain("notes_privees");
      expect(fiche?.nom_client, entete).toBe("Jean Dupont");
    }
  });

  it("retire le bloc même quand le JSON est invalide", () => {
    const { reponseClient, fiche, erreur } = extraireFiche(
      reponseAvecFiche('{ "nom_client": "Jean", }'),
    );
    expect(reponseClient).not.toContain("nom_client");
    expect(fiche).toBeUndefined();
    expect(erreur).toMatch(/JSON invalide/);
  });

  it("laisse la réponse intacte quand il n'y a pas de bloc", () => {
    const texte = "Bonjour 👋 Quel est votre projet ?";
    expect(extraireFiche(texte).reponseClient).toBe(texte);
    expect(extraireFiche(texte).fiche).toBeUndefined();
  });

  it("retient la dernière fiche quand plusieurs sont émises (§4.2 : réémission)", () => {
    const premiere = reponseAvecFiche();
    const seconde = reponseAvecFiche(
      JSON.stringify({ ...JSON.parse(FICHE_VALIDE), enseigne: "Garage Dupont & Fils" }),
    );
    const { fiche, reponseClient } = extraireFiche(`${premiere}\n${seconde}`);
    expect(fiche?.enseigne).toBe("Garage Dupont & Fils");
    expect(reponseClient).not.toContain("{");
  });
});

describe("normalisation de la fiche", () => {
  it("reformate le téléphone français en E.164", () => {
    const { fiche } = extraireFiche(reponseAvecFiche());
    expect(fiche?.telephone).toBe("+33612345678");
  });

  it.each([
    ["06 12 34 56 78", "+33612345678"],
    ["+33 6 12 34 56 78", "+33612345678"],
    ["33612345678", "+33612345678"],
    ["0326123456", "+33326123456"],
    ["06 12 34", null],
    ["pas un numéro", null],
  ])("normaliserTelephone(%s)", (entree, attendu) => {
    expect(normaliserTelephone(entree)).toBe(attendu);
  });

  it("efface toutes les coordonnées si le consentement RGPD est refusé (§3 étape 5)", () => {
    const refus = JSON.stringify({
      ...JSON.parse(FICHE_VALIDE),
      consentement_rgpd: false,
    });
    const { fiche } = extraireFiche(reponseAvecFiche(refus));
    expect(fiche?.consentement_rgpd).toBe(false);
    expect(fiche?.nom_client).toBeNull();
    expect(fiche?.enseigne).toBeNull();
    expect(fiche?.telephone).toBeNull();
    expect(fiche?.email).toBeNull();
    // Le besoin reste : il n'identifie personne et sert au suivi statistique.
    expect(fiche?.besoin).toBe("Site vitrine + prise de rendez-vous");
  });

  it("rejette les valeurs hors énumération plutôt que de les propager au CRM", () => {
    const bancal = JSON.stringify({
      ...JSON.parse(FICHE_VALIDE),
      type_commerce: "boulangerie",
      pack_recommande: "premium",
      canal_prefere: "telegram",
      options_evoquees: ["ia", "drone"],
      statut_projet: "client_signe",
    });
    const { fiche } = extraireFiche(reponseAvecFiche(bancal));
    expect(fiche?.type_commerce).toBeNull();
    expect(fiche?.pack_recommande).toBeNull();
    expect(fiche?.canal_prefere).toBeNull();
    expect(fiche?.options_evoquees).toEqual(["ia"]);
    expect(fiche?.statut_projet).toBe("prospect");
  });
});

describe("signature du webhook Meta", () => {
  const secret = "app-secret-de-test";
  const corps = Buffer.from(JSON.stringify({ entry: [] }), "utf8");
  const signature = `sha256=${crypto.createHmac("sha256", secret).update(corps).digest("hex")}`;

  it("accepte une signature valide", () => {
    expect(verifyMetaSignature(corps, signature, secret)).toBe(true);
  });

  it.each([
    ["en-tête absent", undefined],
    ["en-tête vide", ""],
    ["préfixe absent", signature.replace("sha256=", "")],
    ["signature falsifiée", `sha256=${"0".repeat(64)}`],
    ["longueur inattendue", "sha256=abc"],
  ])("refuse : %s", (_cas, entete) => {
    expect(verifyMetaSignature(corps, entete as string | undefined, secret)).toBe(false);
  });

  it("refuse un corps modifié après signature", () => {
    const falsifie = Buffer.from(JSON.stringify({ entry: [{ id: "faux" }] }), "utf8");
    expect(verifyMetaSignature(falsifie, signature, secret)).toBe(false);
  });
});

describe("découpage des messages longs", () => {
  it("laisse un message court intact", () => {
    expect(decouper("Bonjour")).toEqual(["Bonjour"]);
  });

  it("découpe au-delà de la limite sans rien perdre", () => {
    const long = Array.from({ length: 400 }, (_, i) => `ligne ${i}`).join("\n");
    const morceaux = decouper(long, 1000);
    expect(morceaux.length).toBeGreaterThan(1);
    for (const morceau of morceaux) expect(morceau.length).toBeLessThanOrEqual(1000);
    expect(morceaux.join("\n")).toBe(long);
  });
});
