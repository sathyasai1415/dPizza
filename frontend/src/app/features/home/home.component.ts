import { Component, inject, signal, computed, OnInit, effect, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RestaurantService } from '../../core/services/restaurant.service';
import { LocationService } from '../../core/services/location.service';
import { OnboardingService } from '../../core/services/onboarding.service';
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
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  template: `
    <div class="space-y-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 rounded-[32px] bg-[color:var(--color-hero-bg)]">

      <!-- LIVE DEALS TICKER (sits directly under the top navigation) -->
      <div class="w-full py-3 bg-[#0A0A0A] rounded-2xl border border-[#D4AF37]/20 overflow-hidden relative group shadow-sm">
        <div class="flex whitespace-nowrap animate-marquee group-hover:[animation-play-state:paused] text-xs font-medium text-[#D4AF37]/80 gap-16">
          <span class="inline-flex items-center gap-1.5">🍕 <strong class="text-[#F4EFE6]">Shamz Pizza:</strong> Large Pepperoni now $11.99</span>
          <span class="inline-flex items-center gap-1.5">🏷️ <strong class="text-[#F4EFE6]">Marco's:</strong> Buy One Get One Free</span>
          <span class="inline-flex items-center gap-1.5">⚡ <strong class="text-[#F4EFE6]">Pizza Hut:</strong> Free delivery on orders over $20</span>
          <span class="inline-flex items-center gap-1.5">🔥 <strong class="text-[#F4EFE6]">Jet's Pizza:</strong> 30% off all deep dish orders</span>
          <span class="inline-flex items-center gap-1.5">💰 <strong class="text-[#F4EFE6]">Bunty's Pizza:</strong> $5 off any extra-large pizza</span>
        </div>
      </div>

      <!-- SEARCH & QUICK INTENT SECTION -->
      <section class="space-y-6">
        <!-- Search Bar (with a "Near Me" shortcut beside it on mobile — desktop keeps the pill in the top nav) -->
        <div class="flex items-center gap-3 w-full max-w-2xl mx-auto">
          <div class="relative flex-1 min-w-0">
            <input type="text" [(ngModel)]="searchQuery" (keyup.enter)="executeGlobalSearch()" placeholder="Search pizzas, restaurants, or deals..."
              class="w-full bg-[#0A0A0A] border border-[#D4AF37]/35 focus:border-[#D4AF37] rounded-full py-3.5 pl-12 pr-6 text-[#F4EFE6] text-base placeholder-[#D4AF37]/40 shadow-inner transition outline-none" />
            <span class="absolute left-4.5 top-1/2 -translate-y-1/2 text-lg">🔍</span>
          </div>
          <button (click)="scrollToMap()" title="Near Me"
            class="shrink-0 w-12 h-12 rounded-full bg-[#0A0A0A] border border-[#D4AF37]/35 hover:border-[#D4AF37] hover:bg-[#D4AF37]/15 flex items-center justify-center shadow-md text-xl active:scale-95 transition-all duration-200">
            🗺️
          </button>
        </div>

        <!-- Popular Pizzas (Quick Order) -->
        <div class="text-center space-y-4">
          <h3 class="text-sm font-black uppercase tracking-widest text-neutral-500 flex items-center justify-center gap-2">
            <span>🔥</span> Popular Pizzas
          </h3>
          <div class="flex flex-wrap justify-center gap-3">
            <button (click)="quickCompare('Pepperoni')" class="bg-brand-white border border-brand-black hover:border-[color:var(--color-brand-red)] hover:bg-[color:var(--color-brand-red)]/5 text-brand-black px-5 py-2.5 rounded-2xl font-bold text-sm transition-all hover:-translate-y-0.5 flex items-center gap-2 shadow-sm">
              <span>🍕</span> Pepperoni
            </button>
            <button (click)="quickCompare('Cheese')" class="bg-brand-white border border-brand-black hover:border-[color:var(--color-brand-orange)] hover:bg-[color:var(--color-brand-orange)]/5 text-brand-black px-5 py-2.5 rounded-2xl font-bold text-sm transition-all hover:-translate-y-0.5 flex items-center gap-2 shadow-sm">
              <span>🧀</span> Cheese
            </button>
            <button (click)="quickCompare('Meat Lovers')" class="bg-brand-white border border-brand-black hover:border-[color:var(--color-brand-orange)] hover:bg-[color:var(--color-brand-orange)]/5 text-brand-black px-5 py-2.5 rounded-2xl font-bold text-sm transition-all hover:-translate-y-0.5 flex items-center gap-2 shadow-sm">
              <span>🥓</span> Meat Lovers
            </button>
            <button (click)="quickCompare('Hawaiian')" class="bg-brand-white border border-brand-black hover:border-[color:var(--color-brand-green)] hover:bg-[color:var(--color-brand-green)]/5 text-brand-black px-5 py-2.5 rounded-2xl font-bold text-sm transition-all hover:-translate-y-0.5 flex items-center gap-2 shadow-sm">
              <span>🍍</span> Hawaiian
            </button>
            <button (click)="quickCompare('BBQ Chicken')" class="bg-brand-white border border-brand-black hover:border-[color:var(--color-brand-navy)] hover:bg-[color:var(--color-brand-navy)]/5 text-brand-black px-5 py-2.5 rounded-2xl font-bold text-sm transition-all hover:-translate-y-0.5 flex items-center gap-2 shadow-sm">
              <span>🍗</span> BBQ Chicken
            </button>
          </div>
        </div>
      </section>

      <!-- INTERACTIVE PRICE MAP WIDGET (moved up, right after search, per discovery-first layout) -->
      <section id="price-map" class="space-y-5">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-black text-[color:var(--color-hero-text)] flex items-center gap-2">📍 Live Regional Price Map</h2>
            <p class="text-sm text-neutral-600 font-semibold">Tap any store pin to compare real-time pizza quotes near you.</p>
          </div>
        </div>

        <div class="grid lg:grid-cols-[1fr_340px] gap-6">
          <!-- Real Leaflet Map Canvas -->
          <div class="relative h-[420px] rounded-3xl overflow-hidden border border-brand-black shadow-inner flex items-center justify-center">
            <div id="price-map-canvas" class="h-full w-full z-10"></div>
          </div>

          <!-- Pin Detail Drawer -->
          <div class="rounded-3xl p-6 bg-brand-white border border-brand-black flex flex-col justify-between shadow-sm">
            @if (selectedMapPin()) {
              <div class="space-y-5 animate-fadeIn">
                <div class="flex items-center gap-4">
                  <div class="w-14 h-14 rounded-2xl bg-black/5 border border-brand-black flex items-center justify-center text-3xl shadow-inner">
                    {{ selectedMapPin()!.emoji }}
                  </div>
                  <div>
                    <h3 class="font-black text-brand-black text-lg leading-snug">{{ selectedMapPin()!.name }}</h3>
                    <p class="text-xs text-neutral-500 uppercase font-bold tracking-wider">{{ selectedMapPin()!.city }}, MI</p>
                  </div>
                </div>

                <div class="space-y-3 border-t border-brand-black pt-4 text-sm">
                  <div class="flex justify-between text-neutral-600">
                    <span class="text-neutral-500">Large Pepperoni:</span>
                    <span class="text-brand-black font-extrabold">{{ selectedMapPin()!.price | currency }}</span>
                  </div>
                  <div class="flex justify-between text-neutral-600">
                    <span class="text-neutral-500">Prep & Delivery ETA:</span>
                    <span class="text-brand-black font-extrabold">⏱️ {{ selectedMapPin()!.eta }} min</span>
                  </div>
                  <div class="flex justify-between text-neutral-600">
                    <span class="text-neutral-500">User Rating:</span>
                    <span class="text-amber-600 font-bold">★ {{ selectedMapPin()!.rating }}</span>
                  </div>
                </div>
              </div>

              <div class="space-y-3 pt-6">
                <button (click)="navigateToCompare()"
                  class="w-full py-3 rounded-xl font-bold bg-[color:var(--color-brand-blue)] hover:brightness-110 text-white text-sm shadow-sm transition">
                  Compare Quote ⚖️
                </button>
                <p class="text-center text-xs text-neutral-500">Order directly via MiSlice integration</p>
              </div>
            } @else {
              <div class="h-full flex flex-col items-center justify-center text-center text-neutral-500 py-12">
                <span class="text-4xl mb-3">📍</span>
                <p class="text-sm font-medium">Select any store pin on the map to inspect live quote breakdowns.</p>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Reusable discovery-row store card -->
      <ng-template #storeCardTpl let-store let-badgeIcon="badgeIcon" let-badgeLabel="badgeLabel">
        <div (click)="viewStore(store.slug)"
          class="shrink-0 w-60 rounded-2xl bg-[#0A0A0A] border border-[#D4AF37]/25 hover:border-[#D4AF37]/60 overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-sm">
          <div class="h-28 relative flex items-center justify-center text-5xl"
            [style.background]="store.brandColor ? store.brandColor : 'var(--gradient-mislice)'">
            <span>{{ store.emoji }}</span>
            <span class="absolute top-2 left-2 text-[9px] bg-[#1E3A8A] border border-[#D4AF37]/50 text-[#D4AF37] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
              {{ badgeIcon }} {{ badgeLabel }}
            </span>
            <button (click)="toggleFavourite(store.id); $event.stopPropagation()"
              class="absolute top-2 right-2 w-7 h-7 rounded-full bg-[#0A0A0A]/80 border border-[#D4AF37]/40 flex items-center justify-center text-xs">
              {{ isFavourite(store.id) ? '❤️' : '🤍' }}
            </button>
          </div>
          <div class="p-4 space-y-2">
            <h4 class="font-black text-sm text-[#D4AF37] truncate">{{ store.name }}</h4>
            <div class="flex items-center gap-1.5 text-[11px] text-[#D4AF37]/70 flex-wrap">
              <span>★ {{ store.ratingAvg | number:'1.1-1' }}</span>
              <span>·</span>
              <span>🚴 {{ store.deliveryFee === 0 ? 'Free' : (store.deliveryFee | currency) }}</span>
              <span>·</span>
              <span>⏱️ {{ store.averageEtaMinutes || 25 }}m</span>
            </div>
            <button (click)="viewStore(store.slug); $event.stopPropagation()"
              class="w-full mt-1 py-1.5 rounded-lg text-[11px] font-bold bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/20 transition">
              🔄 Compare Prices
            </button>
          </div>
        </div>
      </ng-template>

      <!-- DISCOVERY SECTIONS — dynamic rows, each derived from real store data -->
      @if (!loadingStore()) {
        @if (trendingStores().length > 0) {
          <section class="space-y-4">
            <h2 class="text-xl font-black text-[color:var(--color-hero-text)] flex items-center gap-2">🔥 Trending Near You</h2>
            <div class="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              <ng-container *ngFor="let store of trendingStores()">
                <ng-container *ngTemplateOutlet="storeCardTpl; context: { $implicit: store, badgeIcon: '🔥', badgeLabel: 'Trending' }"></ng-container>
              </ng-container>
            </div>
          </section>
        }

        @if (bestDealStores().length > 0) {
          <section class="space-y-4">
            <h2 class="text-xl font-black text-[color:var(--color-hero-text)] flex items-center gap-2">💰 Best Deals Today</h2>
            <div class="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              <ng-container *ngFor="let store of bestDealStores()">
                <ng-container *ngTemplateOutlet="storeCardTpl; context: { $implicit: store, badgeIcon: '💰', badgeLabel: 'Best Deal' }"></ng-container>
              </ng-container>
            </div>
          </section>
        }

        @if (topRatedStores().length > 0) {
          <section class="space-y-4">
            <h2 class="text-xl font-black text-[color:var(--color-hero-text)] flex items-center gap-2">⭐ Highest Rated Nearby</h2>
            <div class="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              <ng-container *ngFor="let store of topRatedStores()">
                <ng-container *ngTemplateOutlet="storeCardTpl; context: { $implicit: store, badgeIcon: '⭐', badgeLabel: 'Top Rated' }"></ng-container>
              </ng-container>
            </div>
          </section>
        }

        @if (fastestStores().length > 0) {
          <section class="space-y-4">
            <h2 class="text-xl font-black text-[color:var(--color-hero-text)] flex items-center gap-2">⚡ Fastest Delivery</h2>
            <div class="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              <ng-container *ngFor="let store of fastestStores()">
                <ng-container *ngTemplateOutlet="storeCardTpl; context: { $implicit: store, badgeIcon: '⚡', badgeLabel: 'Fastest' }"></ng-container>
              </ng-container>
            </div>
          </section>
        }

        @if (favouriteStores().length > 0) {
          <section class="space-y-4">
            <h2 class="text-xl font-black text-[color:var(--color-hero-text)] flex items-center gap-2">❤️ Your Favourites</h2>
            <div class="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              <ng-container *ngFor="let store of favouriteStores()">
                <ng-container *ngTemplateOutlet="storeCardTpl; context: { $implicit: store, badgeIcon: '❤️', badgeLabel: 'Favourite' }"></ng-container>
              </ng-container>
            </div>
          </section>
        }
      }

      <!-- MARKETPLACE STORES SECTION -->
      <section class="space-y-6">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-brand-black pb-5">
          <div>
            <h2 class="text-2xl font-black text-[color:var(--color-hero-text)]">Marketplace Pizzerias</h2>
            <p class="text-sm text-neutral-600 font-semibold">Order directly from top rated local stores and national chains</p>
          </div>

          <!-- City Filters -->
          <div class="flex flex-wrap gap-2">
            <button *ngFor="let city of cities()" (click)="selectCity(city)"
              [class]="locationService.selectedCity() === city
                ? 'bg-[#0A0A0A] border border-[#D4AF37] text-[#D4AF37] font-bold px-4 py-2 rounded-xl text-xs shadow-sm'
                : 'bg-brand-white border border-brand-black text-brand-black hover:bg-black/5 px-4 py-2 rounded-xl text-xs transition'">
              {{ city === 'All' ? 'All Cities' : city }}
            </button>
          </div>
        </div>

        <!-- FILTER BAR -->
        <div class="bg-brand-white border border-brand-black rounded-2xl p-4 flex flex-wrap items-center gap-4 text-xs shadow-sm">
          <!-- Distance -->
          <div class="flex items-center gap-2">
            <span class="text-neutral-500 font-bold uppercase tracking-wider text-[10px]">Distance:</span>
            <select [(ngModel)]="filterDistance"
              class="bg-brand-white border border-brand-black rounded-xl px-3 py-2 text-brand-black outline-none focus:border-[color:var(--color-brand-blue)]">
              <option [value]="0">Any distance</option>
              <option [value]="5">Within 5 miles</option>
              <option [value]="10">Within 10 miles</option>
              <option [value]="20">Within 20 miles</option>
            </select>
          </div>

          <!-- Rating -->
          <div class="flex items-center gap-2">
            <span class="text-neutral-500 font-bold uppercase tracking-wider text-[10px]">Rating:</span>
            <select [(ngModel)]="filterRating"
              class="bg-brand-white border border-brand-black rounded-xl px-3 py-2 text-brand-black outline-none focus:border-[color:var(--color-brand-blue)]">
              <option [value]="0">Any rating</option>
              <option [value]="4">4.0+ ★</option>
              <option [value]="4.5">4.5+ ★</option>
            </select>
          </div>

          <!-- Dietary -->
          <div class="flex items-center gap-2">
            <span class="text-neutral-500 font-bold uppercase tracking-wider text-[10px]">Dietary:</span>
            <select [(ngModel)]="filterDiet"
              class="bg-brand-white border border-brand-black rounded-xl px-3 py-2 text-brand-black outline-none focus:border-[color:var(--color-brand-blue)]">
              <option value="All">Any diet</option>
              <option value="Vegetarian">🥗 Vegetarian</option>
              <option value="Vegan">🌱 Vegan</option>
              <option value="Gluten-Free">🌾 Gluten-Free</option>
            </select>
          </div>

          <!-- Open Now Toggle Switch -->
          <label class="flex items-center gap-3 cursor-pointer ml-auto">
            <span class="text-neutral-500 font-bold uppercase tracking-wider text-[10px]">Open Now Only:</span>
            <button (click)="filterOpen.set(!filterOpen())" type="button"
              [class]="'w-10 h-6 rounded-full relative transition-colors duration-200 ' + (filterOpen() ? 'bg-[color:var(--color-brand-blue)]' : 'bg-neutral-300')">
              <span class="absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200" [style.left]="filterOpen() ? '20px' : '4px'"></span>
            </button>
          </label>
        </div>

        <!-- STORES GRID -->
        @if (loadingStore()) {
          <div class="flex flex-col items-center justify-center py-20 gap-3">
            <div class="animate-spin rounded-full h-10 w-10 border-2 border-[color:var(--color-brand-red)] border-t-transparent"></div>
            <p class="text-xs text-neutral-500 font-medium">Fetching store deals...</p>
          </div>
        } @else if (filteredStores().length === 0) {
          <div class="rounded-3xl p-16 text-center bg-[#0A0A0A] border border-[#D4AF37]/25 text-[#D4AF37]/70 shadow-sm">
            <p class="text-4xl mb-3">🍽️</p>
            <p class="text-base font-semibold text-[#D4AF37]">No stores match your search</p>
            <p class="text-xs text-[#D4AF37]/60 mt-1">Try adjusting distance or dietary filters in {{ locationService.selectedCity() === 'All' ? 'all cities' : locationService.selectedCity() }}.</p>
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div *ngFor="let store of filteredStores()" (click)="viewStore(store.slug)"
              class="group rounded-3xl bg-[#0A0A0A] border border-[#D4AF37]/25 hover:shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-sm">

              <!-- Card Header -->
              <div class="h-36 relative flex items-center justify-center text-6xl"
                [style.background]="store.brandColor ? store.brandColor : 'var(--gradient-mislice)'">
                <span>{{ store.emoji }}</span>
                <span *ngIf="store.featured" class="absolute top-3 right-3 text-[10px] bg-[#1E3A8A] border border-[#D4AF37]/50 text-[#D4AF37] px-2.5 py-1 rounded-full font-black uppercase tracking-wider shadow-md">
                  Featured
                </span>
              </div>

              <!-- Card Content -->
              <div class="p-6 space-y-4">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <h3 class="font-black text-xl text-[#D4AF37] group-hover:text-[#D4AF37]/80 transition-colors">{{ store.name }}</h3>
                    <p class="text-xs text-[#D4AF37]/60 mt-0.5">{{ store.neighborhood || store.city }}</p>
                  </div>
                  <div class="flex items-center gap-1 bg-[#1E3A8A] px-2.5 py-1 rounded-lg text-xs text-[#D4AF37] font-extrabold shrink-0 border border-[#D4AF37]/30">
                    ★ {{ store.ratingAvg | number:'1.1-1' }}
                  </div>
                </div>

                <p class="text-xs text-[#D4AF37]/60 line-clamp-2 leading-relaxed">
                  {{ store.tagline || store.description || 'Fresh ingredients, fast delivery, and customizable pizzas.' }}
                </p>

                <!-- Badges -->
                <div class="pt-2 flex flex-wrap gap-2 text-[11px] font-bold">
                  <span class="bg-[#1E3A8A] border border-[#D4AF37]/25 text-[#D4AF37] px-2.5 py-1 rounded-lg">
                    🚴 {{ store.deliveryFee === 0 ? 'Free Delivery' : (store.deliveryFee | currency) }}
                  </span>
                  <span class="bg-[#1E3A8A] border border-[#D4AF37]/25 text-[#D4AF37] px-2.5 py-1 rounded-lg">
                    ⏱️ {{ store.averageEtaMinutes || 25 }} min
                  </span>
                  <span *ngFor="let tag of store.tags" class="bg-[#1E3A8A] text-[#D4AF37]/90 px-2.5 py-1 rounded-lg border border-[#D4AF37]/20 capitalize">
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        }
      </section>

    </div>

    <!-- FLOATING ACTION BUTTON — AI/Manual Pizza Builder lives here, not as homepage content -->
    <button (click)="navigateToBuilder()" title="Build a Pizza"
      class="fixed bottom-24 lg:bottom-8 right-6 z-40 flex items-center gap-2 pl-4 pr-5 py-3.5 rounded-full shadow-lg font-black text-sm text-white transition-transform hover:-translate-y-0.5 active:scale-95"
      style="background: var(--gradient-mislice);">
      <span class="text-lg">✨</span> Build a Pizza
    </button>
    
    <!-- LOCATION PROMPT MODAL -->
    <div *ngIf="showLocationPrompt()" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
      <div class="bg-brand-white border border-brand-black rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative">
        <div class="p-8 flex flex-col items-center text-center">

          <div class="relative mb-6">
            <div class="text-6xl animate-bounce">🔭</div>
          </div>

          <h2 class="text-2xl font-black text-brand-black tracking-tight mb-2">Find Pizza Near You!</h2>
          <p class="text-sm text-neutral-500 font-medium mb-6">
            MiSlice uses your location to calculate real-time delivery costs and price-per-square-inch options.
          </p>

          <div class="flex flex-col gap-3 w-full">
            <button (click)="detectLocation()" class="w-full bg-[color:var(--color-brand-blue)] hover:brightness-110 text-white font-extrabold py-3 px-5 rounded-2xl shadow-sm transition-all text-sm flex items-center justify-center gap-2">
              📍 Detect My Location Automatically
            </button>

            <div class="relative w-full mt-2">
              <input type="text" [(ngModel)]="searchLocationQuery" (keyup.enter)="saveManualLocation()"
                placeholder="Or enter city / zip code..."
                class="w-full bg-brand-white border border-brand-black rounded-2xl py-3 pl-4 pr-10 text-sm focus:outline-none focus:border-[color:var(--color-brand-blue)] text-brand-black placeholder-neutral-400">
              <button (click)="saveManualLocation()" class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-brand-black">
                🔍
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes marquee {
      0% { transform: translateX(0%); }
      100% { transform: translateX(-50%); }
    }
    .animate-marquee {
      display: flex;
      width: 200%;
      animation: marquee 20s linear infinite;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeIn {
      animation: fadeIn 0.25s ease-out forwards;
    }
  `]
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly restaurantService = inject(RestaurantService);
  private readonly router = inject(Router);
  readonly locationService = inject(LocationService);
  private readonly onboarding = inject(OnboardingService);

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
      const stores = this.stores();
      const city = this.locationService.selectedCity();
      const selectedPin = this.selectedMapPin(); // track selection changes

      if (this.map) {
        this.updateMapMarkers(stores, city);
      }
    });

    // Only ask for location once the post-login welcome showcase (if any) has
    // been dismissed — never show both prompts stacked on top of each other.
    effect(() => {
      if (this.onboarding.showWelcome()) return;
      if (!this.locationPromptArmed) return;
      if (localStorage.getItem('mislice_customer_location')) return;
      this.locationPromptArmed = false;
      setTimeout(() => this.showLocationPrompt.set(true), 500);
    });
  }

  private locationPromptArmed = true;

  private readonly locationEffect = effect(() => {
    const city = this.locationService.selectedCity();
    this.loadRestaurants();
  });

  // Filter states
  filterDistance = 0;
  filterRating = 0;
  filterDiet = 'All';
  filterOpen = signal(false);

  // Location Prompt
  showLocationPrompt = signal(false);
  searchLocationQuery = '';
  searchQuery = '';

  // Selected map pin overlay state
  selectedMapPin = signal<MapPin | null>(null);

  // Interactive Map Pins data - dynamically loaded via leaflet now
  mapPins = signal<MapPin[]>([]);
 
  filteredMapPins = computed(() => {
    return this.mapPins();
  });

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

    // Initial load
    this.updateMapMarkers(this.stores(), city);
  }

  private updateMapMarkers(stores: Store[], city: string) {
    if (!this.map) return;

    // Clear old markers
    this.markers.forEach(m => m.remove());
    this.markers = [];

    // Create MapPin objects dynamically from stores
    const pins: MapPin[] = stores
      .filter(s => s.latitude && s.longitude)
      .map(s => {
        // Deterministic jitter based on name hash to prevent perfect overlap
        const nameHash1 = (s.name.charCodeAt(0) % 7) - 3;
        const nameHash2 = (s.name.charCodeAt(1) % 7) - 3;
        const jitterLat = nameHash1 * 0.0018;
        const jitterLng = nameHash2 * 0.0018;

        // Mock starting price based on store name
        let price = 12.99;
        if (s.name.includes("Moto")) price = 15.99;
        else if (s.name.includes("Shamz")) price = 13.99;
        else if (s.name.includes("Motor City")) price = 14.99;
        else if (s.name.includes("Rambo")) price = 11.49;
        else if (s.name.includes("Zumbo")) price = 12.49;
        else if (s.name.includes("Lakes")) price = 13.49;

        return {
          id: s.id,
          name: s.name,
          price: price,
          eta: s.averageEtaMinutes ?? 25,
          rating: s.ratingAvg ?? 4.5,
          emoji: s.emoji ?? '🍕',
          lat: s.latitude! + jitterLat,
          lng: s.longitude! + jitterLng,
          city: s.city
        };
      });

    this.mapPins.set(pins);

    // Center map to selected city coordinates if it has changed
    const target = this.cityCoords[city] || this.cityCoords['Detroit'];
    const currentCenter = this.map.getCenter();
    const dist = Math.sqrt(Math.pow(currentCenter.lat - target.lat, 2) + Math.pow(currentCenter.lng - target.lng, 2));
    if (dist > 0.01) {
      this.map.setView([target.lat, target.lng], target.zoom);
    }

    // Add new markers to map
    pins.forEach(pin => {
      const isSelected = this.selectedMapPin()?.id === pin.id;
      const markerHtml = `
        <div class="flex flex-col items-center select-none cursor-pointer">
          <div class="font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-md border transition-all ${
            isSelected
              ? 'bg-[#E23744] border-[#E23744] text-white scale-110'
              : 'bg-white border-[#1D1F1D] text-[#1D1F1D] hover:border-[#E23744]'
          }">
            $${pin.price.toFixed(2)}
          </div>
          <div class="w-8 h-8 rounded-full bg-white border-2 ${
            isSelected ? 'border-[#E23744] scale-110' : 'border-[#1D1F1D]'
          } hover:border-[#E23744] flex items-center justify-center text-sm shadow-md transition-all">
            ${pin.emoji}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-leaflet-pin',
        html: markerHtml,
        iconSize: [60, 60],
        iconAnchor: [30, 50]
      });

      const marker = L.marker([pin.lat, pin.lng], { icon })
        .addTo(this.map!)
        .on('click', () => {
          this.selectedMapPin.set(pin);
        });

      this.markers.push(marker);
    });
  }

  // Real favourites, shared with the Favourites page (same localStorage key)
  favouriteIds = signal<string[]>(this.readFavouriteIds());

  private readFavouriteIds(): string[] {
    try { return JSON.parse(localStorage.getItem('mislice_fav_stores') || '[]'); } catch { return []; }
  }

  isFavourite(storeId: string): boolean {
    return this.favouriteIds().includes(storeId);
  }

  toggleFavourite(storeId: string) {
    const current = this.favouriteIds();
    const next = current.includes(storeId) ? current.filter(id => id !== storeId) : [...current, storeId];
    this.favouriteIds.set(next);
    localStorage.setItem('mislice_fav_stores', JSON.stringify(next));
  }

  // Discovery sections — all derived from real store data (rating, trend score, ETA, delivery fee), never fabricated.
  trendingStores = computed(() => [...this.filteredStores()].sort((a, b) => (b.trendScore ?? 0) - (a.trendScore ?? 0)).slice(0, 8));
  bestDealStores = computed(() => [...this.filteredStores()].sort((a, b) => (a.deliveryFee ?? 0) - (b.deliveryFee ?? 0)).slice(0, 8));
  topRatedStores = computed(() => [...this.filteredStores()].sort((a, b) => (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0)).slice(0, 8));
  fastestStores = computed(() => [...this.filteredStores()].sort((a, b) => (a.averageEtaMinutes ?? 99) - (b.averageEtaMinutes ?? 99)).slice(0, 8));
  favouriteStores = computed(() => this.filteredStores().filter(s => this.favouriteIds().includes(s.id)));

  filteredStores = computed(() => {
    let list = this.stores();
    const query = (this.searchQuery || '').trim().toLowerCase();

    // 1. Filter by search input (restaurant name, tags, description, city, or nearby query)
    if (query) {
      if (query.includes('nearby') || query.includes('near me') || query.includes('closest') || query.includes('around')) {
        list = list.filter(s => {
          const mockDist = (s.name.charCodeAt(0) % 15) + 3;
          // Return stores within a mock 8 miles proximity
          return mockDist <= 8;
        });
      } else {
        list = list.filter(s => 
          s.name.toLowerCase().includes(query) || 
          (s.description ?? '').toLowerCase().includes(query) ||
          (s.city ?? '').toLowerCase().includes(query)
        );
      }
    }

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

    return list;
  });

  ngOnInit() {
    this.loadCities();
    this.loadRestaurants();
  }

  detectLocation() {
    localStorage.setItem('mislice_customer_location', 'Detected Location');
    this.showLocationPrompt.set(false);
  }

  saveManualLocation() {
    if (this.searchLocationQuery.trim()) {
      localStorage.setItem('mislice_customer_location', this.searchLocationQuery.trim());
      this.showLocationPrompt.set(false);
    }
  }

  loadCities() {
    this.restaurantService.getCities().subscribe(cList => {
      this.cities.set(['All', ...cList.map(c => String(c))]);
    });
  }

  loadRestaurants() {
    this.loadingStore.set(true);
    const selected = this.locationService.selectedCity();
    const city = selected === 'All' ? undefined : selected;
    this.restaurantService.getRestaurants(city).subscribe(stores => {
      this.stores.set(stores);
      this.loadingStore.set(false);
    });
  }

  selectCity(city: string) {
    this.locationService.selectCity(city);
  }

  navigateToBuilder() {
    this.router.navigate(['/builder']);
  }

  quickCompare(intent: string) {
    this.router.navigate(['/quick-compare'], { queryParams: { intent } });
  }

  navigateToCompare() {
    this.router.navigate(['/compare']);
  }

  executeGlobalSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/quick-compare'], { queryParams: { q: this.searchQuery.trim() } });
    }
  }

  scrollToMap() {
    const el = document.getElementById('price-map');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  viewStore(slug: string) {
    this.router.navigate(['/restaurants', slug]);
  }
}
