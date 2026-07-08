import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RestaurantService } from '../../core/services/restaurant.service';
import { Store } from '../../shared/models';
import { MagicBentoComponent, BentoCard } from '../../shared/magic-bento/magic-bento.component';

interface MapPin {
  id: string;
  name: string;
  price: number;
  eta: number;
  rating: number;
  emoji: string;
  x: number; // percentage
  y: number; // percentage
  city: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, MagicBentoComponent, CurrencyPipe],
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

      <!-- INTERACTIVE PRICE MAP WIDGET -->
      <div class="space-y-4">
        <div>
          <h3 class="text-xl font-black text-white">📍 Live Michigan Price Map</h3>
          <p class="text-xs text-white/50">Click on any store pin to see real-time pizza quotes near you.</p>
        </div>

        <div class="grid lg:grid-cols-[1fr_300px] gap-6">
          <!-- The stylized map -->
          <div class="relative h-96 rounded-3xl overflow-hidden glass border border-white/10 flex items-center justify-center bg-black/40">
            <!-- Map background grids -->
            <div class="absolute inset-0 dot-field opacity-30"></div>
            
            <!-- Styled city labels -->
            <div class="absolute top-10 left-10 text-[10px] font-black tracking-widest text-white/20 uppercase">Michigan Basin</div>
            <div class="absolute bottom-10 right-10 text-[10px] font-black tracking-widest text-white/20 uppercase">Lake Erie Area</div>

            <!-- Price Pins -->
            @for (pin of mapPins(); track pin.id) {
              <button (click)="selectedMapPin.set(pin)"
                [class]="'absolute flex flex-col items-center group transition ' + (selectedMapPin()?.id === pin.id ? 'scale-110 z-30' : 'hover:scale-105 z-20')"
                [style.left.%]="pin.x" [style.top.%]="pin.y">
                
                <!-- Price tag speech bubble -->
                <div class="bg-gradient-to-r from-red-600 to-orange-500 text-white font-black text-[10px] px-2.5 py-1 rounded-full shadow-lg border border-red-400/30 mb-1 group-hover:from-red-500 group-hover:to-orange-400">
                  {{ pin.price | currency }}
                </div>
                
                <!-- Pin icon -->
                <div class="w-7 h-7 rounded-full bg-black/60 border-2 border-red-500 flex items-center justify-center text-sm shadow-md">
                  {{ pin.emoji }}
                </div>
              </button>
            }

            <!-- Map Instructions overlay -->
            <div class="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl text-[10px] text-white/60">
              💡 Drag or tap store pins to compare quotes.
            </div>
          </div>

          <!-- Pin detail card -->
          <div class="glass rounded-3xl p-5 flex flex-col justify-between border border-white/10 bg-black/20">
            @if (selectedMapPin()) {
              <div class="space-y-4">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">
                    {{ selectedMapPin()!.emoji }}
                  </div>
                  <div>
                    <h4 class="font-black text-white text-base">{{ selectedMapPin()!.name }}</h4>
                    <p class="text-[10px] text-white/40 uppercase font-black tracking-wider">{{ selectedMapPin()!.city }}, MI</p>
                  </div>
                </div>

                <div class="space-y-2 border-t border-white/10 pt-4">
                  <div class="flex justify-between text-xs text-white/50">
                    <span>Large Pepperoni Pizza:</span>
                    <span class="text-white font-black">{{ selectedMapPin()!.price | currency }}</span>
                  </div>
                  <div class="flex justify-between text-xs text-white/50">
                    <span>Estimated prep time:</span>
                    <span class="text-white font-black">⏱️ {{ selectedMapPin()!.eta }} min</span>
                  </div>
                  <div class="flex justify-between text-xs text-white/50">
                    <span>Customer Rating:</span>
                    <span class="text-yellow-400 font-bold">★ {{ selectedMapPin()!.rating }}</span>
                  </div>
                </div>
              </div>

              <div class="space-y-2 pt-4">
                <button (click)="navigateToCompare()"
                  class="w-full py-2.5 rounded-xl font-bold bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-xs transition">
                  Compare Quote ⚖️
                </button>
                <p class="text-center text-[9px] text-white/30">Order this pizza directly on MiSlice.</p>
              </div>
            } @else {
              <div class="h-full flex flex-col items-center justify-center text-center text-white/30 py-12">
                <p class="text-3xl mb-2">📍</p>
                <p class="text-xs">Select a map pin to view store details & live price comparisons.</p>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- MAGIC BENTO GRID -->
      <app-magic-bento [cards]="bentoCards"></app-magic-bento>

      <!-- STORES SECTION -->
      <div class="space-y-6">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h3 class="text-xl sm:text-2xl font-black text-white">Marketplace Restaurants</h3>
            <p class="text-xs sm:text-sm text-white/50">Order online directly from approved Michigan pizza shops</p>
          </div>

          <!-- City Filters -->
          <div class="flex flex-wrap gap-2">
            <button *ngFor="let city of cities()" (click)="selectCity(city)"
              [class]="selectedCity() === city ? 'bg-red-600 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-md' : 'bg-white/5 text-white/70 hover:bg-white/10 px-3.5 py-1.5 rounded-xl text-xs transition'">
              {{ city }}
            </button>
          </div>
        </div>

        <!-- FILTER BAR -->
        <div class="glass rounded-2xl p-4 flex flex-wrap items-center gap-4 border border-white/5 text-xs">
          <!-- Distance -->
          <div class="flex items-center gap-2">
            <span class="text-white/40 font-bold uppercase tracking-wider text-[10px]">Distance:</span>
            <select [(ngModel)]="filterDistance"
              class="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-red-500">
              <option [value]="0">Any distance</option>
              <option [value]="5">Within 5 miles</option>
              <option [value]="10">Within 10 miles</option>
              <option [value]="20">Within 20 miles</option>
            </select>
          </div>

          <!-- Rating -->
          <div class="flex items-center gap-2">
            <span class="text-white/40 font-bold uppercase tracking-wider text-[10px]">Rating:</span>
            <select [(ngModel)]="filterRating"
              class="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-red-500">
              <option [value]="0">Any rating</option>
              <option [value]="4">4.0+ ★</option>
              <option [value]="4.5">4.5+ ★</option>
            </select>
          </div>

          <!-- Dietary -->
          <div class="flex items-center gap-2">
            <span class="text-white/40 font-bold uppercase tracking-wider text-[10px]">Dietary:</span>
            <select [(ngModel)]="filterDiet"
              class="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-red-500">
              <option value="All">Any diet</option>
              <option value="Vegetarian">🥗 Vegetarian</option>
              <option value="Vegan">🌱 Vegan</option>
              <option value="Gluten-Free">🌾 Gluten-Free</option>
            </select>
          </div>

          <!-- Open Now Toggle -->
          <label class="flex items-center gap-2.5 cursor-pointer ml-auto">
            <span class="text-white/40 font-bold uppercase tracking-wider text-[10px]">Open Now:</span>
            <button (click)="filterOpen.set(!filterOpen())"
              [class]="'w-9 h-5 rounded-full relative transition ' + (filterOpen() ? 'bg-red-500' : 'bg-white/15')">
              <span class="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" [style.left]="filterOpen() ? '18px' : '2px'"></span>
            </button>
          </label>
        </div>

        <!-- STORES GRID -->
        @if (loadingStore()) {
          <div class="flex justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-red-500"></div>
          </div>
        } @else if (filteredStores().length === 0) {
          <div class="glass rounded-3xl p-12 text-center text-white/40 text-sm">
            <p class="text-3xl mb-2">🍽️</p>
            <p>No restaurants match your selected filters in {{ selectedCity() }}.</p>
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div *ngFor="let store of filteredStores()" (click)="viewStore(store.slug)"
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
        }
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

  // Filter states
  filterDistance = 0;
  filterRating = 0;
  filterDiet = 'All';
  filterOpen = signal(false);

  // Selected map pin overlay state
  selectedMapPin = signal<MapPin | null>(null);

  // Interactive Map Pins data representing key chains and local spots compared
  mapPins = signal<MapPin[]>([
    { id: '1', name: "Domino's", price: 14.99, eta: 25, rating: 4.2, emoji: '🍕', x: 25, y: 35, city: 'Detroit' },
    { id: '2', name: 'Shamz Pizza', price: 11.99, eta: 18, rating: 4.8, emoji: '🔥', x: 45, y: 45, city: 'Detroit' },
    { id: '3', name: 'Pizza Hut', price: 13.49, eta: 30, rating: 4.0, emoji: '🍕', x: 65, y: 25, city: 'Ann Arbor' },
    { id: '4', name: "Jet's Pizza", price: 15.49, eta: 22, rating: 4.5, emoji: '📦', x: 30, y: 70, city: 'Detroit' },
    { id: '5', name: "Bunty's Pizza", price: 10.99, eta: 20, rating: 4.7, emoji: '🍕', x: 75, y: 60, city: 'Detroit' }
  ]);

  // MagicBento cards matching the old React layout
  bentoCards: BentoCard[] = [
    { color: '#1A0A0A', title: 'Compare Prices', description: 'See live quotes from every pizza chain near you — Dominos, Pizza Hut, Jets and more.', label: 'Compare', icon: '📊', accent: '#FF6B35', action: () => this.router.navigate(['/compare']) },
    { color: '#0F1020', title: 'AI Pizza Builder', description: 'Describe your perfect pizza in plain English and let AI configure it for you.', label: 'Build', icon: '🤖', accent: '#818CF8', action: () => this.router.navigate(['/builder']) },
    { color: '#120A18', title: 'Best Deals Near You', description: 'Michigan-exclusive flash deals, BOGO offers, and student discounts updated in real time from local pizzerias.', label: 'Deals', icon: '🏷️', accent: '#F59E0B', action: () => this.router.navigate(['/deals']) },
    { color: '#071510', title: 'Local Michigan Stores', description: "Discover independent pizzerias — Bunty's, Shamz, Motor City Slice and more hidden gems.", label: 'Discover', icon: '📍', accent: '#34D399', action: () => this.router.navigate(['/home']) },
    { color: '#15080A', title: 'Smart Search', description: 'Search by price, topping, delivery time or diet. MiSlice Pro unlocks AI-powered precision results.', label: 'Search', icon: '🔍', accent: '#F87171' },
    { color: '#0A0F18', title: 'Track Orders', description: 'Follow your order from oven to door with live status updates across all delivery platforms.', label: 'Track', icon: '🛵', accent: '#60A5FA', action: () => this.router.navigate(['/orders']) },
  ];

  // Computed filter logic
  filteredStores = computed(() => {
    let list = this.stores();

    // Filter by distance (mocked logic since db stores have lat/lng but distance requires client location)
    if (this.filterDistance > 0) {
      list = list.filter(s => {
        // Mock distance matching based on ID hash
        const mockDist = (s.name.charCodeAt(0) % 15) + 3;
        return mockDist <= this.filterDistance;
      });
    }

    // Filter by rating
    if (this.filterRating > 0) {
      list = list.filter(s => (s.ratingAvg ?? 0) >= this.filterRating);
    }

    // Filter by diet tags
    if (this.filterDiet !== 'All') {
      const d = this.filterDiet.toLowerCase();
      list = list.filter(s => {
        const description = (s.description ?? '').toLowerCase();
        const tagline = (s.tagline ?? '').toLowerCase();
        return description.includes(d) || tagline.includes(d);
      });
    }

    // Filter by open now
    if (this.filterOpen()) {
      list = list.filter(s => s.acceptingOrders !== false);
    }

    return list;
  });

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
