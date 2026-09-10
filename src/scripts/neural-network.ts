/*
  Toile neuronale simple - effet léger pour éviter les problèmes de layout
*/

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export class NeuralNetwork {
  private canvas: HTMLCanvasElement;
  /*
    Assertion d'affectation définie : le constructeur sort avant init()/animate()
    si getContext('2d') échoue, donc ctx n'est jamais lu non affecté.
  */
  private ctx!: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animationId: number | null = null;
  /** Dimensions du dessin, en pixels CSS (indépendantes du devicePixelRatio). */
  private w = 1;
  private h = 1;
  private observer: ResizeObserver | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    this.ctx = ctx;
    this.resize();
    this.createParticles();

    /*
      Le canvas est mesuré sur SA PROPRE boîte, pas sur window : il est en
      inset-0/h-full dans le Héro, plus haut que la fenêtre — l'ancienne
      version le dimensionnait à window.innerHeight, ce qui l'étirait
      verticalement d'environ 16 % même en desktop normal.
      Le ResizeObserver suit toute variation de cette boîte : rotation,
      barre d'URL mobile, et surtout bascule « version ordinateur ».
    */
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);

    this.animate();
  }

  /** Recale le tampon sur la boîte CSS et redistribue les particules. */
  private resize(): void {
    const r = this.canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width));
    const h = Math.max(1, Math.round(r.height));
    if (w === this.w && h === this.h) return;

    // Les particules suivent proportionnellement, sinon elles s'agglutinent
    // dans un coin après un élargissement du viewport.
    const fx = this.w > 1 ? w / this.w : 1;
    const fy = this.h > 1 ? h / this.h : 1;
    for (const p of this.particles) {
      p.x *= fx;
      p.y *= fy;
    }

    this.w = w;
    this.h = h;
    // Le tampon est en pixels physiques, le dessin reste en pixels CSS grâce
    // à la transformation : le rendu est net sur écran à haute densité sans
    // que la logique des particules ait à connaître le devicePixelRatio.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private createParticles(): void {
    this.particles = [];
    // Réduire le nombre de particules pour performance
    for (let i = 0; i < 25; i++) {
      this.particles.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3
      });
    }
  }

  private updateParticles(): void {
    this.particles.forEach(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Rebonds simples
      if (particle.x < 0 || particle.x > this.w) particle.vx *= -1;
      if (particle.y < 0 || particle.y > this.h) particle.vy *= -1;
      
      particle.x = Math.max(0, Math.min(this.w, particle.x));
      particle.y = Math.max(0, Math.min(this.h, particle.y));
    });
  }

  private draw(): void {
    this.ctx.clearRect(0, 0, this.w, this.h);
    
    // Dessiner les connexions
    this.ctx.strokeStyle = 'rgba(0, 229, 255, 0.2)';
    this.ctx.lineWidth = 1;

    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 120) {
          const opacity = (120 - distance) / 120 * 0.3;
          this.ctx.strokeStyle = `rgba(0, 229, 255, ${opacity})`;
          
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.stroke();
        }
      }
    }
    
    // Dessiner les particules
    this.ctx.fillStyle = '#00e5ff';
    this.particles.forEach(particle => {
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  private animate(): void {
    this.updateParticles();
    this.draw();
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  public destroy(): void {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.animationId = null;
    this.observer?.disconnect();
    this.observer = null;
  }
}

/*
  La toile n'existe qu'au-delà de 1024 px, où le CSS la révèle (`hidden lg:block`).

  L'ancienne version lisait window.innerWidth UNE SEULE FOIS au chargement. Quand
  un visiteur activait « version ordinateur » sur son téléphone, le CSS révélait
  le canvas mais rien ne l'initialisait : il restait à sa taille par défaut de
  300×150, étirée sur toute la largeur — d'où l'aspect tassé et déformé.
  Constaté en navigateur : tampon 300×150 pour une boîte de 1280×866.

  matchMedia est écouté en continu : la toile se crée et se détruit à chaque
  franchissement du seuil, quel que soit le moment où il survient.
*/
export function initNeuralNetwork(): void {
  const canvas = document.getElementById('neural-network-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;

  const large = window.matchMedia('(min-width: 1024px)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let instance: NeuralNetwork | null = null;

  const appliquer = (): void => {
    const doitTourner = large.matches && !reduced.matches;
    if (doitTourner && !instance) {
      instance = new NeuralNetwork(canvas);
    } else if (!doitTourner && instance) {
      instance.destroy();
      instance = null;
    }
  };

  appliquer();
  large.addEventListener('change', appliquer);
  reduced.addEventListener('change', appliquer);
}