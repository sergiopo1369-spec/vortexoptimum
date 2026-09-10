/*
  Scène 3D « noyau IA » — chargée dynamiquement (chunk séparé), jamais côté
  serveur, jamais sur mobile. Géométrie procédurale légère : icosaèdre
  filaire cyan + nœuds violets + halo de particules. Aucun loader, aucun
  post-processing (la lueur est un drop-shadow CSS sur le <canvas>).

  Import nommé depuis "three" pour laisser Rollup élaguer le module.
*/
import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Group,
  IcosahedronGeometry,
  WireframeGeometry,
  LineSegments,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  BufferGeometry,
  BufferAttribute,
  Points,
  PointsMaterial,
} from "three";

export interface CoreHandle {
  /** Cible de parallaxe, coordonnées normalisées [-1, 1]. */
  setPointer(nx: number, ny: number): void;
  /** Démarre / met en pause la boucle de rendu (hors-viewport, onglet caché). */
  setRunning(on: boolean): void;
  /** Recalage sur la taille du conteneur. */
  resize(): void;
  /** Libère le contexte WebGL et la géométrie. */
  dispose(): void;
}

export function initAiCore(canvas: HTMLCanvasElement, reducedMotion: boolean): CoreHandle {
  const parent = canvas.parentElement as HTMLElement;

  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setClearColor(0x000000, 0);
  // Pixel-ratio plafonné plus bas sur mobile : la scène reste nette sans
  // saturer le GPU d'un téléphone, où le canvas est de toute façon plus petit.
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, window.innerWidth < 640 ? 1.25 : 1.5),
  );

  const scene = new Scene();
  const camera = new PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 6);

  const pivot = new Group(); // parallaxe souris
  const core = new Group(); // rotation continue
  pivot.add(core);
  scene.add(pivot);

  // Cœur translucide - couleurs plus vives
  const solidGeo = new IcosahedronGeometry(1.35, 1);
  const solidMat = new MeshBasicMaterial({ color: 0x1a4f6e, transparent: true, opacity: 0.45 });
  const solid = new Mesh(solidGeo, solidMat);
  core.add(solid);

  // Coque filaire cyan électrique - plus intense
  const shellGeo = new IcosahedronGeometry(1.5, 1);
  const wireMat = new LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.75 });
  const wire = new LineSegments(new WireframeGeometry(shellGeo), wireMat);
  core.add(wire);

  // Nœuds (sommets) violets électriques - plus vibrants
  const nodeGeo = new IcosahedronGeometry(1.5, 1);
  const nodeMat = new PointsMaterial({
    color: 0xd946ef, // Magenta plus vibrant
    size: 0.12,
    transparent: true,
    opacity: 1.0,
    sizeAttenuation: true,
  });
  const nodes = new Points(nodeGeo, nodeMat);
  core.add(nodes);

  // Halo de particules cyan électrique - plus dense et vibrant
  const N = 180; // Plus de particules
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const r = 2.2 + Math.random() * 1.8;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
    pos[i * 3 + 2] = r * Math.cos(ph);
  }
  const haloGeo = new BufferGeometry();
  haloGeo.setAttribute("position", new BufferAttribute(pos, 3));
  const haloMat = new PointsMaterial({
    color: 0x00ffff, // Cyan plus électrique
    size: 0.035, // Particules légèrement plus grandes
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
  });
  const particles = new Points(haloGeo, haloMat);
  pivot.add(particles);

  // Constellation : nuage d'étoiles blanches flottantes + lignes néon cyan
  // reliant dynamiquement les paires suffisamment proches. Rattachée au
  // même `pivot` que le halo → suit la même parallaxe souris subtile.
  const STAR_N = 70;
  const starPos = new Float32Array(STAR_N * 3);
  const starBase = new Float32Array(STAR_N * 3);
  const starPhase = new Float32Array(STAR_N);
  const starSpeed = new Float32Array(STAR_N);
  for (let i = 0; i < STAR_N; i++) {
    const r = 1.8 + Math.random() * 2.5;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    const x = r * Math.sin(ph) * Math.cos(th);
    const y = r * Math.sin(ph) * Math.sin(th);
    const z = r * Math.cos(ph);
    starBase[i * 3] = x;
    starBase[i * 3 + 1] = y;
    starBase[i * 3 + 2] = z;
    starPos[i * 3] = x;
    starPos[i * 3 + 1] = y;
    starPos[i * 3 + 2] = z;
    starPhase[i] = Math.random() * Math.PI * 2;
    starSpeed[i] = 0.4 + Math.random() * 0.6;
  }
  const starGeo = new BufferGeometry();
  const starPosAttr = new BufferAttribute(starPos, 3);
  starGeo.setAttribute("position", starPosAttr);
  const starMat = new PointsMaterial({
    color: 0xffffff,
    size: 0.022,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
  });
  const stars = new Points(starGeo, starMat);
  pivot.add(stars);

  // Lignes de constellation : géométrie recalculée chaque frame selon un
  // seuil de proximité dynamique. `MAX_LINKS` est un plafond défensif de
  // performance, rarement atteint compte tenu de la densité du nuage.
  const LINK_DIST_SQ = 1.0 * 1.0;
  const MAX_LINKS = 160;
  const linkPos = new Float32Array(MAX_LINKS * 2 * 3);
  const linkGeo = new BufferGeometry();
  const linkPosAttr = new BufferAttribute(linkPos, 3);
  linkGeo.setAttribute("position", linkPosAttr);
  const linkMat = new LineBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.3 });
  const links = new LineSegments(linkGeo, linkMat);
  links.frustumCulled = false;
  pivot.add(links);

  let targetRX = 0;
  let targetRY = 0;
  let running = false;
  let raf = 0;
  let t = 0;

  function resize(): void {
    const w = parent.clientWidth || 1;
    const h = parent.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  }

  function updateConstellation(): void {
    // Flottement subtil de chaque étoile autour de sa position de repère
    // (déphasage individuel → mouvement organique, pas de synchronisation).
    for (let i = 0; i < STAR_N; i++) {
      const a = t * 0.01 * starSpeed[i] + starPhase[i];
      starPos[i * 3] = starBase[i * 3] + Math.sin(a) * 0.06;
      starPos[i * 3 + 1] = starBase[i * 3 + 1] + Math.cos(a * 0.9) * 0.06;
      starPos[i * 3 + 2] = starBase[i * 3 + 2] + Math.sin(a * 1.1) * 0.06;
    }
    starPosAttr.needsUpdate = true;

    // Reconstruction des segments : ligne néon cyan entre chaque paire
    // d'étoiles suffisamment proches (seuil de distance dynamique au carré,
    // pour éviter un sqrt par paire). Plafonné par MAX_LINKS (perf).
    let linkCount = 0;
    for (let i = 0; i < STAR_N && linkCount < MAX_LINKS; i++) {
      const ix = i * 3;
      for (let j = i + 1; j < STAR_N && linkCount < MAX_LINKS; j++) {
        const jx = j * 3;
        const dx = starPos[ix] - starPos[jx];
        const dy = starPos[ix + 1] - starPos[jx + 1];
        const dz = starPos[ix + 2] - starPos[jx + 2];
        const distSq = dx * dx + dy * dy + dz * dz;
        if (distSq < LINK_DIST_SQ) {
          const o = linkCount * 6;
          linkPos[o] = starPos[ix];
          linkPos[o + 1] = starPos[ix + 1];
          linkPos[o + 2] = starPos[ix + 2];
          linkPos[o + 3] = starPos[jx];
          linkPos[o + 4] = starPos[jx + 1];
          linkPos[o + 5] = starPos[jx + 2];
          linkCount++;
        }
      }
    }
    linkGeo.setDrawRange(0, linkCount * 2);
    linkPosAttr.needsUpdate = true;
  }

  function frame(): void {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    t += 1;
    core.rotation.y += 0.003;
    core.rotation.z += 0.0011;
    particles.rotation.y -= 0.0009;
    stars.rotation.y += 0.0006;
    // Le flottement des étoiles suit le même régime que la rotation du
    // noyau (non gaté par reducedMotion) ; seule la parallaxe souris du
    // pivot respecte prefers-reduced-motion, comme pour le reste de la scène.
    updateConstellation();
    if (!reducedMotion) {
      pivot.rotation.x += (targetRX - pivot.rotation.x) * 0.05;
      pivot.rotation.y += (targetRY - pivot.rotation.y) * 0.05;
    }
    core.scale.setScalar(1 + Math.sin(t * 0.03) * 0.03);
    renderer.render(scene, camera);
  }

  resize();
  renderer.render(scene, camera);

  return {
    setPointer(nx, ny) {
      targetRY = nx * 0.35;
      targetRX = ny * 0.22;
    },
    setRunning(on) {
      if (on === running) return;
      running = on;
      if (on) {
        cancelAnimationFrame(raf);
        frame();
      } else {
        cancelAnimationFrame(raf);
      }
    },
    resize,
    dispose() {
      cancelAnimationFrame(raf);
      renderer.dispose();
      solidGeo.dispose();
      shellGeo.dispose();
      nodeGeo.dispose();
      haloGeo.dispose();
      starGeo.dispose();
      linkGeo.dispose();
      solidMat.dispose();
      wireMat.dispose();
      nodeMat.dispose();
      haloMat.dispose();
      starMat.dispose();
      linkMat.dispose();
    },
  };
}
