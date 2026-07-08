import {
  Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, NgZone,
} from '@angular/core';

/**
 * GridScan — animated grid with a sweeping red scan line, canvas-based.
 * Recreates the old React sidebar background.
 */
@Component({
  selector: 'app-gridscan',
  standalone: true,
  template: `<canvas #cv class="block w-full h-full"></canvas>`,
  styles: [`:host { position:absolute; inset:0; display:block; overflow:hidden; }`],
})
export class GridScanComponent implements AfterViewInit, OnDestroy {
  @ViewChild('cv', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private raf = 0;
  private w = 0; private h = 0; private dpr = 1;
  private scan = 0;
  private resizeObs?: ResizeObserver;
  private readonly cell = 34;

  constructor(private zone: NgZone) {}

  ngAfterViewInit(): void {
    const cv = this.canvasRef.nativeElement;
    this.ctx = cv.getContext('2d')!;
    this.resize();
    this.resizeObs = new ResizeObserver(() => this.resize());
    this.resizeObs.observe(cv.parentElement ?? cv);
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
    cv.width = this.w * this.dpr; cv.height = this.h * this.dpr;
    cv.style.width = this.w + 'px'; cv.style.height = this.h + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  private last = performance.now();
  private loop = (): void => {
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, this.w, this.h);

    // static grid
    ctx.strokeStyle = 'rgba(220,38,38,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= this.w; x += this.cell) { ctx.moveTo(x, 0); ctx.lineTo(x, this.h); }
    for (let y = 0; y <= this.h; y += this.cell) { ctx.moveTo(0, y); ctx.lineTo(this.w, y); }
    ctx.stroke();

    // sweeping scan line
    this.scan += dt * 90;
    if (this.scan > this.h + 120) this.scan = -120;
    const grad = ctx.createLinearGradient(0, this.scan - 90, 0, this.scan + 30);
    grad.addColorStop(0, 'rgba(220,38,38,0)');
    grad.addColorStop(0.7, 'rgba(220,38,38,0.10)');
    grad.addColorStop(1, 'rgba(249,115,22,0.28)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, this.scan - 90, this.w, 120);

    // bright scan edge
    ctx.strokeStyle = 'rgba(249,115,22,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, this.scan);
    ctx.lineTo(this.w, this.scan);
    ctx.stroke();

    // highlight grid intersections near the scan line
    ctx.fillStyle = 'rgba(251,191,36,0.6)';
    for (let x = 0; x <= this.w; x += this.cell) {
      const yy = Math.round(this.scan / this.cell) * this.cell;
      const d = Math.abs(yy - this.scan);
      if (d < 40) {
        ctx.globalAlpha = 1 - d / 40;
        ctx.beginPath(); ctx.arc(x, yy, 1.6, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    this.raf = requestAnimationFrame(this.loop);
  };
}
