import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, NgZone } from '@angular/core';

/**
 * TextCursor — a soft trailing dot cursor, matching the old React app-wide effect.
 * Disabled automatically on touch / coarse-pointer devices.
 */
@Component({
  selector: 'app-text-cursor',
  standalone: true,
  template: `<canvas #cv class="fixed inset-0 pointer-events-none z-[9999]"></canvas>`,
})
export class TextCursorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('cv', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private raf = 0;
  private trail: { x: number; y: number; a: number }[] = [];
  private mx = -100; private my = -100;
  private dpr = 1;
  private enabled = true;
  private onMove = (e: MouseEvent) => { this.mx = e.clientX; this.my = e.clientY; };
  private onResize = () => this.size();

  constructor(private zone: NgZone) {}

  ngAfterViewInit(): void {
    // skip on touch devices
    if (window.matchMedia('(pointer: coarse)').matches) { this.enabled = false; return; }
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.size();
    window.addEventListener('mousemove', this.onMove, { passive: true });
    window.addEventListener('resize', this.onResize);
    this.zone.runOutsideAngular(() => this.loop());
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('mousemove', this.onMove);
    window.removeEventListener('resize', this.onResize);
  }

  private size(): void {
    const cv = this.canvasRef.nativeElement;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = window.innerWidth * this.dpr;
    cv.height = window.innerHeight * this.dpr;
    cv.style.width = window.innerWidth + 'px';
    cv.style.height = window.innerHeight + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  private loop = (): void => {
    if (!this.enabled) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    this.trail.push({ x: this.mx, y: this.my, a: 1 });
    if (this.trail.length > 14) this.trail.shift();

    for (let i = 0; i < this.trail.length; i++) {
      const p = this.trail[i];
      p.a *= 0.9;
      const r = 2 + (i / this.trail.length) * 5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220,38,38,${(i / this.trail.length) * 0.5})`;
      ctx.fill();
    }
    // bright head
    ctx.beginPath();
    ctx.arc(this.mx, this.my, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(249,115,22,0.9)';
    ctx.fill();

    this.raf = requestAnimationFrame(this.loop);
  };
}
