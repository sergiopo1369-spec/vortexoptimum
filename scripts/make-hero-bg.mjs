/**
 * Génère la texture de fond du Héro en haute résolution, nette, sans artefact.
 *
 *   node scripts/make-hero-bg.mjs
 *   → public/media/hero-bg-2560.webp   (desktop large / 2x)
 *   → public/media/hero-bg-1280.webp   (desktop / tablette)
 *   → public/media/hero-bg-640.webp    (mobile)
 *
 * Pourquoi une texture générée et non une photo : la source historique
 * (assets-src/hero-source.mp4) est une animation du logo avec wordmark
 * incrusté + filigrane, floutée volontairement pour la rendre inutilisable
 * comme texte. Résultat : 1280x362 sur-compressé, agrandi ~2,6x à l'écran.
 * On produit ici un dégradé vectoriel rendu à la résolution cible : net à
 * toutes les tailles, cohérent avec le Dark Futuriste (#080c14 + halos
 * cyan/améthyste/émeraude de `.ambient`), et très léger (aplats lisses).
 *
 * Le résultat EST versionné : le déploiement n'a pas besoin de sharp.
 */
import sharp from "sharp";
import { mkdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const OUT_DIR = path.join(root, "public", "media");
mkdirSync(OUT_DIR, { recursive: true });

const W = 2560;
const H = 1440;

/** Nœuds lumineux — positions fixes (rendu déterministe, pas de Math.random). */
const NODES = [
  [312, 214, 2.6, 0.5], [548, 402, 1.8, 0.34], [822, 168, 2.2, 0.42],
  [1104, 512, 1.6, 0.3], [1420, 246, 2.4, 0.46], [1698, 430, 1.9, 0.32],
  [1962, 190, 2.1, 0.4], [2244, 468, 1.7, 0.3], [420, 742, 2.0, 0.28],
  [980, 880, 1.6, 0.24], [1560, 802, 2.2, 0.3], [2130, 918, 1.8, 0.26],
  [700, 1084, 1.7, 0.2], [1830, 1150, 1.9, 0.22],
];

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="cy" cx="16%" cy="6%" r="64%">
      <stop offset="0%"   stop-color="#22d3ee" stop-opacity="0.28"/>
      <stop offset="52%"  stop-color="#22d3ee" stop-opacity="0.07"/>
      <stop offset="100%" stop-color="#22d3ee" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="am" cx="90%" cy="2%" r="56%">
      <stop offset="0%"   stop-color="#a78bfa" stop-opacity="0.22"/>
      <stop offset="58%"  stop-color="#a78bfa" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#a78bfa" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="em" cx="52%" cy="112%" r="50%">
      <stop offset="0%"   stop-color="#34d399" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#34d399" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="vig" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#080c14" stop-opacity="0"/>
      <stop offset="62%"  stop-color="#080c14" stop-opacity="0.30"/>
      <stop offset="100%" stop-color="#080c14" stop-opacity="0.78"/>
    </linearGradient>
    <pattern id="grid" width="104" height="104" patternUnits="userSpaceOnUse">
      <path d="M104 0H0V104" fill="none" stroke="#7ce7f5" stroke-opacity="0.055" stroke-width="1.2"/>
    </pattern>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="2.2"/>
    </filter>
  </defs>

  <rect width="${W}" height="${H}" fill="#080c14"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <rect width="${W}" height="${H}" fill="url(#cy)"/>
  <rect width="${W}" height="${H}" fill="url(#am)"/>
  <rect width="${W}" height="${H}" fill="url(#em)"/>

  <g filter="url(#soft)" fill="#7ce7f5">
    ${NODES.map(([x, y, r, o]) => `<circle cx="${x}" cy="${y}" r="${r * 3.2}" fill-opacity="${(o * 0.32).toFixed(3)}"/>`).join("\n    ")}
  </g>
  <g fill="#bff3fb">
    ${NODES.map(([x, y, r, o]) => `<circle cx="${x}" cy="${y}" r="${r}" fill-opacity="${o}"/>`).join("\n    ")}
  </g>

  <rect width="${W}" height="${H}" fill="url(#vig)"/>
</svg>`;

const buf = Buffer.from(svg);
const sizes = [2560, 1280, 640];

for (const w of sizes) {
  const out = path.join(OUT_DIR, `hero-bg-${w}.webp`);
  await sharp(buf, { density: Math.round((72 * w) / W) || 72 })
    .resize({ width: w, height: Math.round((H * w) / W), fit: "cover" })
    .webp({ quality: 88, effort: 6 })
    .toFile(out);
  console.log(`  ✓ ${path.relative(root, out)} (${Math.round(statSync(out).size / 1024)} Ko)`);
}

console.log("\n✔ Texture de fond du Héro générée.");
