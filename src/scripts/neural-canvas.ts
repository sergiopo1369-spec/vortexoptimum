/*
  Réseau neuronal interactif — Canvas 2D, sans WebGL ni dépendance.

  Remplace la scène Three.js du Héro. Même thématique (nœuds connectés,
  pulsations, impulsions qui glissent le long des arêtes), pour une fraction
  du poids : ce module fait quelques kilo-octets là où le chunk `three`
  pesait environ 120 Ko compressés.

  Garde-fous de performance :
  - requestAnimationFrame uniquement, jamais setInterval ;
  - nombre de nœuds indexé sur la largeur d'écran ;
  - tampon dimensionné sur la boîte CSS du canvas, devicePixelRatio plafonné à 2 ;
  - boucle mise en pause hors viewport et onglet caché ;
  - arêtes recalculées par intervalle, pas à chaque image.
*/

type Noeud = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Déphasage individuel : les pulsations ne se synchronisent pas. */
  phase: number;
  vitesse: number;
};

type Arete = { a: number; b: number };

type Impulsion = { arete: number; t: number; vitesse: number };

export interface HandleReseau {
  destroy(): void;
}

/** Teintes de la charte : cyan → améthyste → magenta. */
const TEINTES = [
  { r: 0, g: 229, b: 255 },
  { r: 139, g: 92, b: 246 },
  { r: 255, g: 47, b: 208 },
];

/** Interpole la palette sur [0, 1] et rend une couleur CSS. */
function teinte(k: number, alpha: number): string {
  const p = Math.min(0.999, Math.max(0, k)) * (TEINTES.length - 1);
  const i = Math.floor(p);
  const f = p - i;
  const a = TEINTES[i];
  const b = TEINTES[i + 1] ?? a;
  const r = Math.round(a.r + (b.r - a.r) * f);
  const g = Math.round(a.g + (b.g - a.g) * f);
  const bl = Math.round(a.b + (b.b - a.b) * f);
  return `rgba(${r}, ${g}, ${bl}, ${alpha})`;
}

