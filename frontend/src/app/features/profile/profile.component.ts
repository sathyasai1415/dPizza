import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="w-full max-w-3xl mx-auto py-4 space-y-6">
      <div>
        <h1 class="text-3xl font-black text-white tracking-tight">Dietary Profile</h1>
        <p class="text-white/50 text-sm mt-1">We use these to personalize pizza recommendations for you.</p>
      </div>

      <!-- Account card -->
      <section class="glass rounded-3xl p-6 flex items-center gap-4">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center text-2xl font-black text-white">
          {{ (user()?.fullName || 'U').charAt(0) }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-lg font-black text-white truncate">{{ user()?.fullName || 'Guest' }}</p>
          <p class="text-sm text-white/50 truncate">{{ user()?.email }}</p>
        </div>
        <span class="text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full">
          {{ user()?.roles?.[0] || 'Customer' }}
        </span>
      </section>

      <!-- Diet toggles -->
      <section class="glass rounded-3xl p-6 space-y-4">
        <p class="text-xs font-black uppercase tracking-widest text-white/40">Diet</p>
        <div class="grid sm:grid-cols-2 gap-3">
          @for (d of diets; track d.key) {
            <button (click)="toggle(d.key)"
              [class]="'flex items-center gap-3 p-4 rounded-2xl border text-left transition ' +
                (state[d.key] ? 'bg-red-600/20 border-red-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10')">
              <span class="text-xl">{{ d.emoji }}</span>
              <div class="flex-1">
                <p class="text-sm font-bold text-white">{{ d.label }}</p>
                <p class="text-[11px] text-white/40">{{ d.desc }}</p>
              </div>
              <span [class]="'w-9 h-5 rounded-full relative transition ' + (state[d.key] ? 'bg-red-500' : 'bg-white/15')">
                <span class="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                  [style.left]="state[d.key] ? '18px' : '2px'"></span>
              </span>
            </button>
          }
        </div>
      </section>

      <!-- Allergens -->
      <section class="glass rounded-3xl p-6 space-y-3">
        <p class="text-xs font-black uppercase tracking-widest text-white/40">Avoid Allergens</p>
        <div class="flex flex-wrap gap-2">
          @for (a of allergens; track a) {
            <button (click)="toggleAllergen(a)"
              [class]="'px-3.5 py-2 rounded-xl text-xs font-bold transition ' +
                (avoided.includes(a) ? 'bg-red-600 text-white' : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10')">
              {{ a }}
            </button>
          }
        </div>
      </section>

      <button (click)="save()"
        class="w-full py-4 rounded-2xl font-black text-white bg-gradient-to-r from-red-600 to-orange-500 shadow-lg shadow-red-600/30 hover:from-red-500 hover:to-orange-400 transition">
        {{ saved() ? '✓ Saved' : 'Save Preferences' }}
      </button>
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  private readonly auth = inject(AuthService);
  user = this.auth.currentUser;
  saved = signal(false);

  diets = [
    { key: 'vegetarian', label: 'Vegetarian', emoji: '🥗', desc: 'No meat toppings' },
    { key: 'vegan', label: 'Vegan', emoji: '🌱', desc: 'No animal products' },
    { key: 'halal', label: 'Halal', emoji: '🕌', desc: 'Halal-certified meats' },
    { key: 'glutenFree', label: 'Gluten Free', emoji: '🌾', desc: 'Gluten-free crust' },
  ];
  state: Record<string, boolean> = { vegetarian: false, vegan: false, halal: false, glutenFree: false };
  allergens = ['Dairy', 'Nuts', 'Soy', 'Eggs', 'Shellfish', 'Wheat'];
  avoided: string[] = [];

  ngOnInit(): void {
    try {
      const raw = localStorage.getItem('mislice_diet');
      if (raw) {
        const p = JSON.parse(raw);
        this.state = { ...this.state, ...(p.state ?? {}) };
        this.avoided = p.avoided ?? [];
      }
    } catch { /* ignore */ }
  }

  toggle(k: string): void { this.state[k] = !this.state[k]; this.saved.set(false); }
  toggleAllergen(a: string): void {
    this.avoided = this.avoided.includes(a) ? this.avoided.filter(x => x !== a) : [...this.avoided, a];
    this.saved.set(false);
  }
  save(): void {
    localStorage.setItem('mislice_diet', JSON.stringify({ state: this.state, avoided: this.avoided }));
    this.saved.set(true);
  }
}
