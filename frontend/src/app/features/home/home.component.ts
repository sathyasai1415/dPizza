import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RestaurantService } from '../../core/services/restaurant.service';
import { Store, Deal } from '../../shared/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8">
      
      <!-- HERO CAROUSEL / HIGHLIGHT -->
      <div class="relative overflow-hidden rounded-[24px] sm:rounded-[32px] border border-red-500/40 bg-gradient-to-br from-orange-950 to-red-950 p-6 sm:p-8 lg:p-12 shadow-2xl">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.15),transparent_40%)] pointer-events-none"></div>
        
        <div class="relative z-10 max-w-2xl">
          <span class="inline-flex items-center gap-2 rounded-full bg-blue-500/20 backdrop-blur-sm px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-blue-300 border border-blue-400/30">
            🍕 Live Pizza Comparison
          </span>
          <h2 class="mt-4 text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
            Build your pizza, compare price quotes instantly.
          </h2>
          <p class="mt-4 text-sm sm:text-base text-blue-100/70 leading-relaxed">
            Watch your ingredients drop onto the pizza, then click compare to find the cheapest, fastest, and best value options from Domino's, Pizza Hut, Papa John's, Marco's, Jet's, or Bunty's.
          </p>
          <div class="mt-8 flex flex-wrap gap-4">
            <button (click)="navigateToBuilder()"
              class="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg shadow-red-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0">
              Start Customizing 🍕
            </button>
            <button (click)="navigateToCompare()"
              class="px-6 py-3 rounded-xl font-bold bg-white/5 border border-white/10 hover:bg-white/10 text-white transition transform hover:-translate-y-0.5 active:translate-y-0">
              Compare Chains ⚖️
            </button>
          </div>
        </div>
      </div>

      <!-- LIVE DEALS TICKER -->
      <div class="w-full py-3 bg-red-600/10 border-y border-red-500/20 overflow-hidden flex items-center">
        <div class="animate-marquee whitespace-nowrap text-xs sm:text-sm font-bold text-red-300 flex gap-12">
          <span>🍕 Shamz Pizza · Large Pepperoni now $11.99</span>
          <span>🏷️ Marco's · Buy One Get One Free — Tuesdays only</span>
          <span>⚡ Pizza Hut · Free delivery on orders over $20</span>
          <span>🔥 Jet's Pizza · 30% off all deep dish orders</span>
          <span>💰 Bunty's Pizza · $5 off any extra-large pizza</span>
        </div>
      </div>

      <!-- STORES SECTION -->
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h3 class="text-xl sm:text-2xl font-black">Marketplace Restaurants</h3>
            <p class="text-xs sm:text-sm text-white/50">Order online directly from approved Michigan pizza shops</p>
          </div>

          <!-- City Filters -->
          <div class="flex flex-wrap gap-2">
            <button *ngFor="let city of cities()" (click)="selectCity(city)"
              [class]="selectedCity() === city ? 'bg-red-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs' : 'bg-white/5 text-white/70 hover:bg-white/10 px-3 py-1.5 rounded-lg text-xs transition'">
              {{ city }}
            </button>
          </div>
        </div>

        <!-- STORES GRID -->
        <div *ngIf="loadingStore()" class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-red-500"></div>
        </div>

        <div *ngIf="!loadingStore() && stores().length === 0" class="text-center py-12 text-white/40">
          <p class="text-lg">No restaurants approved in {{ selectedCity() }} yet.</p>
        </div>

        <div *ngIf="!loadingStore() && stores().length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div *ngFor="let store of stores()" (click)="viewStore(store.slug)"
            class="group glass rounded-[24px] overflow-hidden cursor-pointer hover:border-red-500/30 transition transform hover:-translate-y-1">
            <!-- Store Emoji / Logo header -->
            <div class="h-32 relative bg-gradient-to-br flex items-center justify-center text-5xl"
              [style.background]="store.brandColor ? store.brandColor : 'rgba(255,255,255,0.03)'">
              <span>{{ store.emoji }}</span>
              <span *ngIf="store.featured" class="absolute top-3 right-3 text-[10px] bg-red-600 px-2 py-0.5 rounded-full text-white font-black uppercase tracking-wider">
                Featured
              </span>
            </div>

            <!-- Store Details -->
            <div class="p-5 space-y-3">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <h4 class="font-black text-lg text-white group-hover:text-red-400 transition">{{ store.name }}</h4>
                  <p class="text-xs text-white/50">{{ store.neighborhood || store.city }}</p>
                </div>
                <div class="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg text-xs text-yellow-400 font-bold shrink-0">
                  ★ {{ store.ratingAvg | number:'1.1-1' }}
                </div>
              </div>

              <p class="text-xs text-white/70 line-clamp-2 leading-relaxed">
                {{ store.tagline || store.description || 'Welcome to ' + store.name + ', offering high quality pizzas cooked fresh to order.' }}
              </p>

              <!-- Stats & Tags -->
              <div class="pt-2 flex flex-wrap gap-2 text-[10px] font-bold">
                <span class="bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md">
                  🚴 {{ store.deliveryFee === 0 ? 'Free Delivery' : (store.deliveryFee | currency) }}
                </span>
                <span class="bg-violet-500/10 text-violet-400 px-2 py-1 rounded-md">
                  ⏱️ {{ store.averageEtaMinutes || 25 }} min
                </span>
                <span *ngFor="let tag of store.tags" class="bg-stone-500/10 text-stone-400 px-2 py-1 rounded-md capitalize">
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    @keyframes marquee {
      0% { transform: translateX(100%); }
      100% { transform: translateX(-100%); }
    }
    .animate-marquee {
      animation: marquee 25s linear infinite;
    }
  `]
})
export class HomeComponent implements OnInit {
  private readonly restaurantService = inject(RestaurantService);
  private readonly router = inject(Router);

  stores = signal<Store[]>([]);
  cities = signal<string[]>([]);
  selectedCity = signal('All');
  loadingStore = signal(true);

  ngOnInit() {
    this.loadCities();
    this.loadRestaurants();
  }

  loadCities() {
    this.restaurantService.getCities().subscribe(cList => {
      this.cities.set(['All', ...cList.map(c => String(c))]);
    });
  }

  loadRestaurants() {
    this.loadingStore.set(true);
    const city = this.selectedCity() === 'All' ? undefined : this.selectedCity();
    this.restaurantService.getRestaurants(city).subscribe(stores => {
      this.stores.set(stores);
      this.loadingStore.set(false);
    });
  }

  selectCity(city: string) {
    this.selectedCity.set(city);
    this.loadRestaurants();
  }

  navigateToBuilder() {
    this.router.navigate(['/builder']);
  }

  navigateToCompare() {
    this.router.navigate(['/compare']);
  }

  viewStore(slug: string) {
    this.router.navigate(['/restaurants', slug]);
  }
}