export function initReseauCanvas(canvas: HTMLCanvasElement): HandleReseau | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const reduit = window.matchMedia("(prefers-reduced-motion: reduce)");

  let w = 1;
  let h = 1;
  let noeuds: Noeud[] = [];
  let aretes: Arete[] = [];
  let impulsions: Impulsion[] = [];
  let raf = 0;
  let t = 0;
  let enVue = false;
  let anime = false;
  /** Position du curseur en pixels CSS ; null tant qu'il n'a pas bougé. */
  let souris: { x: number; y: number } | null = null;

  /* ---------------------------------------------------------------- *
     Construction
   * ---------------------------------------------------------------- */

  /** Moins de nœuds sur petit écran : batterie et fluidité du défilement. */
  function nombreNoeuds(): number {
    if (w < 480) return 22;
    if (w < 1024) return 34;
    return 52;
  }

  /*
    Répartition sur une grille perturbée plutôt qu'un tirage uniforme : on
    évite les paquets et les zones vides d'un aléatoire pur, sans le coût d'un
    échantillonnage de Poisson.
  */
  function construireNoeuds(): void {
    const n = nombreNoeuds();
    const colonnes = Math.ceil(Math.sqrt((n * w) / Math.max(1, h)));
    const lignes = Math.ceil(n / colonnes);
    const pasX = w / colonnes;
    const pasY = h / lignes;

    noeuds = [];
    for (let i = 0; i < n; i++) {
      const cx = i % colonnes;
      const cy = Math.floor(i / colonnes);
      noeuds.push({
        x: (cx + 0.5 + (Math.random() - 0.5) * 0.7) * pasX,
        y: (cy + 0.5 + (Math.random() - 0.5) * 0.7) * pasY,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.16,
        phase: Math.random() * Math.PI * 2,
        vitesse: 0.6 + Math.random() * 0.8,
      });
    }
  }

  /** Relie chaque nœud à ses 3 plus proches voisins, sans doublon de paire. */
  function construireAretes(): void {
    const vues = new Set<string>();
    aretes = [];
    for (let i = 0; i < noeuds.length; i++) {
      const distances: { j: number; d: number }[] = [];
      for (let j = 0; j < noeuds.length; j++) {
        if (i === j) continue;
        const dx = noeuds[i].x - noeuds[j].x;
        const dy = noeuds[i].y - noeuds[j].y;
        distances.push({ j, d: dx * dx + dy * dy });
      }
      distances.sort((a, b) => a.d - b.d);
      for (const { j } of distances.slice(0, 3)) {
        const cle = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (vues.has(cle)) continue;
        vues.add(cle);
        aretes.push({ a: i, b: j });
      }
    }
  }

  function construireImpulsions(): void {
    const n = Math.min(w < 480 ? 7 : 16, aretes.length);
    impulsions = [];
    for (let i = 0; i < n; i++) {
      impulsions.push({
        arete: Math.floor(Math.random() * aretes.length),
        t: Math.random(),
        vitesse: 0.003 + Math.random() * 0.006,
      });
    }
  }

  /* ---------------------------------------------------------------- *
     Dimensionnement
   * ---------------------------------------------------------------- */

  function redimensionner(): void {
    const r = canvas.getBoundingClientRect();
    const nw = Math.max(1, Math.round(r.width));
    const nh = Math.max(1, Math.round(r.height));
    if (nw === w && nh === h) return;

    // Les nœuds suivent proportionnellement, sinon ils s'agglutinent dans un
    // coin quand le viewport s'élargit (bascule « version ordinateur »).
    const fx = w > 1 ? nw / w : 1;
    const fy = h > 1 ? nh / h : 1;
    for (const p of noeuds) {
      p.x *= fx;
      p.y *= fy;
    }

    w = nw;
    h = nh;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    // Le dessin reste exprimé en pixels CSS.
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (!noeuds.length) construireNoeuds();
    construireAretes();
    if (!impulsions.length) construireImpulsions();
    if (!anime) dessiner();
  }

  /* ---------------------------------------------------------------- *
     Rendu
   * ---------------------------------------------------------------- */

  function dessiner(): void {
    ctx!.clearRect(0, 0, w, h);

    // Arêtes d'abord, pour que les nœuds se posent par-dessus.
    ctx!.lineWidth = 1.15;
    for (const e of aretes) {
      const a = noeuds[e.a];
      const b = noeuds[e.b];
      const k = (a.x + b.x) / 2 / Math.max(1, w);
      ctx!.strokeStyle = teinte(k, 0.34);
      ctx!.beginPath();
      ctx!.moveTo(a.x, a.y);
      ctx!.lineTo(b.x, b.y);
      ctx!.stroke();
    }

    // Impulsions glissant le long des arêtes.
    for (const imp of impulsions) {
      const e = aretes[imp.arete];
      if (!e) continue;
      const a = noeuds[e.a];
      const b = noeuds[e.b];
      const x = a.x + (b.x - a.x) * imp.t;
      const y = a.y + (b.y - a.y) * imp.t;
      ctx!.fillStyle = teinte(x / Math.max(1, w), 0.9);
      ctx!.beginPath();
      ctx!.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx!.fill();
    }

    // Nœuds : taille et opacité pulsées, renforcées près du curseur.
    for (const p of noeuds) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.02 * p.vitesse + p.phase);
      let rayon = 2.1 + pulse * 1.3;
      let alpha = 0.55 + pulse * 0.4;

      if (souris) {
        const dx = p.x - souris.x;
        const dy = p.y - souris.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 130) {
          const force = 1 - d / 130;
          rayon += force * 2.2;
          alpha = Math.min(1, alpha + force * 0.5);
        }
      }

      ctx!.fillStyle = teinte(p.x / Math.max(1, w), alpha);
      ctx!.beginPath();
      ctx!.arc(p.x, p.y, rayon, 0, Math.PI * 2);
      ctx!.fill();
    }
  }

  function avancer(): void {
    t += 1;

    for (const p of noeuds) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      p.x = Math.min(w, Math.max(0, p.x));
      p.y = Math.min(h, Math.max(0, p.y));
    }

    for (const imp of impulsions) {
      imp.t += imp.vitesse;
      if (imp.t >= 1) {
        imp.t = 0;
        imp.arete = Math.floor(Math.random() * aretes.length);
      }
    }

    // Les nœuds dérivent lentement : reconstruire le voisinage à chaque image
    // serait du gaspillage en O(n²). Un rafraîchissement périodique suffit.
    if (t % 90 === 0) construireAretes();
  }

  function boucle(): void {
    if (!anime) return;
    raf = requestAnimationFrame(boucle);
    avancer();
    dessiner();
  }

  function synchroniser(): void {
    const doitTourner = enVue && !document.hidden && !reduit.matches;
    if (doitTourner === anime) return;
    anime = doitTourner;
    if (anime) {
      cancelAnimationFrame(raf);
      boucle();
    } else {
      cancelAnimationFrame(raf);
      // Mouvement réduit : on laisse une image fixe du réseau, pas un vide.
      dessiner();
    }
  }

  /* ---------------------------------------------------------------- *
     Branchements
   * ---------------------------------------------------------------- */

  const io = new IntersectionObserver(
    (entries) => {
      enVue = entries[0].isIntersecting;
      synchroniser();
    },
    { rootMargin: "120px" },
  );
  io.observe(canvas);

  const ro = new ResizeObserver(() => redimensionner());
  ro.observe(canvas);

  // Suivi du curseur sur pointeur fin uniquement : sur mobile l'animation
  // reste autonome, pour ne rien ajouter au coût du défilement tactile.
  const finPointeur = window.matchMedia("(pointer: fine)");
  const surSouris = (e: PointerEvent): void => {
    const r = canvas.getBoundingClientRect();
    souris = { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const surSortie = (): void => {
    souris = null;
  };
  if (finPointeur.matches) {
    window.addEventListener("pointermove", surSouris, { passive: true });
    window.addEventListener("pointerleave", surSortie, { passive: true });
  }

  const surVisibilite = (): void => synchroniser();
  document.addEventListener("visibilitychange", surVisibilite);
  reduit.addEventListener("change", synchroniser);

  redimensionner();
  dessiner();

  return {
    destroy() {
      cancelAnimationFrame(raf);
      anime = false;
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", surSouris);
      window.removeEventListener("pointerleave", surSortie);
      document.removeEventListener("visibilitychange", surVisibilite);
      reduit.removeEventListener("change", synchroniser);
    },
  };
}
