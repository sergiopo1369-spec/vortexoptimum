/**
 * Prépare les médias du hero à partir de assets-src/hero-source.mp4 :
 *   - public/media/hero-poster.jpg  (image affichée immédiatement, LCP)
 *   - public/media/hero.mp4         (H.264, sans audio, ~1280px, faststart)
 *   - public/media/hero.webm        (VP9, plus léger — best effort)
 *
 * Le résultat EST versionné : le déploiement n'a donc pas besoin de ffmpeg.
 * Rejouer après remplacement de la source : `npm run media -- --force`
 *
 * Contraintes respectées (cahier des charges §6.2) :
 *   - la vidéo ne doit jamais bloquer le premier rendu → un poster léger est fourni ;
 *   - poids maîtrisé → downscale + CRF élevé + durée plafonnée.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const SRC = path.join(root, "assets-src", "hero-source.mp4");
const OUT_DIR = path.join(root, "public", "media");
const FORCE = process.argv.includes("--force");
const MAX_SECONDS = 16;

/*
  La source est un logo animé « VORTEX OPTIM » avec texte incrusté, léger
  letterbox et filigrane « Veo » en bas à droite. Inutilisable tel quel comme
  fond derrière notre propre <h1>. On la transforme donc en TEXTURE LUMINEUSE
  ABSTRAITE :
    - crop central   → supprime le letterbox et le filigrane ;
    - flou gaussien fort → le texte devient un halo illisible ;
    - léger boost de saturation + vignette → ambiance « dark luxury ».
  Le poster est extrait de CETTE version filtrée pour être cohérent.
*/
const LOOK =
  // crop sur la MOITIÉ HAUTE (le mark 3D + circuit) → exclut totalement le
  // wordmark « VORTEX OPTIM » incrusté dans le bas de l'image ;
  // flou → halo de lumière abstrait, aucun texte lisible ;
  // eq → on éclaircit/sature un peu car un scrim sombre est appliqué en CSS par-dessus.
  "crop=1200:340:40:22,scale=1280:-2:flags=lanczos,gblur=sigma=30,eq=brightness=0.05:saturation=1.3:contrast=1.06,vignette=PI/5";

if (!ffmpegPath) {
  console.error("✖ ffmpeg-static introuvable. Lancez `npm install` d'abord.");
  process.exit(1);
}
if (!existsSync(SRC)) {
  console.error(`✖ Source absente : ${SRC}`);
  console.error("  Placez la vidéo du hero à cet emplacement puis relancez.");
  process.exit(1);
}
mkdirSync(OUT_DIR, { recursive: true });

const srcMtime = statSync(SRC).mtimeMs;
const upToDate = (out) => existsSync(out) && statSync(out).mtimeMs >= srcMtime && !FORCE;

function run(label, args, { optional = false } = {}) {
  const out = args[args.length - 1];
  if (upToDate(out)) {
    console.log(`• ${label} : à jour, ignoré`);
    return true;
  }
  console.log(`• ${label} …`);
  const res = spawnSync(ffmpegPath, ["-y", "-hide_banner", "-loglevel", "error", ...args], {
    stdio: ["ignore", "inherit", "inherit"],
  });
  if (res.status !== 0) {
    const msg = `  ${optional ? "⚠" : "✖"} ${label} a échoué (code ${res.status}).`;
    if (optional) {
      console.warn(msg + " On continue sans ce format.");
      return false;
    }
    console.error(msg);
    process.exit(res.status ?? 1);
  }
  const kb = existsSync(out) ? Math.round(statSync(out).size / 1024) : 0;
  console.log(`  ✓ ${path.relative(root, out)} (${kb} Ko)`);
  return true;
}

run("Poster JPEG", [
  "-ss", "1.5",
  "-i", SRC,
  "-frames:v", "1",
  "-vf", LOOK,
  "-q:v", "4",
  path.join(OUT_DIR, "hero-poster.jpg"),
]);

run("Vidéo MP4 (H.264)", [
  "-i", SRC,
  "-t", String(MAX_SECONDS),
  "-an",
  "-vf", LOOK,
  "-c:v", "libx264",
  "-profile:v", "high",
  "-preset", "veryslow",
  "-crf", "31",
  "-pix_fmt", "yuv420p",
  "-movflags", "+faststart",
  path.join(OUT_DIR, "hero.mp4"),
]);

run(
  "Vidéo WebM (VP9)",
  [
    "-i", SRC,
    "-t", String(MAX_SECONDS),
    "-an",
    "-vf", LOOK,
    "-c:v", "libvpx-vp9",
    "-b:v", "0",
    "-crf", "40",
    "-row-mt", "1",
    path.join(OUT_DIR, "hero.webm"),
  ],
  { optional: true },
);

console.log("\n✔ Médias du hero prêts dans public/media/");
