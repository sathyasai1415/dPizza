import { Component, inject, signal, computed, OnInit, effect, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RestaurantService } from '../../core/services/restaurant.service';
import { LocationService } from '../../core/services/location.service';
import { Store } from '../../shared/models';
import * as L from 'leaflet';

interface MapPin {
  id: string;
  name: string;
  price: number;
  eta: number;
  rating: number;
  emoji: string;
  lat: number;
  lng: number;
  city: string;
}

@Component({
  selector: 'app-order',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  template: `
    <div class="space-y-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 rounded-[32px] bg-[#0E0E10]">

      <!-- MAP SECTION -->
      <section id="price-map" class="space-y-4">
        <div class="flex items-center justify-between border-b border-[#2B2B31] pb-3">
          <div>
            <h2 class="text-[28px] font-bold text-white">Regional Pizza Map</h2>
            <p class="text-[16px] text-[#A9A9A9]">Select pizzerias directly from the interactive local price map</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-stretch">
          <!-- Canvas for Leaflet -->
          <div class="h-[450px] rounded-[22px] border border-[#2B2B31] overflow-hidden relative shadow-lg bg-[#18181B]" style="z-index: 10;">
            <div id="price-map-canvas" class="w-full h-full"></div>
          </div>

          <!-- Dynamic Pin Details sidebar -->
          <div class="clay rounded-[22px] p-6 border border-[#2B2B31] bg-[#18181B] flex flex-col justify-between shadow-lg">
            <div>
              <div class="border-b border-[#2B2B31] pb-4 mb-4">
                <span class="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">Active Selection</span>
                <h3 class="text-xl font-bold text-white mt-1">{{ selectedMapPin()?.name || 'Select a map pin' }}</h3>
              </div>

              @if (selectedMapPin()) {
                <div class="space-y-4 text-xs animate-fadeIn">
                  <div class="flex items-center gap-3">
                    <span class="text-3xl">{{ selectedMapPin()?.emoji }}</span>
                    <div>
                      <p class="text-sm font-bold text-white">{{ selectedMapPin()?.name }}</p>
                      <p class="text-neutral-400 font-medium mt-0.5">Rating: <span class="text-[#D4AF37]">★ {{ selectedMapPin()?.rating }}</span></p>
                    </div>
                  </div>
                  <div class="bg-[#1E1E22] border border-[#2B2B31] rounded-xl p-4 space-y-2 text-[#B8B8B8] font-semibold">
                    <div class="flex justify-between">
                      <span>Delivery ETA:</span>
                      <span class="text-white">{{ selectedMapPin()?.eta }} mins</span>
                    </div>
                    <div class="flex justify-between">
                      <span>Base Cheese Pizza:</span>
                      <span class="text-[#D4AF37] font-bold">{{ selectedMapPin()?.price | currency }}</span>
                    </div>
                  </div>
                </div>
              } @else {
                <div class="text-center py-10 text-neutral-500 font-medium">
                  <p class="text-4xl mb-3">📍</p>
                  <p>Click any pizzeria pin on the map to compare pricing, ETA, and details instantly.</p>
                </div>
              }
            </div>

            <div class="pt-4 border-t border-[#2B2B31] mt-4">
              <button [disabled]="!selectedMapPin()" (click)="viewSelectedStore()"
                class="w-full py-3 rounded-xl font-bold text-xs bg-[#E53935] hover:bg-[#E53935]/90 text-white transition disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider">
                🛒 View Menu &amp; Order
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- MARKETPLACE STORES SECTION -->
      <section class="space-y-6">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#2B2B31] pb-5">
          <div>
            <h2 class="text-[28px] font-bold text-[#FFFFFF]">Marketplace Pizzerias</h2>
            <p class="text-[16px] text-[#A9A9A9]">Order directly from top rated local stores and national chains</p>
          </div>

          <!-- City Filters -->
          <div class="flex flex-wrap gap-2">
            <button *ngFor="let city of cities()" (click)="selectCity(city)"
              [class]="locationService.selectedCity() === city
                ? 'bg-[#1E1E22] border border-[#D4AF37] text-[#D4AF37] font-bold px-4 py-2 rounded-xl text-xs shadow-sm'
                : 'bg-[#18181B] border border-[#2B2B31] text-[#B8B8B8] hover:bg-white/5 px-4 py-2 rounded-xl text-xs transition'">
              {{ city === 'All' ? 'All Cities' : city }}
            </button>
          </div>
        </div>

        <!-- FILTER BAR -->
        <div class="bg-[#18181B] border border-[#2B2B31] rounded-[22px] p-4 flex flex-wrap items-center gap-4 text-xs shadow-sm">
          <!-- Distance -->
          <div class="flex items-center gap-2">
            <span class="text-[#B8B8B8] font-semibold text-[15px]">Distance:</span>
            <select [(ngModel)]="filterDistance"
              class="bg-[#1E1E22] border border-[#2B2B31] rounded-xl px-3 py-2 text-[#E5E5E5] text-[15px] font-semibold outline-none">
              <option [value]="0">Any distance</option>
              <option [value]="5">Within 5 miles</option>
              <option [value]="10">Within 10 miles</option>
              <option [value]="20">Within 20 miles</option>
            </select>
          </div>

          <!-- Rating -->
          <div class="flex items-center gap-2">
            <span class="text-[#B8B8B8] font-semibold text-[15px]">Rating:</span>
            <select [(ngModel)]="filterRating"
              class="bg-[#1E1E22] border border-[#2B2B31] rounded-xl px-3 py-2 text-[#E5E5E5] text-[15px] font-semibold outline-none">
              <option [value]="0">Any rating</option>
              <option [value]="4">4.0+ ★</option>
              <option [value]="4.5">4.5+ ★</option>
            </select>
          </div>

          <!-- Dietary -->
          <div class="flex items-center gap-2">
            <span class="text-[#B8B8B8] font-semibold text-[15px]">Dietary:</span>
            <select [(ngModel)]="filterDiet"
              class="bg-[#1E1E22] border border-[#2B2B31] rounded-xl px-3 py-2 text-[#E5E5E5] text-[15px] font-semibold outline-none">
              <option value="All">Any diet</option>
              <option value="Vegetarian">🥗 Vegetarian</option>
              <option value="Vegan">🌱 Vegan</option>
              <option value="Gluten-Free">🌾 Gluten-Free</option>
            </select>
          </div>

          <!-- Open Now Toggle Switch -->
          <label class="flex items-center gap-3 cursor-pointer ml-auto">
            <span class="text-[#B8B8B8] font-semibold text-[15px]">Open Now Only:</span>
            <button (click)="filterOpen.set(!filterOpen())" type="button"
              [class]="'w-10 h-6 rounded-full relative transition-colors duration-200 ' + (filterOpen() ? 'bg-[#E53935]' : 'bg-neutral-800')">
              <span class="absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200" [style.left]="filterOpen() ? '20px' : '4px'"></span>
            </button>
          </label>
        </div>

        <!-- STORES GRID -->
        <div *ngIf="loadingStore()" class="flex justify-center py-20">
          <div class="animate-spin rounded-full h-10 w-10 border-2 border-[#E53935] border-t-transparent"></div>
        </div>

        <div *ngIf="!loadingStore() && filteredStores().length === 0" class="text-center py-16 clay rounded-[22px] border border-[#2B2B31] bg-[#18181B] shadow-inner">
          <p class="text-4xl mb-3">🍽️</p>
          <p class="text-base font-semibold text-[#D4AF37]">No stores match your search</p>
          <p class="text-xs text-neutral-400 mt-1">Try adjusting distance or dietary filters in {{ locationService.selectedCity() === 'All' ? 'all cities' : locationService.selectedCity() }}.</p>
        </div>

        <div *ngIf="!loadingStore() && filteredStores().length > 0">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[24px]">
            <div *ngFor="let store of filteredStores()" (click)="viewStore(store.slug)"
              class="group rounded-[22px] bg-[#1E1E22] border border-[#2B2B31] hover:border-[#D4AF37]/50 overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-sm">

              <!-- Card Header -->
              <div class="h-36 relative flex items-center justify-center text-6xl"
                [style.background]="store.brandColor ? store.brandColor : 'var(--gradient-mislice)'">
                <span>{{ store.emoji }}</span>
                <span *ngIf="store.featured" class="absolute top-3 right-3 text-[10px] bg-[#C8A84A] text-black px-2.5 py-1 rounded-full font-black uppercase tracking-wider shadow-md">
                  Featured
                </span>
              </div>

              <!-- Card Content with 28px padding -->
              <div class="p-[28px] space-y-4">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <h3 class="text-[22px] font-bold text-[#FFFFFF] group-hover:text-[#D4AF37] transition-colors leading-tight">{{ store.name }}</h3>
                    <p class="text-[14px] font-medium text-[#B8B8B8] mt-1">{{ store.neighborhood || store.city }}</p>
                  </div>
                  <div class="flex items-center gap-1 text-[14px] text-[#B8B8B8] font-medium shrink-0">
                    <span class="text-[#D4AF37]">★</span> {{ store.ratingAvg | number:'1.1-1' }}
                  </div>
                </div>

                <p class="text-[14px] text-[#B8B8B8] font-medium line-clamp-2 leading-relaxed">
                  {{ store.tagline || store.description || 'Fresh ingredients, fast delivery, and customizable pizzas.' }}
                </p>

                <!-- Metadata badges -->
                <div class="pt-2 flex flex-wrap gap-2 text-[14px] font-medium text-[#B8B8B8]">
                  <span class="bg-[#18181B] border border-[#2B2B31] px-2.5 py-1 rounded-lg">
                    🚴 {{ store.deliveryFee === 0 ? 'Free Delivery' : (store.deliveryFee | currency) }}
                  </span>
                  <span class="bg-[#18181B] border border-[#2B2B31] px-2.5 py-1 rounded-lg">
                    ⏱️ {{ store.averageEtaMinutes || 25 }} min
                  </span>
                  <span *ngFor="let tag of store.tags" class="bg-[#18181B] border border-[#2B2B31] px-2.5 py-1 rounded-lg capitalize">
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  `,
})
export class OrderComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly restaurantService = inject(RestaurantService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly locationService = inject(LocationService);

  stores = signal<Store[]>([]);
  cities = signal<string[]>([]);
  loadingStore = signal(true);

  private map: L.Map | null = null;
  private markers: L.Marker[] = [];

  readonly cityCoords: Record<string, { lat: number; lng: number; zoom: number }> = {
    'Detroit': { lat: 42.3314, lng: -83.0458, zoom: 12 },
    'Ann Arbor': { lat: 42.2808, lng: -83.7430, zoom: 12 },
    'Grand Rapids': { lat: 42.9634, lng: -85.6681, zoom: 12 },
    'All': { lat: 42.6000, lng: -84.5000, zoom: 8 }
  };

  constructor() {
    effect(() => {
      // Reload restaurants from backend when global city updates
      const city = this.locationService.selectedCity();
      this.loadRestaurants();
    }, { allowSignalWrites: true });

    effect(() => {
      const stores = this.stores();
      const city = this.locationService.selectedCity();
      if (this.map) {
        this.updateMapMarkers(stores, city);
      }
    });
  }

  // Filter states
  filterDistance = 0;
  filterRating = 0;
  filterDiet = 'All';
  filterOpen = signal(false);
  searchQuery = '';

  // Selected map pin overlay state
  selectedMapPin = signal<MapPin | null>(null);

  // Interactive Map Pins data - dynamically loaded via leaflet now
  mapPins = signal<MapPin[]>([]);

  filteredStores = computed(() => {
    let list = this.stores();
    const query = this.searchQuery.trim().toLowerCase();

    if (query) {
      list = list.filter(s =>
        s.name.toLowerCase().includes(query) ||
        (s.description ?? '').toLowerCase().includes(query) ||
        (s.tagline ?? '').toLowerCase().includes(query) ||
        (s.city ?? '').toLowerCase().includes(query)
      );
    }

    // Proximity / distance filter
    if (this.filterDistance > 0) {
      list = list.filter(s => {
        const mockDist = (s.name.charCodeAt(0) % 15) + 3;
        return mockDist <= this.filterDistance;
      });
    }

    if (this.filterRating > 0) {
      list = list.filter(s => (s.ratingAvg ?? 0) >= this.filterRating);
    }

    if (this.filterDiet !== 'All') {
      const d = this.filterDiet.toLowerCase();
      list = list.filter(s => {
        const description = (s.description ?? '').toLowerCase();
        const tagline = (s.tagline ?? '').toLowerCase();
        return description.includes(d) || tagline.includes(d);
      });
    }

    if (this.filterOpen()) {
      list = list.filter(s => s.acceptingOrders !== false);
    }

    // Sort by premium status first, then by mock distance
    return [...list].sort((a, b) => {
      const aPremium = a.featured || a.category === 'PREMIUM';
      const bPremium = b.featured || b.category === 'PREMIUM';
      if (aPremium !== bPremium) {
        return aPremium ? -1 : 1;
      }
      const distA = (a.name.charCodeAt(0) % 15) + 3;
      const distB = (b.name.charCodeAt(0) % 15) + 3;
      return distA - distB;
    });
  });

  ngOnInit() {
    this.loadCities();
    this.loadRestaurants();

    this.route.queryParams.subscribe(params => {
      if (params['q']) {
        this.searchQuery = params['q'];
      } else {
        this.searchQuery = '';
      }
    });
  }

  ngAfterViewInit() {
    this.initMap();
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private initMap() {
    const city = this.locationService.selectedCity();
    const coords = this.cityCoords[city] || this.cityCoords['Detroit'];

    this.map = L.map('price-map-canvas', {
      zoomControl: true,
      attributionControl: false
    }).setView([coords.lat, coords.lng], coords.zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(this.map);

    this.updateMapMarkers(this.stores(), city);
  }

  private updateMapMarkers(stores: Store[], city: string) {
    if (!this.map) return;

    this.markers.forEach(m => m.remove());
    this.markers = [];

    const pins: MapPin[] = stores
      .filter(s => s.latitude !== undefined && s.longitude !== undefined)
      .map(s => {
        const nameHash1 = (s.name.charCodeAt(0) % 7) - 3;
        const nameHash2 = (s.name.charCodeAt(1) % 7) - 3;
        const latJitter = nameHash1 * 0.0007;
        const lngJitter = nameHash2 * 0.0007;

        return {
          id: s.slug,
          name: s.name,
          price: (s.name.charCodeAt(0) % 5) + 9.99,
          eta: (s.name.charCodeAt(0) % 20) + 15,
          rating: s.ratingAvg || 4.5,
          emoji: s.emoji || '🍕',
          lat: s.latitude! + latJitter,
          lng: s.longitude! + lngJitter,
          city: s.city || 'Detroit'
        };
      });

    this.mapPins.set(pins);

    pins.forEach(pin => {
      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="bg-black/85 border border-[#D4AF37] px-2 py-1 rounded-lg text-white font-extrabold text-[11px] shadow-md flex items-center gap-1 hover:scale-105 transition-all">
                 <span>${pin.emoji}</span>
                 <span>$${pin.price.toFixed(2)}</span>
               </div>`,
        iconSize: [65, 30],
        iconAnchor: [32, 15]
      });

      const m = L.marker([pin.lat, pin.lng], { icon }).addTo(this.map!);
      m.on('click', () => {
        this.selectedMapPin.set(pin);
      });
      this.markers.push(m);
    });

    const activeCoords = this.cityCoords[city] || this.cityCoords['Detroit'];
    this.map.setView([activeCoords.lat, activeCoords.lng], activeCoords.zoom);
  }

  loadCities() {
    this.restaurantService.getCities().subscribe({
      next: (data) => this.cities.set(['All', ...data.map(c => String(c))]),
      error: () => this.cities.set(['All'])
    });
  }

  loadRestaurants() {
    this.loadingStore.set(true);
    const city = this.locationService.selectedCity();
    this.restaurantService.getRestaurants(city === 'All' ? undefined : city).subscribe({
      next: (data) => {
        this.stores.set(data);
        this.loadingStore.set(false);
      },
      error: () => {
        this.stores.set([]);
        this.loadingStore.set(false);
      }
    });
  }

  selectCity(city: string) {
    this.locationService.selectCity(city);
    this.loadRestaurants();
  }

  viewStore(slug: string) {
    this.router.navigate(['/restaurants', slug]);
  }

  viewSelectedStore() {
    const pin = this.selectedMapPin();
    if (pin) {
      this.viewStore(pin.id);
    }
  }
}
