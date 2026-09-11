/**
 * Génère, depuis l'unique source `docs/agent-whatsapp/prompt-systeme.md` :
 *   1. `docs/agent-whatsapp/prompt-a-coller.txt` — version texte brut à coller
 *      dans une console tierce (n8n, Console Anthropic…).
 *   2. `api/_lib/prompt.generated.ts` — le même texte embarqué dans la fonction
 *      serverless, pour qu'elle n'ait aucun fichier à lire à l'exécution.
 *
 * Retirés dans les deux sorties : le frontmatter YAML et la note de maintenance
 * interne (destinée au mainteneur, pas au modèle).
 *
 * Lancer après CHAQUE modification du prompt :  npm run agent:prompt
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(root, "docs/agent-whatsapp/prompt-systeme.md");
const OUT_TXT = path.join(root, "docs/agent-whatsapp/prompt-a-coller.txt");
const OUT_TS = path.join(root, "api/_lib/prompt.generated.ts");

/** Retire le frontmatter YAML de tête (délimité par ---). */
function stripFrontmatter(lines) {
  if (lines[0]?.trim() !== "---") return lines;
  const end = lines.indexOf("---", 1);
  return end === -1 ? lines : lines.slice(end + 1);
}

/** Retire le bloc de citation « Règle de maintenance » et la ligne vide qui suit. */
function stripMaintenanceNote(lines) {
  const out = [];
  let skipping = false;
  for (const line of lines) {
    if (/^> \*\*Règle de maintenance/.test(line)) {
      skipping = true;
      continue;
    }
    if (skipping) {
      if (line.trim() === "") {
        skipping = false;
      }
      continue;
    }
    out.push(line);
  }
  return out;
}

const raw = readFileSync(SOURCE, "utf8");
const body = stripMaintenanceNote(stripFrontmatter(raw.split(/\r?\n/)));
// `.slice(1)` : la ligne vide laissée par le frontmatter retiré.
const text = body.join("\n").replace(/^\n+/, "");

writeFileSync(OUT_TXT, text, "utf8");

writeFileSync(
  OUT_TS,
  `// ⚠️ FICHIER GÉNÉRÉ — ne pas éditer à la main.\n` +
    `// Source : docs/agent-whatsapp/prompt-systeme.md · Régénérer : npm run agent:prompt\n\n` +
    `export const SYSTEM_PROMPT = ${JSON.stringify(text)};\n`,
  "utf8",
);

console.log(
  `prompt-a-coller.txt (${text.length} caractères) et api/_lib/prompt.generated.ts régénérés.`,
);
