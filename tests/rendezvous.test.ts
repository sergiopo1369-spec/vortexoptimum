import { describe, expect, it } from "vitest";
import {
  construireCharge,
  construireRecap,
  dateValide,
  emailValide,
  lienEmail,
  lienWhatsApp,
  normaliserTelephone,
  premierJourOuvre,
  telephoneValide,
  validerEtape,
  type Demande,
} from "../src/lib/rendezvous";

/* Lundi 14 septembre 2026, midi — toutes les dates des tests s'y rapportent. */
const LUNDI = new Date(2026, 8, 14, 12, 0, 0);

const COMPLETE: Demande = {
  nomComplet: "Camille Durand",
  telephone: "+33612345678",
  email: "camille@exemple.fr",
  secteur: "garage",
  situation: "depart_zero",
  objectifs: ["creation", "ia"],
  interet: "pro",
  typeReunion: "presentiel",
  lieu: "12 rue de Vesle, Reims",
  creneau: "matin",
  date: "2026-09-18",
  consentement: true,
};

describe("téléphone", () => {
  it("retire les séparateurs de saisie", () => {
    expect(normaliserTelephone("+33 6 12.34-56(78)")).toBe("+33612345678");
  });

  it("accepte un numéro international, espaces compris", () => {
    expect(telephoneValide("+33 6 12 34 56 78")).toBe(true);
  });

  it("refuse un numéro sans indicatif", () => {
    expect(telephoneValide("0612345678")).toBe(false);
  });

  it("refuse un indicatif commençant par zéro", () => {
    expect(telephoneValide("+0612345678")).toBe(false);
  });

  it("refuse un numéro trop court", () => {
    expect(telephoneValide("+3361")).toBe(false);
  });
});

describe("e-mail", () => {
  it("accepte une adresse standard", () => {
    expect(emailValide("camille@exemple.fr")).toBe(true);
  });

  it("refuse une adresse sans domaine de premier niveau", () => {
    expect(emailValide("camille@exemple")).toBe(false);
  });

  it("refuse une adresse avec espace", () => {
    expect(emailValide("cam ille@exemple.fr")).toBe(false);
  });
});

describe("date de rendez-vous", () => {
  it("accepte un vendredi à venir", () => {
    expect(dateValide("2026-09-18", LUNDI)).toBe(true);
  });

  it("accepte le jour même s'il est ouvré", () => {
    expect(dateValide("2026-09-14", LUNDI)).toBe(true);
  });

  it("refuse un samedi", () => {
    expect(dateValide("2026-09-19", LUNDI)).toBe(false);
  });

  it("refuse un dimanche", () => {
    expect(dateValide("2026-09-20", LUNDI)).toBe(false);
  });

  it("refuse une date passée", () => {
    expect(dateValide("2026-09-11", LUNDI)).toBe(false);
  });

  it("refuse une date inexistante", () => {
    expect(dateValide("2026-02-30", LUNDI)).toBe(false);
  });

  it("premierJourOuvre saute le week-end", () => {
    // Samedi 19 septembre 2026 → lundi 21.
    expect(premierJourOuvre(new Date(2026, 8, 19, 12))).toBe("2026-09-21");
  });
});

describe("validation par étape", () => {
  it("étape 1 : signale les trois champs vides", () => {
    const e = validerEtape(1, {});
    expect(Object.keys(e).sort()).toEqual(["email", "nomComplet", "telephone"]);
  });

  it("étape 1 : un nom d'une lettre est refusé", () => {
    expect(validerEtape(1, { ...COMPLETE, nomComplet: "A" }).nomComplet).toBeTruthy();
  });

  it("étape 2 : exige au moins un objectif", () => {
    const e = validerEtape(2, { ...COMPLETE, objectifs: [] });
    expect(e.objectifs).toBeTruthy();
  });

  it("étape 3 : le lieu n'est exigé qu'en présentiel", () => {
    expect(validerEtape(3, { typeReunion: "visio", lieu: "" }).lieu).toBeUndefined();
    expect(validerEtape(3, { typeReunion: "presentiel", lieu: "" }).lieu).toBeTruthy();
  });

  it("étape 4 : sans consentement, l'étape échoue", () => {
    const e = validerEtape(4, { ...COMPLETE, consentement: false }, LUNDI);
    expect(e.consentement).toBeTruthy();
  });

  it("étape 4 : une demande complète passe", () => {
    expect(validerEtape(4, COMPLETE, LUNDI)).toEqual({});
  });

  it("les messages sont explicites, jamais « champ invalide »", () => {
    const messages = Object.values(validerEtape(1, {}));
    expect(messages.every((m) => m.length > 15)).toBe(true);
  });
});

describe("récapitulatif et liens", () => {
  const libelles = {
    garage: "Garage / mécanique",
    depart_zero: "Je pars de zéro",
    creation: "Création d'un site professionnel",
    ia: "Automatisation / accueil IA 24 h/24",
    pro: "Pack Pro Connecté",
    presentiel: "Visite sur place avec démo",
    matin: "Matin",
  };

  it("traduit les valeurs techniques en libellés lisibles", () => {
    const r = construireRecap(COMPLETE, libelles);
    expect(r).toContain("Garage / mécanique");
    expect(r).not.toContain("depart_zero");
  });

  it("joint le lieu au format quand il est renseigné", () => {
    expect(construireRecap(COMPLETE, libelles)).toContain("12 rue de Vesle, Reims");
  });

  it("omet la formule envisagée si elle est vide", () => {
    const r = construireRecap({ ...COMPLETE, interet: "" }, libelles);
    expect(r).not.toContain("Formule envisagée");
  });

  it("encode le récapitulatif dans le lien WhatsApp", () => {
    const lien = lienWhatsApp("33758187675", "Ligne 1\nLigne 2");
    expect(lien).toBe("https://wa.me/33758187675?text=Ligne%201%0ALigne%202");
  });

  it("construit un mailto avec sujet et corps encodés", () => {
    const lien = lienEmail("contact@exemple.fr", COMPLETE, "corps");
    expect(lien).toContain("mailto:contact@exemple.fr");
    // Le tiret cadratin du sujet doit être encodé, pas laissé brut dans l'URL.
    expect(lien).toContain("subject=Demande%20de%20rendez-vous%20%E2%80%94%20Camille%20Durand");
    expect(lien).toContain("body=corps");
  });
});

describe("point d'accroche CRM", () => {
  it("respecte le mapping vers les champs de clients", () => {
    const c = construireCharge(COMPLETE) as Record<string, unknown>;
    expect(c.nom_client).toBe("Camille Durand");
    expect(c.type_commerce).toBe("garage");
    expect(c.statut_projet).toBe("prospect");
    expect(c.consentement_rgpd).toBe(true);
  });

  it("normalise le téléphone avant envoi", () => {
    const c = construireCharge({ ...COMPLETE, telephone: "+33 6 12 34 56 78" });
    expect(c.telephone).toBe("+33612345678");
  });
});
