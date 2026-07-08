import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface SavedPizza { id: string; name: string; size: string; crust: string; toppings: string[]; }

@Component({
  selector: 'app-saved-pizzas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full max-w-4xl mx-auto py-2 space-y-6">
      <div>
        <h1 class="text-3xl font-black text-white">Saved Pizzas</h1>
        <p class="text-white/50 text-sm mt-1">Your favorite custom creations, ready to reorder.</p>
      </div>

      @if (pizzas().length === 0) {
        <div class="glass rounded-3xl p-12 text-center">
          <p class="text-4xl mb-3">🍕</p>
          <p class="font-black text-white mb-1">No saved pizzas yet</p>
          <p class="text-sm text-white/50 mb-5">Build a pizza you love and save it for one-tap reordering.</p>
          <button (click)="router.navigate(['/builder'])" class="px-6 py-3 rounded-xl font-black text-white bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 transition">
            Build a Pizza
          </button>
        </div>
      } @else {
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (p of pizzas(); track p.id) {
            <div class="glass rounded-3xl p-5">
              <div class="w-16 h-16 rounded-full mb-3 flex items-center justify-center text-2xl"
                style="background: radial-gradient(circle at 50% 40%, #f4c07a, #c67f2e);">🍕</div>
              <p class="font-black text-white">{{ p.name }}</p>
              <p class="text-xs text-white/50">{{ p.size }} · {{ p.crust }}</p>
              <div class="flex flex-wrap gap-1 mt-2">
                @for (t of p.toppings; track t) {
                  <span class="text-[10px] bg-white/5 border border-white/10 text-white/60 px-2 py-0.5 rounded-md">{{ t }}</span>
                }
              </div>
              <button (click)="router.navigate(['/compare'])" class="mt-4 w-full py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 transition">
                Order &amp; Compare
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class SavedPizzasComponent implements OnInit {
  readonly router = inject(Router);
  pizzas = signal<SavedPizza[]>([]);

  ngOnInit(): void {
    try {
      const raw = localStorage.getItem('mislice_saved_pizzas');
      if (raw) this.pizzas.set(JSON.parse(raw));
    } catch { /* ignore */ }
  }
}
