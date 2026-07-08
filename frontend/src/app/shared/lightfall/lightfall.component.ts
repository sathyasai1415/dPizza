import {
  Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, Input, NgZone,
} from '@angular/core';

/**
 * Lightfall — animated falling light-streaks background, canvas-based.
 * A performant recreation of the old React WebGL welcome background.
 */
@Component({
  selector: 'app-lightfall',
  standalone: true,
  template: `<canvas #cv class="block w-full h-full"></canvas>`,
  styles: [`:host { position:absolute; inset:0; display:block; overflow:hidden; }`],
})
export class LightfallComponent implements AfterViewInit, OnDestroy {
  @ViewChild('cv', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() colors: string[] = ['#ff6b6b', '#dc2626', '#f97316', '#fbbf24', '#ff4444'];
  @Input() backgroundColor = '#2a0808';
  @Input() streakCount = 90;

  private ctx!: CanvasRenderingContext2D;
  private raf = 0;
  private streaks: Streak[] = [];
  private w = 0; private h = 0; private dpr = 1;
  private resizeObs?: ResizeObserver;

  constructor(private zone: NgZone) {}

  ngAfterViewInit(): void {
    const cv = this.canvasRef.nativeElement;
    this.ctx = cv.getContext('2d')!;
    this.resize();
    this.resizeObs = new ResizeObserver(() => this.resize());
    this.resizeObs.observe(cv.parentElement ?? cv);
    this.seed();
    this.zone.runOutsideAngular(() => this.loop());
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.raf);
    this.resizeObs?.disconnect();
  }

  private resize(): void {
    const cv = this.canvasRef.nativeElement;
    const rect = (cv.parentElement ?? cv).getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = Math.max(1, rect.width);
    this.h = Math.max(1, rect.height);
    cv.width = this.w * this.dpr;
    cv.height = this.h * this.dpr;
    cv.style.width = this.w + 'px';
    cv.style.height = this.h + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  private seed(): void {
    this.streaks = Array.from({ length: this.streakCount }, () => this.mkStreak(true));
  }

  private mkStreak(initial = false): Streak {
    return {
      x: Math.random() * this.w,
      y: initial ? Math.random() * this.h : -Math.random() * 200,
      len: 40 + Math.random() * 140,
      speed: 60 + Math.random() * 180,
      width: 0.6 + Math.random() * 1.8,
      color: this.colors[(Math.random() * this.colors.length) | 0],
      alpha: 0.25 + Math.random() * 0.6,
      twinkle: Math.random() * Math.PI * 2,
    };
  }

  private last = performance.now();
  private loop = (): void => {
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const ctx = this.ctx;

    // fade background for subtle trails
    ctx.fillStyle = this.backgroundColor;
    ctx.globalAlpha = 1;
    ctx.fillRect(0, 0, this.w, this.h);

    ctx.globalCompositeOperation = 'lighter';
    for (const s of this.streaks) {
      s.y += s.speed * dt;
      s.twinkle += dt * 3;
      if (s.y - s.len > this.h) Object.assign(s, this.mkStreak(false));

      const flick = 0.7 + 0.3 * Math.sin(s.twinkle);
      const grad = ctx.createLinearGradient(s.x, s.y - s.len, s.x, s.y);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, s.color);
      ctx.strokeStyle = grad;
      ctx.globalAlpha = s.alpha * flick;
      ctx.lineWidth = s.width;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - s.len);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();

      // glowing head
      ctx.globalAlpha = s.alpha * flick;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.width * 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;

    this.raf = requestAnimationFrame(this.loop);
  };
}

interface Streak {
  x: number; y: number; len: number; speed: number; width: number;
  color: string; alpha: number; twinkle: number;
}
