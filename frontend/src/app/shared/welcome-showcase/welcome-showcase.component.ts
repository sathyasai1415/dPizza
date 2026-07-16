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
    <div class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0E0E10] overflow-y-auto p-4 sm:p-6">
      <div class="w-full max-w-4xl bg-[#18181B] border border-[#2B2B31] rounded-[28px] overflow-hidden flex flex-col shadow-2xl animate-fadeIn">
        
        <!-- The Poster Image -->
        <div class="relative w-full aspect-[4/3] sm:aspect-[16/11] bg-[#0E0E10] flex items-center justify-center border-b border-[#2B2B31]">
          <img src="assets/poster.png" alt="MiSlice Poster" class="w-full h-full object-contain" />
        </div>

        <!-- Footer / Location Prompt Trigger -->
        <div class="p-6 bg-[#18181B] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <span class="text-2xl select-none">📍</span>
            <div class="text-left">
              <p class="text-sm font-bold text-white">Location Access</p>
              <p class="text-xs text-[#B8B8B8] font-semibold">We'll ask for your location to show nearby deals &amp; delivery options.</p>
            </div>
          </div>

          <button (click)="dismiss()"
            class="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-xs bg-[#E53935] hover:bg-[#E53935]/90 text-white transition uppercase tracking-wider shadow-md">
            Let's Find Your Perfect Slice →
          </button>
        </div>

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
