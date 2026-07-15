import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Feature {
  icon: string;
  title: string;
  desc: string;
  chip: string;
  accent: string;
}

/**
 * Full-screen post-login welcome showcase — highlights MiSlice's core
 * features in the app's own light card / bold-pill visual language, shown
 * once per session right after a successful customer login, before any
 * other first-run prompts (e.g. the Home location-permission modal).
 */
@Component({
  selector: 'app-welcome-showcase',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-brand-white overflow-y-auto">
      <div class="w-full max-w-3xl py-8">

        <!-- Brand header -->
        <div class="flex flex-col items-center text-center mb-8">
          <div class="w-16 h-16 rounded-[22px] flex items-center justify-center mb-4 bg-brand-red text-brand-white shadow-lg">
            <span class="text-3xl">🍕</span>
          </div>
          <h1 class="text-3xl sm:text-4xl font-black text-brand-black tracking-tight">Welcome to MiSlice!</h1>
          <p class="text-sm mt-2 font-medium text-brand-black opacity-70 max-w-md">
            Here's everything you can do — compare prices, build your dream pizza, and grab the best local deals.
          </p>
        </div>

        <!-- Feature cards -->
        <div class="grid sm:grid-cols-2 gap-4 mb-8">
          @for (f of features; track f.title) {
            <div class="clay rounded-2xl p-5 border border-brand-black bg-brand-white shadow-sm space-y-3">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0" [style.background]="f.accent">
                  {{ f.icon }}
                </div>
                <h3 class="font-black text-brand-black text-base leading-tight">{{ f.title }}</h3>
              </div>
              <p class="text-xs text-brand-black opacity-70 leading-relaxed">{{ f.desc }}</p>
              <span class="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border border-brand-black bg-brand-white text-brand-black">
                {{ f.chip }}
              </span>
            </div>
          }
        </div>

        <!-- Location teaser (leads naturally into the location prompt) -->
        <div class="rounded-2xl p-4 border border-brand-black bg-brand-white flex items-center gap-3 mb-8">
          <span class="text-xl">📍</span>
          <p class="text-xs font-semibold text-brand-black">Next, we'll ask for your location so we can show real-time delivery costs and nearby deals.</p>
        </div>

        <button (click)="dismiss()"
          class="w-full py-4 rounded-full font-black text-brand-white text-sm shadow-lg bg-brand-red hover:opacity-90 transition">
          Get Started →
        </button>
      </div>
    </div>
  `,
})
export class WelcomeShowcaseComponent {
  done = output<void>();

  features: Feature[] = [
    { icon: '🍕', title: 'Build Your Own Pizza', desc: 'Pick your size, crust, sauce, and toppings — customize every detail exactly how you like it.', chip: 'Fully Customizable', accent: '#FFE8CC' },
    { icon: '⚖️', title: 'Compare Prices Live', desc: "See real-time prices across Domino's, Pizza Hut, Papa John's, and local favorites side by side.", chip: 'Live Price Comparison', accent: '#FFE0DC' },
    { icon: '🏷️', title: 'Deals & Offers', desc: 'BOGO offers, flash deals, and student discounts from restaurants near you, updated daily.', chip: 'Local Deals', accent: '#FFF3C4' },
    { icon: '📍', title: 'Discover Local Pizzerias', desc: 'Find top-rated local spots and national chains, ranked by price, rating, and delivery time.', chip: 'Near You', accent: '#DDF3E4' },
  ];

  dismiss(): void {
    this.done.emit();
  }
}
