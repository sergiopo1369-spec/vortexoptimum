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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

  const scene = new Scene();
  const camera = new PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 6);

  const pivot = new Group(); // parallaxe souris
  const core = new Group(); // rotation continue
  pivot.add(core);
  scene.add(pivot);

  // Cœur translucide
  const solidGeo = new IcosahedronGeometry(1.35, 1);
  const solidMat = new MeshBasicMaterial({ color: 0x0b2536, transparent: true, opacity: 0.35 });
  const solid = new Mesh(solidGeo, solidMat);
  core.add(solid);

  // Coque filaire cyan
  const shellGeo = new IcosahedronGeometry(1.5, 1);
  const wireMat = new LineBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.55 });
  const wire = new LineSegments(new WireframeGeometry(shellGeo), wireMat);
  core.add(wire);

  // Nœuds (sommets) violets
  const nodeGeo = new IcosahedronGeometry(1.5, 1);
  const nodeMat = new PointsMaterial({
    color: 0xa855f7,
    size: 0.09,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true,
  });
  const nodes = new Points(nodeGeo, nodeMat);
  core.add(nodes);

  // Halo de particules cyan
  const N = 130;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const r = 2.2 + Math.random() * 1.6;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
    pos[i * 3 + 2] = r * Math.cos(ph);
  }
  const haloGeo = new BufferGeometry();
  haloGeo.setAttribute("position", new BufferAttribute(pos, 3));
  const haloMat = new PointsMaterial({
    color: 0x00e5ff,
    size: 0.028,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: true,
  });
  const particles = new Points(haloGeo, haloMat);
  pivot.add(particles);

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

  function frame(): void {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    t += 1;
    core.rotation.y += 0.003;
    core.rotation.z += 0.0011;
    particles.rotation.y -= 0.0009;
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
      solidMat.dispose();
      wireMat.dispose();
      nodeMat.dispose();
      haloMat.dispose();
    },
  };
}
