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

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    this.ctx = ctx;
    this.init();
    this.animate();
  }

  private init(): void {
    // Taille fixe pour éviter problèmes de resize
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.createParticles();
  }

  private createParticles(): void {
    this.particles = [];
    // Réduire le nombre de particules pour performance
    for (let i = 0; i < 25; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
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
      if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;
      
      particle.x = Math.max(0, Math.min(this.canvas.width, particle.x));
      particle.y = Math.max(0, Math.min(this.canvas.height, particle.y));
    });
  }

  private draw(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
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
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

// Initialisation simplifiée
export function initNeuralNetwork(): void {
  const canvas = document.getElementById('neural-network-canvas') as HTMLCanvasElement;
  if (!canvas) return;

  const isDesktop = window.innerWidth >= 1024;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (isDesktop && !prefersReducedMotion) {
    new NeuralNetwork(canvas);
  }
}