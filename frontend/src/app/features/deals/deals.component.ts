import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { RestaurantService } from '../../core/services/restaurant.service';
import { Deal, Store } from '../../shared/models';

interface DealVM {
  deal: Deal;
  store?: Store;
  savings: number;
  pct: number;
  distanceMi?: number;
}

interface Category { id: string; label: string; match: (d: DealVM) => boolean; }

@Component({
  selector: 'app-deals',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  template: `
    <div class="w-full space-y-6 max-w-[1400px] mx-auto px-4 py-6 bg-[#0E0E10]">
      <!-- Header -->
      <div class="relative overflow-hidden rounded-[28px] border border-[#2B2B31] p-6 sm:p-8 bg-gradient-to-r from-[#18181B] to-[#1E1E22] shadow-xl">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.08),transparent_45%)] pointer-events-none"></div>
        <div class="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <span class="inline-flex items-center gap-2 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] px-3.5 py-1.5 text-[10px] font-black uppercase tracking-widest border border-[#D4AF37]/35">🔥 Live Michigan Deals</span>
            <h1 class="mt-4 text-3xl sm:text-4xl font-extrabold text-white">Deals &amp; Offers</h1>
            <p class="mt-2 text-sm text-[#B8B8B8] font-semibold">The best pizza deals from restaurants near you — right now.</p>
          </div>
          <button (click)="requestLocation()" class="shrink-0 self-start sm:self-auto text-xs font-bold text-white bg-[#1E1E22] border border-[#2B2B31] hover:border-[#D4AF37] px-4 py-2.5 rounded-2xl hover:bg-white/5 transition shadow-sm">
            {{ userLoc() ? '📍 Near you · on' : '📍 Use my location' }}
          </button>
        </div>
      </div>

      <div class="flex flex-col lg:flex-row gap-8 items-start">
        
        <!-- LEFT SIDEBAR: FILTERS -->
        <div class="hidden lg:block w-56 shrink-0 space-y-6 sticky top-6">
          <h3 class="text-xl font-extrabold text-white tracking-tight border-b border-[#2B2B31] pb-2">Filters</h3>
          
          <div class="space-y-4 pt-2">
            
            <label class="flex items-center justify-between cursor-pointer group">
              <span class="text-sm font-semibold text-[#B8B8B8] group-hover:text-white transition">Free Delivery</span>
              <div class="relative">
                <input type="checkbox" class="sr-only peer" (change)="toggleFilter('free_delivery')" [checked]="filters().includes('free_delivery')" />
                <div class="w-10 h-6 bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#E53935] peer-focus:outline-none"></div>
              </div>
            </label>
            
            <label class="flex items-center justify-between cursor-pointer group">
              <span class="text-sm font-semibold text-[#B8B8B8] group-hover:text-white transition">Favourites</span>
              <div class="relative">
                <input type="checkbox" class="sr-only peer" (change)="toggleFilter('favourites')" [checked]="filters().includes('favourites')" />
                <div class="w-10 h-6 bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#E53935] peer-focus:outline-none"></div>
              </div>
            </label>

            <label class="flex items-center justify-between cursor-pointer group">
              <span class="text-sm font-semibold text-[#B8B8B8] group-hover:text-white transition">4.5+ Stars</span>
              <div class="relative">
                <input type="checkbox" class="sr-only peer" (change)="toggleFilter('rating')" [checked]="filters().includes('rating')" />
                <div class="w-10 h-6 bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#E53935] peer-focus:outline-none"></div>
              </div>
            </label>

            <label class="flex items-center justify-between cursor-pointer group">
              <span class="text-sm font-semibold text-[#B8B8B8] group-hover:text-white transition">Open Now</span>
              <div class="relative">
                <input type="checkbox" class="sr-only peer" (change)="toggleFilter('open_now')" [checked]="filters().includes('open_now')" />
                <div class="w-10 h-6 bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#E53935] peer-focus:outline-none"></div>
              </div>
            </label>

            <label class="flex items-center justify-between cursor-pointer group">
              <span class="text-sm font-semibold text-[#B8B8B8] group-hover:text-white transition">Under $10</span>
              <div class="relative">
                <input type="checkbox" class="sr-only peer" (change)="toggleFilter('under10')" [checked]="filters().includes('under10')" />
                <div class="w-10 h-6 bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#E53935] peer-focus:outline-none"></div>
              </div>
            </label>

          </div>
        </div>

        <!-- MAIN CONTENT -->
        <div class="flex-1 min-w-0 space-y-6">
          
          <div class="flex flex-col gap-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <!-- Category chips -->
              <div class="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none flex-1">
                @for (c of categories; track c.id) {
                  @if (c.id === 'all' || countFor(c) > 0) {
                    <button (click)="activeCat.set(c.id)"
                      [class]="'shrink-0 px-4 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap shadow-sm ' + (activeCat() === c.id ? 'bg-[#D4AF37] text-black font-extrabold' : 'bg-[#18181B] text-[#B8B8B8] hover:text-white border border-[#2B2B31]')">
                      {{ c.label }}<span class="opacity-60 ml-1.5">{{ c.id === 'all' ? vms().length : countFor(c) }}</span>
                    </button>
                  }
                }
              </div>

              <!-- Sort -->
              <select [ngModel]="sort()" (ngModelChange)="sort.set($any($event))"
                class="shrink-0 bg-[#18181B] border border-[#2B2B31] rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:border-[#D4AF37] shadow-sm cursor-pointer">
                <option value="discount">Sort: Best Discount</option>
                <option value="expiring">Expiring Soon</option>
                <option value="price">Price: Low → High</option>
                <option value="distance">Nearest</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>

            <!-- Mobile Filters (visible on md/sm and below, hidden on lg) -->
            <div class="lg:hidden flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none pt-1">
              <button (click)="toggleFilter('free_delivery')"
                [class]="'shrink-0 px-3.5 py-1.5 rounded-xl text-[11px] font-bold transition border whitespace-nowrap shadow-sm ' + (filters().includes('free_delivery') ? 'bg-[#E53935] text-white border-[#E53935]' : 'bg-[#18181B] text-[#B8B8B8] border-[#2B2B31]')">
                🛵 Free Delivery
              </button>
              <button (click)="toggleFilter('favourites')"
                [class]="'shrink-0 px-3.5 py-1.5 rounded-xl text-[11px] font-bold transition border whitespace-nowrap shadow-sm ' + (filters().includes('favourites') ? 'bg-[#E53935] text-white border-[#E53935]' : 'bg-[#18181B] text-[#B8B8B8] border-[#2B2B31]')">
                ❤️ Favourites
              </button>
              <button (click)="toggleFilter('rating')"
                [class]="'shrink-0 px-3.5 py-1.5 rounded-xl text-[11px] font-bold transition border whitespace-nowrap shadow-sm ' + (filters().includes('rating') ? 'bg-[#E53935] text-white border-[#E53935]' : 'bg-[#18181B] text-[#B8B8B8] border-[#2B2B31]')">
                ★ 4.5+ Stars
              </button>
              <button (click)="toggleFilter('open_now')"
                [class]="'shrink-0 px-3.5 py-1.5 rounded-xl text-[11px] font-bold transition border whitespace-nowrap shadow-sm ' + (filters().includes('open_now') ? 'bg-[#E53935] text-white border-[#E53935]' : 'bg-[#18181B] text-[#B8B8B8] border-[#2B2B31]')">
                🟢 Open Now
              </button>
              <button (click)="toggleFilter('under10')"
                [class]="'shrink-0 px-3.5 py-1.5 rounded-xl text-[11px] font-bold transition border whitespace-nowrap shadow-sm ' + (filters().includes('under10') ? 'bg-[#E53935] text-white border-[#E53935]' : 'bg-[#18181B] text-[#B8B8B8] border-[#2B2B31]')">
                💰 Under $10
              </button>
            </div>
          </div>

          <!-- Loading -->
          <div *ngIf="loading()" class="flex justify-center py-16"><div class="animate-spin rounded-full h-8 w-8 border-t-2 border-[#E53935]"></div></div>

          <!-- Empty -->
          <div *ngIf="!loading() && visible().length === 0" class="clay rounded-[2rem] p-12 text-center text-white bg-[#18181B] shadow-inner border border-[#2B2B31]">
            <p class="text-5xl mb-4">🏷️</p>
            <p class="text-xl font-bold text-white mb-2">No deals match this view</p>
            <p class="text-xs text-neutral-400 max-w-md mx-auto">Try a different category or clear your filters — new offers post all the time.</p>
          </div>

          <!-- Deals grid with glassmorphism -->
          <div *ngIf="!loading() && visible().length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            @for (vm of visible(); track vm.deal.id) {
              <div class="group rounded-[20px] overflow-hidden flex flex-col backdrop-blur-md bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:bg-white/8 hover:scale-105">
                <!-- image / banner -->
                <div class="relative h-40 sm:h-48 flex items-center justify-center text-5xl overflow-hidden"
                  [style.background]="vm.store?.brandColor || 'linear-gradient(135deg,#7f1d1d,#c2410c)'">
                  <img *ngIf="vm.deal.imageUrl" [src]="vm.deal.imageUrl" alt="" class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                  <span *ngIf="!vm.deal.imageUrl" class="group-hover:scale-125 transition duration-500">🍕</span>
                  @if (vm.pct > 0) {
                    <span class="absolute top-4 left-4 text-[12px] font-black text-black bg-gradient-to-r from-[#D4AF37] to-[#E5BF47] px-3 py-1.5 rounded-full shadow-lg">SAVE {{ vm.pct }}%</span>
                  }
                  <span class="absolute top-4 right-4 text-[11px] font-bold text-white bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md border border-white/10">{{ timeLeft(vm.deal) }}</span>
                </div>

                <div class="p-5 sm:p-6 flex flex-col flex-1 gap-4">
                  <!-- restaurant row -->
                  <div class="flex items-center gap-3">
                    <span class="text-2xl">{{ vm.store?.emoji || '🏪' }}</span>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-bold text-white truncate">{{ vm.store?.name || 'Local Pizzeria' }}</p>
                      <p class="text-xs text-white/50">{{ vm.store?.city || 'Local Area' }}</p>
                    </div>
                    <span class="text-xs font-bold text-[#D4AF37] bg-white/10 px-2 py-1 rounded-lg shrink-0">★ {{ (vm.store?.ratingAvg || 4.5) | number:'1.1-1' }}</span>
                  </div>

                  <!-- deal info -->
                  <div class="space-y-1.5">
                    <p class="text-base sm:text-lg font-bold text-white leading-tight line-clamp-2">{{ vm.deal.title }}</p>
                    <p class="text-xs text-white/60 line-clamp-2">{{ vm.deal.description }}</p>
                  </div>

                  <!-- price section -->
                  <div class="space-y-3 py-4 border-t border-b border-white/10">
                    <div class="flex items-baseline gap-2">
                      <span class="text-3xl font-black text-[#E53935]">{{ (vm.deal.discountedPrice ?? vm.deal.originalPrice) | currency }}</span>
                      @if (vm.deal.originalPrice && vm.deal.originalPrice > (vm.deal.discountedPrice ?? 0)) {
                        <span class="text-sm text-white/40 line-through">{{ vm.deal.originalPrice | currency }}</span>
                      }
                    </div>
                    @if (vm.savings > 0) {
                      <p class="text-xs font-bold text-[#22C55E] bg-[#22C55E]/15 px-3 py-1.5 rounded-lg border border-[#22C55E]/30 inline-block">You save {{ vm.savings | currency }}</p>
                    }
                  </div>

                  <!-- meta info grid -->
                  <div class="grid grid-cols-3 gap-2 text-xs text-white/60">
                    <div class="flex flex-col items-start gap-1">
                      <span class="text-lg">⏱️</span>
                      <span class="font-semibold text-white">{{ vm.store?.averageEtaMinutes || 25 }}m</span>
                    </div>
                    <div class="flex flex-col items-start gap-1">
                      <span class="text-lg">🛵</span>
                      <span class="font-semibold text-white text-[11px] line-clamp-1">{{ (vm.store?.deliveryFee ?? 0) > 0 ? (vm.store?.deliveryFee | currency) : 'Free' }}</span>
                    </div>
                    <div class="flex flex-col items-start gap-1">
                      <span class="text-lg">📍</span>
                      @if (vm.distanceMi != null) {
                        <span class="font-semibold text-white">{{ vm.distanceMi | number:'1.0-1' }}m</span>
                      }
                      @else if (vm.store?.city) {
                        <span class="font-semibold text-white text-[11px] line-clamp-1">{{ vm.store?.city }}</span>
                      }
                    </div>
                  </div>

                  <!-- actions -->
                  <div class="grid grid-cols-2 gap-2 pt-2">
                    <button (click)="viewDeal(vm)" class="py-3 px-3 rounded-lg text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-white/10 to-white/5 border border-white/20 hover:from-white/20 hover:to-white/10 hover:border-white/30 transition-all duration-300 backdrop-blur-sm hover:shadow-md">Details</button>
                    <button (click)="orderNow(vm)" class="py-3 px-3 rounded-lg text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-[#E53935] to-[#D4371A] hover:from-[#F44336] hover:to-[#E53935] transition-all duration-300 shadow-lg hover:shadow-[#E53935]/50 transform hover:-translate-y-0.5">Order</button>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DealsComponent implements OnInit, OnDestroy {
  private readonly restaurantService = inject(RestaurantService);
  private readonly router = inject(Router);

  private allVms = signal<DealVM[]>([]);
  loading = signal(true);
  activeCat = signal('all');
  filters = signal<string[]>([]);
  sort = signal<'discount' | 'expiring' | 'price' | 'distance' | 'rating'>('discount');
  userLoc = signal<{ lat: number; lng: number } | null>(null);
  private now = signal(Date.now());
  private timer?: any;

  vms = computed(() => this.allVms());

  categories: Category[] = [
    { id: 'all', label: '✨ All', match: () => true },
    { id: 'trending', label: '🔥 Trending', match: d => d.pct >= 30 },
    { id: 'near', label: '📍 Near You', match: d => d.distanceMi != null && d.distanceMi <= 5 },
    { id: 'bogo', label: '🍕 BOGO', match: d => /bogo|buy one|2 for|two for/i.test(this.txt(d)) },
    { id: 'under10', label: '💰 Under $10', match: d => (d.deal.discountedPrice ?? 99) < 10 },
    { id: 'family', label: '🎉 Family', match: d => /family|combo|bundle|party/i.test(this.txt(d)) },
    { id: 'student', label: '👨‍🎓 Student', match: d => /student/i.test(this.txt(d)) },
    { id: 'latenight', label: '🌙 Late Night', match: d => /late|night|midnight/i.test(this.txt(d)) },
    { id: 'wings', label: '🍗 Pizza & Wings', match: d => /wing/i.test(this.txt(d)) },
    { id: 'lunch', label: '🍽️ Lunch', match: d => /lunch/i.test(this.txt(d)) },
    { id: 'flash', label: '⚡ Flash', match: d => this.msLeft(d.deal) > 0 && this.msLeft(d.deal) < 3 * 3600_000 },
    { id: 'new', label: '🆕 New', match: d => !!d.store?.newStore },
  ];

  ngOnInit(): void {
    forkJoin({
      deals: this.restaurantService.getActiveDeals(),
      stores: this.restaurantService.getRestaurants(),
    }).subscribe({
      next: ({ deals, stores }) => {
        const byId = new Map(stores.map(s => [s.id, s]));
        const vms = (deals ?? []).map(deal => {
          const store = byId.get(deal.restaurantId);
          const orig = Number(deal.originalPrice) || 0;
          const disc = Number(deal.discountedPrice) || 0;
          const savings = orig > 0 && disc > 0 ? Math.max(0, orig - disc) : 0;
          const pct = orig > 0 && savings > 0 ? Math.round((savings / orig) * 100) : (deal.discountType === 'percentage' ? (deal.discountValue || 0) : 0);
          return { deal, store, savings, pct } as DealVM;
        });
        this.allVms.set(vms);
        this.loading.set(false);
        this.recomputeDistance();
      },
      error: () => this.loading.set(false),
    });
    // tick every 30s to keep expiry timers fresh
    this.timer = setInterval(() => this.now.set(Date.now()), 30_000);
  }

  ngOnDestroy(): void { if (this.timer) clearInterval(this.timer); }

  private txt(d: DealVM): string { return `${d.deal.title} ${d.deal.description ?? ''} ${d.store?.name ?? ''}`; }
  private msLeft(deal: Deal): number { return deal.expiresAt ? new Date(deal.expiresAt).getTime() - this.now() : Number.POSITIVE_INFINITY; }

  timeLeft(deal: Deal): string {
    if (!deal.expiresAt) return 'Ongoing';
    const ms = this.msLeft(deal);
    if (ms <= 0) return 'Ended';
    const h = Math.floor(ms / 3600_000);
    const m = Math.floor((ms % 3600_000) / 60_000);
    if (h >= 24) return `${Math.floor(h / 24)}d left`;
    return h > 0 ? `Ends in ${h}h ${m}m` : `Ends in ${m}m`;
  }

  countFor(c: Category): number { return this.allVms().filter(c.match).length; }

  visible = computed<DealVM[]>(() => {
    const cat = this.categories.find(c => c.id === this.activeCat()) ?? this.categories[0];
    const f = this.filters();
    let list = this.allVms().filter(cat.match).filter(vm => {
      // Free Delivery logic (assuming delivery fee is 0 or null)
      if (f.includes('free_delivery') && (vm.store?.deliveryFee ?? 0) > 0) return false;
      
      // Under $10 logic
      if (f.includes('under10') && (vm.deal.discountedPrice ?? 99) >= 10) return false;
      
      // Rating logic
      if (f.includes('rating') && (vm.store?.ratingAvg ?? 0) < 4.5) return false;
      // Open Now logic
      if (f.includes('open_now') && vm.store && !vm.store.acceptingOrders) return false;
      
      // Favourites logic
      if (f.includes('favourites')) {
        const favIds: string[] = JSON.parse(localStorage.getItem('mislice_fav_stores') || '[]');
        if (!vm.store || (!favIds.includes(vm.store.id) && !favIds.includes(vm.store.slug))) return false;
      }
      
      return true;
    });
    
    const s = this.sort();
    list = [...list].sort((a, b) => {
      switch (s) {
        case 'expiring': return this.msLeft(a.deal) - this.msLeft(b.deal);
        case 'price': return (a.deal.discountedPrice ?? 99) - (b.deal.discountedPrice ?? 99);
        case 'distance': return (a.distanceMi ?? 999) - (b.distanceMi ?? 999);
        case 'rating': return (b.store?.ratingAvg ?? 0) - (a.store?.ratingAvg ?? 0);
        default: return b.pct - a.pct;
      }
    });
    return list;
  });

  toggleFilter(f: string) {
    const list = this.filters();
    this.filters.set(list.includes(f) ? list.filter(x => x !== f) : [...list, f]);
  }

  requestLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => { this.userLoc.set({ lat: pos.coords.latitude, lng: pos.coords.longitude }); this.recomputeDistance(); if (this.sort() === 'discount') this.sort.set('distance'); },
      () => { /* permission denied — silently keep city labels */ },
      { timeout: 8000 },
    );
  }
  private recomputeDistance() {
    const loc = this.userLoc();
    if (!loc) return;
    this.allVms.set(this.allVms().map(vm => ({
      ...vm,
      distanceMi: vm.store?.latitude != null && vm.store?.longitude != null
        ? this.haversine(loc.lat, loc.lng, vm.store.latitude, vm.store.longitude) : vm.distanceMi,
    })));
  }
  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3958.8, toRad = (x: number) => x * Math.PI / 180;
    const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private go(vm: DealVM) {
    if (vm.store?.slug) this.router.navigate(['/restaurants', vm.store.slug]);
    else this.router.navigate(['/home']);
  }
  viewDeal(vm: DealVM) { this.go(vm); }
  orderNow(vm: DealVM) { this.go(vm); }
}
