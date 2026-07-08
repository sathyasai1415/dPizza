import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, NgZone } from '@angular/core';

/**
 * Hyperspeed — a rushing light-tunnel / starfield background, canvas-based.
 * Approximates the old React WebGL Hyperspeed effect used behind Favorite Stores.
 */
@Component({
  selector: 'app-hyperspeed',
  standalone: true,
  template: `<canvas #cv class="block w-full h-full"></canvas>`,
  styles: [`:host { position:absolute; inset:0; display:block; overflow:hidden; background:#050206; }`],
})
export class HyperspeedComponent implements AfterViewInit, OnDestroy {
  @ViewChild('cv', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private raf = 0; private w = 0; private h = 0; private dpr = 1;
  private stars: Star[] = [];
  private resizeObs?: ResizeObserver;
  private readonly count = 260;

  constructor(private zone: NgZone) {}

  ngAfterViewInit(): void {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.resize();
    this.resizeObs = new ResizeObserver(() => this.resize());
    this.resizeObs.observe(this.canvasRef.nativeElement.parentElement ?? this.canvasRef.nativeElement);
    this.seed();
    this.zone.runOutsideAngular(() => this.loop());
  }
  ngOnDestroy(): void { cancelAnimationFrame(this.raf); this.resizeObs?.disconnect(); }

  private resize(): void {
    const cv = this.canvasRef.nativeElement;
    const rect = (cv.parentElement ?? cv).getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = Math.max(1, rect.width); this.h = Math.max(1, rect.height);
    cv.width = this.w * this.dpr; cv.height = this.h * this.dpr;
    cv.style.width = this.w + 'px'; cv.style.height = this.h + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  private seed(): void {
    this.stars = Array.from({ length: this.count }, () => this.mk());
  }
  private mk(): Star {
    const colors = ['#ff6b35', '#dc2626', '#fbbf24', '#ffffff'];
    return {
      x: (Math.random() - 0.5) * this.w,
      y: (Math.random() - 0.5) * this.h,
      z: Math.random() * this.w,
      pz: 0,
      color: colors[(Math.random() * colors.length) | 0],
    };
  }

  private loop = (): void => {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(5,2,6,0.35)';
    ctx.fillRect(0, 0, this.w, this.h);
    const cx = this.w / 2, cy = this.h / 2;
    const speed = 14;

    for (const s of this.stars) {
      s.pz = s.z;
      s.z -= speed;
      if (s.z < 1) { Object.assign(s, this.mk()); s.z = this.w; s.pz = s.z; }

      const sx = (s.x / s.z) * this.w + cx;
      const sy = (s.y / s.z) * this.w + cy;
      const px = (s.x / s.pz) * this.w + cx;
      const py = (s.y / s.pz) * this.w + cy;
      const size = (1 - s.z / this.w) * 2.4;

      ctx.strokeStyle = s.color;
      ctx.globalAlpha = Math.min(1, (1 - s.z / this.w) + 0.1);
      ctx.lineWidth = Math.max(0.5, size);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(sx, sy);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    this.raf = requestAnimationFrame(this.loop);
  };
}

interface Star { x: number; y: number; z: number; pz: number; color: string; }
