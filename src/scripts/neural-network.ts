/*
  Toile neuronale interactive - effet de particules connectées
  Réactif au mouvement de la souris, optimisé pour les performances
*/

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export class NeuralNetwork {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private mouse = { x: 0, y: 0 };
  private animationId: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.init();
    this.bindEvents();
    this.animate();
  }

  private init(): void {
    this.resize();
    this.createParticles();
  }

  private resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  private createParticles(): void {
    this.particles = [];
    const rect = this.canvas.getBoundingClientRect();
    
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5
      });
    }
  }

  private bindEvents(): void {
    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    window.addEventListener('resize', () => {
      this.resize();
      this.createParticles();
    });
  }

  private updateParticles(): void {
    const rect = this.canvas.getBoundingClientRect();
    
    this.particles.forEach(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Attraction vers la souris
      const dx = this.mouse.x - particle.x;
      const dy = this.mouse.y - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 100) {
        const force = (100 - distance) / 100;
        particle.x += dx * force * 0.01;
        particle.y += dy * force * 0.01;
      }

      // Rebonds
      if (particle.x < 0 || particle.x > rect.width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > rect.height) particle.vy *= -1;
      
      particle.x = Math.max(0, Math.min(rect.width, particle.x));
      particle.y = Math.max(0, Math.min(rect.height, particle.y));
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

// Initialisation
export function initNeuralNetwork(): void {
  const container = document.getElementById('neural-network');
  if (!container) return;

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none';
  container.appendChild(canvas);

  const isDesktop = window.innerWidth >= 1024;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (isDesktop && !prefersReducedMotion) {
    new NeuralNetwork(canvas);
  }
}