import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="w-full max-w-4xl mx-auto space-y-8 py-2">
      <div class="text-center">
        <span class="inline-flex items-center gap-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black px-4 py-2 uppercase tracking-widest">How MiSlice Works</span>
        <h1 class="mt-4 text-3xl sm:text-4xl font-black text-white">Better pizza deals in 5 steps</h1>
        <p class="mt-2 text-white/50">Build it, compare it, order it — all from one place.</p>
      </div>

      <div class="grid sm:grid-cols-2 gap-4">
        @for (s of steps; track s.n) {
          <div class="glass rounded-3xl p-6 flex gap-4">
            <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center text-lg font-black text-white shrink-0">{{ s.n }}</div>
            <div>
              <p class="text-base font-black text-white">{{ s.icon }} {{ s.title }}</p>
              <p class="text-sm text-white/50 mt-1 leading-relaxed">{{ s.desc }}</p>
            </div>
          </div>
        }
      </div>

      <div class="text-center">
        <a routerLink="/builder" class="inline-block px-8 py-4 rounded-2xl font-black text-white bg-gradient-to-r from-red-600 to-orange-500 shadow-lg shadow-red-600/30 hover:from-red-500 hover:to-orange-400 transition">
          Build Your First Pizza 🍕
        </a>
      </div>
    </div>
  `,
})
export class HowItWorksComponent {
  steps = [
    { n: 1, icon: '🍕', title: 'Build Your Pizza', desc: 'Pick your size, crust, sauce and toppings in the visual builder.' },
    { n: 2, icon: '💸', title: 'We Fetch Live Prices', desc: 'MiSlice pulls real quotes from every pizza chain and local shop near you.' },
    { n: 3, icon: '⚖️', title: 'Compare Side-by-Side', desc: 'See the cheapest, fastest and best-value options ranked instantly.' },
    { n: 4, icon: '🔒', title: 'Order Securely', desc: 'Place your order and pay on delivery or at the store — your choice.' },
    { n: 5, icon: '🛵', title: 'Track in Real Time', desc: 'Follow your order from oven to door with live status updates.' },
  ];
}
