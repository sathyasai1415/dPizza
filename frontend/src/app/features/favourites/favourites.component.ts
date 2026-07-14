import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { RestaurantService } from '../../core/services/restaurant.service';
import { Store } from '../../shared/models';
import { HyperspeedComponent } from '../../shared/hyperspeed/hyperspeed.component';

interface SavedPizza { id: string; name: string; size: string; crust: string; toppings: string[]; }

@Component({
  selector: 'app-favourites',
  standalone: true,
  imports: [CommonModule, DecimalPipe, HyperspeedComponent],
  template: `
    <div class="relative min-h-[85vh] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 overflow-hidden rounded-none">
      <!-- Hyperspeed visual context -->
      <div class="absolute inset-0 z-0"><app-hyperspeed></app-hyperspeed></div>
      <div class="absolute inset-0 z-[1] bg-brand-white pointer-events-none"></div>

      <div class="relative z-10 w-full max-w-5xl mx-auto space-y-6">
        <!-- HEADER -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-3xl font-black text-brand-black tracking-tight flex items-center gap-2">
              ❤️ Favourites
            </h1>
            <p class="text-brand-black text-sm mt-1">Your saved custom pizzas and preferred local stores.</p>
          </div>

          <!-- TAB SWITCHER -->
          <div class="flex p-1 bg-brand-white rounded-2xl border border-brand-black self-start">
            <button (click)="activeTab.set('pizzas')"
              [class]="'px-4 py-2 rounded-xl text-xs font-black transition ' + (activeTab() === 'pizzas' ? 'text-brand-black shadow-lg' : 'text-brand-black hover:text-brand-black')">
              🍕 Favorite Pizza's
            </button>
            <button (click)="activeTab.set('stores')"
              [class]="'px-4 py-2 rounded-xl text-xs font-black transition ' + (activeTab() === 'stores' ? 'text-brand-black shadow-lg' : 'text-brand-black hover:text-brand-black')">
              🏬 Favorite Stores
            </button>
          </div>
        </div>

        <div *ngIf="loading()" class="flex justify-center py-16">
          <div class="animate-spin rounded-full h-9 w-9 border-t-2 border-brand-red"></div>
        </div>

        <!-- FAVORITE PIZZAS TAB -->
        <div *ngIf="!loading() && activeTab() === 'pizzas'" class="space-y-4">
          @if (pizzas().length === 0) {
            <div class="clay rounded-[2rem] p-12 text-center border border-brand-black bg-brand-white">
              <p class="text-5xl mb-4">🍕</p>
              <p class="font-black text-brand-black text-lg mb-1">No Favorite Pizzas Yet</p>
              <p class="text-sm text-brand-black mb-6">Build your perfect configuration in the custom builder and save it to your favourites.</p>
              <button (click)="router.navigate(['/builder'])" class="px-6 py-3.5 rounded-xl font-black text-brand-black hover:hover:transition shadow-lg shadow-red-500/20">
                Go to Builder
              </button>
            </div>
          } @else {
            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              @for (p of pizzas(); track p.id) {
                <div class="clay rounded-3xl p-5 border border-brand-black bg-brand-white flex flex-col justify-between hover:border-brand-red transition group">
                  <div>
                    <div class="flex items-start justify-between mb-3">
                      <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-xl"
                        style="background: radial-gradient(circle at 50% 40%, #f4c07a, #c67f2e);">🍕</div>
                      <button (click)="deletePizza(p, $event)" class="text-brand-black hover:text-brand-red p-1.5 transition text-sm">
                        🗑️ Delete
                      </button>
                    </div>
                    <p class="font-black text-brand-black group-hover:text-brand-red transition text-base">{{ p.name }}</p>
                    <p class="text-xs text-brand-black mt-0.5">{{ p.size }} · {{ p.crust }}</p>
                    <div class="flex flex-wrap gap-1 mt-3">
                      @for (t of p.toppings; track t) {
                        <span class="text-[10px] bg-brand-white border border-brand-black text-brand-black px-2 py-0.5 rounded-md">{{ t }}</span>
                      }
                    </div>
                  </div>
                  <button (click)="orderAndCompare(p)" class="mt-5 w-full py-3 rounded-xl text-xs font-black text-brand-black hover:hover:transition shadow-md shadow-red-600/10">
                    ⚖️ Order &amp; Compare Quotes
                  </button>
                </div>
              }
            </div>
          }
        </div>

        <!-- FAVORITE STORES TAB -->
        <div *ngIf="!loading() && activeTab() === 'stores'" class="space-y-4">
          @if (stores().length === 0) {
            <div class="clay rounded-[2rem] p-12 text-center border border-brand-black bg-brand-white">
              <p class="text-5xl mb-4">⭐</p>
              <p class="font-black text-brand-black text-lg mb-1">No Favorite Stores Yet</p>
              <p class="text-sm text-brand-black mb-6">Explore local restaurants and tap the heart icon on their store cards to save them.</p>
              <button (click)="router.navigate(['/home'])" class="px-6 py-3.5 rounded-xl font-black text-brand-black hover:hover:transition shadow-lg shadow-red-500/20">
                Browse Pizzerias
              </button>
            </div>
          } @else {
            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              @for (s of stores(); track s.slug) {
                <div (click)="router.navigate(['/restaurants', s.slug])"
                  class="group glass rounded-3xl overflow-hidden cursor-pointer border border-brand-black bg-brand-white hover:border-brand-red transition flex flex-col justify-between">
                  <div class="h-24 flex items-center justify-center text-4xl" [style.background]="s.brandColor || 'rgba(255,255,255,0.03)'">
                    {{ s.emoji }}
                  </div>
                  <div class="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div class="flex items-center justify-between gap-2">
                        <p class="font-black text-brand-black group-hover:text-brand-red transition text-sm truncate">{{ s.name }}</p>
                        <button (click)="unfavStore(s, $event)" class="text-brand-red shrink-0 text-sm hover:scale-110 transition">❤️</button>
                      </div>
                      <p class="text-xs text-brand-black mt-0.5">{{ s.neighborhood || s.city }}</p>
                    </div>
                    <div class="flex items-center justify-between mt-3 pt-3 border-t border-brand-black">
                      <span class="text-xs text-brand-orange font-bold">★ {{ s.ratingAvg | number:'1.1-1' }}</span>
                      <span class="text-[10px] text-brand-black">Min. {{ s.minimumOrder | currency }}</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class FavouritesComponent implements OnInit {
  readonly router = inject(Router);
  private readonly restaurantService = inject(RestaurantService);

  activeTab = signal<'pizzas' | 'stores'>('pizzas');
  pizzas = signal<SavedPizza[]>([]);
  stores = signal<Store[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading.set(true);

    // 1. Load Pizzas
    try {
      const rawPizzas = localStorage.getItem('mislice_saved_pizzas');
      if (rawPizzas) this.pizzas.set(JSON.parse(rawPizzas));
    } catch { /* ignore */ }

    // 2. Load Stores
    const favStoreIds: string[] = JSON.parse(localStorage.getItem('mislice_fav_stores') || '[]');
    this.restaurantService.getRestaurants().subscribe({
      next: allRestaurants => {
        this.stores.set(favStoreIds.length ? allRestaurants.filter(s => favStoreIds.includes(s.id) || favStoreIds.includes(s.slug)) : []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  deletePizza(pizza: SavedPizza, e: Event): void {
    e.stopPropagation();
    try {
      const next = this.pizzas().filter(p => p.id !== pizza.id);
      localStorage.setItem('mislice_saved_pizzas', JSON.stringify(next));
      this.pizzas.set(next);
    } catch { /* ignore */ }
  }

  orderAndCompare(pizza: SavedPizza): void {
    // Navigate passing builder config as query parameters
    this.router.navigate(['/compare'], {
      queryParams: {
        size: pizza.size,
        crust: pizza.crust,
        toppings: pizza.toppings.join(',')
      }
    });
  }

  unfavStore(store: Store, e: Event): void {
    e.stopPropagation();
    try {
      const favIds: string[] = JSON.parse(localStorage.getItem('mislice_fav_stores') || '[]');
      const next = favIds.filter(id => id !== store.id && id !== store.slug);
      localStorage.setItem('mislice_fav_stores', JSON.stringify(next));
      this.stores.update(list => list.filter(x => x.slug !== store.slug));
    } catch { /* ignore */ }
  }
}
