import {
  Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, output, signal, NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * VideoIntro — full-screen animated space intro shown once per session,
 * recreating the old React welcome intro (starfield + MiSlice reveal + Skip).
 */
@Component({
  selector: 'app-video-intro',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-[10000] flex flex-col items-center justify-center"
      [class.intro-out]="closing()"
      style="background:#04020a;">
      <canvas #cv class="absolute inset-0 w-full h-full"></canvas>

      <div class="relative z-10 flex flex-col items-center text-center px-6 intro-in">
        <div class="w-24 h-24 rounded-[30px] flex items-center justify-center mb-5"
          style="background: linear-gradient(135deg,#dc2626,#f97316); box-shadow:0 12px 48px rgba(220,38,38,0.6);">
          <span class="text-5xl">🍕</span>
        </div>
        <h1 class="text-6xl font-black text-white tracking-tight" style="text-shadow:0 4px 30px rgba(220,38,38,0.5);">MiSlice</h1>
        <p class="text-white/50 mt-2 font-medium tracking-wide">Michigan's Pizza Marketplace</p>
      </div>

      <button (click)="close()"
        class="absolute bottom-8 right-8 z-10 px-5 py-2.5 rounded-full text-sm font-black text-white bg-white/10 border border-white/15 hover:bg-white/20 transition flex items-center gap-2">
        Skip ✕
      </button>
      <p class="absolute bottom-9 left-1/2 -translate-x-1/2 text-white/30 text-xs">Tap anywhere to continue</p>
      <div class="absolute inset-0 z-[5] cursor-pointer" (click)="close()"></div>
    </div>
  `,
  styles: [`
    .intro-in { animation: intro-in .9s cubic-bezier(.2,.8,.2,1) both; }
    @keyframes intro-in { from { opacity:0; transform:scale(.85) translateY(20px);} to {opacity:1; transform:none;} }
    .intro-out { animation: intro-out .5s ease forwards; }
    @keyframes intro-out { to { opacity:0; visibility:hidden; } }
  `],
})
export class VideoIntroComponent implements AfterViewInit, OnDestroy {
  @ViewChild('cv', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  done = output<void>();
  closing = signal(false);

  private ctx!: CanvasRenderingContext2D;
  private raf = 0; private stars: { x: number; y: number; z: number }[] = [];
  private auto = 0;

  constructor(private zone: NgZone) {}

  ngAfterViewInit(): void {
    const cv = this.canvasRef.nativeElement;
    this.ctx = cv.getContext('2d')!;
    const resize = () => { cv.width = window.innerWidth; cv.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    this.stars = Array.from({ length: 320 }, () => ({
      x: (Math.random() - 0.5) * cv.width,
      y: (Math.random() - 0.5) * cv.height,
      z: Math.random() * cv.width,
    }));
    this.zone.runOutsideAngular(() => this.loop());
    this.auto = window.setTimeout(() => this.close(), 4200);
  }

  ngOnDestroy(): void { cancelAnimationFrame(this.raf); clearTimeout(this.auto); }

  private loop = (): void => {
    const cv = this.canvasRef.nativeElement, ctx = this.ctx;
    ctx.fillStyle = 'rgba(4,2,10,0.4)'; ctx.fillRect(0, 0, cv.width, cv.height);
    const cx = cv.width / 2, cy = cv.height / 2;
    for (const s of this.stars) {
      s.z -= 8; if (s.z < 1) { s.z = cv.width; s.x = (Math.random() - 0.5) * cv.width; s.y = (Math.random() - 0.5) * cv.height; }
      const sx = (s.x / s.z) * cv.width + cx, sy = (s.y / s.z) * cv.width + cy;
      const r = (1 - s.z / cv.width) * 2;
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,${180 + Math.random() * 75 | 0},120,${1 - s.z / cv.width})`;
      ctx.fill();
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  close(): void {
    if (this.closing()) return;
    this.closing.set(true);
    setTimeout(() => this.done.emit(), 480);
  }
}
