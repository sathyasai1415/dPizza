import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface BentoCard {
  color: string;
  title: string;
  description: string;
  label: string;
  icon: string;
  accent: string;
  action?: () => void;
}

/**
 * MagicBento — the animated bento card grid from the old React home.
 * Spotlight follows the cursor per-card; accent border glows on hover.
 */
@Component({
  selector: 'app-magic-bento',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      @for (card of cards; track card.title) {
        <button type="button"
          class="bento-card group relative text-left rounded-[22px] p-5 overflow-hidden transition-transform duration-200 hover:-translate-y-1"
          [style.background]="card.color"
          [style.--accent]="card.accent"
          (click)="card.action?.()"
          (mousemove)="onMove($event)">
          <!-- spotlight -->
          <span class="bento-spot pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          <!-- accent glow border -->
          <span class="bento-border pointer-events-none absolute inset-0 rounded-[22px]"></span>

          <div class="relative z-10">
            <div class="w-11 h-11 rounded-2xl flex items-center justify-center text-xl mb-4"
              [style.background]="'color-mix(in srgb, ' + card.accent + ' 20%, transparent)'"
              [style.border]="'1px solid color-mix(in srgb, ' + card.accent + ' 40%, transparent)'">
              {{ card.icon }}
            </div>
            <p class="text-[10px] font-black uppercase tracking-widest mb-1" [style.color]="card.accent">{{ card.label }}</p>
            <p class="text-sm font-black text-white mb-1.5 leading-tight">{{ card.title }}</p>
            <p class="text-xs text-white/45 leading-relaxed">{{ card.description }}</p>
          </div>
        </button>
      }
    </div>
  `,
  styles: [`
    .bento-card {
      border: 1px solid rgba(255,255,255,0.08);
      box-shadow: 0 8px 32px -8px rgba(0,0,0,0.5);
    }
    .bento-spot {
      background: radial-gradient(
        circle 200px at var(--mx, 50%) var(--my, 50%),
        color-mix(in srgb, var(--accent) 22%, transparent),
        transparent 70%
      );
    }
    .bento-border {
      border: 1px solid transparent;
      transition: border-color .25s ease, box-shadow .25s ease;
    }
    .bento-card:hover .bento-border {
      border-color: color-mix(in srgb, var(--accent) 55%, transparent);
      box-shadow: 0 0 26px -4px color-mix(in srgb, var(--accent) 45%, transparent),
                  inset 0 0 20px -8px color-mix(in srgb, var(--accent) 40%, transparent);
    }
  `],
})
export class MagicBentoComponent {
  @Input() cards: BentoCard[] = [];

  onMove(e: MouseEvent): void {
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  }
}
